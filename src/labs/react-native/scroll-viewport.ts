/**
 * 실습: ScrollView의 뷰포트·콘텐츠 크기·경계 높이 (React Native 19강)
 * 교육용 시뮬레이션 — Yoga 레이아웃과 네이티브 스크롤 뷰의 동작을 숫자 모델로 단순화했다.
 *   viewport = ScrollView 자신의 높이 (부모가 정해 줌)
 *   content  = contentContainer 높이 = 위아래 padding + 자식 높이 합 + 간격
 *   스크롤 가능 거리 = max(0, content − viewport)
 */
import { mountStepLab, h, type Step } from '../engine/step-lab';

const SCREEN = 640;   // 기기 화면 높이(가정)
const HEADER = 80;    // 위쪽 헤더
const ITEM = 72;      // 항목 높이
const GAP = 8;
const PAD = 16;       // contentContainerStyle padding

type S = {
  viewport: number | null;   // ScrollView 높이
  content: number | null;    // 콘텐츠 높이
  mounted: number;           // 만들어진 자식 수
  offset: number;            // 스크롤 위치
  max: number | null;        // 최대 스크롤 거리
  clipped: number;           // 화면 밖으로 잘려 영영 못 보는 높이 (고장 모드)
  wanted: number;            // 사용자가 끌고 싶은 거리
  focus?: string;
};

export function contentHeight(n: number) {
  return PAD * 2 + n * ITEM + Math.max(0, n - 1) * GAP;
}

export function simulateScroll(variant: 'bounded' | 'unbounded', n: number, want: number): Step<S>[] {
  const steps: Step<S>[] = [];
  let st: S = { viewport: null, content: null, mounted: 0, offset: 0, max: null, clipped: 0, wanted: want };
  const push = (s: Omit<Step<S>, 'state'>, patch: Partial<S>) => { st = { ...st, ...patch }; steps.push({ ...s, code: 'main', state: st }); };
  const content = contentHeight(n);
  const avail = SCREEN - HEADER;

  push({ line: 5, phase: '레이아웃', title: '부모(View) 높이 계산',
    detail: variant === 'bounded'
      ? `부모 View에 flex: 1이 있어 화면(${SCREEN})에서 헤더(${HEADER})를 뺀 ${avail}px을 차지합니다. 이 높이가 ScrollView에 "경계"로 내려갑니다.`
      : `부모 View에 높이도 flex도 없습니다. 부모는 자식(ScrollView) 크기에 맞춰 늘어나는 "경계 없는" 상자가 됩니다.`,
    tone: variant === 'bounded' ? 'normal' : 'warn' }, { focus: 'viewport' });

  const marks = [...new Set([1, Math.ceil(n / 2), n])];
  for (const m of marks) {
    push({ line: 10, phase: '렌더', title: `자식 ${m}/${n}개 생성`,
      detail: m === n
        ? `map이 만든 자식 ${n}개가 모두 만들어졌습니다. ScrollView는 보이든 안 보이든 자식을 한꺼번에 만듭니다(화면에 보이는 것은 일부뿐).`
        : `ScrollView는 자식을 "보일 때" 만드는 게 아니라 지금 전부 만듭니다. ${m}번째까지 생성.`,
    }, { mounted: m, focus: 'mounted' });
  }

  push({ line: 8, phase: '레이아웃', title: `콘텐츠 높이 = ${content}px`,
    detail: `위아래 padding ${PAD}×2 + 항목 ${ITEM}×${n} + 간격 ${GAP}×${Math.max(0, n - 1)} = ${content}px. contentContainerStyle의 padding은 이 "안쪽 상자"에 들어갑니다.`,
  }, { content, focus: 'content' });

  if (variant === 'bounded') {
    const max = Math.max(0, content - avail);
    push({ line: 6, phase: '레이아웃', title: `뷰포트 ${avail}px → 스크롤 가능 거리 ${max}px`,
      detail: max > 0
        ? `ScrollView 높이(뷰포트)는 부모가 준 ${avail}px. 콘텐츠가 ${content - avail}px 더 길기 때문에 그만큼 스크롤할 수 있습니다.`
        : `콘텐츠(${content})가 뷰포트(${avail})보다 짧아 스크롤할 거리가 없습니다. 이럴 땐 ScrollView가 필요 없을 수도 있습니다.`,
      tone: 'ok' }, { viewport: avail, max, focus: 'viewport' });
    const to = Math.min(want, max);
    push({ line: 6, phase: '스크롤', title: `손가락으로 ${want}px 끌기 → 위치 ${to}px`,
      detail: want > max
        ? `요청한 ${want}px은 최대치 ${max}px을 넘으므로 ${max}px에서 멈춥니다(iOS는 살짝 튕겼다 돌아옴). 스크롤은 네이티브 UI 스레드에서 처리되어 JS가 바빠도 부드럽게 움직입니다.`
        : `콘텐츠가 위로 ${to}px 이동합니다. 스크롤 자체는 네이티브 UI 스레드에서 처리되고, JS는 onScroll 이벤트로 나중에 위치를 전달받습니다.`,
      tone: 'ok' }, { offset: to, focus: 'offset' });
  } else {
    const clipped = Math.max(0, content - avail);
    push({ line: 6, phase: '레이아웃', title: `뷰포트 = 콘텐츠 = ${content}px (경계 없음)`,
      detail: `부모가 높이를 정해 주지 않으니 ScrollView도 콘텐츠만큼 늘어납니다. 뷰포트와 콘텐츠가 같으므로 스크롤 가능 거리는 0입니다.`,
      tone: 'error' }, { viewport: content, max: 0, clipped, focus: 'viewport' });
    push({ line: 6, phase: '스크롤', title: `손가락으로 ${want}px 끌기 → 움직이지 않음`,
      detail: clipped > 0
        ? `화면에는 ${avail}px만 보이고, 아래 ${clipped}px은 화면 밖으로 잘려 영영 볼 수 없습니다. 오류 메시지도 없어 찾기 어려운 버그입니다. 해결: 부모에 flex: 1(경계 높이)을 주세요.`
        : `콘텐츠가 짧아 잘리지는 않았지만, 항목이 늘어나는 순간 아래가 잘리기 시작합니다.`,
      tone: 'error' }, { offset: 0, focus: 'offset' });
  }
  return steps;
}

function renderState(host: HTMLElement, step: Step<S>) {
  const s = step.state;
  const avail = SCREEN - HEADER;
  const content = s.content ?? 0;
  const scale = 0.28;
  const vp = s.viewport ?? avail;
  const phone = h('div', { class: 'sv-sv-phone' });
  phone.style.height = SCREEN * scale + 'px';
  const header = h('div', { class: 'sv-sv-header', text: '헤더' });
  header.style.height = HEADER * scale + 'px';
  const port = h('div', { class: 'sv-sv-port' + (s.max === 0 && (s.clipped ?? 0) > 0 ? ' bad' : '') });
  port.style.height = Math.min(vp, avail) * scale + 'px';
  const col = h('div', { class: 'sv-sv-content' });
  col.style.transform = `translateY(${-s.offset * scale}px)`;
  col.style.padding = PAD * scale + 'px';
  col.style.gap = GAP * scale + 'px';
  for (let i = 0; i < s.mounted; i++) {
    const it = h('div', { class: 'sv-sv-item', text: String(i + 1) });
    it.style.height = ITEM * scale + 'px';
    col.append(it);
  }
  port.append(col);
  phone.append(header, port);

  const rows: [string, string, string?][] = [
    ['뷰포트(ScrollView 높이)', s.viewport === null ? '?' : `${s.viewport}px`, 'viewport'],
    ['콘텐츠 높이', s.content === null ? '?' : `${s.content}px`, 'content'],
    ['스크롤 가능 거리', s.max === null ? '?' : `${s.max}px`, 'viewport'],
    ['현재 스크롤 위치', `${s.offset}px`, 'offset'],
    ['만들어진 자식', `${s.mounted}개`, 'mounted'],
  ];
  if (s.clipped) rows.push(['화면 밖으로 잘린 높이', `${s.clipped}px`, 'viewport']);
  const table = h('div', { class: 'sv-box' }, h('div', { class: 'sv-label' }, h('span', { text: '📏 측정값' })),
    ...rows.map(([k, v, f]) => h('div', { class: 'sv-sv-row', 'data-flash': String(s.focus === f) }, h('span', { text: k }), h('strong', { text: v }))));
  host.append(h('div', { class: 'sv-sv-wrap' }, h('div', { class: 'sv-box' }, h('div', { class: 'sv-label' }, h('span', { text: '📱 화면 (축소)' })), phone), table));
  void content;
}

const CODE = {
  bounded: [
    'export default function Settings() {',
    '  return (',
    '    <View style={{ flex: 1 }}>',
    '      <Header />',
    '      <View style={{ flex: 1 }}>          {/* 경계 높이 ✓ */}',
    '        <ScrollView',
    '          style={{ flex: 1 }}',
    '          contentContainerStyle={{ padding: 16, gap: 8 }}>',
    '          {items.map((item) => (',
    '            <Row key={item.id} item={item} />',
    '          ))}',
    '        </ScrollView>',
    '      </View>',
    '    </View>',
    '  );',
    '}',
  ].join('\n'),
  unbounded: [
    'export default function Settings() {',
    '  return (',
    '    <View style={{ flex: 1 }}>',
    '      <Header />',
    '      <View>                              {/* 🐞 높이·flex 없음 */}',
    '        <ScrollView',
    '          style={{ flex: 1 }}',
    '          contentContainerStyle={{ padding: 16, gap: 8 }}>',
    '          {items.map((item) => (',
    '            <Row key={item.id} item={item} />',
    '          ))}',
    '        </ScrollView>',
    '      </View>',
    '    </View>',
    '  );',
    '}',
  ].join('\n'),
};

export function mountScrollViewportLab(root: HTMLElement) {
  let n = 12;
  let want = 300;
  mountStepLab<S>(root, {
    title: 'ScrollView는 언제 스크롤될까?',
    mode: 'simulation',
    modeNote: '레이아웃(Yoga)과 네이티브 스크롤 뷰의 크기 계산을 숫자 모델로 단순화했습니다. 화면 높이 640px, 헤더 80px, 항목 72px을 가정합니다.',
    variants: [
      { id: 'bounded', label: '부모에 flex: 1', note: '올바른 방식: ScrollView의 모든 조상이 경계 높이를 갖도록 flex: 1을 내려 줍니다.' },
      { id: 'unbounded', label: '부모 높이 없음', buggy: true, note: '흔한 실수: 중간 View에 flex: 1을 빠뜨림. 오류 없이 "스크롤이 안 돼요"가 됩니다.' },
    ],
    controls(host, change) {
      const mk = (label: string, id: string, min: number, max: number, stepv: number, get: () => number, set: (v: number) => void, unit = '') => {
        const out = h('output', { text: get() + unit });
        const r = h('input', { type: 'range', id, min: String(min), max: String(max), step: String(stepv), value: String(get()) });
        r.addEventListener('input', () => { set(Number(r.value)); out.textContent = r.value + unit; change(); });
        return h('div', { class: 'sl-field' }, h('label', { for: id }, label + ': ', out), r);
      };
      host.append(
        mk('항목 수', 'sv-n', 2, 30, 1, () => n, (v) => (n = v), '개'),
        mk('끌고 싶은 거리', 'sv-want', 0, 2000, 50, () => want, (v) => (want = v), 'px'),
      );
    },
    codeBlocks: (v) => [{ id: 'main', title: v === 'bounded' ? 'Settings.js' : '🐞 Settings.js', code: CODE[v as 'bounded'] }],
    build: (v) => simulateScroll(v as 'bounded' | 'unbounded', n, want),
    renderState,
    predict: (v) => {
      const max = v === 'bounded' ? Math.max(0, contentHeight(n) - (SCREEN - HEADER)) : 0;
      return {
        prompt: `항목 ${n}개일 때 스크롤할 수 있는 최대 거리는 몇 px일까요? (화면 640, 헤더 80, 항목 72, 간격 8, 위아래 padding 16)`,
        kind: 'number',
        answer: String(max),
        explain: (_g, ok) => (ok ? '정확합니다. ' : '') + (v === 'bounded'
          ? `콘텐츠 ${contentHeight(n)}px − 뷰포트 ${SCREEN - HEADER}px = ${max}px (음수면 0). 스크롤 거리는 "콘텐츠가 뷰포트보다 얼마나 긴가"입니다.`
          : '부모에 경계 높이가 없으면 ScrollView가 콘텐츠만큼 늘어나 뷰포트 = 콘텐츠가 되므로 스크롤 거리는 0입니다. 넘치는 부분은 화면 밖에서 잘립니다.'),
      };
    },
  });
}
