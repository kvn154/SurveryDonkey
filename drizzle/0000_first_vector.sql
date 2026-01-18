CREATE TYPE "public"."assigned_game" AS ENUM('TOP_TIER', 'IMPOSTER', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."game_type" AS ENUM('TOP_TIER', 'IMPOSTER');--> statement-breakpoint
CREATE TYPE "public"."player_type" AS ENUM('REAL', 'BOT');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('OPEN_ENDED', 'SINGLE_CHOICE', 'RANKING', 'LIKERT');--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"text" text NOT NULL,
	"type" "question_type" NOT NULL,
	"options" jsonb,
	"assigned_game" "assigned_game" DEFAULT 'BOTH'
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"game_played" "game_type" NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"answers" jsonb NOT NULL,
	"metadata" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;