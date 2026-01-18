import { describe, it, expect } from 'vitest';
import { SurveyUpsert } from './types';

describe('Survey Data Integrity', () => {
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
});
