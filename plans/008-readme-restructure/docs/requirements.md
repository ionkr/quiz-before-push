# README 재구성 요구사항

## 배경

유사한 git-hook 기반, AI 도구 라이브러리들의 README를 분석하여 quiz-before-push의 README를 개선합니다.

## 조사한 라이브러리

| 라이브러리 | 특징 | 참고 URL |
|-----------|------|----------|
| Husky | 초간결함, 성능 수치화 ("2kB", "~1ms") | github.com/typicode/husky |
| lint-staged | 강력한 "Why" 섹션, TOC, 점진적 복잡도 예시 | github.com/lint-staged/lint-staged |
| pre-commit | 최소주의, 외부 문서로 유도 | github.com/pre-commit/pre-commit |
| Claude Code | 다중 OS 설치법, 데이터 정책 명시 | github.com/anthropics/claude-code |
| PR-Agent | 이모지 활용, 실제 동작 GIF/이미지 | github.com/Codium-ai/pr-agent |
| Commitizen | 대상별 섹션 분리, 철학 설명 | github.com/commitizen/cz-cli |

## 사용자 요구사항

1. **Quick Start 섹션 추가**: 5줄 이내로 바로 시작 가능한 코드
2. **목차(TOC) 추가**: 문서 탐색 용이성 향상
3. **성능/패키지 크기 정보 추가**: 기술 스펙 명시
4. **실제 동작 예시 유지**: 현재 Example 섹션 보존/개선
5. **강조할 시각 요소 검토**: 배지, 이모지 등 적절히 활용

## 개선 방향

### 현재 README 구조
```
1. 제목 + 배지
2. Why? (3줄)
3. Features
4. Installation
5. Example
6. Git Hook Setup
7. Standalone CLI Usage
8. AI Agent Setup Guide
9. Configuration
10. Providers
11. How It Works
12. Security
13. Programmatic API
14. Contributing
15. License
```

### 제안 구조
```
1. 제목 + 배지 (강화)
2. Quick Start (신규)
3. 목차 (신규)
4. Why? (강화)
5. Features
6. Example (유지)
7. Installation
8. Git Hook Setup
9. Standalone CLI Usage
10. Configuration
11. Providers
12. How It Works
13. Performance (신규)
14. Security
15. AI Agent Setup Guide (접힘 유지)
16. Programmatic API
17. Contributing
18. License
```

## 성능 정보 조사 필요

- [ ] 패키지 크기 (npm pack 또는 bundle size)
- [ ] 평균 실행 시간
- [ ] 의존성 개수
