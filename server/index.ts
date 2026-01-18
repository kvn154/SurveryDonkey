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

    const rankingQuestions = survey.questions.filter(q => q.type === 'RANKING');
    
    // For simplicity, we'll calculate consensus based on the first ranking question found
    // In a multi-question survey, we might need a more complex UI
    const targetQ = rankingQuestions[0];
    if (!targetQ) return c.json([]);

    const options = targetQ.options as string[];
    const tierCounts: Record<string, Record<string, number>> = {};
    
    options.forEach(opt => {
      tierCounts[opt] = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    });

    const totalResponses = allResponses.filter(r => r.gamePlayed === 'TOP_TIER').length;
    if (totalResponses === 0) return c.json([]);

    allResponses.forEach(r => {
      if (r.gamePlayed !== 'TOP_TIER') return;
      const answer = r.answers[targetQ.id] as Record<string, string[]>;
      if (!answer) return;

      Object.entries(answer).forEach(([tier, optedItems]) => {
        optedItems.forEach(opt => {
          if (tierCounts[opt]) {
            tierCounts[opt][tier] = (tierCounts[opt][tier] || 0) + 1;
          }
        });
      });
    });

    // Determine consensus tier for each item
    const results: any[] = [
      { tier: 'S', items: [], percentage: 0 },
      { tier: 'A', items: [], percentage: 0 },
      { tier: 'B', items: [], percentage: 0 },
      { tier: 'C', items: [], percentage: 0 },
      { tier: 'D', items: [], percentage: 0 },
    ];

    options.forEach((opt, idx) => {
      const counts = tierCounts[opt];
      let maxCount = -1;
      let consensusTier = 'C';
      
      Object.entries(counts).forEach(([tier, count]) => {
        if (count > maxCount) {
          maxCount = count;
          consensusTier = tier;
        }
      });

      const tierGroup = results.find(r => r.tier === consensusTier);
      tierGroup.items.push({ id: `q1_${idx}`, content: opt });
      // Average percentage across items in this tier? 
      // Actually, percentage per item would be better, but the UI expects it per tier group.
      // Let's just use the maxCount/total for that item.
      tierGroup.percentage = Math.round((maxCount / totalResponses) * 100);
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
app.get('/favicon.ico', serveStatic({ path: './dist/favicon.ico' }));

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

