# 요구사항 정의

## 배경
review-before-go는 AI로 생성된 코드를 커밋하기 전에 개발자가 변경사항을 이해하고 있는지 퀴즈로 검증하는 도구입니다.

현재 두 가지 문제가 발견되었습니다:
1. 객관식 문제도 서술형처럼 매번 AI API를 호출하여 평가
2. 객관식 문제 후 서술형 문제로 전환 시 입력이 즉시 종료되는 버그

---

## 문제 1: 객관식 불필요한 AI 평가

### 현재 동작
```
1. 퀴즈 생성 (API 호출) → 객관식 문제 생성 (정답은 이미 정해짐)
2. 사용자가 'A' 선택
3. evaluateAnswer() (API 호출) → "A가 맞는지" 평가 ← 불필요
```

### 기대 동작
```
1. 퀴즈 생성 (API 호출) → 객관식 문제 + 정답 + 피드백 함께 생성
2. 사용자가 'A' 선택
3. 로컬에서 answer === correctChoiceLabel 비교 → 즉시 결과 표시
```

### 요구사항
- [ ] 퀴즈 생성 시 객관식 문제에 정답 라벨(`correctChoiceLabel`) 포함
- [ ] 퀴즈 생성 시 정답/오답 피드백(`correctFeedback`, `incorrectFeedback`) 포함
- [ ] 객관식 문제는 로컬에서 평가 (API 호출 없음)
- [ ] 서술형 문제는 기존대로 AI 평가 유지

### 기대 효과
- API 호출 횟수 감소 (비용 절감)
- 응답 시간 단축 (즉시 피드백)
- 평가 일관성 보장

---

## 문제 2: readline/inquirer stdin 충돌

### 현재 동작
```
1. 객관식 문제 표시 (inquirer select 사용)
2. 사용자가 화살표로 선택 후 Enter
3. inquirer가 stdin을 조작한 상태로 종료
4. 서술형 문제 표시 (readline 사용)
5. "Your answer: " 표시 직후 프로그램 종료 ← 버그
```

### 원인 분석
- `@inquirer/select`가 내부적으로 stdin을 raw mode로 전환
- select 완료 후 stdin 상태가 정상 복구되지 않음
- readline이 stdin에서 EOF를 감지하거나 빈 문자열을 즉시 반환

### 요구사항
- [ ] `getMultipleChoiceAnswer()` 완료 후 stdin 상태 복구
- [ ] `process.stdin.resume()` 명시적 호출
- [ ] readline 재초기화 시 stdin 상태 확인

### 기대 동작
```
1. 객관식 문제 완료
2. stdin 상태 복구
3. 서술형 문제에서 정상적으로 사용자 입력 대기
```

---

## 비기능 요구사항

- 기존 API 호환성 유지 (서술형 문제의 evaluateAnswer 동작 변경 없음)
- 타입 안전성 유지 (새 필드는 optional로 추가)
- 빌드 오류 없음 (`pnpm build` 성공)
