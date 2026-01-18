import { GoogleGenAI, Type } from "@google/genai";
import { type } from "arktype";
import { Question, ImposterScenario } from '../../types';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in server environment");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateImposterScenario = async (
  surveyQuestions: Question[]
): Promise<ImposterScenario> => {
  try {
    const ai = getAiClient();
    
    const activeQuestions = surveyQuestions.filter(q => 
      q.type === 'SINGLE_CHOICE' || q.type === 'OPEN_ENDED'
    );

    const questionsPrompt = activeQuestions.map(q => 
      `ID: ${q.id}, Text: "${q.text}", Options: [${q.options?.join(', ')}]`
    ).join('\n');

    const prompt = `
      You are a game master for a social deduction game called "Imposter".
      
      Task:
      1. Create a "Topic" (e.g., "At the Office", "Space Station", "Beach Party").
      2. Create a "Secret Word" related to that topic that everyone knows except the imposter.
      3. Transform the provided Survey Questions into natural, conversational questions that fit the context of the chosen Topic.
         - The meaning of the survey question must be preserved so we can collect valid data.
         - If the survey question has options, keep similar options but rephrase them if needed to fit the theme.
      4. Add 1-2 "Filler" questions that are purely for fun and game balance, unrelated to the survey.
      
      Survey Questions Input:
      ${questionsPrompt}
      
      Output JSON format only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            secretWord: { type: Type.STRING },
            gameQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalId: { type: Type.STRING },
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  isFiller: { type: Type.BOOLEAN }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const out = JSON.parse(text);
    const result = ImposterScenario(out);
    
    if (result instanceof type.errors) {
      console.error("AI Response validation failed", result.summary);
      throw new Error("Invalid AI response structure");
    }

    return result;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
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
