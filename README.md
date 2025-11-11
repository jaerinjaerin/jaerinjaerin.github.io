# Jaerin's Blog

개발 학습 내용과 알고리즘 문제 풀이를 기록하는 기술 블로그입니다.

## Tech Stack

- **Framework**: Next.js 15 + React 19
- **Content**: Fumadocs + MDX
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 빌드

```bash
pnpm build
```

### 프로덕션 서버 실행

```bash
pnpm start
```

## Blog Content

블로그 포스트는 `/blog/content` 디렉토리에 MDX 형식으로 작성됩니다.

### 포스트 작성 예시

```mdx
---
title: '포스트 제목'
description: '포스트 설명'
date: 2025-01-05
tags: ['React', 'Next.js']
thumbnail: /thumbnails/image.png
---

import { Callout } from 'fumadocs-ui/components/callout';
import { Steps, Step } from 'fumadocs-ui/components/steps';

## 내용 작성
```

### 사용 가능한 컴포넌트

- `<Callout>`: 강조 박스 (type: "info" | "warn" | "error")
- `<Steps>` / `<Step>`: 단계별 가이드

## License

MIT
