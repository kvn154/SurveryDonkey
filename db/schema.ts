import { pgTable, text, timestamp, uuid, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createSelectSchema, createInsertSchema } from 'drizzle-arktype';

// Enums
export const questionTypeEnum = pgEnum('question_type', ['OPEN_ENDED', 'SINGLE_CHOICE', 'RANKING', 'LIKERT']);
export const assignedGameEnum = pgEnum('assigned_game', ['TOP_TIER', 'IMPOSTER', 'BOTH']);
export const gameTypeEnum = pgEnum('game_type', ['TOP_TIER', 'IMPOSTER']);
export const playerTypeEnum = pgEnum('player_type', ['REAL', 'BOT']);

// Surveys Table
export const surveys = pgTable('surveys', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  gamifiedData: jsonb('gamified_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const selectSurveySchema = createSelectSchema(surveys);
export const insertSurveySchema = createInsertSchema(surveys);

// Questions Table
export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  surveyId: uuid('survey_id').references(() => surveys.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  type: questionTypeEnum('type').notNull(),
  options: jsonb('options').$type<string[]>(),
  assignedGame: assignedGameEnum('assigned_game').default('BOTH'),
});

export const selectQuestionSchema = createSelectSchema(questions);
export const insertQuestionSchema = createInsertSchema(questions);

// Survey Responses Table
export const responses = pgTable('responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  surveyId: uuid('survey_id').references(() => surveys.id, { onDelete: 'cascade' }).notNull(),
  gamePlayed: gameTypeEnum('game_played').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  answers: jsonb('answers').$type<Record<string, unknown>>().notNull(),
  metadata: jsonb('metadata').$type<{
    duration: number;
    playerType: 'REAL' | 'BOT';
    isImposter?: boolean;
    confidenceScore?: number;
  }>().notNull(),
});

export const selectResponseSchema = createSelectSchema(responses);
export const insertResponseSchema = createInsertSchema(responses);

// Relations
export const surveysRelations = relations(surveys, ({ many }) => ({
  questions: many(questions),
  responses: many(responses),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  survey: one(surveys, {
    fields: [questions.surveyId],
    references: [surveys.id],
  }),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  survey: one(surveys, {
    fields: [responses.surveyId],
    references: [surveys.id],
  }),
}));

// Infer Types for Frontend
export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Response = typeof responses.$inferSelect;
export type NewResponse = typeof responses.$inferInsert;
