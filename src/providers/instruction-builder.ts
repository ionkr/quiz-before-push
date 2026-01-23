import type { Quiz, Question, EvaluationResult, ComplexityLevel, QuestionType } from '../types/index.js';

// ============================================
// Type Definitions
// ============================================

export interface QuizPromptParams {
  quizCount: number;
  complexityLevel: string;
  language?: string;
  diff: string;
}

export interface EvaluationPromptParams {
  question: Question;
  answer: string;
  attemptCount: number;
  maxAttempts: number;
  language?: string;
}

export interface RawQuizResponse {
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
}

export interface RawEvaluationResponse {
  score: number;
  passed: boolean;
  feedback: string;
  hint?: string | null;
  correctAnswer?: string | null;
}

// ============================================
// InstructionBuilder Class
// ============================================

export class InstructionBuilder {
  /**
   * Build language instruction for quiz generation or evaluation
   */
  static buildLanguageInstruction(language?: string, forEvaluation: boolean = false): string {
    if (forEvaluation) {
      return language
        ? `Provide feedback in ${language}.`
        : 'Provide feedback in the same language as the question.';
    }
    return language
      ? `Generate all questions and answers in ${language}.`
      : 'Generate questions in the same language as the code comments, or English if no comments.';
  }

  /**
   * Build hint instruction based on attempt count
   */
  static buildHintInstruction(attemptCount: number, maxAttempts: number): string {
    const isLastAttempt = attemptCount >= maxAttempts;

    if (isLastAttempt) {
      return `This is the final attempt. If wrong, provide the correct answer with detailed explanation in "correctAnswer" field. Set "hint" to null.`;
    }

    const hintLevel = attemptCount === 1
      ? 'Give a directional hint about what concept or aspect to consider.'
      : 'Give a more specific hint, suggesting which part of the code to review.';

    return `This is attempt ${attemptCount} of ${maxAttempts}. If wrong, provide a helpful hint in "hint" field to guide the developer toward the correct answer WITHOUT revealing it directly.
${hintLevel}
Do NOT include the correct answer yet - set "correctAnswer" to null.`;
  }

  /**
   * Build the full prompt for quiz generation
   */
  static buildQuizPrompt(params: QuizPromptParams): string {
    const { quizCount, complexityLevel, language, diff } = params;
    const languageInstruction = this.buildLanguageInstruction(language, false);

    return `You are a code review quiz generator. Analyze the following git diff and generate ${quizCount} quiz questions to verify the developer understands the changes.

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
  }

  /**
   * Build the full prompt for answer evaluation
   */
  static buildEvaluationPrompt(params: EvaluationPromptParams): string {
    const { question, answer, attemptCount, maxAttempts, language } = params;
    const languageInstruction = this.buildLanguageInstruction(language, true);
    const hintInstruction = this.buildHintInstruction(attemptCount, maxAttempts);

    const choicesSection = question.type === 'MULTIPLE_CHOICE' && question.choices
      ? `Choices:\n${question.choices.map((c) => `${c.label}. ${c.text}`).join('\n')}`
      : '';

    return `You are a lenient evaluator for a code review quiz. Be generous and focus on whether the developer understands the core concept.

Question: ${question.question}
${choicesSection}
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

HINT INSTRUCTIONS:
${hintInstruction}

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "score": <number 0-10>,
  "passed": <boolean, true if score >= 7>,
  "feedback": "Brief, encouraging feedback",
  "hint": "Helpful hint if wrong and not final attempt, otherwise null",
  "correctAnswer": "Correct answer with explanation (only on final attempt if wrong), otherwise null"
}`;
  }

  /**
   * Parse JSON response, removing markdown code blocks if present
   */
  static parseJsonResponse<T>(content: string): T {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    return JSON.parse(jsonStr) as T;
  }

  /**
   * Build Quiz object from raw API response
   */
  static buildQuizFromResponse(parsed: RawQuizResponse, complexityLevel: string): Quiz {
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

  /**
   * Build EvaluationResult object from raw API response
   */
  static buildEvaluationFromResponse(parsed: RawEvaluationResponse): EvaluationResult {
    return {
      score: parsed.score,
      passed: parsed.passed ?? parsed.score >= 7,
      feedback: parsed.feedback,
      hint: parsed.hint || undefined,
      correctAnswer: parsed.correctAnswer || undefined,
    };
  }
}
