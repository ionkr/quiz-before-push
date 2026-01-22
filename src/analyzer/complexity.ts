import { ComplexityLevel } from '../types/index.js';

export interface DiffAnalysis {
  totalLines: number;
  addedLines: number;
  deletedLines: number;
  fileCount: number;
  files: string[];
  hasFunctionChanges: boolean;
  hasClassChanges: boolean;
  hasConfigChanges: boolean;
  hasTestChanges: boolean;
  complexity: number;
  level: ComplexityLevel;
}

export class ComplexityAnalyzer {
  private readonly functionPatterns = [
    /^[+-]\s*(async\s+)?function\s+\w+/,
    /^[+-]\s*(export\s+)?(async\s+)?function\s+\w+/,
    /^[+-]\s*\w+\s*[=:]\s*(async\s+)?\([^)]*\)\s*=>/,
    /^[+-]\s*(public|private|protected)?\s*(async\s+)?\w+\s*\([^)]*\)\s*[:{]/,
    /^[+-]\s*def\s+\w+/,
    /^[+-]\s*func\s+\w+/,
  ];

  private readonly classPatterns = [
    /^[+-]\s*(export\s+)?(abstract\s+)?class\s+\w+/,
    /^[+-]\s*interface\s+\w+/,
    /^[+-]\s*type\s+\w+\s*=/,
    /^[+-]\s*struct\s+\w+/,
  ];

  private readonly configPatterns = [
    /package\.json$/,
    /tsconfig\.json$/,
    /\.config\.(js|ts|mjs|cjs)$/,
    /\.env/,
    /\.yml$/,
    /\.yaml$/,
  ];

  private readonly testPatterns = [
    /\.(test|spec)\.(ts|js|tsx|jsx)$/,
    /__tests__\//,
    /\.test\./,
  ];

  analyzeDiff(diff: string): DiffAnalysis {
    const lines = diff.split('\n');
    const files: string[] = [];
    let addedLines = 0;
    let deletedLines = 0;
    let hasFunctionChanges = false;
    let hasClassChanges = false;
    let hasConfigChanges = false;
    let hasTestChanges = false;
    let currentFile = '';

    for (const line of lines) {
      // Parse file header
      const fileMatch = line.match(/^diff --git a\/(.+) b\/(.+)$/);
      if (fileMatch) {
        currentFile = fileMatch[2];
        if (!files.includes(currentFile)) {
          files.push(currentFile);
        }

        // Check file type
        if (this.configPatterns.some((p) => p.test(currentFile))) {
          hasConfigChanges = true;
        }
        if (this.testPatterns.some((p) => p.test(currentFile))) {
          hasTestChanges = true;
        }
        continue;
      }

      // Count added/deleted lines (skip headers)
      if (line.startsWith('+') && !line.startsWith('+++')) {
        addedLines++;
        if (this.functionPatterns.some((p) => p.test(line))) {
          hasFunctionChanges = true;
        }
        if (this.classPatterns.some((p) => p.test(line))) {
          hasClassChanges = true;
        }
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletedLines++;
        if (this.functionPatterns.some((p) => p.test(line))) {
          hasFunctionChanges = true;
        }
        if (this.classPatterns.some((p) => p.test(line))) {
          hasClassChanges = true;
        }
      }
    }

    const totalLines = addedLines + deletedLines;
    const complexity = this.calculateComplexity({
      totalLines,
      addedLines,
      deletedLines,
      fileCount: files.length,
      hasFunctionChanges,
      hasClassChanges,
      hasConfigChanges,
      hasTestChanges,
    });

    return {
      totalLines,
      addedLines,
      deletedLines,
      fileCount: files.length,
      files,
      hasFunctionChanges,
      hasClassChanges,
      hasConfigChanges,
      hasTestChanges,
      complexity,
      level: this.getDifficultyLevel(complexity),
    };
  }

  private calculateComplexity(params: {
    totalLines: number;
    addedLines: number;
    deletedLines: number;
    fileCount: number;
    hasFunctionChanges: boolean;
    hasClassChanges: boolean;
    hasConfigChanges: boolean;
    hasTestChanges: boolean;
  }): number {
    let complexity = 0;

    // Line count factor (0-40 points)
    if (params.totalLines <= 10) {
      complexity += 5;
    } else if (params.totalLines <= 50) {
      complexity += 15;
    } else if (params.totalLines <= 100) {
      complexity += 25;
    } else if (params.totalLines <= 200) {
      complexity += 35;
    } else {
      complexity += 40;
    }

    // File count factor (0-20 points)
    if (params.fileCount <= 1) {
      complexity += 5;
    } else if (params.fileCount <= 3) {
      complexity += 10;
    } else if (params.fileCount <= 5) {
      complexity += 15;
    } else {
      complexity += 20;
    }

    // Structural changes (0-30 points)
    if (params.hasFunctionChanges) {
      complexity += 15;
    }
    if (params.hasClassChanges) {
      complexity += 15;
    }

    // Config changes (0-10 points)
    if (params.hasConfigChanges) {
      complexity += 10;
    }

    // Test changes reduce complexity slightly (tests are usually easier to understand)
    if (params.hasTestChanges && params.fileCount > 1) {
      complexity -= 5;
    }

    return Math.max(0, Math.min(100, complexity));
  }

  getQuizCount(complexity: number): number {
    if (complexity < 20) return 1;
    if (complexity < 40) return 2;
    if (complexity < 60) return 3;
    if (complexity < 80) return 4;
    return 5;
  }

  getDifficultyLevel(complexity: number): ComplexityLevel {
    if (complexity < 25) return ComplexityLevel.LOW;
    if (complexity < 50) return ComplexityLevel.MEDIUM;
    if (complexity < 75) return ComplexityLevel.HIGH;
    return ComplexityLevel.CRITICAL;
  }
}
