import { minimatch } from 'minimatch';
import { existsSync, readFileSync } from 'fs';

export class IgnoreParser {
  private patterns: string[] = [];

  private readonly defaultPatterns = [
    'node_modules/**',
    'dist/**',
    '.git/**',
    '*.lock',
    'package-lock.json',
  ];

  constructor() {
    this.patterns = [...this.defaultPatterns];
  }

  loadIgnoreFile(filepath: string): void {
    if (!existsSync(filepath)) {
      return;
    }

    const content = readFileSync(filepath, 'utf-8');
    this.parsePatterns(content);
  }

  private parsePatterns(content: string): void {
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    this.patterns.push(...lines);
  }

  shouldIgnore(filePath: string): boolean {
    return this.patterns.some((pattern) =>
      minimatch(filePath, pattern, { dot: true })
    );
  }

  getPatterns(): string[] {
    return [...this.patterns];
  }

  getDefaultPatterns(): string[] {
    return [...this.defaultPatterns];
  }
}
