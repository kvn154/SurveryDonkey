export enum QuestionType {
  OPEN_ENDED = 'OPEN_ENDED',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  RANKING = 'RANKING',
  LIKERT = 'LIKERT'
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For Single Choice or Ranking items
  assignedGame?: 'TOP_TIER' | 'IMPOSTER' | 'BOTH';
}

// --- NEW GAMIFICATION TYPES ---

export interface TopTierGameData {
  applicable: boolean;
  concepts: string[];
  derived_questions: string[];
}

export interface ImposterQuestion {
  question: string;
  type: 'text' | 'scale' | 'multiple_choice';
  choices_scales: string[] | null;
}

export interface ImposterGameData {
  applicable: boolean;
  secret_word: string;
  derived_questions: ImposterQuestion[];
}

export interface GamifiedQuestionData {
  original_question: string;
  games: {
    top_tier_rank: TopTierGameData;
    imposter_spyfall: ImposterGameData;
  };
}

export interface Survey {
  id: string;
  title: string;
  questions: Question[];
  createdAt: number;
  // New field to store the AI generated config
  gamifiedData?: GamifiedQuestionData[]; 
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  gamePlayed: 'TOP_TIER' | 'IMPOSTER';
  timestamp: number;
  answers: Record<string, any>; // questionId -> answer
  metadata: {
    duration: number;
    playerType: 'REAL' | 'BOT'; // For Imposter game
    isImposter?: boolean;
    confidenceScore?: number;
  };
}

export interface TierItem {
  id: string;
  content: string;
}

export type TierLevel = 'S' | 'A' | 'B' | 'C' | 'D';

export interface ImposterGameSession {
  topic: string;
  secretWord: string;
  isUserImposter: boolean;
  round: number;
  players: { id: string; name: string; isBot: boolean }[];
  questions: {
    originalQuestionId?: string;
    gameText: string;
    isFiller: boolean;
    options: string[];
  }[];
}