import { getCollection, type CollectionEntry } from 'astro:content';

export type LessonItem = {
  subject: string;
  order: number;
  slug: string;          // URL 조각: 두 자리 번호 (예: "04")
  url: string;           // /subjects/<과목>/<번호>/
  title: string;
  summary: string;
  unit: string;
  kind: 'deep' | 'legacy';
  hasLegacy: boolean;    // 새 기준으로 재작성되어 이전 버전이 따로 있는가
  mdx?: CollectionEntry<'lessons'>;
  legacy?: CollectionEntry<'legacy'>;
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
  const [subjects, mdx, legacy] = await Promise.all([
    getCollection('subjects'),
    getCollection('lessons'),
    getCollection('legacy'),
  ]);

  return subjects
    .sort((a, b) => a.data.order - b.data.order)
    .map((s) => {
      const byOrder = new Map<number, LessonItem>();
      for (const l of legacy.filter((x) => x.data.subject === s.id)) {
        byOrder.set(l.data.order, {
          subject: s.id, order: l.data.order, slug: pad(l.data.order), url: lessonUrl(s.id, l.data.order),
          title: l.data.t, summary: l.data.i, unit: l.data.unit, kind: 'legacy', hasLegacy: false, legacy: l,
        });
      }
      for (const m of mdx.filter((x) => x.data.subject === s.id)) {
        const prev = byOrder.get(m.data.order);
        byOrder.set(m.data.order, {
          subject: s.id, order: m.data.order, slug: pad(m.data.order), url: lessonUrl(s.id, m.data.order),
          title: m.data.title, summary: m.data.summary, unit: m.data.unit, kind: 'deep',
          hasLegacy: Boolean(prev?.legacy), mdx: m, legacy: prev?.legacy,
        });
      }
      const lessons = [...byOrder.values()].sort((a, b) => a.order - b.order);
      for (const l of lessons) {
        if (!s.data.units.some((u) => u.id === l.unit)) {
          throw new Error(`${s.id} ${l.order}강의 unit "${l.unit}"이 과목 units에 없습니다.`);
        }
      }
      return { id: s.id, data: s.data, url: `/subjects/${s.id}/`, progressKey: progressKeyOf(s.id, s.data.progressKey), lessons };
    });
}
