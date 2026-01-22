import type { AIProvider } from './types.js';
import { OpenAIProvider } from './openai.js';
import { OllamaProvider } from './ollama.js';
import { ClaudeCodeProvider } from './claude-code.js';

export interface ProviderOptions {
  provider: 'openai' | 'ollama' | 'claude-code';
  model?: string;
  apiKey?: string;
  ollamaUrl?: string;
  language?: string;
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

    default: {
      const exhaustiveCheck: never = options.provider;
      throw new Error(`Unknown provider: ${exhaustiveCheck}`);
    }
  }
}

export type { AIProvider, ProviderOptions as ProviderConfig };
export { OpenAIProvider, OllamaProvider, ClaudeCodeProvider };
