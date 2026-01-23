# 코드베이스 분석 결과

## 수정 대상

**파일**: `/Users/luke/review-before-go/src/index.ts`
**메서드**: `getPrePushDiff()` (106-127 라인)

## 현재 코드

```typescript
private getPrePushDiff(): string {
  try {
    // upstream이 설정된 경우
    return execSync('git diff @{push}..HEAD', {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    // upstream이 없으면 origin/main 또는 origin/master와 비교
    try {
      return execSync('git diff origin/main..HEAD', {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch {
      return execSync('git diff origin/master..HEAD', {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });
    }
  }
}
```

## 기존 패턴

- `execSync` 사용하여 git 명령어 실행
- try-catch 폴백 체인
- `maxBuffer: 10 * 1024 * 1024` (10MB)
- `encoding: 'utf-8'`

## 영향 범위

- `src/index.ts`의 `getPrePushDiff()` 메서드만 수정
- 다른 파일 변경 없음
- 테스트 파일 없음 (향후 추가 권장)
