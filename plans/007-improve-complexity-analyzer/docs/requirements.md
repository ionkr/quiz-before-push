# 복잡도 분석기 개선 요구사항

## 목표

`ComplexityAnalyzer`의 복잡도 계산 로직을 개선하여 더 정확하고 현실적인 복잡도 점수를 산출한다.

## 현재 문제점

1. **함수/클래스 변경이 이진값**: 1개 변경이나 10개 변경이나 동일한 점수
2. **삭제/추가 구분 없음**: 새 코드 추가가 더 어려운데 동일 취급
3. **파일 유형 미고려**: `.md` 문서와 `.ts` 핵심 로직이 동일 취급
4. **변경 집중도 미반영**: 분산된 변경의 컨텍스트 스위칭 비용 무시
5. **점수 상한 도달이 쉬움**: 대부분의 PR이 HIGH/CRITICAL로 분류
6. **중복 코드**: `getQuizCount()`, `getComplexityLevel()`이 각 Provider에 중복

## 개선 사항

### 1. 함수/클래스 개수 기반 점수

```typescript
// 현재
if (params.hasFunctionChanges) complexity += 15;

// 개선
complexity += Math.min(params.functionChangeCount * 5, 25);  // 최대 25점
complexity += Math.min(params.classChangeCount * 8, 20);     // 최대 20점
```

### 2. 추가/삭제 라인 가중치 차등

```typescript
// 현재
const totalLines = addedLines + deletedLines;

// 개선: 추가가 더 높은 가중치 (이해 난이도가 높음)
const weightedLines = addedLines * 1.3 + deletedLines * 0.7;
```

### 3. 파일 유형별 가중치

| 파일 유형 | 가중치 | 설명 |
|-----------|--------|------|
| `.ts`, `.js`, `.tsx`, `.jsx` | 1.0 | 핵심 로직 |
| `.json`, `.yaml`, `.yml` | 0.7 | 설정 파일 |
| `.md`, `.txt` | 0.3 | 문서 파일 |
| `.css`, `.scss` | 0.5 | 스타일 파일 |

### 4. 변경 집중도 반영

```typescript
// 분산된 변경은 컨텍스트 스위칭으로 더 어려움
const avgLinesPerFile = totalLines / fileCount;
if (avgLinesPerFile < 10 && fileCount > 3) {
  complexity += 10;  // 분산 변경 보너스
}
```

### 5. 점수 스케일 재조정

현재 점수 구간이 너무 쉽게 높아짐. 로그 스케일 또는 구간 조정 필요.

```typescript
// 라인 수 기준 재조정
if (weightedLines <= 20) complexity += 5;
else if (weightedLines <= 80) complexity += 15;
else if (weightedLines <= 150) complexity += 25;
else if (weightedLines <= 300) complexity += 35;
else complexity += 40;
```

### 6. 중복 코드 제거

- 각 Provider의 `getQuizCount()`, `getComplexityLevel()` 메서드 제거
- `ComplexityAnalyzer`의 메서드를 직접 사용하도록 리팩토링
- 또는 공유 유틸리티로 분리

## 변경 대상 파일

- `src/analyzer/complexity.ts` - 핵심 로직 개선
- `src/providers/openai.ts` - 중복 메서드 제거
- `src/providers/anthropic.ts` - 중복 메서드 제거
- `src/providers/gemini.ts` - 중복 메서드 제거
- `src/providers/ollama.ts` - 중복 메서드 제거
- `src/providers/claude-code.ts` - 중복 메서드 제거
- `src/index.ts` - 필요시 수정

## 기대 효과

- 더 정확한 복잡도 평가로 적절한 퀴즈 수 결정
- 간단한 변경에 대한 퀴즈 피로도 감소
- 코드 중복 제거로 유지보수성 향상
