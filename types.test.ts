import { describe, it, expect } from 'vitest';
import { SurveyUpsert, GamifiedQuestionData, GamifyRequest } from './types';

describe('Survey Data Integrity', () => {
  it('should validate gamified data structure', () => {
    const validGamified: GamifiedQuestionData = {
      original_question: "How is our support?",
      games: {
        top_tier_rank: {
          applicable: true,
          concepts: ["Fast", "Friendly", "Expert", "24/7", "Cheap", "Reliable", "Global"],
          derived_questions: ["What matters most?"]
        },
        imposter_spyfall: {
          applicable: true,
          secret_word: "Support",
          derived_questions: [
            { question: "Is it like a hug or a handshake?", type: "text", choices_scales: null }
          ]
        }
      }
    };

    const out = GamifiedQuestionData(validGamified);
    expect(out).toEqual(validGamified);
  });

  it('should reject invalid gamified data', () => {
    const invalidGamified = {
      original_question: "Short concepts",
      games: {
        top_tier_rank: {
          applicable: true,
          concepts: ["Too", "Few"], // Should ideally be 7 but the schema just says string[]
          derived_questions: []
        }
      }
    };

    const out = GamifiedQuestionData(invalidGamified as any);
    expect(out.toString()).toContain('imposter_spyfall'); // Missing required key
  });

  it('should reject questions with null options according to ArkType schema', () => {
    const invalidSurvey = {
      title: "Test",
      questions: [
        {
          text: "What is your name?",
          type: "OPEN_ENDED",
          options: null 
        }
      ]
    };

    const out = SurveyUpsert(invalidSurvey);
    // In ArkType 2, if it fails, it returns ArkErrors which has a summary
    expect(out.toString()).toContain('must be an array');
  });

  it('should accept questions with empty array options', () => {
    const validSurvey = {
      title: "Test",
      questions: [
        {
          text: "What is your name?",
          type: "OPEN_ENDED",
          options: []
        }
      ]
    };

    const out = SurveyUpsert(validSurvey);
    // If it passes, it returns the data, not ArkErrors
    expect(out).toEqual(validSurvey);
  });

  it('should normalize options manually as a safety net in frontend', () => {
    const questions = [
      { text: 'Q1', type: 'OPEN_ENDED', options: null as any },
      { text: 'Q2', type: 'SINGLE_CHOICE', options: ['A', 'B'] }
    ];

    const normalized = questions.map(q => ({
      ...q,
      options: q.options || []
    }));

    expect(normalized[0].options).toEqual([]);
    expect(normalized[1].options).toEqual(['A', 'B']);
    
    // Now valid for schema
    const survey = { title: "Test", questions: normalized as any };
    const out = SurveyUpsert(survey);
    expect(out).toMatchObject(survey);
  });

  it('should validate GamifyRequest', () => {
    const validRequest = {
      companyName: "Test Co",
      productDescription: "Test product",
      questions: [
        {
          text: "Question 1",
          type: "SINGLE_CHOICE",
          options: ["Opt 1", "Opt 2"],
          assignedGame: "BOTH"
        }
      ]
    };

    const out = GamifyRequest(validRequest);
    expect(out).toEqual(validRequest);
  });

  it('should reject GamifyRequest with missing fields', () => {
    const invalidRequest = {
      companyName: "Test Co",
      // productDescription missing
      questions: []
    };

    const out = GamifyRequest(invalidRequest as any);
    expect(out.toString()).toContain('productDescription');
  });
});
