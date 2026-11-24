/**
 * 실습: FlatList 가상화 창(window)과 빈칸(blank area) (React Native 20강)
 * 교육용 시뮬레이션 — VirtualizedList의 창 계산을 단순화했다.
 *   - 화면에 동시에 보이는 행 수 VR = 8 (행 높이 80, 뷰포트 640 가정)
 *   - initialNumToRender = 10, maxToRenderPerBatch = 10 (공식 기본값)
 *   - windowSize = W 이면 창 = 보이는 화면 1개 + 위아래로 (W−1)/2 화면씩
 *   - 한 배치는 updateCellsBatchingPeriod(기본 50ms)마다 하나씩 처리된다고 본다
 * 실제 구현은 스크롤 속도·측정값·우선순위에 따라 더 복잡하다.
 */
import { mountStepLab, h, type Step } from '../engine/step-lab';

const VR = 8;
const INITIAL = 10;
const BATCH = 10;

type Cell = 0 | 1;   // 0: 없음, 1: 마운트
type S = {
  n: number;
  mounted: Set<number>;
  top: number;          // 화면 맨 위 행
  windowFrom: number;
  windowTo: number;     // 포함
  ms: number;           // 경과 시간(배치 단위 가정)
  focus?: string;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function windowOf(top: number, n: number, ws: number) {
  const half = Math.floor((ws - 1) / 2) * VR;
  return [clamp(top - half, 0, n - 1), clamp(top + VR - 1 + half, 0, n - 1)] as const;
}

export function simulateWindow(variant: 'flatlist' | 'scrollview' | 'tiny', n: number, jump: number): Step<S>[] {
  const ws = variant === 'tiny' ? 1 : 21;
  const steps: Step<S>[] = [];
  let st: S = { n, mounted: new Set(), top: 0, windowFrom: 0, windowTo: 0, ms: 0 };
  const push = (s: Omit<Step<S>, 'state'>, patch: Partial<S>) => { st = { ...st, ...patch, mounted: new Set(patch.mounted ?? st.mounted) }; steps.push({ ...s, code: 'main', state: st }); };

  if (variant === 'scrollview') {
    push({ line: 4, phase: '첫 렌더', title: `${n}개 행을 한꺼번에 생성`,
      detail: `ScrollView + map은 보이는 ${VR}개만이 아니라 ${n}개 전부를 즉시 만들고 측정합니다. 행 하나를 만드는 비용 × ${n}이 첫 화면이 뜨기 전에 모두 지불됩니다.`,
      tone: n > 200 ? 'warn' : 'normal' }, { mounted: new Set(Array.from({ length: n }, (_, i) => i)), windowFrom: 0, windowTo: n - 1, focus: 'mounted' });
    const top = clamp(jump, 0, Math.max(0, n - VR));
    push({ line: 4, phase: '스크롤', title: `${top}번 행으로 빠르게 스크롤 → 빈칸 없음`,
      detail: `모든 행이 이미 있으니 빈칸은 생기지 않습니다. 대신 마운트된 ${n}개가 계속 메모리를 차지합니다. 항목이 수천 개면 첫 렌더와 메모리가 문제가 됩니다.`,
      tone: 'ok' }, { top });
    return steps;
  }

  // 1) 첫 렌더: initialNumToRender
  push({ line: 6, phase: '첫 렌더', title: `처음 ${INITIAL}개만 생성 (initialNumToRender)`,
    detail: `FlatList는 데이터 ${n}개를 모두 갖고 있지만, 첫 화면에는 ${INITIAL}개만 renderItem으로 만듭니다. 화면(${VR}행)을 덮기에 충분해 첫 화면이 빨리 뜹니다.`,
  }, { mounted: new Set(Array.from({ length: Math.min(INITIAL, n) }, (_, i) => i)), focus: 'mounted' });

  // 2) 창 채우기 (배치)
  const fill = (top: number, phase: string) => {
    const [a, b] = windowOf(top, n, ws);
    let mounted = new Set([...st.mounted].filter((i) => i >= a && i <= b));
    const removed = st.mounted.size - mounted.size;
    // 보이는 행을 먼저, 그다음 가까운 순서로
    const order: number[] = [];
    for (let i = top; i < top + VR && i <= b; i++) order.push(i);
    for (let d = 1; order.length < b - a + 1; d++) {
      if (top + VR - 1 + d <= b) order.push(top + VR - 1 + d);
      if (top - d >= a) order.push(top - d);
      if (top + VR - 1 + d > b && top - d < a) break;
    }
    const todo = order.filter((i) => !mounted.has(i));
    if (removed > 0) {
      push({ line: 7, phase, title: `창 밖 ${removed}개 해제(언마운트)`,
        detail: `창(${a}~${b}번) 밖으로 나간 행은 언마운트됩니다. 그 행 안의 지역 State도 함께 사라집니다.`, tone: 'warn' },
      { mounted, windowFrom: a, windowTo: b, focus: 'mounted' });
    }
    let batches = 0;
    const totalBatches = Math.ceil(todo.length / BATCH);
    while (todo.length) {
      const chunk = todo.splice(0, BATCH);
      chunk.forEach((i) => mounted.add(i));
      batches++;
      if (batches <= 3 || !todo.length) {
        push({ line: 7, phase, title: `배치 ${batches}/${totalBatches}: ${chunk.length}개 생성 (maxToRenderPerBatch)`,
          detail: !todo.length
            ? `창(${a}~${b}번, 약 ${b - a + 1}행)이 다 찼습니다. windowSize ${ws}이면 보이는 화면 1개${ws > 1 ? ` + 위아래 ${(ws - 1) / 2}화면씩` : '만'} 유지합니다.`
            : `한 번에 최대 ${BATCH}개씩, 배치 사이에는 JS가 쉬면서 터치 같은 다른 일을 처리합니다(기본 간격 50ms).`,
        }, { mounted: new Set(mounted), windowFrom: a, windowTo: b, ms: st.ms + 50, focus: 'mounted' });
      } else {
        st = { ...st, mounted: new Set(mounted), ms: st.ms + 50 };
      }
    }
    if (totalBatches === 0) push({ line: 7, phase, title: '창이 이미 차 있음', detail: '새로 만들 행이 없습니다.' }, { windowFrom: a, windowTo: b });
  };
  fill(0, '창 채우기');

  // 3) 빠른 스크롤
  const top = clamp(jump, 0, Math.max(0, n - VR));
  const visible = Array.from({ length: Math.min(VR, n - top) }, (_, i) => top + i);
  const blanks = visible.filter((i) => !st.mounted.has(i)).length;
  push({ line: 4, phase: '빠른 스크롤', title: blanks ? `${top}번 행으로 이동 → 빈칸 ${blanks}행!` : `${top}번 행으로 이동 → 이미 만들어져 있음`,
    detail: blanks
      ? `스크롤은 네이티브에서 즉시 움직이지만, 새 행을 만드는 JS는 배치 단위로 따라옵니다. 창 밖으로 뛰어넘었기 때문에 보이는 ${VR}행 중 ${blanks}행이 아직 없어 빈칸으로 보입니다.`
      : `창 안쪽이라 이미 만들어진 행이 보입니다. 큰 windowSize의 장점입니다(대신 메모리를 더 씀).`,
    tone: blanks ? 'error' : 'ok' }, { top, focus: 'blank' });
  fill(top, '창 다시 채우기');
  return steps;
}

export function mountedAfter(variant: 'flatlist' | 'scrollview' | 'tiny', n: number, jump: number) {
  const s = simulateWindow(variant, n, jump);
  return s[s.length - 1].state.mounted.size;
}

function renderState(host: HTMLElement, step: Step<S>) {
  const s = step.state;
  const show = Math.min(s.n, 240);
  const grid = h('div', { class: 'sv-vw-grid', 'aria-label': `행 ${show}개 상태` });
  for (let i = 0; i < show; i++) {
    const visible = i >= s.top && i < s.top + VR;
    const m = s.mounted.has(i);
    const cls = visible ? (m ? 'vis' : 'blank') : m ? 'on' : 'off';
    grid.append(h('span', { class: 'sv-vw-cell ' + cls, title: `${i}번` }));
  }
  const blanks = Array.from({ length: VR }, (_, k) => s.top + k).filter((i) => i < s.n && !s.mounted.has(i)).length;
  host.append(
    h('div', { class: 'sv-box' },
      h('div', { class: 'sv-label' }, h('span', { text: `🧱 행 ${s.n}개${s.n > show ? ` (앞 ${show}개만 표시)` : ''}` }), h('span', { text: `창 ${s.windowFrom}~${s.windowTo}` })),
      grid,
      h('div', { class: 'sv-vw-legend small' },
        h('span', {}, h('i', { class: 'sv-vw-cell vis' }), '화면에 보임'),
        h('span', {}, h('i', { class: 'sv-vw-cell on' }), '마운트됨'),
        h('span', {}, h('i', { class: 'sv-vw-cell off' }), '없음'),
        h('span', {}, h('i', { class: 'sv-vw-cell blank' }), '빈칸')),
    ),
    h('div', { class: 'sv-sv-wrap' },
      h('div', { class: 'sv-box', 'data-flash': String(s.focus === 'mounted') }, h('div', { class: 'sv-label' }, h('span', { text: '마운트된 행' })), h('div', { class: 'sv-big', text: String(s.mounted.size) })),
      h('div', { class: 'sv-box', 'data-flash': String(s.focus === 'blank') }, h('div', { class: 'sv-label' }, h('span', { text: '빈칸(보이는데 없음)' })), h('div', { class: 'sv-big', text: String(blanks) })),
    ),
  );
}

const CODE: Record<string, string> = {
  flatlist: [
    'export default function Feed({ posts }) {',
    '  return (',
    '    <FlatList',
    '      data={posts}                      // 전체 데이터',
    '      keyExtractor={(p) => p.id}',
    '      initialNumToRender={10}           // 기본값',
    '      windowSize={21}                   // 기본값',
    '      renderItem={({ item }) => <Post post={item} />}',
    '    />',
    '  );',
    '}',
  ].join('\n'),
  tiny: [
    'export default function Feed({ posts }) {',
    '  return (',
    '    <FlatList',
    '      data={posts}',
    '      keyExtractor={(p) => p.id}',
    '      initialNumToRender={10}',
    '      windowSize={1}                    // 🐞 메모리 아끼려고 최소로',
    '      renderItem={({ item }) => <Post post={item} />}',
    '    />',
    '  );',
    '}',
  ].join('\n'),
  scrollview: [
    'export default function Feed({ posts }) {',
    '  return (',
    '    <ScrollView>',
    '      {posts.map((p) => <Post key={p.id} post={p} />)}',
    '    </ScrollView>',
    '  );',
    '}',
  ].join('\n'),
};

export function mountVirtualWindowLab(root: HTMLElement) {
  let n = 200;
  let jump = 40;
  mountStepLab<S>(root, {
    title: 'FlatList는 몇 개의 행을 실제로 만들까?',
    mode: 'simulation',
    modeNote: 'VirtualizedList의 창 계산을 단순화한 교육용 모델입니다. 기본값(initialNumToRender 10, maxToRenderPerBatch 10, windowSize 21)은 React Native 공식 문서 기준이고, 화면에 8행이 보인다고 가정합니다.',
    variants: [
      { id: 'flatlist', label: 'FlatList (기본값)', note: '보이는 곳 주변의 창만 만들고, 창 밖은 해제합니다.' },
      { id: 'tiny', label: 'windowSize={1}', buggy: true, note: '흔한 실수: 메모리를 아끼려고 windowSize를 최소로. 빠르게 스크롤하면 어떻게 될까요?' },
      { id: 'scrollview', label: 'ScrollView + map', note: '비교용: 모든 행을 한꺼번에 만듭니다.' },
    ],
    controls(host, change) {
      const mk = (label: string, id: string, min: number, max: number, stepv: number, get: () => number, set: (v: number) => void) => {
        const out = h('output', { text: String(get()) });
        const r = h('input', { type: 'range', id, min: String(min), max: String(max), step: String(stepv), value: String(get()) });
        r.addEventListener('input', () => { set(Number(r.value)); out.textContent = r.value; change(); });
        return h('div', { class: 'sl-field' }, h('label', { for: id }, label + ': ', out), r);
      };
      host.append(
        mk('데이터 개수', 'vw-n', 20, 2000, 20, () => n, (v) => (n = v)),
        mk('빠른 스크롤로 이동할 행', 'vw-jump', 0, 200, 5, () => jump, (v) => (jump = v)),
      );
    },
    codeBlocks: (v) => [{ id: 'main', title: v === 'tiny' ? '🐞 Feed.js' : 'Feed.js', code: CODE[v] }],
    build: (v) => simulateWindow(v as 'flatlist', n, jump),
    renderState,
    predict: (v) => {
      const steps = simulateWindow(v as 'flatlist', n, jump);
      const jumpIdx = steps.findIndex((s) => s.phase === '빠른 스크롤' || s.phase === '스크롤');
      const blank = jumpIdx >= 0 && steps[jumpIdx].tone === 'error' ? 'yes' : 'no';
      return {
        prompt: `데이터 ${n}개에서 ${jump}번 행으로 빠르게 스크롤하면, 그 순간 빈칸이 보일까요?`,
        kind: 'choice',
        choices: [{ value: 'yes', label: '보인다 (아직 안 만든 행이 있다)' }, { value: 'no', label: '안 보인다 (이미 만들어져 있다)' }],
        answer: blank,
        explain: (_g, ok) => (ok ? '정확합니다. ' : '') + (v === 'scrollview'
          ? 'ScrollView는 모든 행을 미리 만들어 두어서 빈칸이 없습니다. 대가는 첫 렌더 시간과 메모리입니다.'
          : blank === 'yes'
            ? '목표 행이 처음 채운 창 바깥이라, 스크롤 직후에는 행을 만들 시간이 없어 빈칸이 보입니다. 창이 작을수록(windowSize↓) 자주 생깁니다.'
            : `기본 windowSize 21이면 아래로 10화면(약 ${10 * VR}행)까지 미리 만들어 두므로 그 안으로의 이동은 빈칸이 없습니다.`),
      };
    },
  });
}
