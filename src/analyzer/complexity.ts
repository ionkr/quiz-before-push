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
  // 새 필드 추가
  functionChangeCount: number;    // 변경된 함수 개수
  classChangeCount: number;       // 변경된 클래스/인터페이스 개수
  weightedLines: number;          // 가중치 적용된 라인 수
  codeFileCount: number;          // 코드 파일 개수 (문서 제외)
}

export class ComplexityAnalyzer {
  private readonly fileTypeWeights: Record<string, number> = {
    // 코드 파일
    '.ts': 1.0, '.tsx': 1.0, '.js': 1.0, '.jsx': 1.0,
    '.py': 1.0, '.go': 1.0, '.rs': 1.0, '.java': 1.0,
    // 설정 파일
    '.json': 0.7, '.yaml': 0.7, '.yml': 0.7, '.toml': 0.7,
    // 문서 파일
    '.md': 0.3, '.txt': 0.3, '.rst': 0.3,
    // 스타일 파일
    '.css': 0.5, '.scss': 0.5, '.less': 0.5,
  };

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

  private getFileWeight(filePath: string): number {
    const ext = filePath.slice(filePath.lastIndexOf('.'));
    return this.fileTypeWeights[ext] ?? 0.8;
  }

  private readonly codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];

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
    // 2.1: 함수/클래스 카운터 변수 추가
    let functionChangeCount = 0;
    let classChangeCount = 0;
    // 2.3: 파일별 가중치 적용을 위한 변수
    const fileLineCounts: Map<string, { added: number; deleted: number }> = new Map();

    for (const line of lines) {
      // Parse file header
      const fileMatch = line.match(/^diff --git a\/(.+) b\/(.+)$/);
      if (fileMatch) {
        currentFile = fileMatch[2];
        if (!files.includes(currentFile)) {
          files.push(currentFile);
          fileLineCounts.set(currentFile, { added: 0, deleted: 0 });
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
        // 파일별 라인 카운트 업데이트
        const counts = fileLineCounts.get(currentFile);
        if (counts) counts.added++;
        // 2.2: 함수 패턴 매칭 시 카운트 증가
        if (this.functionPatterns.some((p) => p.test(line))) {
          hasFunctionChanges = true;
          functionChangeCount++;
        }
        if (this.classPatterns.some((p) => p.test(line))) {
          hasClassChanges = true;
          classChangeCount++;
        }
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletedLines++;
        // 파일별 라인 카운트 업데이트
        const counts = fileLineCounts.get(currentFile);
        if (counts) counts.deleted++;
        // 2.2: 함수 패턴 매칭 시 카운트 증가
        if (this.functionPatterns.some((p) => p.test(line))) {
          hasFunctionChanges = true;
          functionChangeCount++;
        }
        if (this.classPatterns.some((p) => p.test(line))) {
          hasClassChanges = true;
          classChangeCount++;
        }
      }
    }

    // 2.3: 파일별 가중치 적용된 라인 수 계산
    let weightedLines = 0;
    for (const [filePath, counts] of fileLineCounts) {
      const weight = this.getFileWeight(filePath);
      weightedLines += (counts.added * 1.3 + counts.deleted * 0.7) * weight;
    }

    // 2.4: 코드 파일 개수 계산
    const codeFileCount = files.filter((file) => {
      const ext = file.slice(file.lastIndexOf('.'));
      return this.codeExtensions.includes(ext);
    }).length;

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
      functionChangeCount,
      classChangeCount,
      weightedLines,
      codeFileCount,
    });

    return {
      totalLines,
      addedLines,
      deletedLines,
      fileCount: files.length,
      files,
      hasFunctionChanges: functionChangeCount > 0,  // 하위 호환
      hasClassChanges: classChangeCount > 0,        // 하위 호환
      hasConfigChanges,
      hasTestChanges,
      complexity,
      level: this.getDifficultyLevel(complexity),
      functionChangeCount,
      classChangeCount,
      weightedLines,
      codeFileCount,
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
    functionChangeCount: number;
    classChangeCount: number;
    weightedLines: number;
    codeFileCount: number;
  }): number {
    let complexity = 0;

    // 3.1: 가중치 적용된 라인 수 기준 (0-40 points)
    if (params.weightedLines <= 20) {
      complexity += 5;
    } else if (params.weightedLines <= 80) {
      complexity += 15;
    } else if (params.weightedLines <= 150) {
      complexity += 25;
    } else if (params.weightedLines <= 300) {
      complexity += 35;
    } else {
      complexity += 40;
    }

    // 3.2: 코드 파일 수 기준 (문서 파일 제외) (0-20 points)
    if (params.codeFileCount <= 1) {
      complexity += 5;
    } else if (params.codeFileCount <= 3) {
      complexity += 10;
    } else if (params.codeFileCount <= 5) {
      complexity += 15;
    } else {
      complexity += 20;
    }

    // 3.3: 함수 변경 개수 기반 (최대 25점)
    complexity += Math.min(params.functionChangeCount * 5, 25);
    // 3.3: 클래스 변경 개수 기반 (최대 20점)
    complexity += Math.min(params.classChangeCount * 8, 20);

    // Config changes (0-10 points)
    if (params.hasConfigChanges) {
      complexity += 10;
    }

    // Test changes reduce complexity slightly (tests are usually easier to understand)
    if (params.hasTestChanges && params.fileCount > 1) {
      complexity -= 5;
    }

    // 3.4: 분산된 변경은 컨텍스트 스위칭으로 더 어려움
    const avgLinesPerFile = params.weightedLines / Math.max(params.codeFileCount, 1);
    if (avgLinesPerFile < 10 && params.codeFileCount > 3) {
      complexity += 10;  // 분산 변경 보너스
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
