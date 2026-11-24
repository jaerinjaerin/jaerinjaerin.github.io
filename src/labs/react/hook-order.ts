/**
 * 실습: Hook은 "이름"이 아니라 "호출 순서"로 저장된다 (React Native 4강)
 * 교육용 시뮬레이션 — React는 컴포넌트마다 Hook 목록(연결 리스트)을 두고,
 * 렌더할 때마다 useState 호출 순서대로 칸을 하나씩 꺼낸다. 이 모델은 그 순서 대응만 재현한다.
 */
import { mountStepLab, h, type Step } from '../engine/step-lab';

type Slot = { name: string; value: string };
type S = {
  render: 1 | 2;
  slots: Slot[];          // React가 보관 중인 Hook 목록
  cursor: number | null;  // 지금 꺼내는 칸
  bad: number | null;     // 엉뚱한 칸을 읽은 위치
  used: number;           // 이번 렌더에서 사용한 칸 수
  read: { name: string; got: string; ok: boolean }[];
  error: string | null;
};

const CODE: Record<string, string> = {
  good: [
    'function Profile({ showCounter }) {',
    "  const [name, setName] = useState('민수');",
    '  const [count, setCount] = useState(0);',
    '  const [dark, setDark] = useState(false);',
    '',
    '  return (',
    '    <View>',
    '      <Text>{name}</Text>',
    '      {showCounter && <Text>{count}</Text>}',
    '    </View>',
    '  );',
    '}',
  ].join('\n'),
  bad: [
    'function Profile({ showCounter }) {',
    "  const [name, setName] = useState('민수');",
    '  if (showCounter) {',
    '    const [count, setCount] = useState(0);',
    '  }',
    '  const [dark, setDark] = useState(false);',
    '',
    '  return (',
    '    <View>',
    '      <Text>{name}</Text>',
    '    </View>',
    '  );',
    '}',
  ].join('\n'),
};

type Call = { name: string; init: string; line: number; when: 'always' | 'cond' };
const CALLS: Record<string, Call[]> = {
  good: [
    { name: 'name', init: "'민수'", line: 2, when: 'always' },
    { name: 'count', init: '0', line: 3, when: 'always' },
    { name: 'dark', init: 'false', line: 4, when: 'always' },
  ],
  bad: [
    { name: 'name', init: "'민수'", line: 2, when: 'always' },
    { name: 'count', init: '0', line: 4, when: 'cond' },
    { name: 'dark', init: 'false', line: 6, when: 'always' },
  ],
};

export function simulateHooks(variant: 'good' | 'bad', first: boolean, second: boolean): Step<S>[] {
  const steps: Step<S>[] = [];
  const calls = CALLS[variant];
  let st: S = { render: 1, slots: [], cursor: null, bad: null, used: 0, read: [], error: null };
  const push = (s: Omit<Step<S>, 'state'>, patch: Partial<S>) => {
    st = { ...st, ...patch, slots: (patch.slots ?? st.slots).map((x) => ({ ...x })), read: [...(patch.read ?? st.read)] };
    steps.push({ ...s, code: 'main', state: st });
  };

  // 렌더 #1: 마운트 — 호출되는 순서대로 새 칸을 만든다
  push({ line: 1, phase: '렌더 #1 (처음 화면에 나타남)', title: `Profile({ showCounter: ${first} }) 실행`, detail: '처음 렌더에서는 Hook 목록이 비어 있습니다. useState가 호출될 때마다 목록 끝에 새 칸을 하나씩 만듭니다. 칸에는 변수 이름이 저장되지 않고, 순서(번호)만 있습니다.' }, {});
  for (const c of calls) {
    const runs = c.when === 'always' || first;
    if (!runs) {
      push({ line: c.line - 1, phase: '렌더 #1', title: `if (showCounter) → false, 블록 건너뜀`, detail: `showCounter가 false라서 useState(${c.init})는 호출되지 않습니다. 칸도 만들어지지 않습니다.`, tone: 'warn' }, { cursor: null });
      continue;
    }
    const slots = [...st.slots, { name: c.name, value: c.init }];
    push({ line: c.line, phase: '렌더 #1', title: `useState(${c.init}) → ${slots.length - 1}번 칸 생성`, detail: `${slots.length - 1}번 칸에 ${c.init}을(를) 저장하고 ${c.name}에 돌려줍니다. React는 이 칸이 "${c.name}"이라는 것을 모릅니다. 오직 "${slots.length - 1}번째로 호출된 useState"로만 기억합니다.` }, { slots, cursor: slots.length - 1, used: slots.length });
  }
  push({ line: calls[calls.length - 1].line, phase: '렌더 #1 완료', title: `Hook 목록: ${st.slots.length}칸`, detail: `이 컴포넌트의 Hook 목록은 [${st.slots.map((s, i) => `${i}:${s.value}`).join(', ')}]입니다. 다음 렌더에서도 같은 순서로 같은 개수의 useState가 호출되어야 합니다.`, tone: 'ok' }, { cursor: null });

  // 렌더 #2: 업데이트 — 기존 칸을 순서대로 꺼낸다
  const stored = st.slots;
  push({ line: 1, phase: '렌더 #2 (다시 렌더링)', title: `Profile({ showCounter: ${second} }) 실행`, detail: '이번에는 새 칸을 만들지 않고, 저장된 목록을 0번부터 순서대로 하나씩 꺼냅니다.' }, { render: 2, cursor: null, used: 0, read: [] });
  let pos = 0;
  for (const c of calls) {
    const runs = c.when === 'always' || second;
    if (!runs) {
      push({ line: c.line - 1, phase: '렌더 #2', title: `if (showCounter) → false, 블록 건너뜀`, detail: `이번 렌더에서는 useState(${c.init})가 호출되지 않습니다. 하지만 React의 목록에는 그 칸이 그대로 있습니다. 다음 useState는 그 칸을 꺼내게 됩니다.`, tone: 'warn' }, { cursor: null });
      continue;
    }
    if (pos >= stored.length) {
      push({ line: c.line, phase: '렌더 #2', title: `useState(${c.init}) → 꺼낼 칸이 없음!`, detail: `${pos}번 칸이 존재하지 않습니다. 첫 렌더보다 Hook을 더 많이 호출했습니다.`, tone: 'error' }, { cursor: null, bad: pos, error: 'Rendered more hooks than during the previous render.' });
      return finish();
    }
    const slot = stored[pos];
    const ok = slot.name === c.name;
    push({
      line: c.line, phase: '렌더 #2', title: ok ? `useState → ${pos}번 칸 꺼냄: ${c.name} = ${slot.value} ✓` : `useState → ${pos}번 칸 꺼냄: ${c.name} = ${slot.value} ✗`,
      detail: ok
        ? `${pos}번 칸은 첫 렌더에서 ${c.name}이(가) 만든 칸이므로 올바른 값입니다.`
        : (stored.findIndex((x) => x.name === c.name) === -1
          ? `${c.name}은(는) 첫 렌더에서 호출되지 않아 칸이 없었습니다. 그런데 이번에 호출되면서 ${pos}번 칸, 즉 ${slot.name}의 칸(값 ${slot.value})을 자기 값으로 받았습니다.`
          : `${c.name}은(는) 첫 렌더에서 ${stored.findIndex((x) => x.name === c.name)}번 칸이었는데, 앞에서 호출 하나가 빠져 순서가 밀렸습니다. 그래서 ${slot.name}의 칸(값 ${slot.value})을 자기 값으로 받았습니다. 타입조차 다를 수 있습니다(${c.name}은 boolean인데 숫자를 받음).`),
      tone: ok ? 'normal' : 'error',
    }, { cursor: pos, bad: ok ? st.bad : pos, used: pos + 1, read: [...st.read, { name: c.name, got: slot.value, ok }] });
    pos++;
  }
  if (pos < stored.length) {
    push({ line: calls[calls.length - 1].line, phase: '렌더 #2 종료', title: `사용한 칸 ${pos}개 < 저장된 칸 ${stored.length}개`, detail: '렌더가 끝났는데 꺼내지 않은 칸이 남았습니다. React는 Hook 호출 개수가 렌더마다 달라졌다는 것을 감지하고 오류를 던집니다.', tone: 'error' }, { cursor: null, error: 'Rendered fewer hooks than expected. This may be caused by an accidental early return statement.' });
  } else {
    push({ line: calls[calls.length - 1].line, phase: '렌더 #2 완료', title: '모든 칸이 제자리에 대응됨', detail: `호출 순서와 개수가 첫 렌더와 같아서 모든 상태가 올바른 값을 받았습니다. showCounter가 ${second}여도 count의 칸은 계속 보존됩니다.`, tone: 'ok' }, { cursor: null });
  }
  return finish();

  function finish() { return steps; }
}

function renderState(host: HTMLElement, step: Step<S>) {
  const s = step.state;
  const slots = h('div', { class: 'sv-slots' }, ...(s.slots.length ? s.slots.map((slot, i) => h('div', {
    class: 'sv-slot', 'data-cur': String(s.cursor === i), 'data-bad': String(s.bad === i),
    'data-unused': String(s.render === 2 && s.error !== null && i >= s.used),
  }, h('span', { class: 'i', text: `#${i}` }), h('span', { text: `값 ${slot.value}` }), h('span', { class: 'small muted', text: s.render === 1 ? `(${slot.name}가 만듦)` : s.cursor === i ? '◀ 꺼내는 중' : '' }))) : [h('div', { class: 'sv-empty', text: '아직 칸이 없음' })]));
  host.append(h('div', { class: 'sv-box' }, h('div', { class: 'sv-label' }, h('span', { text: '🗂️ React가 보관한 Hook 목록' }), h('span', { text: '이름 없이 번호만' })), slots));
  if (s.render === 2) {
    host.append(h('div', { class: 'sv-box' }, h('div', { class: 'sv-label' }, h('span', { text: '🧾 렌더 #2에서 각 변수가 받은 값' })),
      s.read.length ? h('div', { class: 'sv-row' }, ...s.read.map((r) => h('span', { class: 'sv-chip', style: r.ok ? '' : 'background:var(--err-bg);border-color:var(--err)' }, `${r.name} = ${r.got} ${r.ok ? '✓' : '✗'}`))) : h('div', { class: 'sv-empty', text: '아직 없음' })));
  }
  if (s.error) {
    host.append(h('div', { class: 'callout error', style: 'margin:0' }, h('strong', { text: '💥 React 오류 (개발 모드 메시지)' }), h('code', { style: 'white-space:pre-wrap', text: s.error })));
  }
}

export function mountHookOrderLab(root: HTMLElement) {
  let first = true;
  let second = false;
  mountStepLab<S>(root, {
    title: 'Hook은 이름이 아니라 순서로 기억된다',
    mode: 'simulation',
    modeNote: 'React가 렌더마다 Hook 목록을 순서대로 대응시키는 방식을 단순화한 교육용 모델입니다. 오류 문구는 실제 React 개발 모드 메시지입니다.',
    variants: [
      { id: 'bad', label: 'if 안에서 useState', buggy: true, note: '흔한 실수: 필요할 때만 상태를 만들려고 조건문 안에서 useState 호출.' },
      { id: 'good', label: '항상 맨 위에서 호출', note: '올바른 방식: Hook은 항상 같은 순서로 호출하고, 조건은 화면(JSX)에서 처리.' },
    ],
    controls(host, change) {
      const mk = (label: string, get: () => boolean, set: (v: boolean) => void, id: string) => {
        const sel = h('select', { class: 'sl-input', id }, h('option', { value: 'true', text: 'true' }), h('option', { value: 'false', text: 'false' }));
        sel.value = String(get());
        sel.addEventListener('change', () => { set(sel.value === 'true'); change(); });
        return h('div', { class: 'sl-field' }, h('label', { for: id, text: label }), sel);
      };
      host.append(mk('렌더 #1의 showCounter', () => first, (v) => (first = v), 'ho-1'), mk('렌더 #2의 showCounter', () => second, (v) => (second = v), 'ho-2'));
    },
    codeBlocks: (v) => [{ id: 'main', title: v === 'bad' ? '🐞 Profile (조건부 Hook)' : 'Profile (올바른 Hook 사용)', code: CODE[v] }],
    build: (v) => simulateHooks(v as 'good' | 'bad', first, second),
    renderState,
    predict: (v) => {
      const steps = simulateHooks(v as 'good' | 'bad', first, second);
      const last = steps[steps.length - 1].state;
      const answer = last.error ? (last.error.startsWith('Rendered more') ? 'more' : 'fewer') : last.read.every((r) => r.ok) ? 'ok' : 'wrong';
      return {
        prompt: `showCounter가 렌더 #1에서 ${first}, 렌더 #2에서 ${second}이면 어떻게 될까요?`,
        kind: 'choice',
        choices: [
          { value: 'ok', label: '정상 동작: 모든 상태가 제 값을 받는다' },
          { value: 'fewer', label: '오류: Hook을 예상보다 적게 호출했다' },
          { value: 'more', label: '오류: Hook을 이전보다 많이 호출했다' },
        ],
        answer,
        explain: (_g, ok) => (ok ? '정확합니다. ' : '') + (answer === 'ok'
          ? '두 렌더에서 useState 호출 순서와 개수가 같으므로 각 칸이 올바르게 대응됩니다.'
          : answer === 'fewer'
            ? '렌더 #2에서 조건문 안의 useState가 빠지면서 뒤의 dark가 count의 칸을 꺼냈고, 사용하지 않은 칸이 남아 React가 오류를 냅니다.'
            : '렌더 #1에서 만들지 않은 칸을 렌더 #2에서 꺼내려 해서, React가 "이전보다 많은 Hook"이라는 오류를 냅니다.'),
      };
    },
  });
}
