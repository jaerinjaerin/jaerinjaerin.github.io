/**
 * 실습: 클래스 변수 vs 인스턴스 변수 — 힙과 속성 탐색 (객체지향 1강)
 * 교육용 시뮬레이션 — CPython의 인스턴스 생성(__new__ → __init__), 메서드 호출(바운드 메서드),
 * 속성 읽기(인스턴스 __dict__ → 클래스 __dict__)와 대입(항상 인스턴스 __dict__)만 재현한다.
 * 출력 문자열과 오류 문구는 실제 Python 3.13 실행 결과와 같다.
 */
import { mountStepLab, h, type Step } from '../engine/step-lab';

export type Variant = 'ok' | 'bug' | 'shadow';
type V = { ref: string } | { lit: string };
type Obj = { id: string; kind: 'inst' | 'list'; dict: [string, V][]; items: string[] };
type Look = { where: string; hit: boolean; what?: string };
export type S = {
  names: [string, V][];
  frame: { fn: string; vars: [string, V][] } | null;
  cls: [string, V][];
  objs: Obj[];
  out: string[];
  look: { expr: string; path: Look[] } | null;
  flash: string[];
};

const OWNERS = ['민수', '지영', '하늘', '도윤'];
const GOODS = ['사과', '우유', '빵', '계란'];
const NAMES = ['a', 'b', 'c', 'd'];

export const repr = (v: string[]) => '[' + v.map((x) => `'${x}'`).join(', ') + ']';

/** 변형별 코드 (줄 번호는 1부터) */
export function codeOf(v: Variant, n: number): string[] {
  const head = v === 'ok'
    ? ['class Cart:', '    def __init__(self, owner):', '        self.owner = owner', '        self.items = []', '    def add(self, x):', '        self.items.append(x)']
    : ['class Cart:', '    items = []', '    def __init__(self, owner):', '        self.owner = owner', '    def add(self, x):',
      v === 'bug' ? '        self.items.append(x)' : '        self.items = self.items + [x]'];
  const lines = [...head, ''];
  for (let i = 0; i < n; i++) lines.push(`${NAMES[i]} = Cart("${OWNERS[i]}")`);
  for (let i = 0; i < n; i++) lines.push(`${NAMES[i]}.add("${GOODS[i]}")`);
  lines.push('print(a.items)', 'print(Cart.items)');
  return lines;
}

/** 순수 함수: 단계 배열 생성 (각 단계는 상태 스냅샷을 가진다 → 되감기 = 다른 스냅샷 그리기) */
export function simulate(v: Variant, n: number): Step<S>[] {
  const L = { create: 8, add: 8 + n, print: 8 + 2 * n }; // 줄 번호 기준점
  const ownerLine = v === 'ok' ? 3 : 4;
  const steps: Step<S>[] = [];
  const s: S = { names: [], frame: null, cls: [], objs: [], out: [], look: null, flash: [] };
  let listNo = 0;
  const clone = (): S => JSON.parse(JSON.stringify(s));
  const push = (line: number, phase: string, title: string, detail: string, tone: Step<S>['tone'] = 'normal') => {
    steps.push({ code: 'main', line, phase, title, detail, tone, state: clone() });
    s.flash = []; s.look = null;
  };
  const obj = (id: string) => s.objs.find((o) => o.id === id)!;
  const get = (d: [string, V][], k: string) => d.find(([kk]) => kk === k)?.[1];
  const set = (d: [string, V][], k: string, val: V) => { const e = d.find(([kk]) => kk === k); if (e) e[1] = val; else d.push([k, val]); };
  const newList = (items: string[] = []) => { const id = 'L' + listNo++; s.objs.push({ id, kind: 'list', dict: [], items }); s.flash.push(id); return id; };

  // 1. class 문
  s.cls.push(['__init__', { lit: '함수' }], ['add', { lit: '함수' }]);
  if (v !== 'ok') set(s.cls, 'items', { ref: newList() });
  s.names.push(['Cart', { ref: 'Cart' }]);
  s.flash.push('Cart');
  push(1, 'class 문 실행', '클래스 객체 Cart가 힙에 생김',
    v === 'ok'
      ? '클래스도 객체입니다. Cart.__dict__에는 함수 __init__과 add만 들어 있고, items는 없습니다.'
      : '클래스 몸체의 items = [] 는 class 문이 실행될 때 딱 한 번 실행됩니다. 그래서 리스트 L0는 Cart.__dict__에 하나만 생깁니다.',
    v === 'ok' ? 'normal' : 'warn');

  // 2. 인스턴스 생성
  for (let i = 0; i < n; i++) {
    const id = 'C' + i;
    s.objs.push({ id, kind: 'inst', dict: [], items: [] });
    s.flash.push(id);
    s.frame = { fn: '__init__', vars: [['self', { ref: id }], ['owner', { lit: `"${OWNERS[i]}"` }]] };
    push(L.create + i, `${NAMES[i]} 만들기`, `Cart("${OWNERS[i]}") → 빈 인스턴스 ${id} 생성`,
      `__new__가 힙에 빈 인스턴스 ${id}를 만들고(__dict__ = {}), 곧바로 __init__(self=${id}, owner="${OWNERS[i]}")를 호출합니다. self는 방금 만든 바로 그 객체입니다.`);
    set(obj(id).dict, 'owner', { lit: `"${OWNERS[i]}"` });
    s.flash.push(id);
    push(ownerLine, `${NAMES[i]} 만들기`, `self.owner = owner → ${id}.__dict__에 저장`, '대입(=)은 언제나 self의 __dict__, 즉 인스턴스 자신에게 씁니다.');
    if (v === 'ok') {
      const l = newList();
      set(obj(id).dict, 'items', { ref: l });
      s.flash.push(id);
      push(4, `${NAMES[i]} 만들기`, `self.items = [] → 새 리스트 ${l}`, `__init__은 인스턴스를 만들 때마다 실행되므로 [] 도 매번 새로 만들어집니다. ${id}만의 리스트 ${l}가 생겼습니다.`, 'ok');
    }
    s.frame = null;
    s.names.push([NAMES[i], { ref: id }]);
    s.flash.push(id);
    push(L.create + i, `${NAMES[i]} 만들기`, `이름 ${NAMES[i]} → ${id}`, `__init__ 프레임이 사라지고, 전역 이름 ${NAMES[i]}가 ${id}를 가리킵니다. ${NAMES[i]}는 객체 자체가 아니라 참조입니다.`);
  }

  // 3. 메서드 호출
  for (let i = 0; i < n; i++) {
    const id = 'C' + i;
    s.frame = { fn: 'add', vars: [['self', { ref: id }], ['x', { lit: `"${GOODS[i]}"` }]] };
    s.look = { expr: `${NAMES[i]}.add`, path: [{ where: `${id}.__dict__`, hit: false }, { where: 'Cart.__dict__', hit: true, what: '함수 add' }] };
    s.flash.push('Cart');
    push(L.add + i, `${NAMES[i]}.add 호출`, `Cart.add(${NAMES[i]}, "${GOODS[i]}")로 바뀜`,
      `add는 ${id}에 없어서 클래스에서 찾습니다. 찾은 함수에 ${NAMES[i]}를 묶은 바운드 메서드가 만들어지고, ${NAMES[i]}가 첫 인자 self로 들어갑니다.`);
    if (v === 'ok') {
      const l = (get(obj(id).dict, 'items') as { ref: string }).ref;
      obj(l).items.push(GOODS[i]);
      s.flash.push(l);
      s.look = { expr: 'self.items', path: [{ where: `${id}.__dict__`, hit: true, what: l }] };
      push(6, `${NAMES[i]}.add 호출`, `${l}.append("${GOODS[i]}")`, `self.items는 ${id}.__dict__에서 바로 찾아집니다. ${id}만의 리스트만 바뀝니다.`, 'ok');
    } else if (v === 'bug') {
      const l = (get(s.cls, 'items') as { ref: string }).ref;
      obj(l).items.push(GOODS[i]);
      s.flash.push(l, 'Cart');
      s.look = { expr: 'self.items', path: [{ where: `${id}.__dict__`, hit: false }, { where: 'Cart.__dict__', hit: true, what: l }] };
      push(6, `${NAMES[i]}.add 호출`, `공유 리스트 ${l}.append("${GOODS[i]}")`,
        `${id}에는 items가 없어서 클래스의 ${l}를 찾아갑니다. append는 대입이 아니라 객체를 제자리에서 바꾸는 변경(mutation)이라, 인스턴스에는 아무것도 생기지 않고 모두가 같은 ${l}를 바꿉니다.`, 'error');
    } else {
      const base = (get(s.cls, 'items') as { ref: string }).ref;
      s.look = { expr: 'self.items (읽기)', path: [{ where: `${id}.__dict__`, hit: false }, { where: 'Cart.__dict__', hit: true, what: `${base} = ${repr(obj(base).items)}` }] };
      const l = newList([...obj(base).items, GOODS[i]]);
      set(obj(id).dict, 'items', { ref: l });
      s.flash.push(id);
      push(6, `${NAMES[i]}.add 호출`, `새 리스트 ${l}를 ${id}.__dict__에 대입`,
        `오른쪽 self.items + [x]는 클래스의 ${base}를 읽어 새 리스트 ${l}를 만듭니다. 왼쪽 대입(=)은 항상 인스턴스에 쓰므로 ${id}.__dict__에 items가 생겨 클래스의 ${base}를 가립니다(shadowing). ${base}는 그대로입니다.`, 'warn');
    }
    s.frame = null;
  }

  // 4. 출력
  const aItems = get(obj('C0').dict, 'items') as { ref: string } | undefined;
  const clsItems = get(s.cls, 'items') as { ref: string } | undefined;
  const aList = (aItems ?? clsItems)!.ref;
  s.look = { expr: 'a.items', path: aItems ? [{ where: 'C0.__dict__', hit: true, what: aList }] : [{ where: 'C0.__dict__', hit: false }, { where: 'Cart.__dict__', hit: true, what: aList }] };
  s.out.push(repr(obj(aList).items));
  s.flash.push(aList);
  push(L.print, '출력', `print(a.items) → ${repr(obj(aList).items)}`, v === 'bug' ? '다른 사람이 담은 물건까지 a의 장바구니에 보입니다. 에러 없이 틀린 결과가 나오는 가장 위험한 종류의 버그입니다.' : 'a의 장바구니에는 a가 담은 물건만 있습니다.', v === 'bug' ? 'error' : 'ok');
  if (clsItems) {
    s.out.push(repr(obj(clsItems.ref).items));
    s.flash.push(clsItems.ref);
    s.look = { expr: 'Cart.items', path: [{ where: 'Cart.__dict__', hit: true, what: clsItems.ref }] };
    push(L.print + 1, '출력', `print(Cart.items) → ${repr(obj(clsItems.ref).items)}`, v === 'bug' ? '클래스의 L0 하나에 모든 물건이 모였습니다.' : '인스턴스들은 자기 리스트를 따로 가졌고, 클래스의 L0는 한 번도 바뀌지 않았습니다.', v === 'bug' ? 'error' : 'ok');
  } else {
    s.out.push("AttributeError: type object 'Cart' has no attribute 'items'");
    s.look = { expr: 'Cart.items', path: [{ where: 'Cart.__dict__', hit: false }] };
    push(L.print + 1, '출력', 'print(Cart.items) → AttributeError', '이 방식에서 items는 인스턴스에만 있습니다. 클래스 자신에게서 찾으면 어디에도 없어 오류가 납니다.', 'ok');
  }
  return steps;
}

export const listCount = (v: Variant, n: number) => simulate(v, n).at(-1)!.state.objs.filter((o) => o.kind === 'list').length;

/* ---------- 그리기 ---------- */
function chip(val: V, root: HTMLElement) {
  if ('lit' in val) return h('span', { class: 'sv-chip val', text: val.lit });
  const b = h('button', { type: 'button', class: 'sv-chip ch-ref', text: '→ ' + val.ref, 'aria-label': `${val.ref} 객체 위치 보기` });
  b.addEventListener('click', () => {
    const t = root.querySelector<HTMLElement>(`[data-obj="${val.ref}"]`);
    if (!t) return;
    t.dataset.flash = 'true';
    t.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    setTimeout(() => { t.dataset.flash = 'false'; }, 1400);
  });
  return b;
}
const kv = (k: string, val: V, root: HTMLElement) => h('div', { class: 'ch-kv' }, h('span', { class: 'ch-k', text: k }), chip(val, root));

function renderState(host: HTMLElement, step: Step<S>) {
  const s = step.state;
  const flash = new Set(s.flash);
  const box = (id: string | null, label: string, side: string, ...body: Node[]) =>
    h('div', { class: 'sv-box', 'data-obj': id ?? undefined, 'data-flash': String(id ? flash.has(id) : false) },
      h('div', { class: 'sv-label' }, h('span', { text: label }), h('span', { text: side })), ...body);
  const empty = (t: string) => h('div', { class: 'sv-empty', text: t });

  if (s.look) {
    host.append(h('div', { class: 'sv-box ch-look' },
      h('div', { class: 'sv-label' }, h('span', { text: '속성 탐색 경로' }), h('code', { text: s.look.expr })),
      h('ol', { class: 'ch-path' }, ...s.look.path.map((p) => h('li', { 'data-hit': String(p.hit) },
        h('span', { text: p.where }), h('strong', { text: p.hit ? `있음: ${p.what}` : '없음' })))),
    ));
  }

  const stack = h('div', { class: 'ch-col' },
    box(null, '스택: 전역 이름', '이름 → 객체', ...(s.names.length ? s.names.map(([k, v]) => kv(k, v, host)) : [empty('아직 없음')])),
    s.frame ? box(null, `호출 프레임: ${s.frame.fn}()`, '지역 변수', ...s.frame.vars.map(([k, v]) => kv(k, v, host))) : h('div', { class: 'sv-empty small', text: '실행 중인 메서드 없음' }),
  );
  const heap = h('div', { class: 'ch-col' },
    box('Cart', '클래스 객체 Cart', '__dict__', ...s.cls.map(([k, v]) => kv(k, v, host))),
    ...s.objs.map((o) => o.kind === 'inst'
      ? box(o.id, `인스턴스 ${o.id}`, '__dict__', ...(o.dict.length ? o.dict.map(([k, v]) => kv(k, v, host)) : [empty('{} 비어 있음')]))
      : box(o.id, `리스트 ${o.id}`, `${o.items.length}개`, h('code', { class: 'ch-list', text: repr(o.items) }))),
  );
  host.append(h('div', { class: 'ch-mem' },
    h('div', {}, h('div', { class: 'ch-h small', text: '스택' }), stack),
    h('div', {}, h('div', { class: 'ch-h small', text: '힙' }), heap),
  ));
  host.append(h('div', {}, h('div', { class: 'ch-h small', text: '출력' }), h('div', { class: 'sv-log', text: s.out.join('\n') || ' ' })));
}

export function mountCartHeapLab(root: HTMLElement) {
  let n = 2;
  mountStepLab<S>(root, {
    title: '장바구니가 섞이는 이유: 힙과 속성 탐색',
    mode: 'simulation',
    modeNote: 'CPython이 인스턴스를 만들고 속성을 찾는 순서를 교육용으로 재현합니다. 출력과 오류 문구는 실제 Python 3.13 결과와 같습니다.',
    variants: [
      { id: 'bug', label: '클래스 변수 + append', buggy: true, note: '흔한 실수: 기본값을 클래스 몸체에 items = [] 로 둔다.' },
      { id: 'ok', label: '인스턴스 변수 (정답)', note: '올바른 방식: 가변 객체는 __init__ 안에서 self.items = [] 로 만든다.' },
      { id: 'shadow', label: '클래스 변수 + 재할당', note: '변형: 클래스 변수는 그대로 두고 add에서 self.items = self.items + [x] 로 대입한다. 결과는 맞지만 이유를 설명할 수 있나요?' },
    ],
    controls(host, change) {
      const sel = h('select', { class: 'sl-input', id: 'ch-n' }, ...[2, 3, 4].map((k) => h('option', { value: String(k), text: `${k}개`, selected: k === n })));
      sel.addEventListener('change', () => { n = Number(sel.value); change(); });
      host.append(h('div', { class: 'sl-field' }, h('label', { for: 'ch-n', text: '만들 인스턴스 수' }), sel));
    },
    codeBlocks: (v) => [{ id: 'main', title: 'cart.py', code: codeOf(v as Variant, n).join('\n') }],
    build: (v) => simulate(v as Variant, n),
    renderState,
    predict: (v) => {
      const answer = v === 'bug' ? 'all' : 'own';
      return {
        prompt: `인스턴스 ${n}개, 이 코드에서 print(a.items)의 출력은?`,
        kind: 'choice',
        choices: [
          { value: 'own', label: repr([GOODS[0]]) },
          { value: 'all', label: repr(GOODS.slice(0, n)) },
          { value: 'empty', label: '[]' },
          { value: 'err', label: 'AttributeError' },
        ],
        answer,
        explain: () => v === 'bug'
          ? '모든 인스턴스의 self.items 읽기가 클래스의 L0 하나로 이어졌고, append가 그 하나를 계속 바꿨습니다.'
          : v === 'ok'
            ? '인스턴스마다 __init__에서 자기 리스트를 만들었으므로 서로 섞이지 않습니다.'
            : '첫 읽기는 클래스의 L0로 가지만, 대입이 인스턴스마다 새 리스트를 만들어 L0를 가렸습니다.',
      };
    },
    onFinish(last, v, host) {
      const lists = last.state.objs.filter((o) => o.kind === 'list').length;
      host.append(h('div', { class: 'sv-box' },
        h('div', { class: 'sv-label' }, h('span', { text: '관찰 기록' })),
        h('p', { style: 'margin:0', text: `힙의 리스트 객체: ${lists}개 · 인스턴스: ${n}개. ` + (v === 'bug'
          ? '인스턴스 수를 바꿔도 리스트는 1개입니다. 공유의 증거입니다.'
          : v === 'ok' ? '인스턴스 하나당 리스트 하나입니다.' : '클래스의 L0와 인스턴스마다 새로 만든 리스트가 따로 있습니다.') + ' 다른 모드로 바꿔 같은 질문을 해 보세요.' }),
      ));
    },
  });
}
