import type { AIProvider, AIProviderConfig } from './types.js';
import type { Quiz, Question, EvaluationResult, ComplexityLevel, QuestionType } from '../types/index.js';
import { ComplexityAnalyzer } from '../analyzer/complexity.js';

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
    const languageInstruction = this.language
      ? `Generate all questions and answers in ${this.language}.`
      : 'Generate questions in the same language as the code comments, or English if no comments.';

    const prompt = `You are a code review quiz generator. Analyze the following git diff and generate ${quizCount} quiz questions to verify the developer understands the changes.

${languageInstruction}

Guidelines:
- Mix question types: some multiple choice (with 4 options labeled A, B, C, D), some free text requiring explanation
- Focus on understanding WHY changes were made, not just WHAT changed
- Test understanding of the logic, potential edge cases, and implications
- Difficulty should match complexity level: ${complexityLevel}

Git Diff:
\`\`\`
${diff}
\`\`\`

Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "type": "MULTIPLE_CHOICE",
      "question": "Your question here?",
      "choices": [
        {"label": "A", "text": "First option"},
        {"label": "B", "text": "Second option"},
        {"label": "C", "text": "Third option"},
        {"label": "D", "text": "Fourth option"}
      ],
      "correctAnswer": "A",
      "correctChoiceLabel": "A",
      "correctFeedback": "Feedback to show when the developer selects the correct answer",
      "incorrectFeedback": "Feedback to show when the developer selects a wrong answer, explaining why the correct answer is right",
      "context": "Brief context about what part of the diff this relates to"
    },
    {
      "id": "q2",
      "type": "FREE_TEXT",
      "question": "Explain why...",
      "correctAnswer": "Expected key points in the answer",
      "context": "Brief context"
    }
  ]
}`;

    const content = await this.chat(prompt);
    const parsed = this.parseJsonResponse<{
      questions: Array<{
        id: string;
        type: string;
        question: string;
        choices?: Array<{ label: string; text: string }>;
        correctAnswer?: string;
        correctChoiceLabel?: string;
        correctFeedback?: string;
        incorrectFeedback?: string;
        context?: string;
      }>;
    }>(content);

    return {
      questions: parsed.questions.map((q) => ({
        id: q.id,
        type: q.type as QuestionType,
        question: q.question,
        choices: q.choices,
        correctAnswer: q.correctAnswer,
        correctChoiceLabel: q.correctChoiceLabel,
        correctFeedback: q.correctFeedback,
        incorrectFeedback: q.incorrectFeedback,
        context: q.context,
      })),
      complexity: complexityLevel as ComplexityLevel,
      generatedAt: new Date(),
    };
  }

  async evaluateAnswer(question: Question, answer: string): Promise<EvaluationResult> {
    const languageInstruction = this.language
      ? `Provide feedback in ${this.language}.`
      : 'Provide feedback in the same language as the question.';

    const prompt = `You are a lenient evaluator for a code review quiz. Be generous and focus on whether the developer understands the core concept.

Question: ${question.question}
${question.type === 'MULTIPLE_CHOICE' ? `Choices:\n${question.choices?.map((c) => `${c.label}. ${c.text}`).join('\n')}` : ''}
Expected Answer: ${question.correctAnswer || 'N/A'}
Developer's Answer: ${answer}

${languageInstruction}

IMPORTANT: Be generous in scoring. If the developer shows they understand the main idea, give them credit.

Scoring guide (be lenient):
- 7-10: Developer understands the core concept, even if explanation is brief or imperfect
- 4-6: Partial understanding, missing important aspects
- 0-3: Completely wrong or no understanding

A brief but correct answer should score 7+. Don't penalize for:
- Informal language or typos
- Missing minor details if the main point is correct
- Different wording that conveys the same meaning

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "score": <number 0-10>,
  "passed": <boolean, true if score >= 7>,
  "feedback": "Brief, encouraging feedback",
  "correctAnswer": "Key points (only if failed)"
}`;

    const content = await this.chat(prompt);
    const parsed = this.parseJsonResponse<{
      score: number;
      passed: boolean;
      feedback: string;
      correctAnswer?: string;
    }>(content);

    return {
      score: parsed.score,
      passed: parsed.passed ?? parsed.score >= 7,
      feedback: parsed.feedback,
      correctAnswer: parsed.correctAnswer,
    };
  }

  private async chat(prompt: string): Promise<string> {
    const messages: AnthropicMessage[] = [{ role: 'user', content: prompt }];

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
        system: 'You are a helpful assistant. Always respond with valid JSON only, no markdown formatting.',
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

  private parseJsonResponse<T>(content: string): T {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    return JSON.parse(jsonStr) as T;
  }

}
