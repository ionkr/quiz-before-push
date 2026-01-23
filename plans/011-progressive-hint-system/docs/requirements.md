# 요구사항 정의: 점진적 힌트 시스템

## 개요

오답 시 정답을 바로 공개하지 않고, 점진적으로 힌트를 제공하여 개발자가 스스로 정답을 찾도록 유도하는 시스템.

## 기능 요구사항

### FR-1: 점진적 힌트 제공 (서술형)
- 1차 오답: 방향성 힌트 제공 (어떤 관점에서 생각해볼지)
- 2차 오답: 코드 위치 힌트 제공 (diff의 어느 부분을 확인할지)
- 3차 오답: 정답과 상세 해설 공개

### FR-2: 객관식 문제 처리
- 객관식은 힌트 없이 재시도 허용
- 3회 시도 후 정답 공개

### FR-3: 자동 진행
- 3회 시도 후 정답 공개하고 자동으로 다음 문제로 이동
- 한 문제에서 막혀도 전체 퀴즈 진행 가능

### FR-4: 전체 정답률 판정
- 개별 문제의 재시도 횟수와 무관하게 전체 정답률로 통과 판정
- 통과 기준: 60% 이상 (조정 가능)

## 비기능 요구사항

### NFR-1: 추가 API 호출 최소화
- 서술형: 기존 evaluateAnswer 호출에서 힌트도 함께 생성
- 객관식: 추가 API 호출 없음

### NFR-2: 일관된 UX
- 모든 provider에서 동일한 힌트 시스템 적용
- 힌트 표시 스타일 통일

## 힌트 예시

### 서술형 문제

```
Question 1/3
validateInput 함수가 추가된 이유를 설명하세요.

Your answer: 성능 향상을 위해
✗ Score: 2/10
💡 힌트: 이 함수가 어떤 종류의 데이터를 다루는지 생각해보세요.

Your answer: 데이터 변환을 위해
✗ Score: 3/10
💡 힌트: src/handlers/userInput.ts:23-35 라인의 변경사항을 확인해보세요.

Your answer: 입력값 검증
✗ Score: 5/10
정답: SQL injection 방지를 위한 사용자 입력 검증
해설: 외부에서 들어오는 데이터를 DB 쿼리에 사용하기 전 위험한 문자를 제거합니다.

→ 다음 문제로 이동
```

### 객관식 문제

```
Question 2/3
이 함수의 반환 타입은?
  A) string
  B) number
  C) boolean

Your answer: A
✗ 오답입니다. 다시 시도해보세요. (남은 시도: 2회)

Your answer: A
✗ 오답입니다. 다시 시도해보세요. (남은 시도: 1회)

Your answer: A
✗ 정답: C) boolean

→ 다음 문제로 이동
```

## 변경 범위

| 구분 | 파일 | 변경 내용 |
|------|------|----------|
| 타입 | `src/types/index.ts` | EvaluationResult에 hint 필드 추가 |
| 인터페이스 | `src/providers/types.ts` | evaluateAnswer에 attemptCount 파라미터 |
| Provider | `src/providers/*.ts` (5개) | 평가 프롬프트에 힌트 생성 로직 |
| Manager | `src/quiz/manager.ts` | 흐름 로직 및 표시 로직 수정 |
