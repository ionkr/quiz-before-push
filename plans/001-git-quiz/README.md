# git-quiz 구현 태스크

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

> 참고 프로젝트: [git-rewrite-commits](https://github.com/f/git-rewrite-commits)

- **기술 스택**: TypeScript, Node.js (>=16), ES Modules
- **CLI 프레임워크**: Commander.js
- **LLM 프로바이더**: OpenAI SDK, Ollama REST API, Claude Code CLI
- **UI/UX**: Chalk (색상), Ora (스피너)
- **프로바이더 패턴**: 팩토리 함수로 프로바이더 추상화

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 목적 | AI 작성 코드를 이해 없이 반영하는 것 방지 |
| 퀴즈 형태 | 객관식 + 자연어 설명 |
| 퀴즈 개수 | 적응형 (1-5개, 변경 복잡도에 따라) |
| 실패 처리 | 완전 차단 (3회 실패 후 우회 옵션: diff 보며 재시도) |
| 채점 방식 | LLM 판정 (0-10점, 7점 이상 통과) |
| 난이도 | 적응형 (변경 복잡도에 따라 자동 조절) |
| 언어 | 자동 감지 + 설정 오버라이드 가능 |
| 구현 형태 | Claude Code post-edit 훅 + 독립 CLI (git hook용) |
| 배포 | 오픈소스 |

## 핵심 플로우

```
[코드 변경 감지] → [diff 분석] → [복잡도 기반 난이도/개수 결정]
     → [LLM이 퀴즈 생성] → [사용자 응답] → [LLM 정답 검증]
     → [통과: 반영 허용 / 실패: 차단 또는 우회]
```

---

## 체크리스트

### 1. 프로젝트 초기 설정
- [x] 1.1 `package.json` 생성: name=git-quiz, type=module, bin 설정
- [x] 1.2 `tsconfig.json` 생성: ES2020 타겟, strict 모드, declaration 생성
- [x] 1.3 의존성 설치: commander, chalk, ora, openai, node-fetch, typescript, @types/node, tsx
- [x] 1.4 `.gitignore` 생성: node_modules, dist, .env
- [x] 1.5 `.env.example` 생성: OPENAI_API_KEY 템플릿
- [x] 1.✓ 챕터 1 검증: `pnpm install` 성공, `pnpm exec tsc --version` 출력 확인

### 2. 프로바이더 인터페이스 및 타입 정의
- [x] 2.1 `src/providers/types.ts` 생성: AIProvider 인터페이스 정의
  - `generateQuiz(diff: string, complexity: number): Promise<Quiz>`
  - `evaluateAnswer(question: Question, answer: string): Promise<EvaluationResult>`
  - `getName(): string`
- [x] 2.2 `src/types/index.ts` 생성: Quiz, Question, EvaluationResult, QuizConfig 타입 정의
- [x] 2.3 `src/types/index.ts`에 ComplexityLevel enum 추가: LOW, MEDIUM, HIGH, CRITICAL
- [x] 2.✓ 챕터 2 검증: `pnpm exec tsc --noEmit` 타입 체크 통과

### 3. OpenAI 프로바이더 구현
- [x] 3.1 `src/providers/openai.ts` 생성: OpenAIProvider 클래스 구현
- [x] 3.2 `generateQuiz()` 메서드 구현: diff 분석 후 객관식/자연어 퀴즈 생성
- [x] 3.3 `evaluateAnswer()` 메서드 구현: LLM이 0-10점 채점, 7점 이상 통과
- [x] 3.4 프롬프트에 언어 오버라이드 로직 추가: config.language 있으면 해당 언어로 생성
- [x] 3.✓ 챕터 3 검증: 타입 체크 통과

### 4. Ollama 프로바이더 구현
- [x] 4.1 `src/providers/ollama.ts` 생성: OllamaProvider 클래스 구현
- [x] 4.2 HTTP REST API 호출 구현: `/api/chat` 엔드포인트 사용
- [x] 4.3 연결 확인 메서드 구현: `checkConnection()`
- [x] 4.4 OpenAI와 동일한 프롬프트 구조 재사용
- [x] 4.✓ 챕터 4 검증: 타입 체크 통과

### 5. Claude Code 프로바이더 구현
- [x] 5.1 `src/providers/claude-code.ts` 생성: ClaudeCodeProvider 클래스 구현
- [x] 5.2 `execSync`로 `claude -p` 명령 실행 구현
- [x] 5.3 JSON 출력 파싱 로직 구현
- [x] 5.✓ 챕터 5 검증: 타입 체크 통과

### 6. 프로바이더 팩토리 구현
- [x] 6.1 `src/providers/index.ts` 생성: createProvider 팩토리 함수
- [x] 6.2 ProviderOptions 타입 정의: provider, model, apiKey, ollamaUrl, language
- [x] 6.3 프로바이더 타입에 따른 인스턴스 생성 로직 구현
- [x] 6.✓ 챕터 6 검증: 타입 체크 통과

### 7. 복잡도 분석기 구현
- [x] 7.1 `src/analyzer/complexity.ts` 생성: ComplexityAnalyzer 클래스
- [x] 7.2 `analyzeDiff()` 메서드: diff 파싱 및 복잡도 계산
  - 변경 라인 수, 파일 수, 함수/클래스 변경 여부 분석
- [x] 7.3 `getQuizCount()` 메서드: 복잡도에 따라 1-5개 퀴즈 수 결정
- [x] 7.4 `getDifficultyLevel()` 메서드: 복잡도 레벨 반환
- [x] 7.✓ 챕터 7 검증: 단위 테스트 또는 수동 검증

### 8. 퀴즈 매니저 구현
- [x] 8.1 `src/quiz/manager.ts` 생성: QuizManager 클래스
- [x] 8.2 `runQuiz()` 메서드: 퀴즈 실행 및 결과 수집
- [x] 8.3 `handleFailure()` 메서드: 실패 처리 (3회 후 우회 옵션)
- [x] 8.4 stdin/stdout 기반 인터랙션 구현
- [x] 8.5 Chalk/Ora를 활용한 UI 구현
- [x] 8.✓ 챕터 8 검증: 타입 체크 통과

### 9. 메인 GitQuiz 클래스 구현
- [x] 9.1 `src/index.ts` 생성: GitQuiz 메인 클래스
- [x] 9.2 `run()` 메서드: 전체 플로우 오케스트레이션
- [x] 9.3 Git diff 가져오기 구현: `execSync('git diff --staged')`
- [x] 9.4 민감 데이터 제거 로직 구현: API 키, 암호 패턴 필터링
- [x] 9.5 결과에 따른 exit code 반환: 통과=0, 실패=1
- [x] 9.✓ 챕터 9 검증: 타입 체크 통과

### 10. CLI 구현
- [x] 10.1 `src/cli.ts` 생성: Commander.js 기반 CLI 엔트리포인트
- [x] 10.2 옵션 정의:
  - `--provider <provider>`: openai|ollama|claude-code (기본: openai)
  - `--model <model>`: 사용할 모델
  - `--api-key <key>`: OpenAI API 키
  - `--ollama-url <url>`: Ollama 서버 URL
  - `--language <lang>`: 퀴즈 언어 오버라이드
  - `--skip-quiz`: 퀴즈 건너뛰기 (위험)
  - `--install-hooks`: Git 훅 설치
- [x] 10.3 `--install-hooks` 명령 구현: pre-push 훅 설치
- [x] 10.4 Git Config 읽기 구현: `git config quiz.*` 설정 지원
- [x] 10.✓ 챕터 10 검증: `pnpm exec tsx src/cli.ts --help` 출력 확인

### 11. Git Hook 스크립트 생성
- [x] 11.1 `hooks/pre-push` 생성: Unix용 쉘 스크립트
- [x] 11.2 `hooks/pre-push.bat` 생성: Windows용 배치 스크립트
- [x] 11.3 훅 스크립트에서 `git-quiz` CLI 호출 로직 구현
- [x] 11.4 옵트-인 메커니즘 구현: `git config quiz.enabled true`로 활성화
- [x] 11.✓ 챕터 11 검증: 훅 스크립트 문법 검증

### 12. Claude Code Hook 설정 생성
- [x] 12.1 `claude-hook/settings.json` 예시 생성: post-edit 훅 설정
- [x] 12.2 훅에서 `git-quiz` 호출하는 스크립트 작성
- [x] 12.3 README에 Claude Code 훅 설정 방법 문서화
- [x] 12.✓ 챕터 12 검증: 설정 파일 JSON 유효성 검증

### 13. 빌드 및 테스트
- [x] 13.1 `package.json`에 scripts 추가: build, dev, test
- [x] 13.2 `pnpm run build` 실행하여 dist/ 생성
- [x] 13.3 수동 통합 테스트: 샘플 diff로 퀴즈 생성 확인
- [x] 13.4 에러 핸들링 검증: API 키 없음, Ollama 미실행 등
- [x] 13.✓ 챕터 13 검증: 빌드 성공, CLI 실행 가능

### 14. 문서화
- [x] 14.1 프로젝트 루트 `README.md` 작성: 설치, 사용법, 설정
- [x] 14.2 `QUICK_START.md` 작성: 빠른 시작 가이드
- [x] 14.3 `docs/API.md` 작성: 프로그래매틱 API 문서
- [x] 14.4 `docs/SECURITY.md` 작성: 민감 데이터 처리 정책
- [x] 14.✓ 챕터 14 검증: 문서 완성도 확인

### 15. 최종 검증 및 배포 준비
- [x] 15.1 `package.json` files 필드 설정: dist, hooks, README.md
- [x] 15.2 npm publish 전 검증: `npm pack --dry-run`
- [x] 15.3 LICENSE 파일 추가 (MIT)
- [x] 15.4 GitHub 저장소 초기화 및 첫 커밋
- [x] 15.✓ 챕터 15 검증: 패키지 구조 완성, 배포 준비 완료

---

## 참고 자료

- [git-rewrite-commits 구조 분석](./docs/codebase-context.md)
- [요구사항 정의](./docs/requirements.md)
- [아키텍처 설계](./docs/architecture.md)
