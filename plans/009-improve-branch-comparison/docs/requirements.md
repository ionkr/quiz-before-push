# 브랜치 비교 로직 개선 요구사항

## 배경

pre-push 모드에서 `@{push}` 실패 시 폴백 로직이 부정확한 diff를 생성함.

## 현재 문제점

### 케이스별 동작

| # | 상황 | 현재 동작 | 문제점 |
|---|------|----------|--------|
| 1 | `main` 브랜치에서 push | `@{push}..HEAD` 성공 | 없음 |
| 2 | `feature` → upstream 있음 | `@{push}..HEAD` 성공 | 없음 |
| 3 | `feature` → 첫 push (`-u`) | `@{push}..HEAD` 성공 | 없음 |
| 4 | `feature` → 첫 push (`-u` 없이) | `origin/main..HEAD` | **부정확** |
| 5 | main이 앞서간 경우 | `origin/main..HEAD` | **부정확** |

### 문제 상세

```
         origin/main
              ↓
main:    A ← B ← C ← D
              ↘
feature:       E ← F ← G ← HEAD
```

| 비교 방식 | 결과 |
|----------|------|
| `origin/main..HEAD` | D vs G (C, D 역변경 포함) |
| `merge-base..HEAD` | B vs G (E, F, G만) |

## 개선 요구사항

1. `@{push}` 실패 시 `merge-base`를 활용하여 분기점 찾기
2. 분기점부터 HEAD까지의 변경사항만 diff에 포함
3. origin/main, origin/master 순서로 폴백 유지

## 개선 후 기대 동작

| # | 상황 | 개선 후 |
|---|------|--------|
| 4 | 첫 push (`-u` 없이) | `merge-base origin/main HEAD`..HEAD |
| 5 | main 앞서간 경우 | `merge-base origin/main HEAD`..HEAD |
