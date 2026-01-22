# Improve Complexity Analyzer

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

- **핵심 파일**: `src/analyzer/complexity.ts` (197줄)
- **중복 코드 위치**: 5개 Provider 파일에 `getQuizCount()`, `getComplexityLevel()` 중복
- **타입 정의**: `src/types/index.ts`의 `ComplexityLevel` enum
- **사용처**: `src/index.ts`의 GitQuiz 클래스

상세 내용은 `docs/` 참조:
- [requirements.md](docs/requirements.md) - 요구사항 상세
- [codebase-context.md](docs/codebase-context.md) - 코드베이스 분석

---

## 작업 체크리스트

### 1. DiffAnalysis 인터페이스 확장

- [x] 1.1 `src/analyzer/complexity.ts` 수정: DiffAnalysis 인터페이스에 새 필드 추가
  ```typescript
  // 기존 boolean → number로 변경
  functionChangeCount: number;    // 변경된 함수 개수
  classChangeCount: number;       // 변경된 클래스/인터페이스 개수
  // 새 필드 추가
  weightedLines: number;          // 가중치 적용된 라인 수
  codeFileCount: number;          // 코드 파일 개수 (문서 제외)
  ```

- [x] 1.2 `src/analyzer/complexity.ts` 수정: 파일 유형별 가중치 상수 추가
  ```typescript
  private readonly fileTypeWeights: Record<string, number> = {
    // 코드 파일
    '.ts': 1.0, '.tsx': 1.0, '.js': 1.0, '.jsx': 1.0,
    '.py': 1.0, '.go': 1.0, '.rs': 1.0, '.java': 1.0,
    // 설정 파일
    '.json': 0.7, '.yaml': 0.7, '.yml': 0.7, '.toml': 0.7,
    // 문서 파일
    '.md': 0.3, '.txt': 0.3, '.rst': 0.3,
    // 스타일 파일
    '.css': 0.5, '.scss': 0.5, '.less': 0.5,
  };
  ```

- [x] 1.3 `src/analyzer/complexity.ts` 수정: `getFileWeight()` private 메서드 추가
  - 파일 경로에서 확장자 추출
  - `fileTypeWeights`에서 가중치 반환 (없으면 기본값 0.8)

- [x] 1.✓ 챕터 1 검증: `npx tsc --noEmit` 실행하여 타입 오류 없음 확인

### 2. analyzeDiff 메서드 개선

- [x] 2.1 `src/analyzer/complexity.ts` 수정: 함수/클래스 카운터 변수 추가
  - `let functionChangeCount = 0;`
  - `let classChangeCount = 0;`
  - 기존 `hasFunctionChanges`, `hasClassChanges` 유지 (하위 호환)

- [x] 2.2 `src/analyzer/complexity.ts` 수정: 패턴 매칭 시 카운트 증가
  - 함수 패턴 매칭 시 `functionChangeCount++`
  - 클래스 패턴 매칭 시 `classChangeCount++`

- [x] 2.3 `src/analyzer/complexity.ts` 수정: 파일별 가중치 적용 로직 추가
  - 각 파일의 변경 라인에 해당 파일의 가중치 적용
  - `weightedLines` 계산: `addedLines * 1.3 + deletedLines * 0.7` 에 파일 가중치 곱하기

- [x] 2.4 `src/analyzer/complexity.ts` 수정: `codeFileCount` 계산 추가
  - `.ts`, `.js`, `.tsx`, `.jsx` 등 코드 파일만 카운트

- [x] 2.5 `src/analyzer/complexity.ts` 수정: 반환 객체에 새 필드 추가
  ```typescript
  return {
    // 기존 필드...
    hasFunctionChanges: functionChangeCount > 0,  // 하위 호환
    hasClassChanges: classChangeCount > 0,        // 하위 호환
    functionChangeCount,
    classChangeCount,
    weightedLines,
    codeFileCount,
    // ...
  };
  ```

- [x] 2.✓ 챕터 2 검증: `npx tsc --noEmit` 실행하여 타입 오류 없음 확인

### 3. calculateComplexity 메서드 개선

- [x] 3.1 `src/analyzer/complexity.ts` 수정: 라인 수 점수 기준 조정 (weightedLines 사용)
  ```typescript
  // 가중치 적용된 라인 수 기준
  if (params.weightedLines <= 20) complexity += 5;
  else if (params.weightedLines <= 80) complexity += 15;
  else if (params.weightedLines <= 150) complexity += 25;
  else if (params.weightedLines <= 300) complexity += 35;
  else complexity += 40;
  ```

- [x] 3.2 `src/analyzer/complexity.ts` 수정: 파일 수 점수를 codeFileCount 기준으로 변경
  ```typescript
  // 코드 파일 수 기준 (문서 파일 제외)
  if (params.codeFileCount <= 1) complexity += 5;
  else if (params.codeFileCount <= 3) complexity += 10;
  else if (params.codeFileCount <= 5) complexity += 15;
  else complexity += 20;
  ```

- [x] 3.3 `src/analyzer/complexity.ts` 수정: 함수/클래스 점수를 개수 기반으로 변경
  ```typescript
  // 함수 변경 개수 기반 (최대 25점)
  complexity += Math.min(params.functionChangeCount * 5, 25);
  // 클래스 변경 개수 기반 (최대 20점)
  complexity += Math.min(params.classChangeCount * 8, 20);
  ```

- [x] 3.4 `src/analyzer/complexity.ts` 수정: 변경 집중도 보너스 추가
  ```typescript
  // 분산된 변경은 컨텍스트 스위칭으로 더 어려움
  const avgLinesPerFile = params.weightedLines / Math.max(params.codeFileCount, 1);
  if (avgLinesPerFile < 10 && params.codeFileCount > 3) {
    complexity += 10;  // 분산 변경 보너스
  }
  ```

- [x] 3.5 `src/analyzer/complexity.ts` 수정: calculateComplexity 파라미터 타입 업데이트
  - 새 필드들 (`functionChangeCount`, `classChangeCount`, `weightedLines`, `codeFileCount`) 추가

- [x] 3.✓ 챕터 3 검증: `npx tsc --noEmit` 실행하여 타입 오류 없음 확인

### 4. 중복 코드 제거 - Provider 정리

- [x] 4.1 `src/analyzer/complexity.ts` 수정: `getQuizCount()`, `getDifficultyLevel()` 메서드를 public으로 export
  - 이미 public이면 확인만

- [x] 4.2 `src/providers/openai.ts` 수정: 중복 메서드 제거
  - `private getComplexityLevel()` 메서드 삭제
  - `private getQuizCount()` 메서드 삭제
  - `ComplexityAnalyzer` import 추가
  - `generateQuiz()` 내에서 `new ComplexityAnalyzer().getQuizCount(complexity)` 사용

- [x] 4.3 `src/providers/anthropic.ts` 수정: 중복 메서드 제거
  - 4.2와 동일한 방식으로 수정

- [x] 4.4 `src/providers/gemini.ts` 수정: 중복 메서드 제거
  - 4.2와 동일한 방식으로 수정

- [x] 4.5 `src/providers/ollama.ts` 수정: 중복 메서드 제거
  - 4.2와 동일한 방식으로 수정

- [x] 4.6 `src/providers/claude-code.ts` 수정: 중복 메서드 제거
  - 4.2와 동일한 방식으로 수정

- [x] 4.✓ 챕터 4 검증: `npx tsc --noEmit` 실행하여 타입 오류 없음 확인

### 5. 빌드 및 통합 검증

- [x] 5.1 빌드 실행: `pnpm build`

- [x] 5.2 CLI 동작 확인: `node dist/cli.js --help`

- [x] 5.3 간단한 수동 테스트: 현재 디렉토리에서 `node dist/cli.js --provider anthropic` 실행하여 복잡도 분석 결과 확인

- [x] 5.✓ 챕터 5 검증: 빌드 성공 및 CLI 정상 동작 확인
