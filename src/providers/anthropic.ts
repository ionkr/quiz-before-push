import type { AIProvider, AIProviderConfig, ChatMessage, ChatResponse } from './types.js';
import type { Quiz, Question, EvaluationResult } from '../types/index.js';
import { ComplexityAnalyzer } from '../analyzer/complexity.js';
import { InstructionBuilder, type RawQuizResponse, type RawEvaluationResponse, type RawChatResponse } from './instruction-builder.js';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  stop_reason: string;
}

export class AnthropicProvider implements AIProvider {
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private language?: string;
  private complexityAnalyzer: ComplexityAnalyzer;

  constructor(config: AIProviderConfig) {
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com';
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.language = config.language;
    this.complexityAnalyzer = new ComplexityAnalyzer();

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required. Set it via environment variable or config.');
    }
  }

  getName(): string {
    return 'anthropic';
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

  async chatAboutTopic(
    question: Question,
    userMessage: string,
    chatHistory: ChatMessage[],
    diff?: string
  ): Promise<ChatResponse> {
    const chatMessages = InstructionBuilder.buildChatMessages({
      question,
      userMessage,
      chatHistory,
      diff,
      language: this.language,
    });

    // Extract system message and user/assistant messages
    const systemMessage = chatMessages.find(m => m.role === 'system')?.content || '';
    const messages: AnthropicMessage[] = chatMessages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const content = await this.chatWithSystem(messages, systemMessage);
    const parsed = InstructionBuilder.parseJsonResponse<RawChatResponse>(content);

    return InstructionBuilder.buildChatFromResponse(parsed);
  }

  private async chat(prompt: string): Promise<string> {
    const messages: AnthropicMessage[] = [{ role: 'user', content: prompt }];
    return this.chatWithSystem(messages, 'You are a helpful assistant. Always respond with valid JSON only, no markdown formatting.');
  }

  private async chatWithSystem(messages: AnthropicMessage[], system: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = (await response.json()) as AnthropicResponse;
    const textContent = data.content.find((c) => c.type === 'text');
    if (!textContent) {
      throw new Error('No text content in Anthropic response');
    }
    return textContent.text;
  }
}
