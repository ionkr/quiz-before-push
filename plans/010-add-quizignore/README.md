# 010: .quizignore 파일 제외 기능 추가

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

---

## 코드베이스 컨텍스트

- **프로젝트 구조**: `src/` 하위에 `index.ts`(메인), `cli.ts`(CLI), `analyzer/`(복잡도 분석), `providers/`(AI 제공자), `quiz/`(퀴즈 관리), `types/`(타입 정의)
- **Diff 처리 흐름**: `index.ts:getDiff()` → `sanitizeDiff()` → `analyzer.analyzeDiff()`
- **설정 시스템**: Git config 기반 (`quiz.provider`, `quiz.model` 등)
- **기존 패턴**: 정규식 기반 파일 패턴 매칭 (`complexity.ts:51-68`)
- **추가 의존성 필요**: `minimatch` (glob 패턴 매칭용)

---

## 작업 체크리스트

### 1. 의존성 추가 및 타입 정의
- [x] 1.1 `package.json` 수정: `minimatch` 의존성 추가 (`"minimatch": "^10.0.1"`)
- [x] 1.2 `package.json` 수정: 버전을 `0.1.3` → `0.1.4`로 패치 업
- [x] 1.3 `npm install` 실행하여 의존성 설치
- [x] 1.4 `src/types/index.ts` 수정: `IgnoreConfig` 인터페이스 추가
  ```typescript
  export interface IgnoreConfig {
    patterns: string[];
    defaultPatterns: string[];
  }
  ```
- [x] 1.✓ 챕터 1 검증: `npm run build` 성공 확인

### 2. IgnoreParser 유틸리티 구현
- [x] 2.1 `src/utils/` 디렉토리 생성
- [x] 2.2 `src/utils/ignoreParser.ts` 생성: IgnoreParser 클래스 구현
  - `minimatch` 사용하여 glob 패턴 매칭
  - `loadIgnoreFile(filepath)`: .quizignore 파일 읽기
  - `shouldIgnore(filePath)`: 파일 제외 여부 판단
  - 기본 제외 패턴: `node_modules/**`, `dist/**`, `.git/**`, `*.lock`, `package-lock.json`
- [x] 2.3 `src/utils/index.ts` 생성: IgnoreParser export
- [x] 2.✓ 챕터 2 검증: `npm run build` 성공 확인

### 3. Diff 필터링 로직 통합
- [x] 3.1 `src/index.ts` 수정: IgnoreParser import 추가
- [x] 3.2 `src/index.ts` 수정: GitQuiz 클래스에 `ignoreParser` 프로퍼티 추가
- [x] 3.3 `src/index.ts` 수정: 생성자에서 `.quizignore` 로드 (프로젝트 루트에서)
- [x] 3.4 `src/index.ts` 수정: `filterIgnoredFiles(diff: string): string` 메서드 추가
  - diff를 파싱하여 파일별로 분리
  - 각 파일에 대해 `shouldIgnore()` 검사
  - 제외된 파일의 diff 블록 제거
- [x] 3.5 `src/index.ts` 수정: `run()` 메서드에서 `sanitizeDiff()` 후 `filterIgnoredFiles()` 호출
- [x] 3.✓ 챕터 3 검증: `npm run build` 성공

### 4. Hook 설치 시 안내 메시지 추가
- [x] 4.1 `src/cli.ts` 수정: `installGitHooks()` 함수에서 성공 메시지 출력 후 `.quizignore` 안내 추가
- [x] 4.✓ 챕터 4 검증: `npm run build` 성공 확인

### 5. 프로젝트 .quizignore 파일 생성
- [x] 5.1 프로젝트 루트에 `.quizignore` 파일 생성
- [x] 5.✓ 챕터 5 검증: `.quizignore` 파일 존재 확인

### 6. README 문서 업데이트
- [x] 6.1 `README.md` 수정: Features 섹션에 `.quizignore` 기능 추가
- [x] 6.2 `README.md` 수정: Configuration 섹션에 `.quizignore` 사용법 추가
  ```markdown
  ### .quizignore

  Create a `.quizignore` file in your project root to exclude files from quiz analysis:

  ```
  # Exclude documentation
  docs/**
  *.md

  # Exclude specific directories
  plans/**
  examples/**
  ```

  Default excluded patterns (always applied):
  - `node_modules/**`
  - `dist/**`
  - `.git/**`
  - `*.lock`
  - `package-lock.json`
  ```
- [x] 6.3 `README.ko.md` 수정: Features 섹션에 `.quizignore` 기능 추가
- [x] 6.4 `README.ko.md` 수정: Configuration 섹션에 `.quizignore` 사용법 추가 (한국어)
- [x] 6.✓ 챕터 6 검증: README 파일 내용 확인

### 7. 최종 검증 및 빌드
- [x] 7.1 `npm run build` 실행하여 최종 빌드 성공 확인
- [x] 7.2 실제 diff로 테스트: IgnoreParser 패턴 매칭 동작 확인
- [x] 7.3 `.quizignore` 패턴과 기본 패턴 동작 확인
- [x] 7.✓ 챕터 7 검증: 모든 기능 정상 동작 확인

---

## 참고 파일

| 파일 | 역할 | 주요 수정 위치 |
|------|------|---------------|
| `src/index.ts` | 메인 로직 | `run()` 메서드, 라인 31-42 |
| `src/cli.ts` | CLI/Hook 설치 | `installGitHooks()` 함수 |
| `src/types/index.ts` | 타입 정의 | 파일 끝에 추가 |
| `src/utils/ignoreParser.ts` | 새로 생성 | IgnoreParser 클래스 |
| `package.json` | 의존성 | dependencies, version |
| `README.md` | 영문 문서 | Features, Configuration |
| `README.ko.md` | 한국어 문서 | Features, Configuration |
