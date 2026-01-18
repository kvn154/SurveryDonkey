import { client } from './apiClient';
import { Survey, SurveyResponse, Question } from '../types';


export const StorageService = {
  getSurveys: async (): Promise<Survey[]> => {
    const res = await client.api.surveys.$get();
    if (!res.ok) {
      console.error('Failed to fetch surveys');
      return [];
    }
    const data = await res.json();
    return (data as Survey[]) || [];
  },

  getSurveyById: async (id: string): Promise<Survey | null> => {
    const res = await client.api.surveys[':id'].$get({
      param: { id }
    });
    if (!res.ok) {
      console.error('Failed to fetch survey by ID');
      return null;
    }
    const data = await res.json();
    return (data as Survey) || null;
  },

  getResponses: async (): Promise<SurveyResponse[]> => {
    const res = await client.api.responses.$get();
    if (!res.ok) {
      console.error('Failed to fetch responses');
      return [];
    }
    const data = await res.json();
    return (data as SurveyResponse[]) || [];
  },

  getConsensus: async (surveyId: string) => {
    const res = await client.api.surveys[':id'].consensus.$get({
      param: { id: surveyId }
    });
    if (!res.ok) {
      console.error('Failed to fetch consensus');
      return [];
    }
    return await res.json();
  },

  deleteSurvey: async (id: string) => {
    const res = await client.api.surveys[':id'].$delete({
      param: { id }
    });
    if (!res.ok) {
      console.error('Failed to delete survey');
      throw new Error('Delete failed');
    }
    return await res.json();
  },

  createSurvey: async (survey: { title: string; questions: Omit<Question, 'id' | 'surveyId'>[] }) => {
    const res = await client.api.surveys.$post({
      json: survey as any // Cast to any because Omit might not perfectly match the validator's strict requirements
    });
    if (!res.ok) {
      const error = await res.text();
      console.error('Failed to create survey:', error);
      throw new Error('Create failed');
    }
    return await res.json();
  },

  updateSurvey: async (id: string, survey: { title: string; questions: Omit<Question, 'id' | 'surveyId'>[] }) => {
    const res = await client.api.surveys[':id'].$put({
      param: { id },
      json: survey as any
    });
    if (!res.ok) {
      const error = await res.text();
      console.error('Failed to update survey:', error);
      throw new Error('Update failed');
    }
    return await res.json();
  },

  saveResponse: async (response: Omit<SurveyResponse, 'id' | 'timestamp'>) => {
    const res = await client.api.responses.$post({
      json: {
        surveyId: response.surveyId,
        gamePlayed: response.gamePlayed,
        answers: response.answers as Record<string, unknown>,
        metadata: response.metadata,
      }
    });

    if (!res.ok) {
      console.error('Failed to save response');
      throw new Error('Save failed');
    }

    return await res.json();
  },
};
