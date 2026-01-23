# 브랜치 비교 로직 개선

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

- **프로젝트 구조**: TypeScript CLI 도구, `src/index.ts`에 핵심 로직
- **수정 대상**: `src/index.ts`의 `getPrePushDiff()` 메서드 (106-127 라인)
- **기존 패턴**: `execSync` + try-catch 폴백 체인
- **참고 문서**: `docs/requirements.md`, `docs/codebase-context.md`

---

## 작업 체크리스트

### 1. getPrePushDiff 메서드 개선
- [x] 1.1 `/Users/luke/review-before-go/src/index.ts` 읽기: 현재 `getPrePushDiff()` 메서드 확인 (106-127 라인)
- [x] 1.2 `/Users/luke/review-before-go/src/index.ts` 수정: 폴백 로직에 `merge-base` 적용
  - `origin/main..HEAD` → `$(git merge-base origin/main HEAD)..HEAD`
  - `origin/master..HEAD` → `$(git merge-base origin/master HEAD)..HEAD`
- [x] 1.3 주석 업데이트: 폴백 로직 설명을 명확하게 수정
- [x] 1.✓ 챕터 1 검증: `pnpm build` 실행하여 컴파일 오류 없는지 확인

### 2. 테스트 및 검증
- [x] 2.1 새 브랜치에서 테스트: `git checkout -b test-branch` 후 변경사항 생성
- [x] 2.2 `pnpm dev -- --mode pre-push` 실행하여 diff가 올바른지 확인
- [x] 2.3 테스트 브랜치 정리: `git checkout main && git branch -D test-branch`
- [x] 2.✓ 챕터 2 검증: 브랜치 변경사항만 diff에 포함되는지 확인

---

## 개선 코드 예시

```typescript
private getPrePushDiff(): string {
  try {
    // upstream이 설정된 경우
    return execSync('git diff @{push}..HEAD', {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    // upstream이 없으면 merge-base를 활용하여 분기점부터 비교
    return this.getDiffFromMergeBase();
  }
}

private getDiffFromMergeBase(): string {
  // origin/main 시도
  try {
    const mergeBase = execSync('git merge-base origin/main HEAD', {
      encoding: 'utf-8',
    }).trim();
    return execSync(`git diff ${mergeBase}..HEAD`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    // origin/master 폴백
    const mergeBase = execSync('git merge-base origin/master HEAD', {
      encoding: 'utf-8',
    }).trim();
    return execSync(`git diff ${mergeBase}..HEAD`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
  }
}
```

## 참고 자료

- `docs/requirements.md`: 상세 요구사항 및 케이스별 분석
- `docs/codebase-context.md`: 코드베이스 분석 결과
