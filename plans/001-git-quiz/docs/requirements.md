# git-quiz 요구사항 정의서

## 1. 프로젝트 개요

### 1.1 목적
AI가 작성한 코드를 개발자가 이해하지 않고 무분별하게 반영하는 것을 방지하기 위한 퀴즈 기반 검증 도구.

### 1.2 핵심 가치
- **이해 강제**: 코드를 반영하기 전 반드시 이해했는지 확인
- **교육적 효과**: 퀴즈를 통해 코드 이해도 향상
- **유연성**: 다양한 LLM 프로바이더 지원, 설정 커스터마이징

---

## 2. 기능 요구사항

### 2.1 퀴즈 생성

| 항목 | 요구사항 |
|------|----------|
| 형태 | 객관식 + 자연어 설명 |
| 개수 | 적응형 (1-5개), 변경 복잡도에 따라 자동 조절 |
| 난이도 | 적응형 (LOW, MEDIUM, HIGH, CRITICAL) |
| 언어 | 자동 감지 + 설정 오버라이드 가능 |

### 2.2 채점 방식

| 항목 | 요구사항 |
|------|----------|
| 객관식 | 정답 일치 여부 (정확히 맞아야 통과) |
| 자연어 | LLM이 0-10점 채점, 7점 이상 통과 |
| 종합 | 모든 문항 통과해야 전체 통과 |

### 2.3 실패 처리

| 시나리오 | 처리 방식 |
|----------|-----------|
| 1-2회 실패 | 재시도 허용, 힌트 제공 가능 |
| 3회 실패 | 우회 옵션 제공: diff 보면서 다시 풀기 |
| 우회 선택 | diff 전체 표시 후 동일 퀴즈 재출제 |
| 최종 통과 못함 | exit code 1 반환, 변경사항 반영 차단 |

### 2.4 LLM 프로바이더 지원

| 프로바이더 | 연동 방식 | 필수 설정 |
|------------|-----------|-----------|
| OpenAI | SDK (openai) | OPENAI_API_KEY |
| Ollama | HTTP REST API | ollama-url (기본: localhost:11434) |
| Claude Code | CLI 실행 | claude CLI 설치 및 로그인 |

### 2.5 훅 지원

| 훅 타입 | 트리거 | 용도 |
|---------|--------|------|
| Git pre-push | `git push` 전 | 푸시 전 코드 이해도 검증 |
| Claude Code post-edit | 파일 편집 후 | 편집 후 즉시 검증 |

---

## 3. 비기능 요구사항

### 3.1 성능
- 퀴즈 생성: 10초 이내 (LLM 응답 시간 의존)
- CLI 시작: 1초 이내

### 3.2 보안
- 민감 데이터 자동 제거 (API 키, 암호, 개인키)
- 원격 API 사용 시 사용자 동의 필요 (옵트-인)

### 3.3 호환성
- Node.js 16 이상
- Windows, macOS, Linux 지원
- Git 2.x 이상

### 3.4 확장성
- 새로운 LLM 프로바이더 쉽게 추가 가능 (프로바이더 패턴)
- 커스텀 프롬프트 지원

---

## 4. 설정 옵션

### 4.1 CLI 옵션

```
--provider <provider>   AI 프로바이더 (openai|ollama|claude-code)
--model <model>         사용할 모델
--api-key <key>         OpenAI API 키
--ollama-url <url>      Ollama 서버 URL
--language <lang>       퀴즈 언어 오버라이드 (ko, en, ja, etc.)
--skip-quiz             퀴즈 건너뛰기 (위험, 로그 기록)
--install-hooks         Git 훅 설치
--verbose               상세 출력
```

### 4.2 Git Config 설정

```bash
git config quiz.enabled true              # 퀴즈 활성화
git config quiz.provider ollama           # 프로바이더 선택
git config quiz.model llama3.2            # 모델 선택
git config quiz.language ko               # 언어 설정
git config quiz.minScore 7                # 최소 통과 점수
```

### 4.3 환경 변수

```
OPENAI_API_KEY          OpenAI API 키
GIT_QUIZ_PROVIDER       프로바이더 선택
GIT_QUIZ_MODEL          모델 선택
GIT_QUIZ_LANGUAGE       언어 설정
OLLAMA_URL              Ollama 서버 URL
```

---

## 5. 사용자 시나리오

### 5.1 기본 사용 흐름

```
1. 개발자가 AI로 코드 생성
2. git add && git commit
3. git push 시도
4. pre-push 훅 발동 → git-quiz 실행
5. diff 분석 → 복잡도 계산 → 퀴즈 생성
6. 개발자가 퀴즈 응답
7. 정답 검증
   - 통과: push 진행
   - 실패: 재시도 또는 우회
```

### 5.2 Claude Code 훅 사용

```
1. Claude Code로 파일 편집
2. post-edit 훅 발동 → git-quiz 실행
3. 편집된 내용에 대한 퀴즈 출제
4. 퀴즈 통과해야 편집 유지
```

---

## 6. 에러 처리

| 상황 | 처리 방식 |
|------|-----------|
| API 키 없음 | 친절한 안내 메시지 출력, exit 1 |
| Ollama 미실행 | 연결 실패 안내, 설치/실행 가이드 제공 |
| LLM 응답 실패 | 3회 재시도 후 실패 안내 |
| 네트워크 오류 | 타임아웃 설정, 재시도 안내 |
| 잘못된 설정 | 설정 검증 후 구체적 오류 안내 |

---

## 7. 제약사항

1. **인터넷 연결 필요** (Ollama 로컬 제외)
2. **LLM 비용 발생** (OpenAI 사용 시)
3. **퀴즈 정확도 한계** (LLM 생성/채점의 불완전성)
4. **대용량 diff 제한** (토큰 한계로 인한 diff 크기 제한 필요)
