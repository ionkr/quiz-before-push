# 객관식 답변 방향키 선택 UI 구현

## 역할
당신은 이 작업을 순차적으로 구현하는 에이전트입니다.
현재 파일의 작업 체크리스트를 확인하고, 첫 번째 미완료 챕터를 찾아 해당 챕터의 모든 항목을 진행하세요.

### 완료 표시
- 각 항목 완료 후 해당 체크박스를 [x]로 수정
- 챕터 내 모든 항목과 검증 항목 완료 후 다음 챕터로 진행

### 종료 조건
- 모든 체크박스가 [x]이면 → `<promise>ALL_TASKS_COMPLETED</promise>` 출력 후 종료

## 중요 규칙
1. **한 세션에 1개 챕터만 완료** (챕터 완료 후 세션 종료)
2. 반드시 README.md 체크박스 업데이트
3. 컴파일 오류 발생 시 해결 후 완료 처리
4. 챕터 완료 시 반드시 검증 항목(N.✓) 수행
5. 모든 작업 완료 시 `<promise>ALL_TASKS_COMPLETED</promise>` 출력

## 코드베이스 컨텍스트

- **프로젝트 구조**: ESM 기반 TypeScript 프로젝트 (`"type": "module"`)
- **핵심 파일**: `src/quiz/manager.ts` - 퀴즈 실행 및 사용자 입력 처리
- **기존 패턴**:
  - `getAnswer()` 메서드에서 `question.type`으로 분기
  - readline.Interface로 텍스트 입력 처리
  - chalk로 터미널 스타일링
- **재사용 코드**:
  - `prompt()` 메서드 - 단답형 입력용으로 유지
  - chalk 색상 (cyan, gray, green, red)

## 목표

현재 텍스트 입력(A/B/C/D) 방식의 객관식 답변을 키보드 방향키(↑↓)로 선택하는 인터랙티브 UI로 변경

**Before:**
```
  A) Input sanitization
  B) Performance optimization

Your answer (A/B/C/D): _
```

**After:**
```
? What is the purpose of the new validation logic?
❯ A) Input sanitization
  B) Performance optimization
```

---

## 작업 체크리스트

### 1. 의존성 추가

- [x] 1.1 `@inquirer/select` 패키지 설치: `pnpm add @inquirer/select`
- [x] 1.2 `package.json` 확인: dependencies에 `@inquirer/select` 추가됨 확인
- [x] 1.✓ 챕터 1 검증: `pnpm build` 실행하여 기존 빌드 정상 동작 확인

### 2. manager.ts 수정 - import 및 헬퍼 메서드

- [x] 2.1 `src/quiz/manager.ts` 1행: `import select from '@inquirer/select';` 추가 (default export)
- [x] 2.2 `src/quiz/manager.ts`: `getMultipleChoiceAnswer()` private 메서드 추가 (getAnswer 메서드 위에)
  ```typescript
  private async getMultipleChoiceAnswer(question: Question): Promise<string> {
    // readline 충돌 방지
    this.closeReadline();

    const choices = question.choices!.map(choice => ({
      value: choice.label,
      name: `${choice.label}) ${choice.text}`,
    }));

    try {
      const answer = await select({
        message: question.question,
        choices: choices,
        loop: true,
      });
      return answer;
    } catch (error) {
      if (error instanceof Error && error.name === 'ExitPromptError') {
        console.log(chalk.yellow('\n\nQuiz cancelled.'));
        process.exit(1);
      }
      throw error;
    } finally {
      // 다음 질문을 위해 readline 재초기화
      this.initReadline();
    }
  }
  ```
- [x] 2.✓ 챕터 2 검증: `pnpm build` 실행하여 타입 에러 없음 확인

### 3. manager.ts 수정 - getAnswer 및 displayQuestion

- [x] 3.1 `src/quiz/manager.ts` `getAnswer()` 메서드 (219-226행) 수정:
  ```typescript
  private async getAnswer(question: Question): Promise<string> {
    if (question.type === 'MULTIPLE_CHOICE' && question.choices) {
      return this.getMultipleChoiceAnswer(question);
    }

    const prompt = chalk.cyan('Your answer: ');
    return this.prompt(prompt);
  }
  ```
- [x] 3.2 `src/quiz/manager.ts` `displayQuestion()` 메서드 (174-189행) 수정 - MULTIPLE_CHOICE일 때 선택지 출력 제거:
  ```typescript
  private displayQuestion(question: Question, current: number, total: number): void {
    console.log(chalk.bold(`\nQuestion ${current}/${total}`));

    if (question.context) {
      console.log(chalk.gray(`Context: ${question.context}`));
    }

    // MULTIPLE_CHOICE가 아닐 때만 질문 텍스트 출력 (select가 message로 표시)
    if (question.type !== 'MULTIPLE_CHOICE') {
      console.log(chalk.white(`\n${question.question}\n`));
    }
  }
  ```
- [x] 3.✓ 챕터 3 검증: `pnpm build` 실행하여 빌드 성공 확인

### 4. 통합 테스트

- [x] 4.1 `pnpm dev quiz` 실행하여 객관식 문제에서 방향키(↑↓) 선택 동작 확인
- [x] 4.2 Enter 키로 선택 확정 동작 확인
- [x] 4.3 단답형(SHORT_ANSWER/FREE_TEXT) 문제가 있다면 기존 텍스트 입력 동작 확인
- [x] 4.✓ 챕터 4 검증: 퀴즈 전체 플로우 정상 동작 확인 (시작 → 문제 풀이 → 결과)
