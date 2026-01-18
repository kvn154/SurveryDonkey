import { client } from './apiClient';
import { Question, ImposterScenario } from '../types';

export const generateImposterScenario = async (
  surveyQuestions: Question[]
): Promise<ImposterScenario> => {
  try {
    const res = await client.api.ai['generate-scenario'].$post({
      json: { questions: surveyQuestions }
    });

    if (!res.ok) {
      throw new Error("Failed to generate scenario from backend");
    }

    return await res.json();
  } catch (error) {
    console.error("Scenario Generation Error:", error);
    // Fallback
    return {
      topic: "General Survey",
      secretWord: "Data",
      gameQuestions: surveyQuestions.map(q => ({
        originalId: q.id,
        text: q.text,
        options: q.options || [],
        isFiller: false
      }))
    };
  }
};
