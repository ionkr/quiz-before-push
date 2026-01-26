import { execSync } from 'child_process';
import type { AIProvider, AIProviderConfig, ChatMessage, ChatResponse } from './types.js';
import type { Quiz, Question, EvaluationResult } from '../types/index.js';
import { ComplexityAnalyzer } from '../analyzer/complexity.js';
import { InstructionBuilder, type RawQuizResponse, type RawEvaluationResponse, type RawChatResponse } from './instruction-builder.js';

export class ClaudeCodeProvider implements AIProvider {
  private language?: string;
  private complexityAnalyzer: ComplexityAnalyzer;

  constructor(config: AIProviderConfig) {
    this.language = config.language;
    this.complexityAnalyzer = new ComplexityAnalyzer();
  }

  getName(): string {
    return 'claude-code';
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

    const content = this.runClaude(prompt);
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

    const content = this.runClaude(prompt);
    const parsed = InstructionBuilder.parseJsonResponse<RawEvaluationResponse>(content);

    return InstructionBuilder.buildEvaluationFromResponse(parsed);
  }

  private runClaude(prompt: string): string {
    try {
      // Use claude CLI with -p flag for prompt and --output-format for JSON
      const result = execSync(`claude -p "${this.escapeForShell(prompt)}" --output-format json`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 120000, // 2 minute timeout
      });

      // Parse the Claude CLI JSON output
      const cliOutput = JSON.parse(result) as { result?: string; content?: string; text?: string };
      return cliOutput.result || cliOutput.content || cliOutput.text || result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Claude CLI error: ${error.message}`);
      }
      throw error;
    }
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

    // Combine messages into a single prompt for Claude CLI
    const systemPrompt = chatMessages.find(m => m.role === 'system')?.content || '';
    const historyText = chatMessages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    const combinedPrompt = `${systemPrompt}\n\nConversation:\n${historyText}`;

    const content = this.runClaude(combinedPrompt);
    const parsed = InstructionBuilder.parseJsonResponse<RawChatResponse>(content);

    return InstructionBuilder.buildChatFromResponse(parsed);
  }

  private escapeForShell(str: string): string {
    // Escape special characters for shell
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`')
      .replace(/\n/g, '\\n');
  }
}
