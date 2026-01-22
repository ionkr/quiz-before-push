# Add Gemini Provider

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

- **프로젝트 구조**: TypeScript 기반 CLI 도구, `src/providers/`에 AI provider 구현체들
- **기존 Provider 패턴**: `AIProvider` 인터페이스 구현, `fetch` API 사용 (Anthropic/Ollama)
- **재사용 가능한 코드**:
  - `src/providers/anthropic.ts`: fetch 기반 HTTP 요청 패턴
  - `src/providers/types.ts`: AIProvider 인터페이스
  - 프롬프트 구조, JSON 파싱, 복잡도 계산 로직

## 요구사항 요약

- **목표**: Gemini를 새로운 AI provider로 추가
- **기본 모델**: `gemini-3-flash-preview`
- **HTTP 방식**: `fetch` API 사용 (SDK 사용 안함)
- **JSON 모드**: `responseMimeType` + `responseJsonSchema` 사용

상세 내용은 `docs/` 참조:
- [requirements.md](docs/requirements.md) - 정제된 요구사항
- [api-spec.md](docs/api-spec.md) - Gemini API 명세
- [codebase-context.md](docs/codebase-context.md) - 코드베이스 분석 결과

---

## 작업 체크리스트

### 1. GeminiProvider 클래스 생성

- [x] 1.1 `src/providers/gemini.ts` 생성: 기본 클래스 구조 작성
  - `AIProvider` 인터페이스 import
  - `GeminiProvider` 클래스 선언
  - constructor에서 `baseUrl`, `apiKey`, `model`, `language` 설정
  - 기본 모델: `gemini-3-flash-preview`
  - 기본 URL: `https://generativelanguage.googleapis.com/v1beta`
  - API 키: `config.apiKey || process.env.GEMINI_API_KEY`

- [x] 1.2 `src/providers/gemini.ts`: `chat()` private 메서드 구현
  - fetch API로 Gemini generateContent 엔드포인트 호출
  - 헤더: `Content-Type: application/json`, `x-goog-api-key: ${apiKey}`
  - body에 `generationConfig.responseMimeType: "application/json"` 설정
  - 응답에서 `candidates[0].content.parts[0].text` 추출

- [x] 1.3 `src/providers/gemini.ts`: `generateQuiz()` 메서드 구현
  - `anthropic.ts`의 동일 메서드 참고
  - 프롬프트 구조 동일하게 유지
  - `responseJsonSchema` 추가하여 Quiz 구조 강제

- [x] 1.4 `src/providers/gemini.ts`: `evaluateAnswer()` 메서드 구현
  - `anthropic.ts`의 동일 메서드 참고
  - `responseJsonSchema` 추가하여 EvaluationResult 구조 강제

- [x] 1.5 `src/providers/gemini.ts`: 헬퍼 메서드 구현
  - `getName()`: `'gemini'` 반환
  - `parseJsonResponse<T>()`: markdown 코드블록 제거 후 JSON 파싱
  - `getComplexityLevel()`: complexity → 'LOW'/'MEDIUM'/'HIGH'/'CRITICAL'
  - `getQuizCount()`: complexity → 1~5 문제 수

- [x] 1.✓ 챕터 1 검증: `npx tsc --noEmit` 실행하여 타입 오류 없음 확인

### 2. Provider Factory 및 타입 통합

- [x] 2.1 `src/providers/index.ts` 수정: GeminiProvider import 추가
  ```typescript
  import { GeminiProvider } from './gemini.js';
  ```

- [x] 2.2 `src/providers/index.ts` 수정: ProviderOptions 타입에 'gemini' 추가
  ```typescript
  provider: 'openai' | 'ollama' | 'claude-code' | 'anthropic' | 'gemini';
  ```

- [x] 2.3 `src/providers/index.ts` 수정: createProvider switch문에 gemini case 추가
  ```typescript
  case 'gemini':
    return new GeminiProvider({
      model: options.model,
      apiKey: options.apiKey,
      language: options.language,
    });
  ```

- [x] 2.4 `src/providers/index.ts` 수정: export 문에 GeminiProvider 추가

- [x] 2.✓ 챕터 2 검증: `npx tsc --noEmit` 실행하여 타입 오류 없음 확인

### 3. CLI 통합

- [x] 3.1 `src/cli.ts` 수정: GitQuizCliOptions 타입에 'gemini' 추가 (라인 13)
  ```typescript
  provider: 'openai' | 'ollama' | 'claude-code' | 'anthropic' | 'gemini';
  ```

- [x] 3.2 `src/cli.ts` 수정: validProviders 배열에 'gemini' 추가 (라인 154)
  ```typescript
  const validProviders = ['openai', 'ollama', 'claude-code', 'anthropic', 'gemini'];
  ```

- [x] 3.3 `src/cli.ts` 수정: getDefaultApiKey 함수에 gemini 케이스 추가 (라인 139-142)
  ```typescript
  const getDefaultApiKey = (p: string) => {
    if (p === 'anthropic') return process.env.ANTHROPIC_API_KEY;
    if (p === 'gemini') return process.env.GEMINI_API_KEY;
    return process.env.OPENAI_API_KEY;
  };
  ```

- [x] 3.4 `src/cli.ts` 수정: provider 옵션 설명에 gemini 추가 (라인 117-119)
  ```typescript
  .option(
    '-p, --provider <provider>',
    'AI provider to use (openai, ollama, claude-code, anthropic, gemini)'
  )
  ```

- [x] 3.5 `src/cli.ts` 수정: GitQuiz 생성자 타입에 'gemini' 추가 (라인 177)

- [x] 3.✓ 챕터 3 검증: `npx tsc --noEmit` 실행하여 타입 오류 없음 확인

### 4. 환경 변수 및 문서화

- [x] 4.1 `.env.example` 수정: GEMINI_API_KEY 추가
  ```
  GEMINI_API_KEY=your_gemini_api_key_here
  ```

- [x] 4.2 `README.md` 수정 (있다면): Gemini provider 사용법 추가
  - provider 옵션에 gemini 추가
  - GEMINI_API_KEY 환경변수 설명

- [x] 4.✓ 챕터 4 검증: `cat .env.example`으로 내용 확인

### 5. 빌드 및 통합 테스트

- [x] 5.1 빌드 실행: `npm run build` 또는 `pnpm build`

- [x] 5.2 빌드 결과 확인: `dist/providers/gemini.js` 파일 존재 확인

- [x] 5.3 CLI 도움말 확인: `node dist/cli.js --help`에서 gemini 옵션 표시 확인

- [x] 5.✓ 챕터 5 검증: 빌드 성공 및 CLI 동작 확인
