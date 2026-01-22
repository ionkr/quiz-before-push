export enum ComplexityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  FREE_TEXT = 'FREE_TEXT',
}

export interface Choice {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  choices?: Choice[];
  correctAnswer?: string;
  context?: string;
}

export interface Quiz {
  questions: Question[];
  complexity: ComplexityLevel;
  generatedAt: Date;
}

export interface EvaluationResult {
  score: number;
  passed: boolean;
  feedback: string;
  correctAnswer?: string;
}

export interface QuizConfig {
  provider: 'openai' | 'ollama' | 'claude-code';
  model?: string;
  apiKey?: string;
  ollamaUrl?: string;
  language?: string;
  maxRetries?: number;
  passingScore?: number;
}
