# Gemini API Specification

## Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

## Authentication

헤더에 API 키 포함:

```
x-goog-api-key: YOUR_API_KEY
```

## Request Format

```typescript
interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    responseMimeType?: string;      // "application/json" for JSON mode
    responseJsonSchema?: object;    // JSON Schema for structured output
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
}
```

### Example Request (with JSON Schema)

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [{
      "parts": [{"text": "Your prompt here"}]
    }],
    "generationConfig": {
      "responseMimeType": "application/json",
      "responseJsonSchema": {
        "type": "object",
        "properties": {
          "questions": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {"type": "string"},
                "type": {"type": "string"},
                "question": {"type": "string"}
              },
              "required": ["id", "type", "question"]
            }
          }
        },
        "required": ["questions"]
      }
    }
  }'
```

## Response Format

```typescript
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}
```

### Extracting Text

```typescript
const text = response.candidates[0].content.parts[0].text;
```

## Error Handling

HTTP 상태 코드:
- `400`: Bad Request (잘못된 요청 형식)
- `401`: Unauthorized (API 키 오류)
- `403`: Forbidden (권한 없음)
- `404`: Not Found (모델 없음)
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error

## Available Models

| Model | Description | Pricing (per 1M tokens) |
|-------|-------------|-------------------------|
| `gemini-3-flash-preview` | Latest, balanced speed/performance | $0.50 / $3.00 |
| `gemini-2.5-flash` | Production stable, cost-effective | $0.30 / $2.50 |
| `gemini-2.5-pro` | Complex reasoning | Higher |

## JSON Schema Support

Gemini API는 `responseJsonSchema`를 통해 구조화된 출력을 지원합니다:

- 지원 타입: `string`, `number`, `integer`, `boolean`, `object`, `array`, `null`
- `required` 필드로 필수 속성 지정
- `description`으로 각 필드 설명 가능

### Quiz JSON Schema

```json
{
  "type": "object",
  "properties": {
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "type": {"type": "string", "enum": ["MULTIPLE_CHOICE", "FREE_TEXT"]},
          "question": {"type": "string"},
          "choices": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "label": {"type": "string"},
                "text": {"type": "string"}
              },
              "required": ["label", "text"]
            }
          },
          "correctAnswer": {"type": "string"},
          "correctChoiceLabel": {"type": "string"},
          "correctFeedback": {"type": "string"},
          "incorrectFeedback": {"type": "string"},
          "context": {"type": "string"}
        },
        "required": ["id", "type", "question"]
      }
    }
  },
  "required": ["questions"]
}
```

### EvaluationResult JSON Schema

```json
{
  "type": "object",
  "properties": {
    "score": {"type": "integer", "minimum": 0, "maximum": 10},
    "passed": {"type": "boolean"},
    "feedback": {"type": "string"},
    "correctAnswer": {"type": "string"}
  },
  "required": ["score", "passed", "feedback"]
}
```
