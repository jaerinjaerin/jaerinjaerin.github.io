/**
 * 모델: 참조와 프로토타입 — 장바구니 (객체지향 1강, 실습 1)
 * 순수 함수. 실습(cart-refs.ts)과 강의 본문 그림(OopFigure.astro)이 같은 모델을 쓴다.
 * 재현 범위: new가 객체를 만들고 [[Prototype]]을 잇는 과정, 생성자의 this, 메서드 탐색, 배열 참조 공유.
 * 출력 문자열은 Node.js 22에서 같은 코드를 실행한 결과와 같다.
 */
import type { Step } from '../engine/step-lab';
import type { Diagram, DNode, Row } from './object-diagram';

export type CartVariant = 'shared' | 'fresh' | 'copy';
type Ref = { ref: string } | { v: string };
type Obj = { id: string; kind: 'inst' | 'arr'; fields: [string, Ref][]; items: string[] };
export type CartState = {
  names: [string, Ref][];
  frame: { fn: string; vars: [string, Ref][] } | null;
  objs: Obj[];
  out: string[];
  look: { expr: string; path: { where: string; hit: boolean; what?: string }[] } | null;
  hl: string[];
  hlRows: string[];
  hlProto: string[];
};

const OWNERS = ['민수', '지영', '하늘'];
const GOODS = ['사과', '우유', '빵'];
const NAMES = ['a', 'b', 'c'];

/** Node.js의 console.log 배열 출력 형식 */
export const show = (v: string[]) => (v.length ? `[ ${v.map((x) => `'${x}'`).join(', ')} ]` : '[]');

export function cartCode(v: CartVariant, n: number): string[] {
  const lines = [
    'class Cart {',
    '  owner: string;',
    '  items: string[];',
    '  constructor(owner: string, items: string[]) {',
    '    this.owner = owner;',
    v === 'copy' ? '    this.items = [...items];' : '    this.items = items;',
    '  }',
    '  add(x: string) {',
    '    this.items.push(x);',
    '  }',
    '}',
    '',
  ];
  if (v !== 'fresh') lines.push('const empty: string[] = [];');
  for (let i = 0; i < n; i++) lines.push(`const ${NAMES[i]} = new Cart("${OWNERS[i]}", ${v === 'fresh' ? '[]' : 'empty'});`);
  for (let i = 0; i < n; i++) lines.push(`${NAMES[i]}.add("${GOODS[i]}");`);
  lines.push('console.log(a.items);');
  return lines;
}

export function simulateCart(v: CartVariant, n: number): Step<CartState>[] {
  const base = v === 'fresh' ? 13 : 14; // 첫 new 줄
  const steps: Step<CartState>[] = [];
  const s: CartState = { names: [], frame: null, objs: [], out: [], look: null, hl: [], hlRows: [], hlProto: [] };
  let arrNo = 0;
  const snap = (): CartState => JSON.parse(JSON.stringify(s));
  const push = (line: number, phase: string, title: string, detail: string, tone: Step<CartState>['tone'] = 'normal') => {
    steps.push({ code: 'main', line, phase, title, detail, tone, state: snap() });
    s.hl = []; s.hlRows = []; s.hlProto = []; s.look = null;
  };
  const obj = (id: string) => s.objs.find((o) => o.id === id)!;
  const newArr = (items: string[] = []) => { const id = 'A' + arrNo++; s.objs.push({ id, kind: 'arr', fields: [], items }); s.hl.push(id); return id; };

  s.names.push(['Cart', { v: '클래스' }]);
  s.hl.push('Cart.prototype');
  push(1, '클래스 정의', 'Cart.prototype에 메서드가 놓임',
    '클래스를 정의하면 메서드 add는 인스턴스가 아니라 Cart.prototype이라는 공유 객체에 한 번만 저장됩니다. 앞으로 만들 모든 장바구니가 이 객체를 함께 씁니다.');

  let shared = '';
  if (v !== 'fresh') {
    shared = newArr();
    s.names.push(['empty', { ref: shared }]);
    s.hlRows.push('names:empty');
    push(13, '준비', `빈 배열 ${shared} 하나를 만들어 empty가 가리킴`, `[] 를 한 번 실행했으니 배열은 ${shared} 하나뿐입니다. 이 배열을 여러 장바구니에 넘기면 무슨 일이 생길지가 이 실습의 질문입니다.`);
  }

  for (let i = 0; i < n; i++) {
    const id = 'C' + i;
    const line = base + i;
    s.objs.push({ id, kind: 'inst', fields: [], items: [] });
    s.hl.push(id); s.hlProto.push(id);
    const arg = v === 'fresh' ? newArr() : shared;
    s.frame = { fn: 'constructor', vars: [['this', { ref: id }], ['owner', { v: `"${OWNERS[i]}"` }], ['items', { ref: arg }]] };
    push(line, `${NAMES[i]} 만들기`, `new가 빈 객체 ${id}를 만들고 프로토타입을 연결`,
      `① 빈 객체 ${id}를 만듭니다. ② ${id}의 [[Prototype]](점선)을 Cart.prototype에 잇습니다. ③ 생성자를 this = ${id}로 실행합니다.` +
      (v === 'fresh' ? ` 인자로 쓴 [] 는 이 줄이 실행될 때마다 새 배열 ${arg}를 만듭니다.` : ` 인자 items는 empty와 같은 배열 ${shared}를 가리킵니다. 배열이 복사된 게 아니라 화살표(참조)가 복사됐습니다.`));
    obj(id).fields.push(['owner', { v: `"${OWNERS[i]}"` }]);
    s.hl.push(id); s.hlRows.push(`${id}:owner`);
    push(5, `${NAMES[i]} 만들기`, `this.owner = owner → ${id}에 저장`, `this는 지금 만들고 있는 ${id}입니다. 대입은 ${id} 자신에게 칸을 만듭니다.`);
    let target = arg;
    if (v === 'copy') {
      target = newArr([...obj(arg).items]);
      obj(id).fields.push(['items', { ref: target }]);
      s.hlRows.push(`${id}:items`);
      push(6, `${NAMES[i]} 만들기`, `[...items]가 새 배열 ${target}를 만듦`, `펼침 문법은 ${arg}의 원소를 꺼내 새 배열 ${target}에 담습니다(방어적 복사). ${id}는 넘겨받은 배열이 아니라 자기만의 배열을 가리킵니다.`, 'ok');
    } else {
      obj(id).fields.push(['items', { ref: target }]);
      s.hlRows.push(`${id}:items`);
      push(6, `${NAMES[i]} 만들기`, `this.items = items → ${id}.items가 ${target}를 가리킴`,
        v === 'fresh' ? `${id}는 자기만의 배열 ${target}를 가리킵니다.` : `${id}.items도 ${shared}를 가리킵니다. ${i > 0 ? `이제 ${shared}로 가는 화살표가 ${i + 2}개입니다. 장바구니는 ${i + 1}개인데 배열은 하나입니다.` : '아직은 문제가 없어 보입니다.'}`,
        v === 'shared' && i > 0 ? 'warn' : 'normal');
    }
    s.frame = null;
    s.names.push([NAMES[i], { ref: id }]);
    s.hl.push(id); s.hlRows.push(`names:${NAMES[i]}`);
    push(line, `${NAMES[i]} 만들기`, `이름 ${NAMES[i]} → ${id}`, `생성자가 끝나 프레임이 사라지고, 이름 ${NAMES[i]}가 완성된 ${id}를 가리킵니다. ${NAMES[i]}는 객체 자체가 아니라 객체를 가리키는 참조입니다.`);
  }

  for (let i = 0; i < n; i++) {
    const id = 'C' + i;
    const line = base + n + i;
    s.look = { expr: `${NAMES[i]}.add`, path: [{ where: id, hit: false }, { where: 'Cart.prototype', hit: true, what: 'add 함수' }] };
    s.hlProto.push(id); s.hl.push('Cart.prototype'); s.hlRows.push('Cart.prototype:add()');
    s.frame = { fn: 'add', vars: [['this', { ref: id }], ['x', { v: `"${GOODS[i]}"` }]] };
    push(line, `${NAMES[i]}.add 호출`, `add를 ${id}에서 못 찾아 점선을 따라 올라감`,
      `${id}에는 add 칸이 없습니다. 점선(프로토타입 연결)을 따라 Cart.prototype에서 찾습니다. 찾은 함수를 실행할 때 this는 점 왼쪽의 ${NAMES[i]}, 즉 ${id}입니다.`);
    const arr = (obj(id).fields.find(([k]) => k === 'items')![1] as { ref: string }).ref;
    obj(arr).items.push(GOODS[i]);
    s.hl.push(arr); s.hlRows.push(`${id}:items`);
    s.look = { expr: 'this.items', path: [{ where: id, hit: true, what: arr }] };
    const sharedNow = s.objs.filter((o) => o.kind === 'inst' && (o.fields.find(([k]) => k === 'items')?.[1] as { ref: string } | undefined)?.ref === arr).length > 1;
    push(9, `${NAMES[i]}.add 호출`, `${arr}.push("${GOODS[i]}")`,
      sharedNow ? `${id}.items가 가리키는 ${arr}는 다른 장바구니도 가리키는 배열입니다. ${NAMES[i]}에 담았지만 모두의 장바구니가 바뀝니다.` : `${id}만 가리키는 배열 ${arr}가 바뀝니다.`,
      sharedNow ? 'error' : 'ok');
    s.frame = null;
  }

  const aArr = (obj('C0').fields.find(([k]) => k === 'items')![1] as { ref: string }).ref;
  s.out.push(show(obj(aArr).items));
  s.hl.push(aArr); s.hlRows.push('C0:items');
  s.look = { expr: 'a.items', path: [{ where: 'C0', hit: true, what: aArr }] };
  const bad = v === 'shared';
  push(base + 2 * n, '출력', `console.log(a.items) → ${show(obj(aArr).items)}`,
    bad ? '오류는 없지만 결과가 틀렸습니다. 같은 배열을 가리키는 화살표가 여러 개였기 때문입니다.' : 'a의 장바구니에는 a가 담은 것만 있습니다. 화살표가 서로 다른 배열을 가리켰기 때문입니다.',
    bad ? 'error' : 'ok');
  return steps;
}

/** 한 단계의 상태 → 객체 다이어그램 */
export function cartDiagram(s: CartState): Diagram {
  const refRow = (owner: string, k: string, r: Ref): Row =>
    'ref' in r ? { k, ref: r.ref, hl: s.hlRows.includes(`${owner}:${k}`) } : { k, v: r.v, hl: s.hlRows.includes(`${owner}:${k}`) };
  const nodes: DNode[] = [{ id: 'names', col: 0, kind: 'stack', title: '전역 이름', rows: s.names.map(([k, r]) => refRow('names', k, r)) }];
  if (s.frame) nodes.push({ id: 'frame', col: 0, kind: 'frame', title: `${s.frame.fn}() 실행`, rows: s.frame.vars.map(([k, r]) => refRow('frame', k, r)), hl: true });
  for (const o of s.objs.filter((x) => x.kind === 'inst'))
    nodes.push({ id: o.id, col: 1, kind: 'inst', title: `인스턴스 ${o.id}`, rows: o.fields.map(([k, r]) => refRow(o.id, k, r)), proto: 'Cart.prototype', hl: s.hl.includes(o.id) });
  nodes.push({ id: 'Cart.prototype', col: 2, kind: 'proto', title: 'Cart.prototype', rows: [{ k: 'constructor', v: 'ƒ' }, { k: 'add()', v: 'ƒ', hl: s.hlRows.includes('Cart.prototype:add()') }], hl: s.hl.includes('Cart.prototype') });
  for (const o of s.objs.filter((x) => x.kind === 'arr'))
    nodes.push({ id: o.id, col: 2, kind: 'arr', title: `배열 ${o.id}`, rows: o.items.map((x, i) => ({ k: String(i), v: `'${x}'` })), hl: s.hl.includes(o.id) });
  return { nodes, hlProto: s.hlProto };
}
