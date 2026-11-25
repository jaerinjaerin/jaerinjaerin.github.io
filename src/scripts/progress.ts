/**
 * 학습 진도 저장소 (localStorage)
 * - 과목별 키: subject.progressKey (기본값 'cs-progress:<과목id>')
 * - 값 형식(기존과 동일): { "<강의번호-1>": true }
 * - 마지막 학습 위치: 'cs-last-course' = 과목 id, 'cs-last-lesson' = 강의 번호(1부터)
 */
export type Done = Record<string, boolean>;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function getDone(progressKey: string): Done {
  const d = read<Done>(progressKey, {});
  return d && typeof d === 'object' ? d : {};
}

export function isDone(progressKey: string, order: number): boolean {
  return Boolean(getDone(progressKey)[String(order - 1)]);
}

export function setDone(progressKey: string, order: number, value: boolean) {
  const d = getDone(progressKey);
  if (value) d[String(order - 1)] = true; else delete d[String(order - 1)];
  try { localStorage.setItem(progressKey, JSON.stringify(d)); } catch {}
}

export function countDone(progressKey: string, orders: number[]): number {
  const d = getDone(progressKey);
  return orders.filter((o) => d[String(o - 1)]).length;
}

export function setLast(subject: string, order: number) {
  try {
    localStorage.setItem('cs-last-course', subject);
    localStorage.setItem('cs-last-lesson', String(order));
  } catch {}
}

export function getLast(): { subject: string | null; order: number | null } {
  try {
    const subject = localStorage.getItem('cs-last-course');
    const order = Number(localStorage.getItem('cs-last-lesson'));
    return { subject, order: Number.isFinite(order) && order > 0 ? order : null };
  } catch {
    return { subject: null, order: null };
  }
}
