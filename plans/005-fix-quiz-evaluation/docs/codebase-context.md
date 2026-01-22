# 코드베이스 분석 결과

## 수정 대상 파일

### 1. `src/types/index.ts`
**역할**: 핵심 타입 정의

**현재 Question 인터페이스**:
```typescript
export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  choices?: Choice[];
  correctAnswer?: string;  // 기존 필드 (활용 안 됨)
  context?: string;
}
```

**추가할 필드**:
- `correctChoiceLabel?: string` - 객관식 정답 라벨 (예: 'A')
- `correctFeedback?: string` - 정답 시 피드백
- `incorrectFeedback?: string` - 오답 시 피드백

---

### 2. `src/quiz/manager.ts`
**역할**: 퀴즈 실행 및 답변 평가

**주요 메서드**:
- `runQuiz()` - 퀴즈 루프 실행 (line 43-129)
- `getAnswer()` - 답변 입력 처리 (line 244-251)
- `getMultipleChoiceAnswer()` - 객관식 입력 (line 216-242)
- `initReadline()` / `closeReadline()` - readline 관리

**수정 포인트**:
1. `runQuiz()` 내 평가 로직 분기 추가 (line 67 부근)
2. `evaluateMultipleChoice()` 메서드 신규 추가
3. `getMultipleChoiceAnswer()` finally 블록에 stdin resume 추가

**stdin 충돌 관련 코드** (line 216-242):
```typescript
private async getMultipleChoiceAnswer(question: Question): Promise<string> {
  this.closeReadline();  // readline 닫음

  try {
    const answer = await select({...});
    return answer;
  } finally {
    this.initReadline();  // 여기서 stdin 복구 필요
  }
}
```

---

### 3. `src/providers/openai.ts`
**역할**: OpenAI API 연동

**generateQuiz 프롬프트 위치**: line 44-89
**수정 포인트**: JSON 응답 포맷에 객관식 정답/피드백 필드 추가

**현재 프롬프트 구조**:
```
- 복잡도에 따른 질문 개수
- 질문 타입 혼합 (객관식/서술형)
- JSON 응답 포맷 지정
```

---

### 4. `src/providers/anthropic.ts`
**역할**: Anthropic API 연동

**generateQuiz 프롬프트 위치**: line 45-95
**수정 포인트**: openai.ts와 동일

---

### 5. `src/providers/ollama.ts`
**역할**: Ollama (로컬 LLM) 연동

**generateQuiz 프롬프트 위치**: line 42-92
**수정 포인트**: openai.ts와 동일

---

### 6. `src/providers/claude-code.ts`
**역할**: Claude CLI subprocess 호출

**generateQuiz 프롬프트 위치**: line 35-80
**수정 포인트**: openai.ts와 동일

---

## 의존성 관계

```
cli.ts
  └─> index.ts (GitQuiz)
       ├─> providers/*.ts (AI 프로바이더)
       │    └─> types/index.ts (Question 타입)
       └─> quiz/manager.ts (QuizManager)
            ├─> providers/types.ts (AIProvider 인터페이스)
            ├─> readline (Node.js 내장)
            └─> @inquirer/select (외부 패키지)
```

---

## 외부 라이브러리

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| `@inquirer/select` | ^5.0.4 | 대화형 선택 UI (객관식) |
| `readline` | Node.js 내장 | 텍스트 입력 (서술형) |
| `chalk` | ^5.6.2 | 터미널 색상 |
| `ora` | ^9.1.0 | 스피너 |
