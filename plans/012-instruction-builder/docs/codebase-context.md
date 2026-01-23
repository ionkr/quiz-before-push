# 코드베이스 분석 결과

## 프로젝트 구조

```
src/
├── providers/
│   ├── types.ts           # AIProvider 인터페이스, AIProviderConfig
│   ├── anthropic.ts       # Anthropic API (REST)
│   ├── openai.ts          # OpenAI SDK
│   ├── gemini.ts          # Gemini API (REST + JSON Schema)
│   ├── ollama.ts          # Ollama local (REST)
│   └── claude-code.ts     # Claude CLI (execSync)
├── analyzer/
│   └── complexity.ts      # ComplexityAnalyzer (이미 공통화됨)
├── types/
│   └── index.ts           # Quiz, Question, EvaluationResult 등
└── quiz/
    └── manager.ts         # QuizManager (퀴즈 실행 관리)
```

## 중복 코드 분석

### 1. generateQuiz prompt (5개 provider에서 동일)

```typescript
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
  "questions": [...]
}`;
```

### 2. evaluateAnswer prompt (5개 provider에서 동일)

```typescript
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
```

### 3. languageInstruction 생성 (5개 provider에서 동일)

```typescript
// generateQuiz용
const languageInstruction = this.language
  ? `Generate all questions and answers in ${this.language}.`
  : 'Generate questions in the same language as the code comments, or English if no comments.';

// evaluateAnswer용
const languageInstruction = this.language
  ? `Provide feedback in ${this.language}.`
  : 'Provide feedback in the same language as the question.';
```

### 4. hintInstruction 생성 (5개 provider에서 동일)

```typescript
const isLastAttempt = attemptCount >= maxAttempts;
const hintInstruction = isLastAttempt
  ? `This is the final attempt. If wrong, provide the correct answer with detailed explanation in "correctAnswer" field. Set "hint" to null.`
  : `This is attempt ${attemptCount} of ${maxAttempts}. If wrong, provide a helpful hint in "hint" field to guide the developer toward the correct answer WITHOUT revealing it directly.
${attemptCount === 1 ? 'Give a directional hint about what concept or aspect to consider.' : 'Give a more specific hint, suggesting which part of the code to review.'}
Do NOT include the correct answer yet - set "correctAnswer" to null.`;
```

### 5. parseJsonResponse (4개 provider에서 동일, OpenAI 제외)

```typescript
private parseJsonResponse<T>(content: string): T {
  let jsonStr = content.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }
  return JSON.parse(jsonStr) as T;
}
```

### 6. Quiz 객체 변환 (5개 provider에서 동일)

```typescript
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
```

### 7. EvaluationResult 객체 변환 (5개 provider에서 동일)

```typescript
return {
  score: parsed.score,
  passed: parsed.passed ?? parsed.score >= 7,
  feedback: parsed.feedback,
  hint: parsed.hint || undefined,
  correctAnswer: parsed.correctAnswer || undefined,
};
```

## 각 Provider의 고유 로직

### Anthropic
- REST API 직접 호출 (`fetch`)
- `chat(prompt)` 메서드로 API 통신

### OpenAI
- OpenAI SDK 사용 (`this.client.chat.completions.create`)
- `response_format: { type: 'json_object' }` 사용
- parseJsonResponse 불필요 (SDK가 JSON 보장)

### Gemini
- REST API + JSON Schema 사용
- `QUIZ_JSON_SCHEMA`, `EVALUATION_JSON_SCHEMA` 상수 정의
- `chat(prompt, jsonSchema)` 메서드

### Ollama
- 로컬 서버 REST API
- `format: 'json'` 파라미터
- `checkConnection()` 메서드

### Claude-Code
- CLI 실행 (`execSync`)
- `runClaude(prompt)` 메서드
- `escapeForShell(str)` 유틸리티
