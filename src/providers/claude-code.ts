import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { AIProvider, AIProviderConfig, ChatMessage, ChatResponse } from './types.js';
import type { Quiz, Question, EvaluationResult } from '../types/index.js';
import { ComplexityAnalyzer } from '../analyzer/complexity.js';
import { InstructionBuilder, type RawQuizResponse, type RawEvaluationResponse } from './instruction-builder.js';

// Chat 응답용 JSON Schema (Claude Code CLI --json-schema 옵션용)
const CHAT_JSON_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    message: { type: 'string' },
    suggestedAction: { type: 'string', enum: ['continue', 'ready_to_answer'] }
  },
  required: ['message']
});

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

  private runClaude(prompt: string, jsonSchema?: string): string {
    // Write prompt to temp file to avoid shell argument length limits
    const tempFile = path.join(os.tmpdir(), `quiz-prompt-${Date.now()}.txt`);

    try {
      fs.writeFileSync(tempFile, prompt, 'utf-8');

      // Use claude CLI with Read tool to read the prompt from temp file
      const metaPrompt = `Read the file ${tempFile} and follow the instructions in it exactly. Return only the JSON response as specified.`;

      const args = ['-p', metaPrompt, '--allowedTools', 'Read', '--output-format', 'json'];
      if (jsonSchema) {
        args.push('--json-schema', jsonSchema);
      }

      const result = spawnSync('claude', args, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 180000, // 3 minute timeout for large diffs
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        throw new Error(`Claude CLI exited with code ${result.status}: ${result.stderr}`);
      }

      // Parse the Claude CLI JSON output
      // --json-schema 사용 시 structured_output 필드에 결과 반환
      const cliOutput = JSON.parse(result.stdout) as {
        result?: string;
        content?: string;
        text?: string;
        structured_output?: object;
      };

      if (jsonSchema && cliOutput.structured_output) {
        return JSON.stringify(cliOutput.structured_output);
      }
      return cliOutput.result || cliOutput.content || cliOutput.text || result.stdout;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Claude CLI error: ${error.message}`);
      }
      throw error;
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch {
        // Ignore cleanup errors
      }
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

    const content = this.runClaude(combinedPrompt, CHAT_JSON_SCHEMA);
    const parsed = InstructionBuilder.parseChatJsonResponse(content);

    return InstructionBuilder.buildChatFromResponse(parsed);
  }
}
