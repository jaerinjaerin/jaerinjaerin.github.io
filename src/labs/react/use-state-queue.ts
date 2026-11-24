/**
 * 실습: useState 업데이트 큐와 렌더 스냅샷 (React Native 4강)
 * 교육용 시뮬레이션 — React의 실제 동작(이벤트 배칭, 업데이트 큐 처리, 렌더 스냅샷)을
 * 단순화한 모델이다. React 내부 구현(Fiber, 순환 연결 리스트 큐, lane 우선순위)은 생략했다.
 */
import { mountStepLab, h, type Step } from '../engine/step-lab';

type Op =
  | { kind: 'value'; expr: string; f: (snap: number) => number }   // setCount(count + 1)
  | { kind: 'fn'; expr: string; f: (prev: number) => number }      // setCount(c => c + 1)
  | { kind: 'log' };                                                // console.log(count)

type QItem = { kind: 'value' | 'fn'; label: string; value?: number; f?: (prev: number) => number; result?: number; done?: boolean; cur?: boolean };

type S = {
  render: number;          // 지금 화면을 만든 렌더 번호
  snapshot: number;        // 그 렌더의 count (핸들러가 기억하는 값)
  stored: number;          // React(Fiber)가 보관 중인 값
  queue: QItem[];
  acc: number | null;      // 큐 처리 중 누적값
  screen: number;
  logs: string[];
  scheduled: boolean;
  focus?: 'queue' | 'stored' | 'screen' | 'snapshot' | 'log';
};

export const PALETTE: { id: string; op: Op; code: string }[] = [
  { id: 'v1', op: { kind: 'value', expr: 'count + 1', f: (s) => s + 1 }, code: 'setCount(count + 1);' },
  { id: 'v5', op: { kind: 'value', expr: 'count + 5', f: (s) => s + 5 }, code: 'setCount(count + 5);' },
  { id: 'f1', op: { kind: 'fn', expr: 'c => c + 1', f: (p) => p + 1 }, code: 'setCount(c => c + 1);' },
  { id: 'f2', op: { kind: 'fn', expr: 'c => c * 2', f: (p) => p * 2 }, code: 'setCount(c => c * 2);' },
  { id: 'v42', op: { kind: 'value', expr: '42', f: () => 42 }, code: 'setCount(42);' },
  { id: 'log', op: { kind: 'log' }, code: 'console.log(count);' },
];
const P = Object.fromEntries(PALETTE.map((p) => [p.id, p]));

const PRESETS: Record<string, string[]> = {
  value3: ['v1', 'v1', 'v1'],
  fn3: ['f1', 'f1', 'f1'],
  mixed: ['v5', 'f1'],
  snapshot: ['v1', 'log'],
};

const REACT_CODE = [
  '// 다음 렌더에서 useState(0)이 하는 일 (의사 코드)',
  'let result = hook.memoizedState;     // 저장된 값에서 출발',
  'for (const update of hook.queue) {',
  "  result = typeof update === 'function'",
  '    ? update(result)                  // 함수: 직전 결과로 계산',
  '    : update;                         // 값: 그 값으로 교체',
  '}',
  'hook.memoizedState = result;',
  'return [result, setCount];           // 새 스냅샷',
].join('\n');

export function simulate(ids: string[], start: number, renderNo: number): Step<S>[] {
  const ops = ids.map((id) => P[id]);
  const steps: Step<S>[] = [];
  let st: S = { render: renderNo, snapshot: start, stored: start, queue: [], acc: null, screen: start, logs: [], scheduled: false };
  const push = (s: Omit<Step<S>, 'state'>, patch: Partial<S> = {}) => {
    st = { ...st, ...patch, queue: (patch.queue ?? st.queue).map((q) => ({ ...q })), logs: [...(patch.logs ?? st.logs)] };
    steps.push({ ...s, state: st });
  };

  push({
    code: 'handler', line: 1, phase: '이벤트 처리', title: '사용자가 버튼을 눌렀습니다',
    detail: `onPress가 handlePress를 실행합니다. 이 함수는 렌더 #${renderNo} 때 만들어졌으므로, 그 렌더의 count = ${start}을(를) 기억합니다(클로저). 이 값은 핸들러가 끝날 때까지 절대 바뀌지 않습니다.`,
  }, { focus: 'snapshot' });

  ops.forEach((p, i) => {
    const line = i + 2;
    if (p.op.kind === 'log') {
      push({
        code: 'handler', line, phase: '이벤트 처리', title: `console.log(count) → ${start}`,
        detail: st.queue.length
          ? `setCount를 이미 호출했지만 count는 여전히 ${start}입니다. setCount는 "다음 렌더에서 바꿔 달라"는 요청을 큐에 넣을 뿐, 지금 실행 중인 렌더의 변수 count를 바꾸지 않습니다.`
          : `아직 아무 업데이트도 요청하지 않았으므로 ${start}이 출력됩니다.`,
        tone: st.queue.length ? 'warn' : 'normal',
      }, { logs: [...st.logs, String(start)], focus: 'log' });
      return;
    }
    if (p.op.kind === 'value') {
      const v = p.op.f(start);
      const usesCount = p.op.expr.includes('count');
      push({
        code: 'handler', line, phase: '이벤트 처리', title: `setCount(${p.op.expr}) → 큐에 "값 ${v}" 추가`,
        detail: usesCount
          ? `괄호 안의 ${p.op.expr}이(가) 먼저 계산됩니다. 이 렌더의 count는 ${start}이므로 결과는 ${v}. React는 "다음 렌더에서 ${v}(으)로 바꿔라"라는 값 업데이트를 큐에 넣습니다. 화면은 아직 그대로입니다.`
          : `"다음 렌더에서 ${v}(으)로 바꿔라"라는 값 업데이트를 큐에 넣습니다. 이전 값과 상관없이 ${v}이(가) 됩니다.`,
        tone: usesCount && i > 0 && ops.slice(0, i).some((q) => q.op.kind !== 'log') ? 'warn' : 'normal',
      }, { queue: [...st.queue, { kind: 'value', label: `값 ${v}`, value: v }], scheduled: true, focus: 'queue' });
    } else {
      push({
        code: 'handler', line, phase: '이벤트 처리', title: `setCount(${p.op.expr}) → 큐에 "함수" 추가`,
        detail: `함수 ${p.op.expr} 자체가 큐에 들어갑니다. 지금은 실행되지 않습니다. 다음 렌더에서 React가 "직전까지 계산한 결과"를 c로 넘겨 실행합니다. 그래서 count 스냅샷(${start})에 묶이지 않습니다.`,
      }, { queue: [...st.queue, { kind: 'fn', label: p.op.expr, f: p.op.f }], scheduled: true, focus: 'queue' });
    }
  });

  const endLine = ops.length + 2;
  if (!st.queue.length) {
    push({ code: 'handler', line: endLine, phase: '이벤트 처리', title: '핸들러 종료 — 업데이트 요청 없음', detail: '큐가 비어 있으므로 React는 다시 렌더링하지 않습니다.', tone: 'ok' });
    return steps;
  }
  push({
    code: 'handler', line: endLine, phase: '배칭', title: '핸들러 종료 → 다시 렌더링 예약 (한 번만)',
    detail: `이벤트 핸들러 안에서 요청한 업데이트 ${st.queue.length}개를 모아(배칭) 렌더링을 한 번만 예약합니다. setCount를 여러 번 불러도 렌더는 여러 번 일어나지 않습니다.`,
  }, { focus: 'queue' });

  push({
    code: 'react', line: 2, phase: `렌더 #${renderNo + 1}`, title: 'Counter 함수가 다시 호출됩니다',
    detail: `컴포넌트 함수가 처음부터 다시 실행되고, useState(0)에 도달합니다. 초기값 0은 첫 렌더에서만 쓰이고, 지금은 React가 보관한 값 ${st.stored}에서 출발합니다.`,
  }, { acc: st.stored, focus: 'stored' });

  let acc = st.stored;
  st.queue.forEach((q, i) => {
    const before = acc;
    const queue = st.queue.map((x, j) => ({ ...x, cur: j === i, done: j < i }));
    if (q.kind === 'value') {
      acc = q.value!;
      queue[i].result = acc;
      push({
        code: 'react', line: 6, phase: `렌더 #${renderNo + 1} · 큐 처리 ${i + 1}/${st.queue.length}`, title: `값 업데이트: ${before} → ${acc}`,
        detail: `값 업데이트는 직전 결과(${before})를 무시하고 ${acc}(으)로 교체합니다.` + (before === acc && i > 0 ? ' 앞의 업데이트와 같은 값이라 결과가 그대로입니다. 고장 모드의 핵심이 바로 이것입니다.' : ''),
        tone: before === acc && i > 0 ? 'warn' : 'normal',
      }, { queue, acc, focus: 'queue' });
    } else {
      acc = q.f!(before);
      queue[i].result = acc;
      push({
        code: 'react', line: 5, phase: `렌더 #${renderNo + 1} · 큐 처리 ${i + 1}/${st.queue.length}`, title: `함수 업데이트: ${q.label}  (c = ${before}) → ${acc}`,
        detail: `React가 직전 결과 ${before}을(를) c로 넘겨 함수를 실행합니다. 결과 ${acc}이(가) 다음 업데이트의 입력이 됩니다.`,
      }, { queue, acc, focus: 'queue' });
    }
  });

  const same = Object.is(acc, start);
  push({
    code: 'react', line: 9, phase: `렌더 #${renderNo + 1}`, title: `새 스냅샷: count = ${acc}`,
    detail: same
      ? `결과가 이전 값(${start})과 같습니다(Object.is 비교). 이런 경우 React는 자식 렌더링이나 화면 반영을 건너뛸 수 있습니다.`
      : `useState가 [${acc}, setCount]를 반환합니다. 이번 렌더에서 만들어지는 모든 함수(새 handlePress 포함)는 count = ${acc}을(를) 기억합니다.`,
  }, { stored: acc, snapshot: acc, render: renderNo + 1, queue: [], acc: null, scheduled: false, focus: 'stored' });

  push({
    code: 'react', line: 9, phase: '커밋', title: `화면 반영: ${start} → ${acc}`,
    detail: same ? '바뀐 것이 없으므로 화면도 그대로입니다.' : `이전 렌더 결과와 비교해 바뀐 Text만 네이티브 뷰에 반영합니다. 이제야 화면에 ${acc}이(가) 보입니다.`,
    tone: 'ok',
  }, { screen: acc, focus: 'screen' });
  return steps;
}

export function finalCount(ids: string[], start: number): number {
  let acc = start;
  for (const id of ids) {
    const op = P[id].op;
    if (op.kind === 'value') acc = op.f(start);
    else if (op.kind === 'fn') acc = op.f(acc);
  }
  return acc;
}

function renderState(host: HTMLElement, step: Step<S>) {
  const s = step.state;
  const box = (label: string, key: S['focus'], ...children: (Node | string)[]) =>
    h('div', { class: 'sv-box', 'data-flash': String(s.focus === key) }, h('div', { class: 'sv-label' }, ...label.split('|').map((t) => h('span', { text: t }))), ...children);

  host.append(
    box(`📸 렌더 #${s.render}의 스냅샷|핸들러가 보는 값`, 'snapshot', h('div', { class: 'sv-big', text: `count = ${s.snapshot}` })),
    box('📥 업데이트 큐|' + (s.scheduled ? '렌더 예약됨' : '대기 없음'), 'queue',
      s.queue.length
        ? h('div', { class: 'sv-row' }, ...s.queue.map((q, i) => h('span', {
          class: 'sv-chip ' + (q.kind === 'value' ? 'val' : 'fn'), 'data-cur': q.cur ? 'true' : undefined, 'data-done': q.done ? 'true' : undefined,
        }, `${i + 1}. ${q.kind === 'value' ? q.label : 'ƒ ' + q.label}`, q.result !== undefined && q.cur ? ` → ${q.result}` : '')))
        : h('div', { class: 'sv-empty', text: '비어 있음' }),
      s.acc !== null ? h('div', { class: 'small', style: 'margin-top:6px' }, '처리 중 누적값: ', h('strong', { text: String(s.acc) })) : '',
    ),
    box('🗄️ React가 보관 중인 값|hook.memoizedState', 'stored', h('div', { class: 'sv-big', text: String(s.stored) })),
    box('📱 화면|사용자가 보는 것', 'screen', h('div', { class: 'sv-phone' }, h('div', { class: 'small', text: '좋아요' }), h('div', { class: 'sv-big', text: String(s.screen) }))),
  );
  if (s.logs.length || step.state.focus === 'log') {
    host.append(box('🖥️ 콘솔|console.log', 'log', h('div', { class: 'sv-log', text: s.logs.map((l) => '> ' + l).join('\n') || ' ' })));
  }
}

export function mountUseStateLab(root: HTMLElement) {
  let start = 0;
  let renderNo = 1;
  let custom: string[] = ['f1', 'v1'];
  const missions = [
    { id: 'm1', text: '미션 1: [직접 조립]에서 시작값 0일 때 버튼 한 번에 화면이 3이 되도록, 정확히 3줄로 만드세요.', check: (ids: string[], s: number, r: number) => s === 0 && ids.length === 3 && r === 3 },
    { id: 'm2', text: '미션 2: setCount(count + 5)를 반드시 포함해서, 시작값 0 → 결과 6이 되게 만드세요.', check: (ids: string[], s: number, r: number) => s === 0 && ids.includes('v5') && r === 6 },
    { id: 'm3', text: '미션 3: setCount(count + 1)를 두 번 이상 쓰면서도 시작값 0 → 결과 4가 되게 만드세요.', check: (ids: string[], s: number, r: number) => s === 0 && ids.filter((x) => x === 'v1').length >= 2 && r === 4 },
  ];
  const cleared = new Set<string>();
  const idsOf = (variant: string) => (variant === 'custom' ? custom : PRESETS[variant]);

  mountStepLab<S>(root, {
    title: 'setCount를 여러 번 부르면 무슨 일이 일어날까?',
    mode: 'simulation',
    modeNote: 'React의 이벤트 배칭·업데이트 큐·렌더 스냅샷을 단순화해 재현한 교육용 모델입니다. 실제 React 코드를 실행하지는 않습니다.',
    variants: [
      { id: 'value3', label: 'count + 1 × 3', buggy: true, note: '흔한 실수: 3을 올리려고 setCount(count + 1)를 세 번 호출. 예측해 보고 실행해 보세요.' },
      { id: 'fn3', label: 'c => c + 1 × 3', note: '올바른 방식: 이전 값에 기반한 업데이트는 함수형 업데이트로.' },
      { id: 'mixed', label: '값 + 함수 섞기', note: '값 업데이트와 함수 업데이트가 섞이면 큐가 순서대로 어떻게 처리될까요?' },
      { id: 'snapshot', label: '바로 console.log', buggy: true, note: '흔한 실수: setCount 직후 count를 읽으면 새 값이 나올 거라고 기대하기.' },
      { id: 'custom', label: '🧩 직접 조립', note: '아래에서 줄을 골라 핸들러를 직접 만들고, 미션을 풀어 보세요.' },
    ],
    controls(host, change, api) {
      const out = h('output', { text: String(start) });
      const range = h('input', { type: 'range', min: '0', max: '10', step: '1', value: String(start), id: 'us-start', 'aria-label': '버튼을 누르기 전 count' });
      range.addEventListener('input', () => { start = Number(range.value); renderNo = 1; out.textContent = range.value; change(); });
      host.append(h('div', { class: 'sl-field' }, h('label', { for: 'us-start' }, '누르기 전 count: ', out), range));

      // 직접 조립 UI (custom 변형일 때만 표시)
      const builder = h('div', { class: 'us-builder' });
      host.append(builder);
      const paintBuilder = () => {
        builder.hidden = api.variant() !== 'custom';
        builder.replaceChildren(
          h('div', { class: 'small', style: 'font-weight:800' }, `내 핸들러 (${custom.length}/4줄) — 줄을 누르면 삭제`),
          h('div', { class: 'sv-row' }, ...(custom.length ? custom.map((id, i) => {
            const b = h('button', { type: 'button', class: 'sv-chip us-line', 'aria-label': `${i + 1}번째 줄 삭제: ${P[id].code}`, text: `${i + 1}. ${P[id].code} ✕` });
            b.addEventListener('click', () => { custom = custom.filter((_, j) => j !== i); change(); paintBuilder(); });
            return b;
          }) : [h('span', { class: 'sv-empty', text: '아래에서 줄을 추가하세요' })])),
          h('div', { class: 'small', style: 'font-weight:800;margin-top:6px' }, '추가할 줄'),
          h('div', { class: 'sv-row' }, ...PALETTE.map((p) => {
            const b = h('button', { type: 'button', class: 'btn secondary us-add', text: '+ ' + p.code, disabled: custom.length >= 4 });
            b.addEventListener('click', () => { if (custom.length < 4) { custom = [...custom, p.id]; change(); paintBuilder(); } });
            return b;
          })),
        );
      };
      root.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('.sl-variant')) setTimeout(paintBuilder); });
      paintBuilder();
    },
    codeBlocks: (variant) => [
      { id: 'handler', title: '내 코드: handlePress', code: ['function handlePress() {', ...idsOf(variant).map((id) => '  ' + P[id].code), '}'].join('\n') },
      { id: 'react', title: 'React 내부 (단순화한 의사 코드)', code: REACT_CODE },
    ],
    build: (variant) => simulate(idsOf(variant), start, renderNo),
    renderState,
    predict: (variant) => {
      const ids = idsOf(variant);
      if (!ids.length) return null;
      const ans = finalCount(ids, start);
      const hasLog = ids.includes('log');
      if (hasLog) {
        return {
          prompt: `count가 ${start}일 때 버튼을 한 번 누르면, 콘솔에 처음 출력되는 값은?`,
          kind: 'number', answer: String(start),
          explain: (g, ok) => ok
            ? `맞습니다. setCount는 지금 실행 중인 렌더의 count를 바꾸지 않습니다. 콘솔에는 ${start}, 화면에는 다음 렌더 후 ${ans}이(가) 나옵니다.`
            : `${g}을(를) 예상했다면 "setCount가 즉시 count를 바꾼다"고 생각한 것입니다. count는 이 렌더의 스냅샷(상수)이라 ${start} 그대로입니다. 새 값 ${ans}은(는) 다음 렌더의 count에 들어 있습니다.`,
        };
      }
      return {
        prompt: `count가 ${start}일 때 버튼을 한 번 누르면, 화면의 count는 얼마가 될까요?`,
        kind: 'number', answer: String(ans),
        explain: (g, ok) => {
          if (ok) return `맞습니다. 큐를 순서대로 처리한 최종값이 ${ans}입니다.`;
          if (variant === 'value3') return `세 줄 모두 "count + 1"을 이 렌더의 count = ${start}으로 계산하므로 "값 ${start + 1}"이 세 번 들어갑니다. 같은 값으로 세 번 교체하니 결과는 ${ans}입니다.`;
          return `큐의 각 항목을 순서대로 적용해 보세요. 값 업데이트는 교체, 함수 업데이트는 직전 결과로 계산합니다. 최종값은 ${ans}입니다.`;
        },
      };
    },
    onFinish(last, variant, host, api) {
      const ids = idsOf(variant);
      const result = last.state.stored;
      const again = h('button', { type: 'button', class: 'btn secondary', text: `한 번 더 누르기 (렌더 #${last.state.render}, count = ${result}에서)` });
      again.addEventListener('click', () => {
        start = result; renderNo = last.state.render;
        const r = api.root.querySelector<HTMLInputElement>('#us-start');
        if (r) { r.value = String(Math.min(10, start)); const o = r.parentElement?.querySelector('output'); if (o) o.textContent = String(start); }
        api.rebuild();
      });
      host.append(h('div', { class: 'row' }, again));
      if (variant === 'custom') {
        const list = h('div', { class: 'us-missions' });
        for (const m of missions) {
          if (m.check(ids, start, result)) cleared.add(m.id);
          list.append(h('div', { class: 'us-mission', 'data-ok': String(cleared.has(m.id)) }, (cleared.has(m.id) ? '✅ ' : '⬜ ') + m.text));
        }
        host.append(list);
      }
    },
  });

  // 미션 목록은 직접 조립을 고르기 전에도 보이게 안내
  const intro = h('div', { class: 'us-missions-intro small' }, '🎯 미션: 🧩 직접 조립을 선택하면 미션 3개를 풀 수 있습니다. 실행을 끝까지 진행하면 자동으로 채점됩니다.');
  root.append(intro);
}
