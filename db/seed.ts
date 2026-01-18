import 'dotenv/config';
import { db } from './index';
import { surveys, questions, responses } from './schema';

async function seed() {
  console.log('🌱 Seeding database with diverse surveys and responses...');

  // 1. Clean existing data
  await db.delete(responses);
  await db.delete(questions);
  await db.delete(surveys);

  const surveyData = [
    {
      title: 'Video Games 2025: The Next Frontier',
      questions: [
        {
          text: 'Rank these 2025 anticipated releases by your excitement level',
          type: 'RANKING',
          assignedGame: 'TOP_TIER',
          options: ['Grand Theft Auto VI', 'Death Stranding 2: On The Beach', 'Metroid Prime 4: Beyond', 'Monster Hunter Wilds', 'Ghost of Yotei'],
        },
        {
          text: 'Which console will dominate the market in late 2025?',
          type: 'SINGLE_CHOICE',
          assignedGame: 'IMPOSTER',
          options: ['PlayStation 5 Pro', 'Nintendo Switch 2 (Rumored)', 'Xbox Series X Next-Gen', 'PC/Steam Deck'],
        },
        {
          text: 'How satisfied are you with the current trend of "Live Service" games?',
          type: 'LIKERT',
          assignedGame: 'BOTH',
          options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        },
        {
          text: 'What classic franchise deserves a massive 2025 remake?',
          type: 'OPEN_ENDED',
          assignedGame: 'IMPOSTER',
          options: [],
        }
      ],
      openEndedAnswers: [
        "Silent Hill 1 (the original atmosphere is unmatched)",
        "Dino Crisis (RE engine would make it terrifying)",
        "Metal Gear Solid 3 (Wait, that's already happening, so let's say MGS1)",
        "Bloodborne (60fps is all we ask)",
        "Chrono Trigger in the HD-2D style",
        "Legacy of Kain: Soul Reaver"
      ]
    },
    {
      title: 'Recent AI Architectures & Paradigms',
      questions: [
        {
          text: 'Rank these architectures by their perceived long-context efficiency',
          type: 'RANKING',
          assignedGame: 'TOP_TIER',
          options: ['Transformers (standard)', 'Mamba (SSM)', 'Jamba (Hybrid)', 'Liquid Neural Nets', 'RetNet'],
        },
        {
          text: 'Which technique is currently most effective for reducing LLM hallucination?',
          type: 'SINGLE_CHOICE',
          assignedGame: 'IMPOSTER',
          options: ['RAG (Retrieval Augmented Generation)', 'Fine-tuning', 'Chain of Thought Prompting', 'DPO (Direct Preference Optimization)'],
        },
        {
          text: 'I believe Mixture of Experts (MoE) is superior to monolithic models.',
          type: 'LIKERT',
          assignedGame: 'BOTH',
          options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        },
        {
          text: 'What is the biggest bottleneck in current AI scaling?',
          type: 'OPEN_ENDED',
          assignedGame: 'IMPOSTER',
          options: [],
        }
      ],
      openEndedAnswers: [
        "The availability of high-quality human-generated data.",
        "Energy consumption and data center cooling.",
        "The quadratic complexity of the self-attention mechanism.",
        "Memory bandwidth in current H100/B200 clusters.",
        "The lack of true symbolic reasoning in connectionist architectures."
      ]
    },
    {
      title: 'Pokémon: Legacy & Future (Gen 10)',
      questions: [
        {
          text: 'Rank these Pokémon generations by their competitive meta quality',
          type: 'RANKING',
          assignedGame: 'TOP_TIER',
          options: ['Gen 4 (Sinnoh)', 'Gen 5 (Unova)', 'Gen 9 (Paldea)', 'Gen 3 (Hoenn)', 'Gen 1 (Kanto)'],
        },
        {
          text: 'Which gimmick should return in Gen 10?',
          type: 'SINGLE_CHOICE',
          assignedGame: 'IMPOSTER',
          options: ['Mega Evolution', 'Z-Moves', 'Dynamax', 'Terastal'],
        },
        {
          text: 'How do you feel about the open-world direction of the series?',
          type: 'LIKERT',
          assignedGame: 'BOTH',
          options: ['Hate it', 'Dislike it', 'Neutral', 'Like it', 'Love it'],
        },
        {
          text: 'What type combination is still missing and needs to happen?',
          type: 'OPEN_ENDED',
          assignedGame: 'IMPOSTER',
          options: [],
        }
      ],
      openEndedAnswers: [
        "Fire/Fairy (A literal burning pixie)",
        "Bug/Dragon (Finally, a real dragonfly Pokémon)",
        "Normal/Ghost (The ultimate immunity machine)",
        "Electric/Fighting (We need a true Zeraora successor)",
        "Rock/Ghost (A haunted fossil or ancient tomb)"
      ]
    },
    {
      title: 'Vibe Coding: The Agentic Era',
      questions: [
        {
          text: 'Rank these editors/tools by how much they improve your "vibe" flow',
          type: 'RANKING',
          assignedGame: 'TOP_TIER',
          options: ['Cursor', 'Windsurf', 'v0.dev', 'Lovable', 'Bolt.new'],
        },
        {
          text: 'Which agentic framework are you most likely to use for a complex project?',
          type: 'SINGLE_CHOICE',
          assignedGame: 'IMPOSTER',
          options: ['LangGraph', 'CrewAI', 'AutoGPT', 'PydanticAI'],
        },
        {
          text: 'Prompting is more important than knowing the syntax of a language.',
          type: 'LIKERT',
          assignedGame: 'BOTH',
          options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        },
        {
          text: 'Describe the "vibe" of a perfect coding session in 2025.',
          type: 'OPEN_ENDED',
          assignedGame: 'IMPOSTER',
          options: [],
        }
      ],
      openEndedAnswers: [
        "Lo-fi beats, AI writing the boilerplate, me just directing the high-level logic.",
        "Describe a feature in plain English and see it deploy in under 30 seconds.",
        "Zero friction between thought and execution; the agent knows my stack perfectly.",
        "Agentic loops fixing my edge cases before I even realize they exist.",
        "It's like being a conductor of an orchestra rather than a solo violinist."
      ]
    }
  ];

  for (const s of surveyData) {
    const [newSurvey] = await db.insert(surveys).values({
      title: s.title,
    }).returning();

    console.log(`Created survey: ${newSurvey.title}`);

    const qValues = s.questions.map(q => ({
      surveyId: newSurvey.id,
      text: q.text,
      type: q.type as any,
      assignedGame: q.assignedGame as any,
      options: q.options,
    }));

    const insertedQuestions = await db.insert(questions).values(qValues).returning();
    
    // Add fake responses to simulate diverse surveyors
    const fakeResponses = [];

    // Create 10-15 surveyors for each survey
    for (let i = 0; i < 12; i++) {
      const answers: Record<string, any> = {};
      
      for (const q of insertedQuestions) {
        if (q.type === 'RANKING') {
          const opts = q.options as string[];
          const shuffled = [...opts].sort(() => Math.random() - 0.5);
          answers[q.id] = {
            S: [shuffled[0]],
            A: [shuffled[1]],
            B: [shuffled[2]],
            C: [shuffled[3]],
            D: [shuffled[4]]
          };
        } else if (q.type === 'SINGLE_CHOICE' || q.type === 'LIKERT') {
          const opts = q.options as string[];
          answers[q.id] = opts[Math.floor(Math.random() * opts.length)];
        } else if (q.type === 'OPEN_ENDED') {
          answers[q.id] = s.openEndedAnswers[Math.floor(Math.random() * s.openEndedAnswers.length)];
        }
      }

      // Add as TOP_TIER response
      fakeResponses.push({
        surveyId: newSurvey.id,
        gamePlayed: 'TOP_TIER' as const,
        answers,
        metadata: {
          duration: 30 + Math.random() * 60,
          playerType: 'BOT' as const
        }
      });

      // Also add as IMPOSTER response (different metadata)
      fakeResponses.push({
        surveyId: newSurvey.id,
        gamePlayed: 'IMPOSTER' as const,
        answers,
        metadata: {
          duration: 120 + Math.random() * 120,
          playerType: 'REAL' as const,
          confidenceScore: 0.7 + Math.random() * 0.3
        }
      });
    }

    await db.insert(responses).values(fakeResponses);
  }

  console.log('✅ Diverse seeding with text answers completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:');
  console.error(err);
  process.exit(1);
});
