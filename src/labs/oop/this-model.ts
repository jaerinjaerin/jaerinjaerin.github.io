/**
 * 모델: this는 누가 정하나 (객체지향 1강, 실습 2)
 * 순수 함수. 재현 범위: 메서드 호출 시 this 결정(점 왼쪽), 메서드를 꺼내 따로 부를 때 this 손실,
 * bind로 만든 함수, 화살표 함수 필드. 클래스 본문은 엄격 모드라 따로 부른 메서드의 this는 undefined이다.
 * 오류 문구와 출력은 Node.js 22 실행 결과와 같다.
 */
import type { Step } from '../engine/step-lab';
import type { Diagram, DNode, Row } from './object-diagram';

export type ThisVariant = 'detach' | 'bind' | 'arrow';
type Ref = { ref: string } | { v: string; bad?: boolean };
type Fn = { id: string; title: string; rows: [string, Ref][] };
type Inst = { id: string; fields: [string, Ref][] };
export type ThisState = {
  names: [string, Ref][];
  frame: { fn: string; vars: [string, Ref][] } | null;
  insts: Inst[];
  fns: Fn[];
  protoRows: [string, Ref][];
  out: string[];
  call: { parts: { t: string; role?: 'recv' | 'fn' }[]; thisIs: string } | null;
  hl: string[];
  hlRows: string[];
  hlProto: string[];
};

export function thisCode(v: ThisVariant): string[] {
  const cls = v === 'arrow'
    ? ['class Counter {', '  count = 0;', '  increment = () => {', '    this.count += 1;', '  };', '}']
    : ['class Counter {', '  count = 0;', '  increment() {', '    this.count += 1;', '  }', '}'];
  const lines = [...cls, '', 'const c = new Counter();'];
  if (v === 'arrow') lines.push('const d = new Counter();');
  lines.push('c.increment();', v === 'bind' ? 'const inc = c.increment.bind(c);' : 'const inc = c.increment;', 'inc();', 'console.log(c.count);');
  return lines;
}

export function simulateThis(v: ThisVariant): Step<ThisState>[] {
  const L = (src: string) => thisCode(v).indexOf(src) + 1;
  const steps: Step<ThisState>[] = [];
  const s: ThisState = { names: [], frame: null, insts: [], fns: [], protoRows: [['constructor', { v: 'ƒ' }]], out: [], call: null, hl: [], hlRows: [], hlProto: [] };
  const snap = (): ThisState => JSON.parse(JSON.stringify(s));
  const push = (line: number, phase: string, title: string, detail: string, tone: Step<ThisState>['tone'] = 'normal') => {
    steps.push({ code: 'main', line, phase, title, detail, tone, state: snap() });
    s.hl = []; s.hlRows = []; s.hlProto = []; s.call = null;
  };
  const inst = (id: string) => s.insts.find((o) => o.id === id)!;
  const setCount = (id: string, n: number) => { inst(id).fields.find(([k]) => k === 'count')![1] = { v: String(n) }; s.hlRows.push(`${id}:count`); s.hl.push(id); };

  s.names.push(['Counter', { v: '클래스' }]);
  if (v !== 'arrow') {
    s.fns.push({ id: 'F', title: '함수 increment', rows: [['this', { v: '호출 때 정함' }]] });
    s.protoRows.push(['increment', { ref: 'F' }]);
  }
  s.hl.push('Counter.prototype');
  push(1, '클래스 정의', v === 'arrow' ? 'prototype에는 constructor만 있음' : 'increment 함수는 prototype에 하나만 있음',
    v === 'arrow'
      ? '화살표 함수 필드는 메서드가 아니라 "인스턴스마다 만들어지는 속성"입니다. 그래서 Counter.prototype에는 increment가 없습니다.'
      : '메서드 increment는 함수 객체 F 하나로 Counter.prototype에 저장됩니다. 이 함수는 this가 누구인지 모릅니다. this는 호출될 때 정해집니다.');

  const make = (id: string, name: string, line: number) => {
    s.insts.push({ id, fields: [['count', { v: '0' }]] });
    if (v === 'arrow') {
      const fid = 'F' + id.slice(1);
      s.fns.push({ id: fid, title: `화살표 함수 ${fid}`, rows: [['this(고정)', { ref: id }]] });
      inst(id).fields.push(['increment', { ref: fid }]);
      s.hl.push(fid);
    }
    s.names.push([name, { ref: id }]);
    s.hl.push(id); s.hlProto.push(id); s.hlRows.push(`names:${name}`);
    push(line, '객체 만들기', `new Counter() → ${id}`, v === 'arrow'
      ? `필드 count = 0 과 함께 화살표 함수 ${'F' + id.slice(1)}도 ${id} 전용으로 새로 만들어집니다. 화살표 함수는 만들어지는 순간의 this(${id})를 붙잡아 둡니다.`
      : `필드 count = 0 은 인스턴스마다 실행되어 ${id}에 칸이 생깁니다. increment는 ${id}에 없고 프로토타입에 있습니다.`);
  };
  make('C0', 'c', L('const c = new Counter();'));
  if (v === 'arrow') make('C1', 'd', L('const d = new Counter();'));

  // c.increment()
  const fnOfC = v === 'arrow' ? 'F0' : 'F';
  s.call = { parts: [{ t: 'c', role: 'recv' }, { t: '.' }, { t: 'increment', role: 'fn' }, { t: '()' }], thisIs: 'C0' };
  s.frame = { fn: 'increment', vars: [['this', { ref: 'C0' }]] };
  s.hl.push(fnOfC);
  if (v !== 'arrow') { s.hlProto.push('C0'); s.hlRows.push('Counter.prototype:increment'); }
  push(L('c.increment();'), '첫 호출', 'c.increment() — 점 왼쪽이 this', v === 'arrow'
    ? 'increment를 C0에서 바로 찾습니다(자기 칸). 화살표 함수는 붙잡아 둔 this = C0을 씁니다.'
    : 'increment를 C0에서 못 찾아 프로토타입에서 찾습니다. 호출 식에서 점 왼쪽이 c이므로 this = C0이 됩니다.');
  setCount('C0', 1);
  push(4, '첫 호출', 'this.count += 1 → C0.count = 1', 'this가 C0이므로 C0의 count가 1이 됩니다.', 'ok');
  s.frame = null;

  // const inc = ...
  if (v === 'bind') {
    s.fns.push({ id: 'B', title: '묶인 함수 B', rows: [['원래 함수', { ref: 'F' }], ['this(고정)', { ref: 'C0' }]] });
    s.names.push(['inc', { ref: 'B' }]);
    s.hl.push('B'); s.hlRows.push('names:inc');
    push(L('const inc = c.increment.bind(c);'), '꺼내기', 'bind가 this를 C0에 묶은 새 함수 B를 만듦', 'bind는 원래 함수 F를 고치지 않습니다. "F를 this = C0으로 부르는" 새 함수 B를 만들어 돌려줍니다.', 'ok');
  } else {
    s.names.push(['inc', { ref: fnOfC }]);
    s.hl.push(fnOfC); s.hlRows.push('names:inc');
    push(L('const inc = c.increment;'), '꺼내기', `inc가 함수 ${fnOfC}를 가리킴`, v === 'arrow'
      ? `inc는 화살표 함수 F0을 가리킵니다. F0은 this = C0을 이미 붙잡고 있습니다.`
      : 'inc는 함수 F 자체를 가리킵니다. c와의 연결은 따라오지 않습니다. 함수는 자기가 어느 객체에서 꺼내졌는지 기억하지 않습니다.',
      v === 'detach' ? 'warn' : 'normal');
  }

  // inc()
  s.call = { parts: [{ t: 'inc', role: 'fn' }, { t: '()' }], thisIs: v === 'detach' ? 'undefined' : 'C0' };
  if (v === 'detach') {
    s.frame = { fn: 'increment', vars: [['this', { v: 'undefined', bad: true }]] };
    s.hl.push('F');
    push(L('inc();'), '따로 호출', 'inc() — 점 왼쪽이 없음 → this = undefined', '호출 식에 점 왼쪽이 없습니다. 클래스 본문은 엄격 모드(strict mode)라서 this는 undefined가 됩니다.', 'warn');
    s.out.push("TypeError: Cannot read properties of undefined (reading 'count')");
    s.call = { parts: [{ t: 'inc', role: 'fn' }, { t: '()' }], thisIs: 'undefined' };
    push(4, '따로 호출', 'this.count 읽기 실패 → TypeError', 'undefined에서 count를 읽으려다 오류가 나고 프로그램이 멈춥니다. 마지막 console.log 줄은 실행되지 않습니다.', 'error');
    s.frame = null;
    return steps;
  }
  s.frame = { fn: 'increment', vars: [['this', { ref: 'C0' }]] };
  s.hl.push(v === 'bind' ? 'B' : 'F0');
  push(L('inc();'), '따로 호출', v === 'bind' ? 'inc() — 묶인 함수가 this = C0으로 F를 부름' : 'inc() — 화살표 함수는 붙잡아 둔 this를 씀',
    v === 'bind' ? '점 왼쪽이 없어도 상관없습니다. B는 항상 this = C0으로 F를 호출합니다.' : '화살표 함수에는 자기 this가 없습니다. 호출 방식과 관계없이 만들어질 때의 this(C0)를 씁니다.');
  setCount('C0', 2);
  push(4, '따로 호출', 'this.count += 1 → C0.count = 2', 'C0의 count가 2가 됩니다.', 'ok');
  s.frame = null;
  s.out.push('2');
  s.hlRows.push('C0:count');
  push(L('console.log(c.count);'), '출력', 'console.log(c.count) → 2', v === 'arrow'
    ? '결과는 맞습니다. 대신 인스턴스마다 함수가 하나씩(F0, F1) 생겼습니다. 객체가 많으면 메모리를 더 씁니다.'
    : '결과가 맞습니다. this를 명시적으로 묶었기 때문입니다.', 'ok');
  return steps;
}

export function thisDiagram(s: ThisState): Diagram {
  const row = (owner: string, k: string, r: Ref): Row =>
    'ref' in r ? { k, ref: r.ref, hl: s.hlRows.includes(`${owner}:${k}`) } : { k, v: r.v, bad: r.bad, hl: s.hlRows.includes(`${owner}:${k}`) };
  const nodes: DNode[] = [{ id: 'names', col: 0, kind: 'stack', title: '전역 이름', rows: s.names.map(([k, r]) => row('names', k, r)) }];
  if (s.frame) nodes.push({ id: 'frame', col: 0, kind: 'frame', title: `${s.frame.fn}() 실행`, rows: s.frame.vars.map(([k, r]) => row('frame', k, r)), hl: true });
  for (const o of s.insts) nodes.push({ id: o.id, col: 1, kind: 'inst', title: `인스턴스 ${o.id}`, rows: o.fields.map(([k, r]) => row(o.id, k, r)), proto: 'Counter.prototype', hl: s.hl.includes(o.id) });
  nodes.push({ id: 'Counter.prototype', col: 2, kind: 'proto', title: 'Counter.prototype', rows: s.protoRows.map(([k, r]) => row('Counter.prototype', k, r)), hl: s.hl.includes('Counter.prototype') });
  for (const f of s.fns) nodes.push({ id: f.id, col: 2, kind: 'fn', title: f.title, rows: f.rows.map(([k, r]) => row(f.id, k, r)), hl: s.hl.includes(f.id) });
  return { nodes, hlProto: s.hlProto };
}
