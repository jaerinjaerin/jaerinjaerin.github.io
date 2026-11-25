# CS Learning Lab — 사이트 구조 명세 (site-architecture.md)

> 프로젝트 지침 7번 [사이트 반영]이 따르는 규칙입니다. 구조를 바꿀 때는 이 문서를 먼저 고치고 승인받습니다.
> 최종 수정: 2026-11-25 (React Native 과목 제거, "공학 도면집" 디자인 적용)

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
  content.config.ts            컬렉션 정의 (subjects, lessons)
  content/
    subjects/<과목id>.json      과목 정보 + 단원(units) 목록
    lessons/<과목id>/<NN>-<slug>.mdx   새 기준 강의 (한 파일 = 한 강의)
  components/
    lesson/                    강의 본문용: Layer, Callout, CodeWalk, Predict, BugHunt, Explain, Quiz
    labs/                      실습 래퍼(.astro): <과목 실습>Lab.astro
  labs/
    engine/step-lab.ts, .css   공통 실습 엔진
    <과목>/                    과목별 실습 로직 (예: labs/os/page-table.ts)
  layouts/Base.astro, LessonLayout.astro
  lib/catalog.ts               과목·강의 목록 계산 (홈·목차·진도는 모두 여기서 파생)
  figures/
    kit/iso-kit.mjs            Anatomy kit 사본 (MIT, LICENSE-anatomy)
    <그림 이름>/geometry.mjs    빌드 시 SVG를 만드는 기하 모듈
    <그림 이름>/live.ts         움직임 (클라이언트)
  components/figures/          그림 래퍼(.astro)
  pages/
    index.astro                         홈
    subjects/[subject]/index.astro      과목 페이지
    subjects/[subject]/[lesson]/index.astro   강의 페이지
    404.astro                           없는 주소 안내
  scripts/progress.ts, assess.ts
  styles/base.css
docs/site-architecture.md     이 문서
.claude/skills/anatomy/       Anatomy 스킬 (Claude가 그림을 만들 때 쓰는 지침·도구, MIT)
```

## 3. URL 규칙

- 과목: `/subjects/<과목id>/`
- 강의: `/subjects/<과목id>/<NN>/` (NN = 두 자리 강의 번호). 강의 번호는 바뀌지 않는 영구 주소입니다.
- 없는 주소는 404 페이지(홈으로 안내)로 갑니다.

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
subject: operating-systems
order: 1                # 강의 번호 = URL
unit: process           # 과목 units의 id
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

엔진이 제공: 처음/이전/다음/자동 재생(속도 3단계)/타임라인/키보드 ←→, 화면 밖이면 재생 정지. 조작 바는 단계 설명 바로 아래에 두고(화면에 따라다니지 않음), 예측 전에는 숨긴다.

새 실습 = `src/labs/<과목>/<이름>.ts` (로직) + `src/components/labs/<이름>Lab.astro` (래퍼).

## 6-1. 원리 그림 (Anatomy)

`.claude/skills/anatomy`의 스킬로 "개념을 실제 기계로 만든" 아이소메트릭 그림을 만듭니다. 실습 엔진과 역할이 다릅니다.

| | 원리 그림 (Anatomy) | 단계 실습 (Step Lab) |
|---|---|---|
| 목적 | 전체 흐름을 한눈에 직관으로 (①·④층) | 예측하고 한 단계씩 따라가며 검증 |
| 위치 | ④ 내부 동작 첫머리 | ⑨ 실습 |

규칙:
- 그림의 숫자·움직임은 실습과 **같은 모델**(실습의 `build`가 쓰는 순수 함수)에서 나온다.
- 스킬 크기 기준: Figure(부품 40~80, 1시간 이내)를 기본으로 한다. Hero 이상은 미리 시간을 알리고 승인받는다.
- SVG는 Astro 컴포넌트 frontmatter에서 `geometry.mjs`로 빌드 시 생성하고, `live.ts`는 transform·글자만 바꾼다 (프레임마다 다시 그리지 않음).
- 그림 판은 `class="iso"`, 사이트 테마를 따라 `data-theme`를 바꾼다. 강조(lit)는 한 번에 한 부품만.
- 검증: 390px·데스크톱, 라이트·다크, 여러 단계에서 캡처하고 4배 확대로 이음새·그리는 순서를 확인한다.
- 이름 붙이기: `Fig <강의>-<번호>`.

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
| @fontsource/ibm-plex-sans-kr | 5.3.0 | 본문·제목 서체 (400, 700) | 한글은 unicode-range로 쪼개져 쓰인 글자만 내려받음 | OFL-1.1 | 전체 |
| @fontsource/ibm-plex-mono | 5.3.0 | 코드 서체 (400, 600) | 라틴 약 20KB/굵기 | OFL-1.1 | 코드 |
| Anatomy kit (`src/figures/kit`) | 1482e84 | 아이소메트릭 원리 그림 | SVG는 빌드 시 생성, 런타임 JS는 그림당 수 KB | MIT | (현재 사용 강의 없음) |

## 8. 학습 데이터 (localStorage) — 형식 변경은 사전 승인 필요

| 키 | 값 | 비고 |
|---|---|---|
| `cs-progress:<과목id>` | `{"<번호-1>": true}` | 과목별 진도 |
| `cs-last-course` / `cs-last-lesson` | 과목id / 강의 번호 | 이어서 학습하기 |
| `cs-theme` | `light` / `dark` | 테마 |
| `cs-explain:<경로>:<id>` | 문자열 | "내 말로 설명하기" 답안 |

기기 간 동기화는 없습니다(브라우저 저장).

## 9. 디자인·품질 기준

**콘셉트: 공학 도면집.** 강의 한 편 = 도면 한 장. 첫 화면·과목·강의 머리는 모눈 위의 도면과 표제란(제목·과목·단원·번호), 과목 목록은 도면 목록표.

| 토큰 | 라이트 | 다크(청사진) | 쓰임 |
|---|---|---|---|
| `--paper` | #F2F4F1 | #0F1B2A | 바탕 |
| `--ink` | #172235 | #E4ECF2 | 글자, 굵은 테두리(1.5px) |
| `--graphite` | #586273 | #93A4B8 | 보조 글자 |
| `--rule` | #CDD5CE | #263A52 | 괘선·구분선 |
| `--blueprint` | #1F6F8B | #6FC3DF | 링크, 현재 위치, 진도 |
| `--marker` | #F2E863 | #E9DD5C | 지금 보는 것(현재 강의, 실행 중인 줄)에만 |

- 서체: IBM Plex Sans KR(본문·제목, 한 가족), IBM Plex Mono(코드만). 작은 데이터 라벨에 고정폭 서체를 쓰지 않는다.
- 쓰지 않는 것: 대문자 영문 머리말, 버튼 끝 "→", 장식용 이모지, 모든 것을 같은 둥근 카드로 자르기, 그림자 남발.
- 모눈 바탕(`.grid-paper`)은 도면 머리에만 쓴다. 본문은 깨끗한 바탕.
- 본문 문단은 `--measure`(약 40em)로 줄 길이를 제한하고, 실습·표·코드는 강의 폭 전체를 쓴다.
- 디자인 토큰은 `src/styles/base.css`의 CSS 변수만 사용 (라이트/다크 자동 대응).
- 360~430px 우선 → 768px → 1024px(목차 사이드바 고정). 터치 대상 44px 이상, 입력 16px 이상.
- 가로 스크롤 금지(코드 블록 내부 스크롤은 허용). `prefers-reduced-motion` 존중.
- 767px 이하: 본문 15.5px, 코드 12.5px, 실습 14px. 강의 본문 표는 LessonLayout 스크립트가 열 제목(data-label)을 붙여 "행 = 카드"로 보여 준다(`table.rtable`).

## 10. 작업 순서 (지침 7번)

변경 계획 → `npm run build` + 로컬 미리보기(모바일·데스크톱, 콘솔 오류 0, 실습 조작 확인) → 승인 → 커밋·푸시 → Actions 성공 확인 → 배포 URL에서 실제 동작 확인 → 보고.

## 11. 변경 기록

- 2026-11-23 단일 HTML → Astro 전환, React Native 26강 이전
- 2026-11-24 4·19·20강 새 기준 재작성, Anatomy 그림(Fig 4-1) 추가
- 2026-11-25 사용자 요청으로 React Native 과목 전체 제거(강의·실습·그림·이전 강의 데이터). 필요하면 git 커밋 `97e9bc5`에서 되살릴 수 있음. 공통 실습 엔진·평가 컴포넌트·Anatomy 키트는 유지.
- 2026-11-25 "공학 도면집" 디자인 적용(커밋 `8c734b8`).
