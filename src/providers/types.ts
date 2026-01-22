import type { Quiz, Question, EvaluationResult, QuizConfig } from '../types/index.js';

export interface AIProvider {
  generateQuiz(diff: string, complexity: number): Promise<Quiz>;
  evaluateAnswer(question: Question, answer: string): Promise<EvaluationResult>;
  getName(): string;
}

export interface AIProviderConfig {
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  language?: string;
}

export type { Quiz, Question, EvaluationResult, QuizConfig };
