# Programmatic API

review-before-go can be used programmatically in your Node.js applications.

## Installation

```bash
npm install review-before-go
```

## Basic Usage

```typescript
import { GitQuiz } from 'review-before-go';

const gitQuiz = new GitQuiz({
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
  language: 'en',
});

const exitCode = await gitQuiz.run();
process.exit(exitCode);
```

## Classes

### GitQuiz

Main orchestrator class.

```typescript
import { GitQuiz, GitQuizOptions } from 'review-before-go';

interface GitQuizOptions {
  provider: 'openai' | 'ollama' | 'claude-code';
  model?: string;
  apiKey?: string;
  ollamaUrl?: string;
  language?: string;
  maxRetries?: number;    // Default: 3
  passingScore?: number;  // Default: 7
  skipQuiz?: boolean;
}

const quiz = new GitQuiz(options);
const exitCode = await quiz.run(); // Returns 0 (pass) or 1 (fail)
```

### ComplexityAnalyzer

Analyzes git diffs and calculates complexity.

```typescript
import { ComplexityAnalyzer, DiffAnalysis, ComplexityLevel } from 'review-before-go';

const analyzer = new ComplexityAnalyzer();

const analysis: DiffAnalysis = analyzer.analyzeDiff(diffString);

// DiffAnalysis structure:
interface DiffAnalysis {
  totalLines: number;
  addedLines: number;
  deletedLines: number;
  fileCount: number;
  files: string[];
  hasFunctionChanges: boolean;
  hasClassChanges: boolean;
  hasConfigChanges: boolean;
  hasTestChanges: boolean;
  complexity: number;  // 0-100
  level: ComplexityLevel;
}

// Get quiz count based on complexity
const quizCount = analyzer.getQuizCount(analysis.complexity); // 1-5

// Get difficulty level
const level = analyzer.getDifficultyLevel(analysis.complexity);
// ComplexityLevel: LOW | MEDIUM | HIGH | CRITICAL
```

### Providers

#### Create Provider

```typescript
import { createProvider, ProviderOptions, AIProvider } from 'review-before-go';

const provider: AIProvider = createProvider({
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: 'sk-...',
  language: 'en',
});
```

#### AIProvider Interface

```typescript
interface AIProvider {
  generateQuiz(diff: string, complexity: number): Promise<Quiz>;
  evaluateAnswer(question: Question, answer: string): Promise<EvaluationResult>;
  getName(): string;
}
```

#### OpenAIProvider

```typescript
import { OpenAIProvider } from 'review-before-go';

const provider = new OpenAIProvider({
  model: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY,
  language: 'ko',
});
```

#### OllamaProvider

```typescript
import { OllamaProvider } from 'review-before-go';

const provider = new OllamaProvider({
  model: 'llama3.2',
  baseUrl: 'http://localhost:11434',
  language: 'en',
});

// Check connection
const isConnected = await provider.checkConnection();
```

#### ClaudeCodeProvider

```typescript
import { ClaudeCodeProvider } from 'review-before-go';

const provider = new ClaudeCodeProvider({
  language: 'ja',
});
```

### QuizManager

Handles quiz execution and user interaction.

```typescript
import { QuizManager, QuizResult, QuizManagerOptions } from 'review-before-go';

const manager = new QuizManager(provider, {
  maxRetries: 3,
  passingScore: 7,
  showDiffOnBypass: true,
});

const result: QuizResult = await manager.runQuiz(quiz, originalDiff);

// QuizResult structure:
interface QuizResult {
  totalQuestions: number;
  passedQuestions: number;
  failedQuestions: number;
  results: Array<{
    question: Question;
    answer: string;
    evaluation: EvaluationResult;
  }>;
  overallPassed: boolean;
  bypassed: boolean;
}
```

## Types

### Quiz

```typescript
interface Quiz {
  questions: Question[];
  complexity: ComplexityLevel;
  generatedAt: Date;
}
```

### Question

```typescript
enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  FREE_TEXT = 'FREE_TEXT',
}

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  choices?: Choice[];
  correctAnswer?: string;
  context?: string;
}

interface Choice {
  label: string;  // A, B, C, D
  text: string;
}
```

### EvaluationResult

```typescript
interface EvaluationResult {
  score: number;      // 0-10
  passed: boolean;    // true if score >= 7
  feedback: string;
  correctAnswer?: string;
}
```

### ComplexityLevel

```typescript
enum ComplexityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
```

## Example: Custom Integration

```typescript
import {
  createProvider,
  ComplexityAnalyzer,
  QuizManager,
} from 'review-before-go';
import { execSync } from 'child_process';

async function runCustomQuiz() {
  // Get diff
  const diff = execSync('git diff --staged', { encoding: 'utf-8' });

  // Analyze complexity
  const analyzer = new ComplexityAnalyzer();
  const analysis = analyzer.analyzeDiff(diff);

  console.log(`Complexity: ${analysis.complexity} (${analysis.level})`);
  console.log(`Files: ${analysis.fileCount}`);
  console.log(`Questions: ${analyzer.getQuizCount(analysis.complexity)}`);

  // Create provider
  const provider = createProvider({
    provider: 'openai',
    model: 'gpt-4o-mini',
  });

  // Generate quiz
  const quiz = await provider.generateQuiz(diff, analysis.complexity);

  // Run quiz
  const manager = new QuizManager(provider, { maxRetries: 2 });
  const result = await manager.runQuiz(quiz, diff);

  return result.overallPassed ? 0 : 1;
}
```
