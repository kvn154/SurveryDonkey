import { Survey, SurveyResponse, Question, QuestionType } from '../types';

const STORAGE_KEYS = {
  SURVEYS: 'sg_surveys',
  RESPONSES: 'sg_responses',
};

// Seed data
const DEFAULT_SURVEY: Survey = {
  id: 'cs-survey-2025',
  title: 'Customer Support Experience',
  createdAt: Date.now(),
  questions: [
    {
      id: 'q_rank_1',
      text: 'Rank these aspects of our customer support by importance to you',
      type: QuestionType.RANKING,
      assignedGame: 'TOP_TIER',
      options: ['Response Speed', 'Agent Friendliness', 'Technical Knowledge', 'Issue Resolution', '24/7 Availability'],
    },
    {
      id: 'q_cs_1',
      text: 'How satisfied are you with the overall customer service experience?',
      type: QuestionType.SINGLE_CHOICE,
      assignedGame: 'IMPOSTER',
      options: ['Extremely Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Extremely Dissatisfied'],
    }
  ],
};

export const StorageService = {
  getSurveys: (): Survey[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SURVEYS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify([DEFAULT_SURVEY]));
      return [DEFAULT_SURVEY];
    }
    return JSON.parse(data);
  },

  saveSurvey: (survey: Survey) => {
    const surveys = StorageService.getSurveys();
    const index = surveys.findIndex(s => s.id === survey.id);
    if (index >= 0) {
      surveys[index] = survey;
    } else {
      surveys.push(survey);
    }
    localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys));
  },

  deleteSurvey: (id: string) => {
    const surveys = StorageService.getSurveys().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys));
  },

  getResponses: (): SurveyResponse[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RESPONSES);
    return data ? JSON.parse(data) : [];
  },

  saveResponse: (response: SurveyResponse) => {
    const responses = StorageService.getResponses();
    responses.push(response);
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
  },
  
  // Helper to generate some fake data for analytics visualization
  seedFakeData: () => {
    const responses: SurveyResponse[] = [];
    const surveys = StorageService.getSurveys();
    
    // Only seed if empty
    if(localStorage.getItem(STORAGE_KEYS.RESPONSES)) return;

    // Top Tier Fake Data
    for(let i=0; i<20; i++) {
        responses.push({
            id: `fake-tt-${i}`,
            surveyId: 'cs-survey-2025',
            gamePlayed: 'TOP_TIER',
            timestamp: Date.now() - Math.floor(Math.random() * 1000000000),
            answers: {
                'q_rank_1': {
                    'S': ['Issue Resolution'],
                    'A': ['Response Speed'],
                    'B': ['Technical Knowledge'],
                    'C': ['Agent Friendliness'],
                    'D': ['24/7 Availability']
                }
            },
            metadata: { duration: 45 + Math.random() * 30, playerType: 'REAL' }
        })
    }
     // Imposter Fake Data
     for(let i=0; i<15; i++) {
        responses.push({
            id: `fake-imp-${i}`,
            surveyId: 'cs-survey-2025',
            gamePlayed: 'IMPOSTER',
            timestamp: Date.now() - Math.floor(Math.random() * 1000000000),
            answers: {
                'q_cs_1': 'Satisfied'
            },
            metadata: { duration: 120, playerType: 'REAL' }
        })
    }
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
  }
};