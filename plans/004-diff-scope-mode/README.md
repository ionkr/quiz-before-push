# Diff 범위 모드 구현

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

### 프로젝트 구조
```
src/
├── cli.ts              # CLI 옵션 처리 (Commander.js)
├── index.ts            # GitQuiz 클래스, getStagedDiff() 메서드
├── providers/
│   ├── index.ts        # ProviderOptions 타입, createProvider()
│   └── types.ts        # AIProviderConfig 인터페이스
└── analyzer/
    └── complexity.ts   # 복잡도 분석
hooks/
└── pre-push            # Git pre-push 훅 스크립트
```

### 현재 동작
- `src/index.ts:83-96`의 `getStagedDiff()`: `git diff --staged` 실행
- `src/cli.ts:111-125`: Commander 옵션 정의
- `hooks/pre-push:76-90`: `review-before-go` CLI 호출

### 재사용 패턴
- CLI 옵션 추가: `src/cli.ts`의 `.option()` 체인
- Git 명령 실행: `execSync()` with `encoding: 'utf-8'`
- Git config 읽기: `git config --get quiz.<key>`

---

## 목표

퀴즈 출제 범위를 실행 시점에 맞게 조정:

| 모드 | Git 명령 | 사용 시점 |
|------|----------|----------|
| `default` (기본값) | `git diff HEAD` | post-edit, 일반 실행 |
| `pre-push` | `git diff @{push}..HEAD` 또는 `origin/<base>..HEAD` | pre-push 훅 |

---

## 체크리스트

### 1. 타입 및 인터페이스 수정

- [x] 1.1 `src/providers/index.ts` 수정 (7-13행): `ProviderOptions` 인터페이스에 `mode?: 'default' | 'pre-push'` 필드 추가
- [x] 1.2 `src/cli.ts` 수정 (12-20행): `GitQuizCliOptions` 인터페이스에 `mode?: 'default' | 'pre-push'` 필드 추가
- [x] 1.✓ 챕터 1 검증: `pnpm build` 실행하여 타입 에러 없음 확인

### 2. CLI 옵션 추가

- [x] 2.1 `src/cli.ts` 수정 (111-125행): Commander 옵션에 `--mode <mode>` 추가
  ```typescript
  .option('--mode <mode>', 'Diff mode: default (staged+unstaged) or pre-push (commits to push)', 'default')
  ```
- [x] 2.2 `src/cli.ts` 수정 (134-149행): `finalOptions`에 `mode` 필드 추가
- [x] 2.3 `src/cli.ts` 수정 (152-157행): `validModes` 검증 로직 추가
- [x] 2.4 `src/cli.ts` 수정 (166-173행): `GitQuiz` 생성자에 `mode` 전달
- [x] 2.✓ 챕터 2 검증: `pnpm build && node dist/cli.js --help`로 `--mode` 옵션 확인

### 3. GitQuiz 클래스 수정

- [x] 3.1 `src/index.ts` 수정 (7-11행): `GitQuizOptions`에 `mode` 필드 추가 (ProviderOptions 확장이므로 자동 포함 확인)
- [x] 3.2 `src/index.ts` 수정: `getStagedDiff()` 메서드를 `getDiff()`로 이름 변경
- [x] 3.3 `src/index.ts` 수정: `getDiff()` 메서드에서 `this.options.mode`에 따른 분기 구현
  ```typescript
  private getDiff(): string {
    const mode = this.options.mode || 'default';

    if (mode === 'pre-push') {
      // pre-push: 푸시할 커밋들의 변경사항
      return this.getPrePushDiff();
    }

    // default: staged + unstaged
    return execSync('git diff HEAD', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  }
  ```
- [x] 3.4 `src/index.ts`: `getPrePushDiff()` private 메서드 추가
  ```typescript
  private getPrePushDiff(): string {
    try {
      // upstream이 설정된 경우
      return execSync('git diff @{push}..HEAD', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    } catch {
      // upstream이 없으면 origin/main 또는 origin/master와 비교
      try {
        return execSync('git diff origin/main..HEAD', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      } catch {
        return execSync('git diff origin/master..HEAD', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      }
    }
  }
  ```
- [x] 3.5 `src/index.ts` 수정 (31행): `run()` 메서드에서 `getStagedDiff()` 호출을 `getDiff()`로 변경
- [x] 3.✓ 챕터 3 검증: `pnpm build` 성공 확인

### 4. Pre-push 훅 수정

- [x] 4.1 `hooks/pre-push` 수정: CLI 호출 시 `--mode pre-push` 옵션 추가
  ```bash
  # 기존: eval "review-before-go $OPTIONS"
  # 변경: eval "review-before-go --mode pre-push $OPTIONS"
  ```
- [x] 4.2 `src/cli.ts` 수정 (59-80행): `installGitHooks()` 함수 내 `prePushHook` 문자열에 `--mode pre-push` 추가
- [x] 4.✓ 챕터 4 검증: `hooks/pre-push` 스크립트 내용 확인

### 5. 테스트 및 문서화

- [x] 5.1 수동 테스트: `pnpm dev` 실행하여 기본 모드(staged+unstaged) 동작 확인
- [x] 5.2 수동 테스트: `pnpm dev -- --mode pre-push` 실행하여 pre-push 모드 동작 확인
- [x] 5.3 `README.md` 수정: Mode 옵션 사용법 문서화
- [x] 5.4 `QUICK_START.md` 수정: 필요시 모드 관련 설명 추가
- [x] 5.✓ 챕터 5 검증: 빌드 및 두 모드 모두 정상 동작 확인

---

## 참고

- 현재 `getStagedDiff()` 위치: `src/index.ts:83-96`
- 현재 pre-push 훅 CLI 호출: `hooks/pre-push:76-90`
- Git diff 명령어:
  - `git diff HEAD`: staged + unstaged 변경사항
  - `git diff @{push}..HEAD`: 푸시할 커밋들
  - `git diff origin/main..HEAD`: main 브랜치 대비 변경사항
