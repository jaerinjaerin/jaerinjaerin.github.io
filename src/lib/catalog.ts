import { getCollection, type CollectionEntry } from 'astro:content';

export type LessonItem = {
  subject: string;
  order: number;
  slug: string;          // URL 조각: 두 자리 번호 (예: "04")
  url: string;           // /subjects/<과목>/<번호>/
  title: string;
  summary: string;
  unit: string;
  mdx: CollectionEntry<'lessons'>;
};

export type SubjectItem = {
  id: string;
  data: CollectionEntry<'subjects'>['data'];
  url: string;
  progressKey: string;
  lessons: LessonItem[];
};

export const pad = (n: number) => String(n).padStart(2, '0');
export const lessonUrl = (subject: string, order: number) => `/subjects/${subject}/${pad(order)}/`;
export const progressKeyOf = (id: string, explicit?: string) => explicit ?? `cs-progress:${id}`;

export async function getCatalog(): Promise<SubjectItem[]> {
  const [subjects, mdx] = await Promise.all([getCollection('subjects'), getCollection('lessons')]);

  return subjects
    .sort((a, b) => a.data.order - b.data.order)
    .map((s) => {
      const lessons = mdx
        .filter((m) => m.data.subject === s.id)
        .map((m) => ({
          subject: s.id, order: m.data.order, slug: pad(m.data.order), url: lessonUrl(s.id, m.data.order),
          title: m.data.title, summary: m.data.summary, unit: m.data.unit, mdx: m,
        }))
        .sort((a, b) => a.order - b.order);
      const seen = new Set<number>();
      for (const l of lessons) {
        if (seen.has(l.order)) throw new Error(`${s.id} 과목에 ${l.order}번 강의가 두 개 있습니다.`);
        seen.add(l.order);
        if (!s.data.units.some((u) => u.id === l.unit)) {
          throw new Error(`${s.id} ${l.order}강의 unit "${l.unit}"이 과목 units에 없습니다.`);
        }
      }
      return { id: s.id, data: s.data, url: `/subjects/${s.id}/`, progressKey: progressKeyOf(s.id, s.data.progressKey), lessons };
    });
}
