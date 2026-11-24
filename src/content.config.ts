import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/** 과목: src/content/subjects/<과목id>.json */
const subjects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/subjects' }),
  schema: z.object({
    title: z.string(),
    icon: z.string(),
    area: z.string(),           // 세부 분야 (예: 모바일, 운영체제)
    field: z.string(),          // 큰 분야 (예: 프로그래밍, 컴퓨터 시스템)
    order: z.number(),
    description: z.string(),
    progressKey: z.string().optional(), // 기본값: cs-progress:<과목id>
    units: z.array(z.object({ id: z.string(), title: z.string() })),
  }),
});

/** 새 기준 강의: src/content/lessons/<과목id>/<NN>-<slug>.mdx */
const lessons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: z.object({
    subject: z.string(),
    order: z.number(),
    unit: z.string(),
    title: z.string(),
    summary: z.string(),
    goals: z.array(z.string()),
    prerequisites: z.array(z.string()).default([]),
    minutes: z.number().optional(),
    updated: z.coerce.date(),
  }),
});

/**
 * 이전 형식 강의(보존용): 사이트를 Astro로 옮기기 전의 React Native 1~26강 원본 데이터.
 * 같은 과목·번호의 MDX 강의가 생기면 MDX가 대표 강의가 되고, 이 데이터는 /<번호>/legacy/ 로 남는다.
 * 새 강의는 여기에 추가하지 않는다.
 */
const legacy = defineCollection({
  loader: file('./src/content/legacy/react-native.json'),
  schema: z.object({
    subject: z.string(),
    order: z.number(),
    unit: z.string(),
    t: z.string(), i: z.string(), w: z.string(), h: z.string(), c: z.string(),
    lab: z.string(), task: z.string(), q: z.string(), a: z.array(z.string()), ok: z.number(), reason: z.string(),
    ext: z.object({
      goal: z.string(), concept: z.string(), steps: z.array(z.string()), notes: z.array(z.string()),
      pitfall: z.string(), use: z.string(), challenge: z.string(), hint: z.string(), answer: z.string(),
    }),
  }),
});

export const collections = { subjects, lessons, legacy };
