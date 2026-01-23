import type { AIProvider, AIProviderConfig } from './types.js';
import type { Quiz, Question, EvaluationResult } from '../types/index.js';
import { ComplexityAnalyzer } from '../analyzer/complexity.js';
import { InstructionBuilder, type RawQuizResponse, type RawEvaluationResponse } from './instruction-builder.js';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

const QUIZ_JSON_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['MULTIPLE_CHOICE', 'FREE_TEXT'] },
          question: { type: 'string' },
          choices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                text: { type: 'string' },
              },
              required: ['label', 'text'],
            },
          },
          correctAnswer: { type: 'string' },
          correctChoiceLabel: { type: 'string' },
          correctFeedback: { type: 'string' },
          incorrectFeedback: { type: 'string' },
          context: { type: 'string' },
        },
        required: ['id', 'type', 'question'],
      },
    },
  },
  required: ['questions'],
};

const EVALUATION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 0, maximum: 10 },
    passed: { type: 'boolean' },
    feedback: { type: 'string' },
    hint: { type: 'string' },
    correctAnswer: { type: 'string' },
  },
  required: ['score', 'passed', 'feedback'],
};

export class GeminiProvider implements AIProvider {
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private language?: string;
  private complexityAnalyzer: ComplexityAnalyzer;

  constructor(config: AIProviderConfig) {
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    this.model = config.model || 'gemini-3-flash-preview';
    this.language = config.language;
    this.complexityAnalyzer = new ComplexityAnalyzer();

    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required. Set it via environment variable or config.');
    }
  }

  getName(): string {
    return 'gemini';
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

    const content = await this.chat(prompt, QUIZ_JSON_SCHEMA);
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

    const content = await this.chat(prompt, EVALUATION_JSON_SCHEMA);
    const parsed = InstructionBuilder.parseJsonResponse<RawEvaluationResponse>(content);

    return InstructionBuilder.buildEvaluationFromResponse(parsed);
  }

  private async chat(prompt: string, jsonSchema?: object): Promise<string> {
    const url = `${this.baseUrl}/models/${this.model}:generateContent`;

    const body: {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: {
        responseMimeType: string;
        responseJsonSchema?: object;
        maxOutputTokens: number;
      };
    } = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
      },
    };

    if (jsonSchema) {
      body.generationConfig.responseJsonSchema = jsonSchema;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = (await response.json()) as GeminiResponse;

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No candidates in Gemini response');
    }

    const textContent = data.candidates[0].content.parts[0]?.text;
    if (!textContent) {
      throw new Error('No text content in Gemini response');
    }

    return textContent;
  }
}
