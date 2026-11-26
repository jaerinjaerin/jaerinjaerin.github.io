/** 실습 2: this는 누가 정하나 — 호출 식과 this 결정 (교육용 시뮬레이션) */
import { mountStepLab, h, type Step } from '../engine/step-lab';
import { renderDiagram } from './object-diagram';
import { diagramBox } from './cart-refs';
import { simulateThis, thisCode, thisDiagram, type ThisState, type ThisVariant } from './this-model';

function callBox(call: NonNullable<ThisState['call']>) {
  const hasRecv = call.parts.some((p) => p.role === 'recv');
  const parts = call.parts.map((p) => h('span', { class: 'part' + (p.role === 'recv' ? ' recv' : '') },
    h('span', { text: p.t }), p.role === 'recv' ? h('small', { text: 'this가 됨' }) : h('small', { text: ' ' })));
  if (!hasRecv) parts.unshift(h('span', { class: 'part none', text: '점 왼쪽 없음' }));
  return h('div', { class: 'sv-box' },
    h('div', { class: 'sv-label' }, h('span', { text: '호출 식' }), h('span', { text: `this = ${call.thisIs}` })),
    h('div', { class: 'od-call' }, ...parts));
}

export function mountThisBindingLab(root: HTMLElement) {
  mountStepLab<ThisState>(root, {
    title: 'this는 누가 정하나',
    mode: 'simulation',
    modeNote: '메서드를 부를 때 this가 정해지는 규칙을 그림으로 재현합니다. 오류 문구와 출력은 같은 코드를 Node.js 22에서 실행한 결과와 같습니다.',
    variants: [
      { id: 'detach', label: '메서드 꺼내서 부르기', buggy: true, note: '흔한 실수: const inc = c.increment; 로 메서드만 꺼내 따로 부른다. 이벤트 핸들러나 콜백으로 넘길 때 똑같이 일어난다.' },
      { id: 'bind', label: 'bind로 묶기 (정답)', note: '해결 1: c.increment.bind(c)로 this를 c에 묶은 새 함수를 만든다.' },
      { id: 'arrow', label: '화살표 함수 필드 (정답)', note: '해결 2: increment = () => {…} 로 선언해 인스턴스마다 this가 고정된 함수를 둔다. 대가가 무엇인지도 보세요.' },
    ],
    codeBlocks: (v) => [{ id: 'main', title: 'counter.ts', code: thisCode(v as ThisVariant).join('\n') }],
    build: (v) => simulateThis(v as ThisVariant),
    renderState(host, step: Step<ThisState>) {
      if (step.state.call) host.append(callBox(step.state.call));
      host.append(diagramBox(renderDiagram(thisDiagram(step.state), `${step.title} 상태의 객체 다이어그램`)));
      host.append(h('div', {}, h('div', { class: 'small muted', text: '출력' }), h('div', { class: 'sv-log od-out', text: step.state.out.join('\n') || ' ' })));
    },
    predict: (v) => ({
      prompt: '이 코드를 끝까지 실행하면?',
      kind: 'choice',
      choices: [
        { value: '1', label: '1이 출력된다' },
        { value: '2', label: '2가 출력된다' },
        { value: 'nan', label: 'NaN이 출력된다' },
        { value: 'err', label: 'TypeError로 멈춘다' },
      ],
      answer: v === 'detach' ? 'err' : '2',
      explain: () => v === 'detach'
        ? 'inc()에는 점 왼쪽이 없어서 this가 undefined였고, undefined.count를 읽다가 멈췄습니다.'
        : v === 'bind' ? 'bind로 만든 함수는 점 왼쪽과 상관없이 this = C0으로 원래 함수를 부릅니다.' : '화살표 함수는 만들어질 때의 this(C0)를 그대로 씁니다.',
    }),
    onFinish(last, v, host) {
      const fns = last.state.fns.length;
      host.append(h('div', { class: 'sv-box' },
        h('div', { class: 'sv-label' }, h('span', { text: '관찰 기록' })),
        h('p', { style: 'margin:0', text: v === 'arrow'
          ? `함수 객체 ${fns}개(인스턴스마다 하나). 프로토타입 메서드는 인스턴스가 1000개여도 함수가 1개지만, 화살표 함수 필드는 1000개가 됩니다.`
          : v === 'bind' ? '함수 F는 그대로 1개이고, 묶인 함수 B가 하나 더 생겼습니다. 필요한 곳에서만 묶으면 됩니다.'
          : '함수 F는 this를 기억하지 않습니다. this는 정의한 곳이 아니라 부르는 모양(호출 식)이 정합니다.' }),
      ));
    },
  });
}
