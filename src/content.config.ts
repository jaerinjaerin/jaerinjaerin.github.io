import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
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


export const collections = { subjects, lessons };
