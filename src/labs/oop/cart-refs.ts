/** 실습 1: 장바구니 화살표 따라가기 — 참조 공유와 프로토타입 (교육용 시뮬레이션) */
import { mountStepLab, h, type Step } from '../engine/step-lab';
import { renderDiagram, legend } from './object-diagram';
import { cartCode, cartDiagram, show, simulateCart, type CartState, type CartVariant } from './cart-model';

const GOODS = ['사과', '우유', '빵'];

export function lookBox(look: { expr: string; path: { where: string; hit: boolean; what?: string }[] }) {
  return h('div', { class: 'sv-box od-look' },
    h('div', { class: 'sv-label' }, h('span', { text: '찾아가는 길' }), h('code', { text: look.expr })),
    h('ol', { class: 'od-path' }, ...look.path.map((p) => h('li', { 'data-hit': String(p.hit) },
      h('span', { text: p.where }), h('strong', { text: p.hit ? `있음: ${p.what}` : '없음 → 점선 따라 위로' })))));
}

export function diagramBox(svg: string) {
  const box = h('div', { class: 'sv-box od-wrap' });
  box.innerHTML = svg + legend;
  return box;
}

export function mountCartRefsLab(root: HTMLElement) {
  let n = 2;
  mountStepLab<CartState>(root, {
    title: '장바구니 화살표 따라가기',
    mode: 'simulation',
    modeNote: 'new, 생성자, 메서드 탐색이 메모리에서 하는 일을 그림으로 재현합니다. 출력은 같은 코드를 Node.js 22에서 실행한 결과와 같습니다.',
    variants: [
      { id: 'shared', label: '같은 배열 넘기기', buggy: true, note: '흔한 실수: 빈 배열 하나를 만들어 두고 여러 생성자에 넘긴다.' },
      { id: 'fresh', label: '호출마다 [] (정답)', note: '올바른 방식 1: 생성자를 부를 때마다 새 배열 [] 를 넘긴다.' },
      { id: 'copy', label: '방어적 복사 (정답)', note: '올바른 방식 2: 같은 배열을 넘겨도 생성자가 [...items]로 복사해 자기 배열을 만든다.' },
    ],
    controls(host, change) {
      const sel = h('select', { class: 'sl-input', id: 'cr-n' }, ...[2, 3].map((k) => h('option', { value: String(k), text: `${k}개`, selected: k === n })));
      sel.addEventListener('change', () => { n = Number(sel.value); change(); });
      host.append(h('div', { class: 'sl-field' }, h('label', { for: 'cr-n', text: '장바구니 수' }), sel));
    },
    codeBlocks: (v) => [{ id: 'main', title: 'cart.ts', code: cartCode(v as CartVariant, n).join('\n') }],
    build: (v) => simulateCart(v as CartVariant, n),
    renderState(host, step: Step<CartState>) {
      host.append(diagramBox(renderDiagram(cartDiagram(step.state), `${step.title} 상태의 객체 다이어그램`)));
      if (step.state.look) host.append(lookBox(step.state.look));
      host.append(h('div', {}, h('div', { class: 'small muted', text: '출력' }), h('div', { class: 'sv-log od-out', text: step.state.out.join('\n') || ' ' })));
    },
    predict: (v) => ({
      prompt: `장바구니 ${n}개. 마지막 console.log(a.items)의 출력은?`,
      kind: 'choice',
      choices: [
        { value: 'own', label: show([GOODS[0]]) },
        { value: 'all', label: show(GOODS.slice(0, n)) },
        { value: 'empty', label: '[]' },
        { value: 'err', label: 'TypeError' },
      ],
      answer: v === 'shared' ? 'all' : 'own',
      explain: () => v === 'shared'
        ? '모든 장바구니의 items 화살표가 배열 A0 하나로 모였고, push가 그 하나를 계속 바꿨습니다.'
        : '장바구니마다 items 화살표가 서로 다른 배열을 가리켰습니다.',
    }),
    onFinish(last, v, host) {
      const arrays = last.state.objs.filter((o) => o.kind === 'arr').length;
      host.append(h('div', { class: 'sv-box' },
        h('div', { class: 'sv-label' }, h('span', { text: '관찰 기록' })),
        h('p', { style: 'margin:0', text: `배열 ${arrays}개, 장바구니 ${n}개. ` + (v === 'shared'
          ? '장바구니 수를 바꿔도 배열은 1개입니다. 화살표만 늘어납니다.'
          : v === 'fresh' ? '장바구니 하나에 배열 하나입니다.' : '넘겨받은 A0는 그대로 남고, 장바구니마다 복사본이 생겼습니다.') + ' Cart.prototype의 add는 어느 모드에서나 하나뿐이라는 점도 확인해 보세요.' }),
      ));
    },
  });
}
