import type { AIProvider, AIProviderConfig } from './types.js';
import type { Quiz, Question, EvaluationResult } from '../types/index.js';
import { ComplexityAnalyzer } from '../analyzer/complexity.js';
import { InstructionBuilder, type RawQuizResponse, type RawEvaluationResponse } from './instruction-builder.js';

interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;
  private language?: string;
  private complexityAnalyzer: ComplexityAnalyzer;

  constructor(config: AIProviderConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'llama3.2';
    this.language = config.language;
    this.complexityAnalyzer = new ComplexityAnalyzer();
  }

  getName(): string {
    return 'ollama';
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateQuiz(diff: string, complexity: number): Promise<Quiz> {
    const complexityLevel = this.complexityAnalyzer.getDifficultyLevel(complexity);
    const quizCount = this.complexityAnalyzer.getQuizCount(complexity);

    const prompt = InstructionBuilder.buildQuizPrompt({
      quizCount,
      complexityLevel,
      language: this.language,
      diff,
    });

    const content = await this.chat(prompt);
    const parsed = InstructionBuilder.parseJsonResponse<RawQuizResponse>(content);

    return InstructionBuilder.buildQuizFromResponse(parsed, complexityLevel);
  }

  async evaluateAnswer(
    question: Question,
    answer: string,
    attemptCount: number = 1,
    maxAttempts: number = 3
  ): Promise<EvaluationResult> {
    const prompt = InstructionBuilder.buildEvaluationPrompt({
      question,
      answer,
      attemptCount,
      maxAttempts,
      language: this.language,
    });

    const content = await this.chat(prompt);
    const parsed = InstructionBuilder.parseJsonResponse<RawEvaluationResponse>(content);

    return InstructionBuilder.buildEvaluationFromResponse(parsed);
  }

  private async chat(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Always respond with valid JSON only, no markdown formatting.',
          },
          { role: 'user', content: prompt },
        ],
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OllamaChatResponse;
    return data.message.content;
  }
}
