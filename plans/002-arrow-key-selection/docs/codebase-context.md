# 코드베이스 분석 결과

## 프로젝트 구조

```
review-before-go/
├── src/
│   ├── quiz/
│   │   └── manager.ts          # 핵심 수정 대상
│   ├── types/
│   │   └── index.ts            # Question, Choice 타입 정의
│   ├── providers/
│   │   ├── openai.ts           # 퀴즈 생성 및 평가
│   │   └── ...
│   ├── cli.ts
│   └── index.ts
├── package.json                 # 의존성 추가 필요
└── tsconfig.json               # ESNext 설정 확인됨
```

## 핵심 파일 분석

### src/quiz/manager.ts

**현재 구조:**
- `QuizManager` 클래스
- readline.Interface로 사용자 입력 처리
- `getAnswer()`: 질문 타입별 답변 수집 (219-226행)
- `displayQuestion()`: 질문 및 선택지 출력 (174-189행)
- `prompt()`: readline 기반 입력 (233-241행)

**수정 필요 메서드:**
| 메서드 | 행 번호 | 변경 내용 |
|--------|---------|----------|
| import | 1행 | `@inquirer/select` import 추가 |
| `displayQuestion()` | 174-189행 | MULTIPLE_CHOICE 선택지 출력 제거 |
| `getAnswer()` | 219-226행 | MULTIPLE_CHOICE 분기 처리 |
| 신규 | - | `getMultipleChoiceAnswer()` 메서드 추가 |

### src/types/index.ts

**Choice 인터페이스:**
```typescript
export interface Choice {
  label: string;  // "A", "B", "C", "D"
  text: string;   // 선택지 내용
}
```

**@inquirer/select와 매핑:**
```typescript
// Choice → inquirer choice 변환
{
  value: choice.label,        // "A"
  name: `${choice.label}) ${choice.text}`,  // "A) 선택지 내용"
}
```

## 기존 패턴

### 색상 사용 패턴
```typescript
chalk.cyan()   // 프롬프트, 선택지 라벨
chalk.gray()   // 컨텍스트, 부가 정보
chalk.green()  // 성공, 통과
chalk.red()    // 실패, 에러
chalk.yellow() // 경고
chalk.bold()   // 강조
```

### readline 관리 패턴
```typescript
initReadline()   // stdin/stdout 인터페이스 생성
closeReadline()  // 인터페이스 종료
```

## 의존성 현황

**현재 package.json:**
```json
{
  "dependencies": {
    "chalk": "^5.6.2",
    "commander": "^14.0.2",
    "node-fetch": "^3.3.2",
    "openai": "^6.16.0",
    "ora": "^9.1.0"
  }
}
```

**추가 필요:**
```json
{
  "@inquirer/select": "latest"
}
```
