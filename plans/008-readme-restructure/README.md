# README 재구성

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

- **프로젝트 구조**: TypeScript 기반 CLI 도구, src/ 하위 모듈화
- **대상 파일**: `/Users/luke/review-before-go/README.md` (영문), `/Users/luke/review-before-go/README.ko.md` (한글)
- **패키지 정보**: 29.4 kB (gzipped), 7개 런타임 의존성, Node.js 16+
- **참고 문서**: `docs/requirements.md`, `docs/codebase-context.md`

---

## 작업 체크리스트

### 1. README 구조 기획 및 배지 강화
- [x] 1.1 `/Users/luke/review-before-go/README.md` 읽기: 현재 구조 파악
- [x] 1.2 배지 추가 계획: npm 다운로드 수 배지, Node.js 버전 배지 추가 설계
- [x] 1.3 새로운 섹션 순서 확정: Quick Start, TOC, Why, Features, Example 순서로 재배치 계획 수립
- [x] 1.✓ 챕터 1 검증: 구조 계획이 requirements.md와 일치하는지 확인

### 2. 영문 README 헤더 영역 수정
- [x] 2.1 `/Users/luke/review-before-go/README.md` 수정: 배지 라인 강화
  - npm 다운로드 배지 추가: `![npm downloads](https://img.shields.io/npm/dm/quiz-before-push.svg)`
  - Node.js 버전 배지 추가: `![node](https://img.shields.io/badge/node-%3E%3D16-brightgreen)`
- [x] 2.2 한 줄 설명 아래 핵심 특징 강조 추가 (29kB 경량, 5개 AI 제공자 등)
- [x] 2.✓ 챕터 2 검증: 배지가 올바른 markdown 형식인지 확인

### 3. Quick Start 섹션 추가 (영문)
- [x] 3.1 `/Users/luke/review-before-go/README.md` 수정: "Why?" 섹션 바로 위에 Quick Start 섹션 추가
- [x] 3.2 Quick Start 내용 작성:
  ```markdown
  ## Quick Start

  ```bash
  # Install
  npm install -g quiz-before-push

  # Set up git hook (one-time)
  quiz-before-push --install-hooks && git config quiz.enabled true

  # Configure AI provider (choose one)
  export OPENAI_API_KEY=sk-...
  # or: export ANTHROPIC_API_KEY=sk-ant-...

  # Push with quiz
  git push
  ```
  ```
- [x] 3.✓ 챕터 3 검증: Quick Start 코드 블록이 5줄 이내 핵심만 담고 있는지 확인

### 4. 목차(TOC) 추가 (영문)
- [x] 4.1 `/Users/luke/review-before-go/README.md` 수정: Quick Start 아래에 Table of Contents 섹션 추가
- [x] 4.2 TOC 내용 작성: 주요 섹션들의 앵커 링크 포함
  ```markdown
  ## Table of Contents

  - [Quick Start](#quick-start)
  - [Why?](#why)
  - [Features](#features)
  - [Example](#example)
  - [Installation](#installation)
  - [Git Hook Setup](#git-hook-setup-recommended)
  - [Standalone CLI](#standalone-cli-usage)
  - [Configuration](#configuration)
  - [Providers](#providers)
  - [How It Works](#how-it-works)
  - [Performance](#performance)
  - [Security](#security)
  - [API](#programmatic-api)
  ```
- [x] 4.✓ 챕터 4 검증: 모든 TOC 링크가 존재하는 섹션을 가리키는지 확인

### 5. Why 섹션 강화 (영문)
- [x] 5.1 `/Users/luke/review-before-go/README.md` 수정: Why? 섹션 내용 보강
- [x] 5.2 문제 제기 강화: AI 코드 생성의 위험성을 더 구체적으로 설명
  - 통계나 사례 언급 (예: "Studies show developers accept 30%+ of AI suggestions without review")
  - "The Problem" + "The Solution" 구조로 분리
- [x] 5.✓ 챕터 5 검증: Why 섹션이 설득력 있는 동기 부여를 제공하는지 확인

### 6. Performance 섹션 추가 (영문)
- [x] 6.1 `/Users/luke/review-before-go/README.md` 수정: Security 섹션 위에 Performance 섹션 추가
- [x] 6.2 Performance 내용 작성:
  ```markdown
  ## Performance

  | Metric | Value |
  |--------|-------|
  | Package size | 29 kB (gzipped) |
  | Dependencies | 7 runtime |
  | Node.js | >= 16 |
  | Quiz generation | ~3-10s (varies by provider) |
  | Local evaluation | < 100ms |
  ```
- [x] 6.✓ 챕터 6 검증: 성능 정보가 정확한지 확인

### 7. 한글 README 동기화 (README.ko.md)
- [x] 7.1 `/Users/luke/review-before-go/README.ko.md` 읽기: 현재 구조 파악
- [x] 7.2 `/Users/luke/review-before-go/README.ko.md` 수정: 배지 영역 동일하게 업데이트
- [x] 7.3 `/Users/luke/review-before-go/README.ko.md` 수정: 빠른 시작 섹션 추가 (한글)
- [x] 7.4 `/Users/luke/review-before-go/README.ko.md` 수정: 목차 추가 (한글)
- [x] 7.5 `/Users/luke/review-before-go/README.ko.md` 수정: Why(왜?) 섹션 강화
- [x] 7.6 `/Users/luke/review-before-go/README.ko.md` 수정: 성능 섹션 추가
- [x] 7.✓ 챕터 7 검증: 영문과 한글 README 구조가 동일한지 비교

### 8. 최종 검토 및 마무리
- [x] 8.1 영문 README 전체 검토: 오타, 링크 깨짐, 마크다운 문법 확인
- [x] 8.2 한글 README 전체 검토: 번역 품질, 일관성 확인
- [x] 8.3 섹션 순서 최종 확인: 두 파일 모두 동일한 구조인지 확인
- [x] 8.✓ 챕터 8 검증: `cat README.md | head -100` 으로 상단 구조 확인

---

## 참고 자료

### 벤치마크 라이브러리 README 특징

| 라이브러리 | 채택할 특징 |
|-----------|------------|
| Husky | 성능 수치화 (크기, 속도) |
| lint-staged | 강력한 Why 섹션, TOC |
| Claude Code | 다중 설치 방법, 데이터 정책 |
| PR-Agent | 시각적 요소 활용 |

### 최종 섹션 순서 (영문 기준)

1. 제목 + 배지 (강화)
2. Quick Start (신규)
3. Table of Contents (신규)
4. Why? (강화)
5. Features
6. Example
7. Installation
8. Git Hook Setup
9. Standalone CLI Usage
10. Configuration
11. Providers
12. How It Works
13. Performance (신규)
14. Security
15. AI Agent Setup Guide
16. Programmatic API
17. Contributing
18. License
