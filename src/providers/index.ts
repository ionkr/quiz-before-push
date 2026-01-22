import type { AIProvider } from './types.js';
import { OpenAIProvider } from './openai.js';
import { OllamaProvider } from './ollama.js';
import { ClaudeCodeProvider } from './claude-code.js';
import { AnthropicProvider } from './anthropic.js';
import { GeminiProvider } from './gemini.js';

export interface ProviderOptions {
  provider: 'openai' | 'ollama' | 'claude-code' | 'anthropic' | 'gemini';
  model?: string;
  apiKey?: string;
  ollamaUrl?: string;
  language?: string;
  mode?: 'default' | 'pre-push';
}

export function createProvider(options: ProviderOptions): AIProvider {
  switch (options.provider) {
    case 'openai':
      return new OpenAIProvider({
        model: options.model,
        apiKey: options.apiKey,
        language: options.language,
      });

    case 'ollama':
      return new OllamaProvider({
        model: options.model,
        baseUrl: options.ollamaUrl,
        language: options.language,
      });

    case 'claude-code':
      return new ClaudeCodeProvider({
        language: options.language,
      });

    case 'anthropic':
      return new AnthropicProvider({
        model: options.model,
        apiKey: options.apiKey,
        language: options.language,
      });

    case 'gemini':
      return new GeminiProvider({
        model: options.model,
        apiKey: options.apiKey,
        language: options.language,
      });

    default: {
      const exhaustiveCheck: never = options.provider;
      throw new Error(`Unknown provider: ${exhaustiveCheck}`);
    }
  }
}

export type { AIProvider, ProviderOptions as ProviderConfig };
export { OpenAIProvider, OllamaProvider, ClaudeCodeProvider, AnthropicProvider, GeminiProvider };
