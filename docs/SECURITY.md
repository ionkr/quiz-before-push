# Security Policy

review-before-go takes security seriously. This document describes how sensitive data is handled.

## Sensitive Data Redaction

Before sending any diff content to AI providers, review-before-go automatically redacts sensitive data patterns.

### Redacted Patterns

The following patterns are automatically detected and replaced with `[REDACTED]`:

#### API Keys and Secrets

```
api_key = "sk-1234..."         →  api_key = [REDACTED]
API_SECRET: abc123...          →  API_SECRET: [REDACTED]
secret_key = "..."             →  secret_key = [REDACTED]
```

#### AWS Credentials

```
AWS_ACCESS_KEY_ID = "AKIA..."  →  AWS_ACCESS_KEY_ID = [REDACTED]
aws_secret_access_key = "..."  →  aws_secret_access_key = [REDACTED]
```

#### Bearer Tokens

```
Authorization: Bearer eyJ...   →  Authorization: Bearer [REDACTED]
```

#### Passwords

```
password = "mysecret123"       →  password = [REDACTED]
DB_PASSWORD: "..."             →  DB_PASSWORD: [REDACTED]
```

#### Database Connection Strings

```
mongodb://user:pass@host/db    →  [REDACTED]
postgres://user:pass@host/db   →  [REDACTED]
mysql://user:pass@host/db      →  [REDACTED]
redis://user:pass@host         →  [REDACTED]
```

#### JWT Tokens

```
eyJhbGciOiJIUzI1NiIs...       →  [REDACTED]
```

#### Private Keys

```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBg...
-----END PRIVATE KEY-----
```
↓
```
[REDACTED]
```

## Best Practices

### Do NOT Commit Secrets

Even with redaction, avoid committing secrets to version control:

1. Use `.env` files (add to `.gitignore`)
2. Use environment variables
3. Use secret management tools (Vault, AWS Secrets Manager, etc.)

### API Key Storage

❌ **Don't** store API keys in git config:
```bash
git config quiz.apiKey sk-1234...  # NOT RECOMMENDED
```

✅ **Do** use environment variables:
```bash
export OPENAI_API_KEY=sk-1234...
```

### Local Providers

For maximum security, use local AI providers:

```bash
# Ollama runs entirely locally - no data leaves your machine
review-before-go --provider ollama
```

## Data Sent to Providers

### What IS Sent

- Git diff content (after redaction)
- Your quiz answers
- Provider configuration (model name, language preference)

### What is NOT Sent

- Your API keys (sent only to authenticate with the provider)
- File paths outside the diff
- Git history
- Your local environment variables

## Provider Security

### OpenAI

- Data sent to OpenAI API
- Subject to [OpenAI's data usage policy](https://openai.com/policies/api-data-usage-policies)
- API data is not used to train models by default

### Ollama

- **Fully local** - no data leaves your machine
- Recommended for sensitive codebases
- No API key required

### Anthropic

- Data sent to Anthropic API
- Subject to [Anthropic's privacy policy](https://www.anthropic.com/privacy)
- API data handling follows Anthropic's data retention policies

### Claude Code

- Uses the Claude CLI
- Subject to Anthropic's privacy policy
- Runs through your authenticated Claude session

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public GitHub issue
2. Email security concerns to the maintainers
3. Provide details about the vulnerability
4. Allow time for a fix before public disclosure

## Audit

The redaction logic is implemented in `src/index.ts` in the `sanitizeDiff()` method. You can review the exact patterns being matched.

```typescript
// Example patterns (see source for complete list)
const sensitivePatterns = [
  /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9_\-]{20,}['"]?/gi,
  /password\s*[:=]\s*['"][^'"]+['"]/gi,
  // ... more patterns
];
```
