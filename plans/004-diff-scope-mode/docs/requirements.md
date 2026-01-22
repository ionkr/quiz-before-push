# 요구사항 정의

## 배경

현재 `review-before-go`는 `git diff --staged`만 퀴즈 대상으로 삼는다.
그러나 실행 시점에 따라 적절한 diff 범위가 다르다:

| 시점 | 현재 동작 | 문제점 |
|------|-----------|--------|
| **pre-push** | `git diff --staged` | 이미 커밋됨, staged가 비어있음 |
| **post-edit** | `git diff --staged` | AI 수정이 아직 unstaged일 수 있음 |

## 요구사항

### 기능 요구사항

1. **기본 모드 (default)**
   - `git diff HEAD` 사용
   - staged + unstaged 모든 변경사항 포함
   - AI가 수정 완료 후 바로 퀴즈 실행 가능

2. **Pre-push 모드 (pre-push)**
   - 푸시할 커밋들의 변경사항만 포함
   - 우선순위:
     1. `git diff @{push}..HEAD` (upstream 설정된 경우)
     2. `git diff origin/main..HEAD` (fallback)
     3. `git diff origin/master..HEAD` (legacy fallback)

3. **CLI 옵션**
   - `--mode <mode>`: `default` 또는 `pre-push`
   - 기본값: `default`

4. **Git Config 지원**
   - `git config quiz.mode` 로 기본 모드 설정 가능

5. **Pre-push 훅 자동 설정**
   - `--install-hooks` 실행 시 생성되는 훅에 `--mode pre-push` 자동 포함

### 비기능 요구사항

- 하위 호환성: 기존 동작(`--staged`)은 `default` 모드로 대체되지만, 더 넓은 범위를 커버
- 에러 처리: upstream이 없거나 origin이 없는 경우 적절한 fallback

## 영향 범위

### 수정 파일
- `src/cli.ts`: CLI 옵션 추가
- `src/index.ts`: diff 로직 변경
- `src/providers/index.ts`: 타입 정의
- `hooks/pre-push`: mode 옵션 전달
- `README.md`, `QUICK_START.md`: 문서화

### 영향 없는 파일
- `src/providers/*.ts`: Provider 구현은 변경 없음
- `src/analyzer/complexity.ts`: diff 내용만 받으므로 변경 없음
- `src/quiz/manager.ts`: 퀴즈 실행 로직 변경 없음
