import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { db } from '../db';
import { surveys, responses, questions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { arktypeValidator } from '@hono/arktype-validator';
import { gamifySurvey } from './services/aiService';
import { SurveyUpsert, ResponseInsert, GamifyRequest } from '../types';

const app = new Hono();

app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} - ${c.res.status} (${ms}ms)`);
});

app.use('*', cors());

const routes = app
  .basePath('/api')
  .get('/surveys', async (c) => {
    const data = await db.query.surveys.findMany({
      with: { questions: true },
    });
    return c.json(data);
  })
  .get('/surveys/:id', async (c) => {
    const id = c.req.param('id');
    const data = await db.query.surveys.findFirst({
      where: eq(surveys.id, id),
      with: { questions: true },
    });
    if (!data) return c.json({ error: 'Not found' }, 404);
    return c.json(data);
  })
  .post('/surveys', arktypeValidator('json', SurveyUpsert), async (c) => {
    const body = c.req.valid('json');
    
    const result = await db.transaction(async (tx) => {
      const [newSurvey] = await tx.insert(surveys).values({
        title: body.title,
        gamifiedData: body.gamifiedData,
      }).returning();

      if (body.questions.length > 0) {
        await tx.insert(questions).values(
          body.questions.map(q => ({
            surveyId: newSurvey.id,
            text: q.text,
            type: q.type,
            options: q.options,
            assignedGame: q.assignedGame,
          }))
        );
      }
      return newSurvey;
    });

    return c.json(result);
  })
  .put('/surveys/:id', arktypeValidator('json', SurveyUpsert), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');

    await db.transaction(async (tx) => {
      // 1. Update survey title
      await tx.update(surveys)
        .set({ title: body.title, gamifiedData: body.gamifiedData })
        .where(eq(surveys.id, id));

      // 2. Handle Questions (Non-destructive)
      const existingQuestions = await tx.query.questions.findMany({
        where: eq(questions.surveyId, id),
      });

      const incomingQuestionIds = body.questions
        .map(q => q.id)
        .filter((qid): qid is string => !!qid);

      // Delete questions that are no longer in the list
      const toDelete = existingQuestions.filter(eq => !incomingQuestionIds.includes(eq.id));
      for (const q of toDelete) {
        await tx.delete(questions).where(eq(questions.id, q.id));
      }

      // Update or Insert
      for (const q of body.questions) {
        if (q.id) {
          // Update existing
          await tx.update(questions)
            .set({
              text: q.text,
              type: q.type,
              options: q.options,
              assignedGame: q.assignedGame,
            })
            .where(eq(questions.id, q.id));
        } else {
          // Insert new
          await tx.insert(questions).values({
            surveyId: id,
            text: q.text,
            type: q.type,
            options: q.options,
            assignedGame: q.assignedGame,
          });
        }
      }
    });

    return c.json({ success: true });
  })
  .get('/responses', async (c) => {

    const data = await db.query.responses.findMany();
    return c.json(data);
  })
  .get('/surveys/:id/consensus', async (c) => {
    const id = c.req.param('id');
    const survey = await db.query.surveys.findFirst({
      where: eq(surveys.id, id),
      with: { questions: true },
    });

    if (!survey) return c.json({ error: 'Not found' }, 404);

    const allResponses = await db.query.responses.findMany({
      where: eq(responses.surveyId, id),
    });

    // 1. Aggregate ALL possible concepts that could have been ranked
    const allConcepts = new Set<string>();
    
    // Standard questions
    survey.questions.forEach(q => {
      if (q.type === 'RANKING' && Array.isArray(q.options)) {
        q.options.forEach(opt => allConcepts.add(opt));
      }
    });

    // Gamified data
    if (survey.gamifiedData && Array.isArray(survey.gamifiedData)) {
      survey.gamifiedData.forEach((g: any) => {
        if (g.games?.top_tier_rank?.applicable && Array.isArray(g.games.top_tier_rank.concepts)) {
          g.games.top_tier_rank.concepts.forEach((c: string) => allConcepts.add(c));
        }
      });
    }

    if (allConcepts.size === 0) return c.json([]);

    const tierCounts: Record<string, Record<string, number>> = {};
    allConcepts.forEach(concept => {
      tierCounts[concept] = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    });

    const topTierResponses = allResponses.filter(r => r.gamePlayed === 'TOP_TIER');
    if (topTierResponses.length === 0) return c.json([]);

    // 2. Count placements across all responses
    topTierResponses.forEach(r => {
      const answers = r.answers as Record<string, any>;
      
      // Case A: Gamified rankings (new UI)
      if (answers.gamified_rankings) {
        Object.entries(answers.gamified_rankings).forEach(([tier, items]) => {
          if (Array.isArray(items)) {
            items.forEach(item => {
              if (tierCounts[item]) {
                tierCounts[item][tier] = (tierCounts[item][tier] || 0) + 1;
              }
            });
          }
        });
      }

      // Case B: Question-specific rankings (old/standard UI)
      survey.questions.forEach(q => {
        if (q.type === 'RANKING' && answers[q.id]) {
          const qAnswer = answers[q.id];
          if (typeof qAnswer === 'object' && !Array.isArray(qAnswer)) {
            Object.entries(qAnswer).forEach(([tier, items]) => {
              if (Array.isArray(items)) {
                items.forEach(item => {
                  if (tierCounts[item]) {
                    tierCounts[item][tier] = (tierCounts[item][tier] || 0) + 1;
                  }
                });
              }
            });
          }
        }
      });
    });

    // 3. Determine consensus tier for each concept
    const results: any[] = [
      { tier: 'S', items: [], percentage: 0 },
      { tier: 'A', items: [], percentage: 0 },
      { tier: 'B', items: [], percentage: 0 },
      { tier: 'C', items: [], percentage: 0 },
      { tier: 'D', items: [], percentage: 0 },
    ];

    Array.from(allConcepts).forEach((concept, idx) => {
      const counts = tierCounts[concept];
      let maxCount = 0;
      let consensusTier = 'C';
      let totalPlacementsForItem = 0;
      
      Object.entries(counts).forEach(([tier, count]) => {
        totalPlacementsForItem += count;
        if (count > maxCount) {
          maxCount = count;
          consensusTier = tier;
        }
      });

      if (totalPlacementsForItem > 0) {
        const tierGroup = results.find(r => r.tier === consensusTier);
        tierGroup.items.push({ id: `c_${idx}`, content: concept });
        
        // Calculate agreement percentage for this specific item
        const itemAgreement = Math.round((maxCount / totalPlacementsForItem) * 100);
        // We update the group percentage if this item has higher agreement, 
        // or we could use average. Let's use average for the group or just 
        // return it per item if the UI supported it. 
        // For now, let's keep the existing UI format but make it meaningful.
        tierGroup.percentage = Math.max(tierGroup.percentage, itemAgreement);
      }
    });

    return c.json(results);
  })
  .delete('/surveys/:id', async (c) => {
    const id = c.req.param('id');
    await db.delete(surveys).where(eq(surveys.id, id));
    return c.json({ success: true });
  })
  .post('/responses', arktypeValidator('json', ResponseInsert), async (c) => {
    const body = c.req.valid('json');
    const [result] = await db.insert(responses).values({
      surveyId: body.surveyId,
      gamePlayed: body.gamePlayed,
      answers: body.answers,
      metadata: body.metadata,
    }).returning();
    return c.json(result);
  })
  .post('/ai/gamify', arktypeValidator('json', GamifyRequest), async (c) => {
    const { companyName, productDescription, questions } = c.req.valid('json');
    console.log(`Gamifying for ${companyName} with ${questions.length} questions`);
    const result = await gamifySurvey(companyName, productDescription, questions);
    console.log(`AI returned ${result.length} gamified items`);
    return c.json(result);
  });

// Static Files
app.use('/assets/*', serveStatic({ root: './dist' }));
app.get('/favicon.ico', serveStatic({ path: './public/logo.png' }));
app.get('/logo.png', serveStatic({ path: './public/logo.png' }));

// SPA Catch-all
app.get('*', async (c) => {
  try {
    const html = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf-8');
    return c.html(html);
  } catch {
    return c.text('Frontend not built', 404);
  }
});

const port = Number(process.env.PORT) || 3000;
console.log(`🚀 Hono Server is running at http://localhost:${port}`);

if (process.env.NODE_ENV !== 'test') {
  serve({
    fetch: app.fetch,
    port
  });
}

export type AppType = typeof routes;

