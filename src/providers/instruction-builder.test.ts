import { describe, it, expect } from 'vitest';
import { InstructionBuilder } from './instruction-builder.js';

describe('InstructionBuilder.parseChatJsonResponse', () => {
  describe('valid JSON parsing', () => {
    it('should parse valid JSON correctly', () => {
      const input = JSON.stringify({
        message: 'Hello, how can I help you?',
        suggestedAction: 'continue'
      });

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.message).toBe('Hello, how can I help you?');
      expect(result.suggestedAction).toBe('continue');
    });

    it('should parse JSON wrapped in markdown code blocks', () => {
      const input = `\`\`\`json
{
  "message": "This is wrapped in markdown",
  "suggestedAction": "ready_to_answer"
}
\`\`\``;

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.message).toBe('This is wrapped in markdown');
      expect(result.suggestedAction).toBe('ready_to_answer');
    });

    it('should parse JSON with code block without json specifier', () => {
      const input = `\`\`\`
{"message": "No json specifier", "suggestedAction": "continue"}
\`\`\``;

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.message).toBe('No json specifier');
    });
  });

  describe('jsonrepair recovery', () => {
    it('should repair JSON with trailing comma', () => {
      const input = `{
        "message": "Test message",
        "suggestedAction": "continue",
      }`;

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.message).toBe('Test message');
      expect(result.suggestedAction).toBe('continue');
    });

    it('should repair JSON with single quotes', () => {
      const input = `{'message': 'Single quotes', 'suggestedAction': 'continue'}`;

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.message).toBe('Single quotes');
    });

    it('should repair JSON with missing quotes on keys', () => {
      const input = `{message: "No quotes on keys", suggestedAction: "continue"}`;

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.message).toBe('No quotes on keys');
    });
  });

  describe('plain text fallback', () => {
    it('should extract message from malformed JSON with unescaped newlines', () => {
      // This is the case that causes "Unterminated string in JSON" error
      const input = `{"message": "Line 1
Line 2
Line 3", "suggestedAction": "continue"}`;

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.message).toContain('Line 1');
    });

    it('should extract message from malformed JSON with unescaped quotes', () => {
      const input = `{"message": "He said "hello" to me", "suggestedAction": "continue"}`;

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.message).toContain('He said');
    });

    it('should not truncate message containing code blocks with JSON-like content', () => {
      // This simulates AI response with code that contains "}" or ","
      const input = `{"message": "Here is the code:\\n\`\`\`\\nconst obj = {\\"key\\": \\"value\\"};\\n\`\`\`\\nAnd this is the explanation.", "suggestedAction": "continue"}`;

      const result = InstructionBuilder.parseChatJsonResponse(input);

      // Should contain the full message including "explanation"
      expect(result.message).toContain('explanation');
      expect(result.message).toContain('code');
    });

    it('should handle plain text with no JSON structure', () => {
      const input = `This is just plain text without any JSON structure.
It might happen when the AI doesn't follow instructions.`;

      const result = InstructionBuilder.parseChatJsonResponse(input);

      // Plain text fallback returns the text as message and infers action
      expect(result.message).toBeDefined();
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.suggestedAction).toBe('continue');
    });

    it('should unescape escaped characters in fallback mode', () => {
      // Partially valid JSON structure but still fails to parse
      const input = `{"message": "Tab:\\tNewline:\\nQuote:\\"Backslash:\\\\", "broken`;

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.message).toContain('Tab:\t');
      expect(result.message).toContain('Newline:\n');
    });
  });

  describe('suggestedAction inference', () => {
    it('should infer ready_to_answer from explicit JSON value in malformed JSON', () => {
      // Malformed JSON that contains "ready_to_answer" - jsonrepair can fix this
      const input = `{"message": "You got it!, "suggestedAction": "ready_to_answer"}`;

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.suggestedAction).toBe('ready_to_answer');
    });

    it('should return undefined suggestedAction when jsonrepair fixes JSON without action', () => {
      // jsonrepair successfully fixes these, so suggestedAction is undefined (not in the JSON)
      const input = '{"message": "You seem ready to answer now!}';

      const result = InstructionBuilder.parseChatJsonResponse(input);

      // jsonrepair fixes this to valid JSON with only message field
      expect(result.message).toBe('You seem ready to answer now!');
      expect(result.suggestedAction).toBeUndefined();
    });

    it('should infer ready_to_answer in text fallback when JSON is completely unrecoverable', () => {
      // This is so malformed that jsonrepair creates invalid structure
      const input = 'You seem ready to answer now! Try answering the question.';

      const result = InstructionBuilder.parseChatJsonResponse(input);

      // Falls back to text extraction which infers action
      expect(result.suggestedAction).toBe('ready_to_answer');
    });

    it('should infer ready_to_answer from Korean phrases in text fallback', () => {
      const input = '답변할 준비가 된 것 같아요. 이해하신 것 같네요!';

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.suggestedAction).toBe('ready_to_answer');
    });

    it('should default to continue in text fallback when no ready phrases found', () => {
      const input = 'Let me explain this concept further in detail';

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.suggestedAction).toBe('continue');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = InstructionBuilder.parseChatJsonResponse('');

      expect(result.message).toBe('');
      expect(result.suggestedAction).toBe('continue');
    });

    it('should handle whitespace only', () => {
      const result = InstructionBuilder.parseChatJsonResponse('   \n\t  ');

      expect(result.message).toBe('');
      expect(result.suggestedAction).toBe('continue');
    });

    it('should handle JSON with only message field (no suggestedAction)', () => {
      const input = '{"message": "Only message, no action"}';

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.message).toBe('Only message, no action');
      expect(result.suggestedAction).toBeUndefined();
    });

    it('should handle deeply nested markdown code blocks', () => {
      const input = `Some text before
\`\`\`json
{"message": "Nested content", "suggestedAction": "continue"}
\`\`\`
Some text after`;

      const result = InstructionBuilder.parseChatJsonResponse(input);

      expect(result.message).toBe('Nested content');
    });
  });
});
