# Anthropic 프로바이더 요구사항

## 개요
기존 Git Quiz 프로젝트에 Anthropic Claude API를 사용하는 새로운 프로바이더를 추가합니다.

## 기능 요구사항

### 필수 기능
1. **퀴즈 생성** (`generateQuiz`)
   - Git diff와 복잡도를 입력받아 퀴즈 생성
   - JSON 형식으로 응답 파싱
   - 복잡도에 따른 질문 개수 조절

2. **답변 평가** (`evaluateAnswer`)
   - 사용자 답변을 0-10점으로 평가
   - 7점 이상 통과
   - 피드백 및 정답 제공

3. **프로바이더 식별** (`getName`)
   - 'anthropic' 문자열 반환

### API 설정
- **HTTP 클라이언트**: `node-fetch` (추가 의존성 불필요)
- **API 엔드포인트**: `https://api.anthropic.com/v1/messages`
- **기본 모델**: `claude-sonnet-4-20250514`
- **API 키**: `ANTHROPIC_API_KEY` 환경변수

## 기술 사양

### 프로바이더 구성
```typescript
interface AIProviderConfig {
  model?: string;        // 기본: 'claude-sonnet-4-20250514'
  apiKey?: string;       // 기본: process.env.ANTHROPIC_API_KEY
  baseUrl?: string;      // 선택: 커스텀 엔드포인트 (기본: https://api.anthropic.com)
  language?: string;     // 선택: 출력 언어
}
```

### Messages API 호출 형식 (fetch 기반)
```typescript
const response = await fetch(`${this.baseUrl}/v1/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': this.apiKey,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: '시스템 프롬프트',
    messages: [
      { role: 'user', content: '...' }
    ]
  })
});
```

### JSON 응답 처리
- Anthropic API는 `response_format` 옵션을 지원하지 않음
- 프롬프트에서 JSON 형식 명시적 요청
- 응답에서 마크다운 코드블록 제거 후 파싱
- Ollama 프로바이더의 `extractJson()` 패턴 참고

## 호환성
- 기존 `AIProvider` 인터페이스 완전 호환
- OpenAI, Ollama, Claude-Code와 동일한 사용자 경험
- CLI에서 `--provider anthropic` 옵션으로 선택

## 환경변수
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```
