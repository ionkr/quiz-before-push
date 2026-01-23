# 요구사항 정의: .quizignore 파일 제외 기능

## 개요

`.gitignore`와 유사한 방식으로 diff 분석에서 특정 파일/디렉토리를 제외할 수 있는 기능을 추가합니다.

## 기능 요구사항

### FR-1: .quizignore 파일 지원
- 프로젝트 루트에 `.quizignore` 파일을 생성하여 제외 패턴 정의
- `.gitignore`와 동일한 glob 패턴 문법 지원
- `#`으로 시작하는 라인은 주석으로 처리
- 빈 라인 무시

### FR-2: 기본 제외 패턴
`.quizignore` 파일이 없어도 다음 패턴은 항상 제외:
- `node_modules/**`
- `dist/**`
- `.git/**`
- `*.lock`
- `package-lock.json`

### FR-3: Diff 필터링
- git diff 결과에서 제외 패턴에 매칭되는 파일 블록 제거
- 필터링된 diff를 complexity 분석에 전달
- 제외된 파일은 퀴즈 문제 생성에서도 제외

### FR-4: 문서화
- README.md (영문) 업데이트
- README.ko.md (한국어) 업데이트
- Features 및 Configuration 섹션에 설명 추가

### FR-5: Hook 설치 시 안내
- `--install-hooks` 실행 시 `.quizignore` 사용법 콘솔 출력
- 기본 제외 패턴 안내

## 비기능 요구사항

### NFR-1: 성능
- 대용량 diff에서도 빠른 필터링 (minimatch 사용)
- 파일당 O(n) 패턴 매칭 (n = 패턴 수)

### NFR-2: 호환성
- 기존 동작과 하위 호환성 유지
- `.quizignore` 없으면 기본 패턴만 적용

### NFR-3: 버전
- npm 패치 버전 업: 0.1.3 → 0.1.4

## 기술 스택

- **패턴 매칭**: `minimatch` v10.x
- **파일 읽기**: Node.js `fs` 모듈

## 제약사항

- `.quizignore`는 프로젝트 루트에만 위치
- 중첩된 `.quizignore` 지원하지 않음
- 네거티브 패턴(`!pattern`) 지원하지 않음 (v1)
