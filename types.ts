
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  a: number;
  b: number;
  result: number;
}

export interface GameState {
  currentQuestion: Question | null;
  score: number;
  streak: number;
  attempts: number;
  history: Question[];
  difficulty: Difficulty;
}

export interface GeminiFeedback {
  message: string;
  tip?: string;
  emoji: string;
}
