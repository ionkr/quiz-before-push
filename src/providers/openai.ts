import OpenAI from 'openai';
import type { AIProvider, AIProviderConfig } from './types.js';
import type { Quiz, Question, EvaluationResult, ComplexityLevel, QuestionType } from '../types/index.js';
import { ComplexityAnalyzer } from '../analyzer/complexity.js';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;
  private language?: string;
  private complexityAnalyzer: ComplexityAnalyzer;

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseURL: config.baseUrl,
    });
    this.model = config.model || 'gpt-4o-mini';
    this.language = config.language;
    this.complexityAnalyzer = new ComplexityAnalyzer();
  }

  getName(): string {
    return 'openai';
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

Respond with a JSON object in this exact format:
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

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates code review quizzes. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content) as {
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
    };

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

Respond with a JSON object:
{
  "score": <number 0-10>,
  "passed": <boolean, true if score >= 7>,
  "feedback": "Brief, encouraging feedback",
  "correctAnswer": "Key points (only if failed)"
}`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a fair and constructive code review evaluator. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content) as {
      score: number;
      passed: boolean;
      feedback: string;
      correctAnswer?: string;
    };

    return {
      score: parsed.score,
      passed: parsed.passed ?? parsed.score >= 7,
      feedback: parsed.feedback,
      correctAnswer: parsed.correctAnswer,
    };
  }

}
