/**
 * 객체 다이어그램 — 스택의 이름, 힙의 인스턴스, 공유되는 객체(프로토타입·배열·함수)를
 * 상자와 화살표로 그린다. DOM을 쓰지 않고 SVG 문자열을 돌려주므로
 * 빌드 시(Astro 그림 컴포넌트)와 실행 중(실습) 모두 같은 그림을 쓴다.
 */
export type Row = { k: string; v?: string; ref?: string; hl?: boolean; bad?: boolean };
export type DNode = {
  id: string;
  col: 0 | 1 | 2;
  title: string;
  kind: 'stack' | 'frame' | 'inst' | 'proto' | 'arr' | 'fn';
  rows: Row[];
  proto?: string;
  hl?: boolean;
};
export type Diagram = { nodes: DNode[]; hlProto?: string[]; heads?: [string, string, string] };

const COL_X = [0, 116, 236];
const COL_W = [108, 106, 122];
const TOP = 30, HEAD = 25, ROW = 22, GAP = 14, W = 376;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1) + '…' : s);

export function renderDiagram(d: Diagram, label = '객체 다이어그램'): string {
  const pos = new Map<string, { x: number; y: number; w: number; h: number; col: number }>();
  const colY = [TOP, TOP, TOP];
  for (const n of d.nodes) {
    const h = HEAD + Math.max(1, n.rows.length) * ROW + 6;
    pos.set(n.id, { x: COL_X[n.col], y: colY[n.col], w: COL_W[n.col], h, col: n.col });
    colY[n.col] += h + GAP;
  }
  const height = Math.max(...colY) + 4;
  const heads = d.heads ?? ['스택', '힙: 인스턴스', '힙: 공유되는 것'];
  const out: string[] = [];
  out.push(`<svg class="od" viewBox="0 0 ${W} ${height}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">`);
  heads.forEach((t, i) => out.push(`<text class="od-head" x="${COL_X[i] + 2}" y="14">${esc(t)}</text>`));

  const edges: string[] = [];
  type Box = { x: number; y: number; w: number; h: number; col: number };
  const tipR = (x: number, y: number) => `M${x - 8},${y - 4} L${x},${y} L${x - 8},${y + 4} Z`;
  const tipL = (x: number, y: number) => `M${x + 8},${y - 4} L${x},${y} L${x + 8},${y + 4} Z`;
  const arrow = (src: Box, y1: number, t: Box, cls: string) => {
    const ty = t.y + 12;
    let path: string, tip: string;
    if (t.col > src.col) {
      const x1 = src.x + src.w - 10, x2 = t.x, dx = Math.max(24, (x2 - x1) * 0.5);
      path = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${ty} ${x2 - 7},${ty}`; tip = tipR(x2, ty);
    } else if (t.col < src.col) {
      const x1 = src.x, x2 = t.x + t.w;
      path = `M${x1},${y1} C${x1 - 22},${y1} ${x2 + 22},${ty} ${x2 + 7},${ty}`; tip = tipL(x2, ty);
    } else {
      const x1 = src.x + src.w, x2 = t.x + t.w;
      path = `M${x1},${y1} C${x1 + 20},${y1} ${x2 + 20},${ty} ${x2 + 7},${ty}`; tip = tipL(x2, ty);
    }
    edges.push(`<path class="od-edge ${cls}" d="${path}"/><path class="od-tip ${cls}" d="${tip}"/>`);
  };

  for (const n of d.nodes) {
    const p = pos.get(n.id)!;
    out.push(`<g class="od-node k-${n.kind}${n.hl ? ' hl' : ''}" data-obj="${esc(n.id)}">`);
    out.push(`<rect class="od-box" x="${p.x + 0.75}" y="${p.y + 0.75}" width="${p.w - 1.5}" height="${p.h - 1.5}" rx="3"/>`);
    out.push(`<line class="od-rule" x1="${p.x}" y1="${p.y + HEAD}" x2="${p.x + p.w}" y2="${p.y + HEAD}"/>`);
    out.push(`<text class="od-title" x="${p.x + 8}" y="${p.y + 17}">${esc(clip(n.title, Math.floor((p.w - 12) / 6.4)))}</text>`);
    if (!n.rows.length) out.push(`<text class="od-empty" x="${p.x + 8}" y="${p.y + HEAD + 15}">비어 있음</text>`);
    n.rows.forEach((r, i) => {
      const ry = p.y + HEAD + i * ROW;
      if (r.hl) out.push(`<rect class="od-rowhl" x="${p.x + 2}" y="${ry + 2}" width="${p.w - 4}" height="${ROW - 2}"/>`);
      out.push(`<text class="od-k" x="${p.x + 8}" y="${ry + 16}">${esc(r.k)}</text>`);
      if (r.ref) {
        out.push(`<circle class="od-dot${r.hl ? ' hl' : ''}" cx="${p.x + p.w - 10}" cy="${ry + 11}" r="3.5"/>`);
        const t = pos.get(r.ref);
        if (t) arrow(p, ry + 11, t, r.hl ? 'hl' : '');
      } else if (r.v !== undefined) {
        const room = Math.floor((p.w - 14) / 7.2) - r.k.length;
        out.push(`<text class="od-v${r.bad ? ' bad' : ''}" x="${p.x + p.w - 8}" y="${ry + 16}" text-anchor="end">${esc(clip(r.v, Math.max(4, room)))}</text>`);
      }
    });
    out.push('</g>');
    if (n.proto) {
      const t = pos.get(n.proto);
      if (t) {
        const on = d.hlProto?.includes(n.id);
        const x1 = p.x + p.w, y1 = p.y + 12;
        edges.push(`<path class="od-proto${on ? ' hl' : ''}" d="M${x1},${y1} C${x1 + 30},${y1} ${t.x - 30},${t.y + 6} ${t.x - 7},${t.y + 6}"/>` +
          `<path class="od-tip proto${on ? ' hl' : ''}" d="M${t.x - 8},${t.y + 2} L${t.x},${t.y + 6} L${t.x - 8},${t.y + 10} Z"/>`);
      }
    }
  }
  out.push(...edges, '</svg>');
  return out.join('');
}

export const legend = '<p class="od-legend"><span class="sw ref"></span>참조(가리킴) <span class="sw proto"></span>프로토타입 연결 <span class="sw hl"></span>이번 단계</p>';
