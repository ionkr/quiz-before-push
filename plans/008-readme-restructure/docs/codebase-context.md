# 코드베이스 분석 결과

## 프로젝트 개요

- **이름**: quiz-before-push
- **버전**: 0.1.3
- **목적**: AI 코드 생성을 검증하기 위한 대화형 퀴즈 도구

## 디렉토리 구조

```
/Users/luke/review-before-go/
├── src/
│   ├── analyzer/complexity.ts    # Diff 복잡도 분석
│   ├── providers/               # AI 제공자 구현 (5개)
│   ├── quiz/manager.ts          # 퀴즈 실행 관리
│   ├── types/index.ts           # TypeScript 타입
│   ├── cli.ts                   # CLI 진입점
│   └── index.ts                 # GitQuiz 메인 클래스
├── docs/
│   ├── API.md                   # API 문서
│   └── SECURITY.md              # 보안 문서
├── hooks/                       # Git hook 스크립트
├── README.md                    # 영문 README
├── README.ko.md                 # 한글 README
└── package.json
```

## 핵심 기능

1. **다중 AI 제공자**: OpenAI, Anthropic, Gemini, Ollama, Claude Code
2. **적응형 퀴즈**: 복잡도 기반 문제 수 조절 (1-5문제)
3. **보안**: 민감한 데이터 자동 새니타이징
4. **Git 통합**: pre-push hook, git config 연동

## 현재 README 파일 위치

- 영문: `/Users/luke/review-before-go/README.md`
- 한글: `/Users/luke/review-before-go/README.ko.md`

## 관련 문서

- API 문서: `/Users/luke/review-before-go/docs/API.md`
- 보안 문서: `/Users/luke/review-before-go/docs/SECURITY.md`
