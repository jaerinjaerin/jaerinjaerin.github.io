/**
 * 실습: key가 행의 "정체성"을 정한다 (React Native 20강)
 * 교육용 시뮬레이션 — React 재조정(reconciliation)이 형제 목록에서 key로 기존 컴포넌트 인스턴스를
 * 찾아 재사용하는 규칙만 재현한다. 각 Row는 자기 안에 useState(checked)를 가진다.
 */
import { mountStepLab, h, type Step } from '../engine/step-lab';

type Item = { id: string; name: string };
type Inst = { uid: number; key: string; checked: boolean; props: string; fresh?: boolean; matched?: boolean };
type S = { data: Item[]; insts: Inst[]; removed: Inst[]; focus?: string };

const START: Item[] = [{ id: 'a', name: '사과' }, { id: 'b', name: '배' }, { id: 'c', name: '귤' }];
const NEW: Item = { id: 'n', name: '딸기' };

export function simulateKeys(variant: 'id' | 'index'): Step<S>[] {
  const keyOf = (it: Item, i: number) => (variant === 'id' ? it.id : String(i));
  const steps: Step<S>[] = [];
  let uid = 0;
  let st: S = { data: START, insts: START.map((it, i) => ({ uid: ++uid, key: keyOf(it, i), checked: false, props: it.name, fresh: true })), removed: [] };
  const push = (s: Omit<Step<S>, 'state'>, patch: Partial<S>) => { st = { ...st, ...patch }; steps.push({ ...s, code: 'main', state: JSON.parse(JSON.stringify(st)) }); };

  push({ line: 12, phase: '첫 렌더', title: 'Row 인스턴스 3개 생성',
    detail: `각 항목마다 Row 컴포넌트 인스턴스가 만들어지고, 인스턴스마다 자기 State(checked = false)를 가집니다. key는 ${variant === 'id' ? 'item.id' : '배열 index'}입니다.` }, {});
  const insts1 = st.insts.map((x) => ({ ...x, fresh: false, checked: x.props === '사과' }));
  push({ line: 3, phase: '사용자 입력', title: '"사과" 체크',
    detail: `체크 상태는 데이터가 아니라 Row 인스턴스(key ${insts1[0].key})의 State에 저장됩니다.` }, { insts: insts1, focus: 'state' });
  const data2 = [NEW, ...START];
  push({ line: 18, phase: '데이터 변경', title: '맨 앞에 "딸기" 추가',
    detail: 'setItems((prev) => [newItem, ...prev]) — 새 배열이 만들어지고 FlatList가 다시 렌더합니다.' }, { data: data2, focus: 'data' });

  // 재조정: 새 key마다 기존 인스턴스를 찾는다
  const old = new Map(st.insts.map((x) => [x.key, x]));
  const next: Inst[] = data2.map((it, i) => {
    const k = keyOf(it, i);
    const hit = old.get(k);
    if (hit) { old.delete(k); return { ...hit, props: it.name, matched: true, fresh: false }; }
    return { uid: ++uid, key: k, checked: false, props: it.name, fresh: true };
  });
  const removed = [...old.values()];
  const wrong = next.find((x) => x.checked && x.props !== '사과');
  push({ line: 12, phase: '재조정(reconciliation)', title: variant === 'id' ? 'key로 짝 찾기: a·b·c는 그대로, n은 새로' : 'key로 짝 찾기: 0·1·2는 기존 인스턴스, 3은 새로',
    detail: variant === 'id'
      ? '새 목록의 key [n, a, b, c]를 이전 key와 비교합니다. a·b·c 인스턴스는 State를 가진 채 자리만 옮기고, n만 새로 만듭니다.'
      : '새 목록의 key는 [0, 1, 2, 3]입니다. key 0의 기존 인스턴스(체크된 State를 가진)가 이번에는 "딸기" props를 받습니다. React는 key가 같으면 같은 것이라고 믿기 때문입니다.',
    tone: variant === 'id' ? 'ok' : 'warn' }, { insts: next, removed, focus: 'match' });
  push({ line: 3, phase: '결과', title: wrong ? `체크가 "${wrong.props}"로 옮겨 감 ✗` : '체크는 여전히 "사과" ✓',
    detail: wrong
      ? `사용자는 사과를 체크했는데 화면에서는 ${wrong.props}가 체크되어 보입니다. index key는 "자리"를 식별할 뿐, 항목을 식별하지 못합니다. 순서가 바뀌는 목록에는 쓰면 안 됩니다.`
      : '안정적인 id key 덕분에 State가 항목을 따라갑니다. 정렬·삽입·삭제가 있어도 안전합니다.',
    tone: wrong ? 'error' : 'ok' }, { focus: 'state' });
  return steps;
}

function renderState(host: HTMLElement, step: Step<S>) {
  const s = step.state;
  const data = h('div', { class: 'sv-box', 'data-flash': String(s.focus === 'data') }, h('div', { class: 'sv-label' }, h('span', { text: '📦 data 배열' })),
    h('div', { class: 'sv-row' }, ...s.data.map((d, i) => h('span', { class: 'sv-chip' }, `[${i}] ${d.name} (id ${d.id})`))));
  const insts = h('div', { class: 'sv-box', 'data-flash': String(s.focus === 'match' || s.focus === 'state') }, h('div', { class: 'sv-label' }, h('span', { text: '🧩 Row 인스턴스 (화면에 보이는 행)' }), h('span', { text: 'key → State' })),
    h('div', { class: 'sv-slots' }, ...s.insts.map((x) => h('div', { class: 'sv-slot', 'data-cur': String(Boolean(x.fresh)), 'data-bad': String(x.checked && x.props !== '사과') },
      h('span', { class: 'i', text: `#${x.uid}` }),
      h('span', { text: `${x.checked ? '☑' : '☐'} ${x.props}` }),
      h('span', { class: 'small muted', text: `key ${x.key}${x.fresh ? ' · 새로 생성' : x.matched ? ' · 재사용' : ''}` }),
    ))));
  host.append(data, insts);
  if (s.removed.length) host.append(h('div', { class: 'small muted', text: `해제된 인스턴스: ${s.removed.map((x) => `#${x.uid}`).join(', ')}` }));
}

const CODE: Record<string, string> = {
  id: [
    'function Row({ item }) {',
    '  const [checked, setChecked] = useState(false);',
    "  return <Pressable onPress={() => setChecked((c) => !c)}><Text>{checked ? '☑' : '☐'} {item.name}</Text></Pressable>;",
    '}',
    '',
    'export default function Fruits() {',
    '  const [items, setItems] = useState(START);',
    '  return (',
    '    <>',
    '      <FlatList',
    '        data={items}',
    '        renderItem={({ item }) => <Row item={item} />}',
    '        keyExtractor={(item) => item.id}          // ✓ 안정적인 id',
    '      />',
    '      <Button',
    '        title="맨 앞에 추가"',
    '        onPress={() =>',
    "          setItems((prev) => [{ id: 'n', name: '딸기' }, ...prev])",
    '        }',
    '      />',
    '    </>',
    '  );',
    '}',
  ].join('\n'),
};
CODE.index = CODE.id.replace("keyExtractor={(item) => item.id}          // ✓ 안정적인 id", 'keyExtractor={(item, index) => String(index)} // 🐞 index');

export function mountListKeysLab(root: HTMLElement) {
  mountStepLab<S>(root, {
    title: 'key를 index로 쓰면 체크 표시가 어디로 갈까?',
    mode: 'simulation',
    modeNote: 'React 재조정이 key로 기존 컴포넌트 인스턴스를 재사용하는 규칙만 재현한 교육용 모델입니다.',
    variants: [
      { id: 'index', label: 'key = index', buggy: true, note: '흔한 실수: id가 귀찮아서 index를 key로 사용.' },
      { id: 'id', label: 'key = item.id', note: '올바른 방식: 항목마다 바뀌지 않는 고유 id를 key로.' },
    ],
    codeBlocks: (v) => [{ id: 'main', title: v === 'index' ? '🐞 Fruits.js' : 'Fruits.js', code: CODE[v] }],
    build: (v) => simulateKeys(v as 'id' | 'index'),
    renderState,
    predict: (v) => ({
      prompt: '"사과"를 체크한 뒤 맨 앞에 "딸기"를 추가하면, 화면에서 체크된 항목은?',
      kind: 'choice',
      choices: [{ value: 'apple', label: '사과' }, { value: 'straw', label: '딸기' }, { value: 'none', label: '아무것도 체크 안 됨' }],
      answer: v === 'index' ? 'straw' : 'apple',
      explain: (_g, ok) => (ok ? '정확합니다. ' : '') + (v === 'index'
        ? '체크 State는 key 0 인스턴스에 있습니다. 추가 후 key 0 자리에 딸기가 오므로 체크가 딸기로 옮겨 갑니다.'
        : 'key가 a인 인스턴스가 State와 함께 재사용되어 사과의 체크가 유지됩니다.'),
    }),
  });
}
