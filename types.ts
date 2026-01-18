import { type } from "arktype";
import { selectSurveySchema, selectQuestionSchema, selectResponseSchema } from "./db/schema";

export const QuestionType = type("'OPEN_ENDED' | 'SINGLE_CHOICE' | 'RANKING' | 'LIKERT'");

export const Question = selectQuestionSchema;
export type Question = typeof Question.infer;

export const Survey = selectSurveySchema.and({
  questions: Question.array(),
  createdAt: "string | Date | number",
});
export type Survey = typeof Survey.infer;

export const SurveyResponse = selectResponseSchema.and({
  timestamp: "string | Date | number",
});
export type SurveyResponse = typeof SurveyResponse.infer;

export const SurveyUpsert = type({
  title: "string",
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
