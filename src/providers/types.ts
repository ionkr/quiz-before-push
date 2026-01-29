import type { Quiz, Question, EvaluationResult, QuizConfig } from '../types/index.js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  suggestedAction?: 'continue' | 'ready_to_answer';
}

export interface AIProvider {
  generateQuiz(diff: string, complexity: number): Promise<Quiz>;
  evaluateAnswer(
    question: Question,
    answer: string,
    attemptCount?: number,
    maxAttempts?: number
  ): Promise<EvaluationResult>;
  chatAboutTopic(
    question: Question,
    userMessage: string,
    chatHistory: ChatMessage[],
    diff?: string
  ): Promise<ChatResponse>;
  getName(): string;
}

export interface AIProviderConfig {
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  language?: string;
}

export type { Quiz, Question, EvaluationResult, QuizConfig };
