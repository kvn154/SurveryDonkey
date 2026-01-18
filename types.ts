import { type } from "arktype";
import { selectSurveySchema, selectQuestionSchema, selectResponseSchema } from "./db/schema";

export const QuestionType = type("'OPEN_ENDED' | 'SINGLE_CHOICE' | 'RANKING' | 'LIKERT'");

export const Question = selectQuestionSchema;
export type Question = typeof Question.infer;

export const Survey = selectSurveySchema.and({
  questions: Question.array(),
  "gamifiedData?": "unknown", 
  createdAt: "string | Date | number",
});
export type Survey = typeof Survey.infer;

export const SurveyResponse = selectResponseSchema.and({
  timestamp: "string | Date | number",
});
export type SurveyResponse = typeof SurveyResponse.infer;

export const SurveyUpsert = type({
  title: "string",
  "gamifiedData?": "unknown",
  questions: type({
    "id?": "string",
    text: "string",
    type: "'OPEN_ENDED' | 'SINGLE_CHOICE' | 'RANKING' | 'LIKERT'",
    "options?": "string[]",
    "assignedGame?": "'TOP_TIER' | 'IMPOSTER' | 'BOTH'",
  }).array(),
});
export type SurveyUpsert = typeof SurveyUpsert.infer;

export const ResponseInsert = type({
  surveyId: "string",
  gamePlayed: "'TOP_TIER' | 'IMPOSTER'",
  answers: "Record<string, unknown>",
  metadata: {
    duration: "number",
    playerType: "'REAL' | 'BOT'",
    "isImposter?": "boolean",
    "confidenceScore?": "number",
  },
});
export type ResponseInsert = typeof ResponseInsert.infer;

export const TierItem = type({
  id: "string",
  content: "string",
});
export type TierItem = typeof TierItem.infer;

export const TierLevel = type("'S' | 'A' | 'B' | 'C' | 'D'");
export type TierLevel = typeof TierLevel.infer;

export const ImposterScenario = type({
  topic: "string",
  secretWord: "string",
  gameQuestions: type({
    "originalId?": "string",
    text: "string",
    options: "string[]",
    isFiller: "boolean",
  }).array(),
});
export type ImposterScenario = typeof ImposterScenario.infer;

export const ImposterGameSession = type({
  topic: "string",
  secretWord: "string",
  isUserImposter: "boolean",
  round: "number",
  players: type({ id: "string", name: "string", isBot: "boolean" }).array(),
  questions: type({
    "originalQuestionId?": "string",
    gameText: "string",
    isFiller: "boolean",
    options: "string[]",
  }).array(),
});

export type ImposterGameSession = typeof ImposterGameSession.infer;

// --- GAMIFICATION TYPES (Ported from Prototype) ---

export const TopTierGameData = type({
  applicable: "boolean",
  concepts: "string[]",
  derived_questions: "string[]",
});
export type TopTierGameData = typeof TopTierGameData.infer;

export const ImposterQuestion = type({
  question: "string",
  type: "'text' | 'scale' | 'multiple_choice'",
  "choices_scales?": "string[] | null",
});
export type ImposterQuestion = typeof ImposterQuestion.infer;

export const ImposterGameData = type({
  applicable: "boolean",
  secret_word: "string",
  derived_questions: ImposterQuestion.array(),
});
export type ImposterGameData = typeof ImposterGameData.infer;

export const GamifiedQuestionData = type({
  original_question: "string",
  games: {
    top_tier_rank: TopTierGameData,
    imposter_spyfall: ImposterGameData,
  },
});
export type GamifiedQuestionData = typeof GamifiedQuestionData.infer;

// Update SurveyUpsert to include gamifiedData
// We redefine SurveyUpsert to avoid overwrite issues if I just appended, 
// but since I can't easily replace the previous definition in one go without a huge match block,
// I will just use a separate type for the Gamification request or update the existing one.
// Let's modify the existing SurveyUpsert using replaceAll in a separate edit or just let it be loose for now
// and use a specific validator for the gamification endpoint.

export const GamifyRequest = type({
  companyName: "string",
  productDescription: "string",
  questions: type({
    text: "string",
    type: "'OPEN_ENDED' | 'SINGLE_CHOICE' | 'RANKING' | 'LIKERT'",
    "options?": "string[]",
    "assignedGame?": "'TOP_TIER' | 'IMPOSTER' | 'BOTH'",
  }).array(),
});
export type GamifyRequest = typeof GamifyRequest.infer;
