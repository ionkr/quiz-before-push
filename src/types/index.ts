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
  // 객관식 문제용 필드 (로컬 평가를 위해)
  correctChoiceLabel?: string; // 정답 선택지 라벨 (예: 'A', 'B')
  correctFeedback?: string; // 정답 시 피드백
  incorrectFeedback?: string; // 오답 시 피드백
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
  hint?: string; // 오답 시 힌트 (정답 공개 전 제공)
}

export interface QuizConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'claude-code';
  model?: string;
  apiKey?: string;
  ollamaUrl?: string;
  language?: string;
  maxRetries?: number;
  passingPercentage?: number;
}

export interface IgnoreConfig {
  patterns: string[];
  defaultPatterns: string[];
}
