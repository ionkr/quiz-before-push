# 요구사항 명세

## 개요
퀴즈 시스템의 객관식 답변 입력 방식을 텍스트 입력에서 방향키 선택 UI로 변경

## 기능 요구사항

### FR-01: 객관식 방향키 선택
- **대상**: `question.type === 'MULTIPLE_CHOICE'`인 문제만
- **동작**:
  - ↑↓ 방향키로 선택지 이동
  - Enter 키로 선택 확정
  - 마지막 선택지에서 ↓ 누르면 첫 번째로 순환 (loop)
- **반환값**: 선택한 라벨 (A, B, C, D 중 하나)

### FR-02: 단답형 기존 방식 유지
- **대상**: `SHORT_ANSWER`, `FREE_TEXT` 타입
- **동작**: 기존 readline 기반 텍스트 입력 유지

### FR-03: 사용자 중단 처리
- **동작**: Ctrl+C 입력 시 "Quiz cancelled." 메시지 출력 후 종료

## 비기능 요구사항

### NFR-01: 라이브러리
- `@inquirer/select` 사용 (ESM 네이티브 지원)

### NFR-02: 기존 스타일 유지
- chalk 색상 스킴 유지 (cyan, gray, green, red)

## UI 명세

### 객관식 표시 형식
```
? What is the purpose of the new validation logic?
❯ A) Input sanitization      ← 현재 선택 (커서 표시)
  B) Performance optimization
  C) Error handling
  D) Code refactoring
```

### 선택 완료 후
- 선택한 답변 반환 → 평가 진행
