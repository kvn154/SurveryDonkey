import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GamifiedQuestionData } from '../../types';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in server environment");
  }
  return new GoogleGenAI({ apiKey });
};

const GAMIFICATION_SYSTEM_PROMPT = `
**ROLE**
You are an expert Game Master AI. Your goal is to take survey questions and transform them into engaging game assets. The tone should be **modern, clear, and grounded**, but not boring. Think "app store feature highlights" or "consumer review keywords" rather than "corporate feedback form".

**TASK**
Analyze the input questions (contextualized by a Company Name and Product Description) and generate content for two specific game modes: **Top Tier Rank** and **Imposter / Spyfall**.

**GAME DEFINITIONS & RULES**

### 1. Top Tier Rank (The "Tier List" Game)
*   **Goal:** Players rank items into S-Tier (God Tier) down to D-Tier (Trash Tier).
*   **Vibe:** Professional but engaging.
*   **Constraints:**
    *   **EXACTLY 7 Rankable Concepts**: No more, no less.
    *   **Length:** 1 to 3 words max per concept. Short and punchy.
    *   **Tone:** Realistic and descriptive, avoiding stiffness but also avoiding silliness.
        *   *Too Boring:* "Customer Support Response Time Evaluation"
        *   *Too Silly:* "Warp Speed Turbo Boost"
        *   *Just Right:* "Fast Replies", "24/7 Availability", "Expert Help", "Low Wait Times", "Friendly Agents".
    *   **Derived Questions:** Provide 2 engaging prompts (e.g., "What defines 5-star service for you?", "What matters most?").

### 2. Imposter / Spyfall (The Social Deduction Game)
*   **Goal:** Players prove they aren't the AI bot/Imposter by answering vaguely about a Secret Word.
*   **Secret Word:** Usually the **Company Name** or **Product Name**.
*   **Question Style:**
    *   Questions should be **metaphorical yet intuitive**.
    *   **Metaphors:** Compare the product to common experiences (Food, Travel, Weather, Animals).
    *   *Example:* "If this product was a vehicle, would it be a race car or a tank?"
    *   *Example:* "How steep is the learning curve? Like a small hill or Everest?"
*   **Structure:**
    *   Generate **3 derived questions**.
    *   Each question needs a \`type\` (text, multiple_choice, scale) and options if applicable.

**GENERAL RULES**
*   **Dual Applicability:** A single survey question can and should be mapped to **BOTH** games if it fits the criteria.
*   **Safety:** Do not invent sensitive personal data.

NOTE: BE SMART and add the company name on either the question of the answers (but not for imposter)
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      original_question: { type: Type.STRING },
      games: {
        type: Type.OBJECT,
        properties: {
          top_tier_rank: {
            type: Type.OBJECT,
            properties: {
              applicable: { type: Type.BOOLEAN },
              concepts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 7 grounded, realistic items, 1-3 words each"
              },
              derived_questions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["applicable", "concepts", "derived_questions"]
          },
          imposter_spyfall: {
            type: Type.OBJECT,
            properties: {
              applicable: { type: Type.BOOLEAN },
              secret_word: { type: Type.STRING },
              derived_questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["text", "multiple_choice", "scale"] },
                    choices_scales: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      nullable: true
                    }
                  },
                  required: ["question", "type"]
                }
              }
            },
            required: ["applicable", "secret_word", "derived_questions"]
          }
        },
        required: ["top_tier_rank", "imposter_spyfall"]
      }
    },
    required: ["original_question", "games"]
  }
};

export const gamifySurvey = async (
  companyName: string,
  productDescription: string,
  questions: any[]
): Promise<GamifiedQuestionData[]> => {
  try {
    const ai = getAiClient();
    
    // Prepare the input prompt
    const questionsList = questions.map(q => `Q: ${q.text}`).join('\n');
    const userPrompt = `
      CONTEXT:
      Company Name: ${companyName}
      Product Description: ${productDescription}

      LIST OF QUESTIONS:
      ${questionsList}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: GAMIFICATION_SYSTEM_PROMPT + "\n\nIMPORTANT: You must return a JSON array containing exactly " + questions.length + " objects. One for each input question in order.",
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    console.log("AI RAW RESPONSE:", text);
    if (!text || text === "[]") {
        throw new Error("We screwed up: AI returned empty or null response. Gamification failed.");
    }
    
    const parsed = JSON.parse(text);
    return parsed as GamifiedQuestionData[];

  } catch (error) {
    console.error("Gemini Gamification Error:", error);
    // Return empty array or throw based on preference. 
    // Throwing allows the frontend to handle the error state.
    throw error;
  }
};
