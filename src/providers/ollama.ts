import type { AIProvider, AIProviderConfig } from './types.js';
import type { Quiz, Question, EvaluationResult, ComplexityLevel, QuestionType } from '../types/index.js';

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

  constructor(config: AIProviderConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'llama3.2';
    this.language = config.language;
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
    const complexityLevel = this.getComplexityLevel(complexity);
    const quizCount = this.getQuizCount(complexity);
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

    const prompt = `You are evaluating a developer's answer to a code review quiz question.

Question: ${question.question}
${question.type === 'MULTIPLE_CHOICE' ? `Choices:\n${question.choices?.map((c) => `${c.label}. ${c.text}`).join('\n')}` : ''}
Expected Answer: ${question.correctAnswer || 'N/A'}
Developer's Answer: ${answer}

${languageInstruction}

Evaluate the answer on a scale of 0-10:
- 0-3: Completely wrong or shows no understanding
- 4-6: Partially correct but missing key points
- 7-8: Good understanding with minor gaps
- 9-10: Excellent, demonstrates full understanding

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "score": <number 0-10>,
  "passed": <boolean, true if score >= 7>,
  "feedback": "Detailed feedback explaining the score",
  "correctAnswer": "The correct answer or key points that should have been mentioned"
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

  private parseJsonResponse<T>(content: string): T {
    // Try to extract JSON from the response (handles markdown code blocks)
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    return JSON.parse(jsonStr) as T;
  }

  private getComplexityLevel(complexity: number): string {
    if (complexity < 25) return 'LOW';
    if (complexity < 50) return 'MEDIUM';
    if (complexity < 75) return 'HIGH';
    return 'CRITICAL';
  }

  private getQuizCount(complexity: number): number {
    if (complexity < 20) return 1;
    if (complexity < 40) return 2;
    if (complexity < 60) return 3;
    if (complexity < 80) return 4;
    return 5;
  }
}
