# CS Learning Lab — 사이트 구조 명세 (site-architecture.md)

> 프로젝트 지침 7번 [사이트 반영]이 따르는 규칙입니다. 구조를 바꿀 때는 이 문서를 먼저 고치고 승인받습니다.
> 최종 수정: 2026-11-23 (Astro 전환)

## 1. 기술 스택

| 항목 | 선택 | 이유 |
|---|---|---|
| 사이트 생성 | Astro 7 (정적 빌드) | 강의마다 HTML 페이지 생성, 실습 부분만 JS 로딩 |
| 강의 형식 | MDX (`@astrojs/mdx`) | Markdown 본문에 실습·평가 컴포넌트를 끼워 넣음 |
| 코드 강조 | Shiki (빌드 시, github-light/dark 이중 테마) | 런타임 JS 없음 |
| 실습 | 공통 실습 엔진 `src/labs/engine/step-lab.ts` (바닐라 TS) | 과목과 상관없이 재사용 |
| 배포 | GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`) | main에 push하면 자동 빌드·배포 |
| 사이트맵 | `@astrojs/sitemap` | |

GitHub 저장소 Settings → Pages → Source는 **GitHub Actions**여야 합니다.

## 2. 폴더 구조

```
src/
  content.config.ts            컬렉션 정의 (subjects, lessons, legacy)
  content/
    subjects/<과목id>.json      과목 정보 + 단원(units) 목록
    lessons/<과목id>/<NN>-<slug>.mdx   새 기준 강의 (한 파일 = 한 강의)
    legacy/react-native.json   개편 전 React Native 26강 원본 데이터 (보존용, 추가 금지)
  components/
    lesson/                    강의 본문용: Layer, Callout, CodeWalk, Predict, BugHunt, Explain, Quiz, LegacyLesson
    labs/                      실습 래퍼(.astro): <과목 실습>Lab.astro
  labs/
    engine/step-lab.ts, .css   공통 실습 엔진
    <과목>/                    과목별 실습 로직 (예: labs/react/use-state-queue.ts)
    legacy/                    개편 전 실습 코드 (원본 보존)
  layouts/Base.astro, LessonLayout.astro
  lib/catalog.ts               과목·강의 목록 계산 (홈·목차·진도는 모두 여기서 파생)
  pages/
    index.astro                         홈
    subjects/[subject]/index.astro      과목 페이지 (+ 옛 주소 ?lesson=N 리다이렉트)
    subjects/[subject]/[lesson]/index.astro   강의 페이지
    subjects/[subject]/[lesson]/legacy.astro  재작성된 강의의 이전 버전
  scripts/progress.ts, assess.ts
  styles/base.css, legacy-labs.css
docs/site-architecture.md     이 문서
```

## 3. URL 규칙

- 과목: `/subjects/<과목id>/`
- 강의: `/subjects/<과목id>/<NN>/` (NN = 두 자리 강의 번호). 강의 번호는 바뀌지 않는 영구 주소입니다.
- 이전 버전: `/subjects/<과목id>/<NN>/legacy/` (새 기준으로 재작성된 강의만)
- 옛 주소 `/subjects/react-native/?lesson=N`은 자동으로 새 주소로 이동합니다.

## 4. 과목 추가하기

1. `src/content/subjects/<과목id>.json` 생성 (과목id는 영문 소문자·하이픈, 예: `operating-systems`)
   ```json
   {
     "title": "운영체제", "icon": "🖥️", "field": "컴퓨터 시스템", "area": "운영체제", "order": 2,
     "description": "…",
     "units": [{ "id": "process", "title": "프로세스와 스레드" }]
   }
   ```
   - `field`: 홈의 분야 필터 (예: 프로그래밍, 컴퓨터 시스템, 네트워크, 데이터, 보안, 수학, AI)
   - `progressKey`는 생략 → 자동으로 `cs-progress:<과목id>`
2. `src/content/lessons/<과목id>/01-<slug>.mdx`로 강의 추가. 홈·목차·강의 수·진도율은 자동 반영(하드코딩 금지).

## 5. 강의(MDX) 작성 규칙

프론트매터 (모두 필수, prerequisites·minutes만 선택):

```yaml
subject: react-native
order: 4                # 강의 번호 = URL
unit: basics            # 과목 units의 id
title: …
summary: …
goals: [ … ]            # "~할 수 있다" 형태, 3~6개
prerequisites: [ … ]
minutes: 60
updated: 2026-11-23
```

본문 구성 (프로젝트 지침 3~5번):

1. 문제 제시 → `<Layer n={1}/>`~`<Layer n={8}/>` 순서로 ①직관 ②정의 ③존재 이유 ④내부 동작 ⑤경계와 실패 ⑥비교 ⑦실무 ⑧더 깊이
2. 완성 예제 최소 2개(기본 + 함정) + `<CodeWalk>` 줄 해설
3. `<Layer n={9}/>` 실습: 핵심 메커니즘마다 실습 1개 (같은 실습 재사용 금지)
4. `<Layer n={10}/>` 평가: Predict / BugHunt / Explain / Quiz 중 3종 이상, 변형 문제 포함
5. `<Callout kind="analogy|limit|error|tip|note">` — 실제 오류는 `error`에 원문 메시지 그대로

MDX 주의: 본문 텍스트에 `{`, `<`를 그대로 쓰면 JSX로 해석됩니다. 코드는 백틱(`` ` ``)으로 감싸세요.

## 6. 실습 엔진 규칙

`mountStepLab(root, config)`에 다음을 넘깁니다.

| 필드 | 역할 |
|---|---|
| `mode` | `'simulation'` 또는 `'real'` → 배지 자동 표시 (필수) |
| `variants` | 올바른 방식과 `buggy: true`인 고장 모드를 함께 제공 |
| `controls` | 슬라이더·선택 등 변수 조작 → 바뀌면 다시 계산 |
| `codeBlocks` | 현재 실행 줄을 강조할 코드 (여러 블록 가능: 내 코드 / 내부 의사 코드) |
| `build(variant)` | **순수 함수**로 단계 배열(각 단계의 상태 스냅샷 포함)을 생성 → 되감기가 공짜 |
| `renderState` | 한 단계의 상태를 그림 (숨은 상태 시각화) |
| `predict` | 실행 전 예측 (예측 전에는 실행 잠금, 마지막 단계에서 자동 채점) |
| `onFinish` | 미션 채점, "한 번 더" 같은 후속 동작 |

엔진이 제공: 처음/이전/다음/자동 재생(속도 3단계)/타임라인/키보드 ←→, 화면 밖이면 재생 정지, 모바일에서 하단 고정 조작 바.

새 실습 = `src/labs/<과목>/<이름>.ts` (로직) + `src/components/labs/<이름>Lab.astro` (래퍼).

## 7. 라이브러리 도입 규칙

- npm으로 설치해 빌드에 포함 (CDN 금지). 실습이 있는 페이지에서만 import.
- 무거운 실행 환경(Pyodide, sql.js/PGlite, Three.js 등)은 사용자가 실행 버튼을 누를 때 동적 import.
- 3D는 깊이 축이 의미를 가질 때만. 시점 프리셋·조작 모드 전환·2D 대체 화면 필수.
- 도입 시 아래 표에 기록.

| 라이브러리 | 버전 | 용도 | 대략 용량(gzip) | 라이선스 | 사용 위치 |
|---|---|---|---|---|---|
| astro | 7.x | 사이트 생성 | 빌드 전용 | MIT | 전체 |
| @astrojs/mdx | 8.x | MDX 강의 | 빌드 전용 | MIT | 전체 |
| @astrojs/sitemap | 3.x | 사이트맵 | 빌드 전용 | MIT | 전체 |

## 8. 학습 데이터 (localStorage) — 형식 변경은 사전 승인 필요

| 키 | 값 | 비고 |
|---|---|---|
| `rn-lesson-progress` | `{"<번호-1>": true}` | React Native 진도 (개편 전 키 그대로 유지) |
| `cs-progress:<과목id>` | 같은 형식 | 새 과목 진도 |
| `cs-last-course` / `cs-last-lesson` | 과목id / 강의 번호 | 이어서 학습하기 |
| `cs-theme` | `light` / `dark` | 테마 |
| `cs-explain:<경로>:<id>` | 문자열 | "내 말로 설명하기" 답안 |

기기 간 동기화는 없습니다(브라우저 저장).

## 9. 디자인·품질 기준

- 디자인 토큰은 `src/styles/base.css`의 CSS 변수만 사용 (라이트/다크 자동 대응).
- 360~430px 우선 → 768px → 1024px(목차 사이드바 고정). 터치 대상 44px 이상, 입력 16px 이상.
- 가로 스크롤 금지(코드 블록·표 내부 스크롤은 허용). `prefers-reduced-motion` 존중.

## 10. 작업 순서 (지침 7번)

변경 계획 → `npm run build` + 로컬 미리보기(모바일·데스크톱, 콘솔 오류 0, 실습 조작 확인) → 승인 → 커밋·푸시 → Actions 성공 확인 → 배포 URL에서 실제 동작 확인 → 보고.

## 11. 개편 전 강의(legacy) 처리

- React Native 1~26강은 원본 내용·실습 코드를 그대로 강의별 페이지로 옮겼습니다 (`LegacyLesson.astro`, `labs/legacy/react-native.js`).
- 새 기준으로 재작성하면 같은 번호의 MDX를 추가합니다. MDX가 대표 강의가 되고, 원본은 `/legacy/`에서 계속 볼 수 있습니다.
- 재작성 완료: 4강 useState
