/**
 * 공통 실습 엔진 (Step Lab)
 * ------------------------------------------------------------
 * 모든 과목의 "단계 실행형" 실습이 공유하는 뼈대.
 *  - 변형(variant) 선택: 올바른 방식 / 🐞 고장 모드(흔한 실수)를 나란히 비교
 *  - 변수 조작: controls()로 슬라이더·선택 등을 추가하면 바뀔 때마다 다시 계산
 *  - 예측 → 실행 → 설명: predict()가 있으면 예측 전에는 실행할 수 없고, 마지막에 채점
 *  - 단계 실행: 처음 / 이전 / 다음 / 자동 재생 / 타임라인 / 키보드(←, →)
 *  - 숨은 상태 시각화: renderState()가 매 단계의 상태 스냅샷을 그린다 (되감기 = 다른 스냅샷 그리기)
 *  - 실행 구분 배지: [시뮬레이션] / [실제 실행]
 *
 * 각 실습은 "단계 배열을 만드는 순수 함수(build)"와 "상태를 그리는 함수(renderState)"만 작성하면 된다.
 */

export type CodeBlock = { id: string; title: string; code: string };

export type Step<S> = {
  code?: string;            // 강조할 코드 블록 id
  line?: number;            // 강조할 줄 (1부터)
  phase: string;            // 예: "이벤트 처리", "렌더", "커밋"
  title: string;
  detail: string;
  tone?: 'normal' | 'warn' | 'error' | 'ok';
  state: S;
};

export type Variant = { id: string; label: string; buggy?: boolean; note?: string };

export type Prediction = {
  prompt: string;
  kind: 'number' | 'choice';
  choices?: { value: string; label: string }[];
  answer: string;
  explain: (guess: string, correct: boolean) => string;
};

export type LabApi = { rebuild: () => void; variant: () => string; goTo: (i: number) => void; root: HTMLElement };

export interface StepLabConfig<S> {
  title: string;
  mode: 'simulation' | 'real';
  modeNote: string;
  variants: Variant[];
  initialVariant?: string;
  controls?: (host: HTMLElement, change: () => void, api: LabApi) => void;
  codeBlocks: (variant: string) => CodeBlock[];
  build: (variant: string) => Step<S>[];
  renderState: (host: HTMLElement, step: Step<S>, ctx: { variant: string; index: number; steps: Step<S>[] }) => void;
  predict?: (variant: string) => Prediction | null;
  onFinish?: (last: Step<S>, variant: string, host: HTMLElement, api: LabApi) => void;
}

/* ---------- 작은 DOM 도우미 ---------- */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | undefined> = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'text') el.textContent = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

const KEYWORDS = /^(class|this|extends|static|private|public|readonly|interface|implements|abstract|function|const|let|var|return|if|else|for|of|in|while|typeof|import|from|export|default|new|true|false|null|undefined|def|self|None|True|False|pass|raise|elif|lambda)$/;

/** 아주 작은 문법 강조기 (의존성 없음, 텍스트 노드로 안전하게 생성) */
export function highlight(line: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  const re = /\/\/.*$|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|=>|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b/g;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > i) frag.append(line.slice(i, m.index));
    const t = m[0];
    let cls = '';
    if (t.startsWith('//')) cls = 'c';
    else if (/^['"`]/.test(t)) cls = 's';
    else if (t === '=>') cls = 'k';
    else if (/^\d/.test(t)) cls = 'n';
    else if (KEYWORDS.test(t)) cls = 'k';
    else if (/^(use[A-Z]\w*|set[A-Z]\w*)$/.test(t)) cls = 'f';
    else if (/^[A-Z]/.test(t)) cls = 't';
    if (cls) frag.append(h('span', { class: 'tk-' + cls, text: t }));
    else frag.append(t);
    i = m.index + t.length;
  }
  if (i < line.length) frag.append(line.slice(i));
  return frag;
}

const SPEEDS: Record<string, number> = { slow: 2200, normal: 1400, fast: 700 };

export function mountStepLab<S>(root: HTMLElement, cfg: StepLabConfig<S>): LabApi {
  root.classList.add('sl');
  root.replaceChildren();

  let variant = cfg.initialVariant ?? cfg.variants[0].id;
  let steps: Step<S>[] = [];
  let index = 0;
  let timer = 0;
  let predicted: string | null = null; // null = 아직 예측 안 함, '' = 건너뜀
  let speed = 'normal';

  /* ----- 골격 ----- */
  const badge = h('span', { class: 'badge ' + (cfg.mode === 'real' ? 'real' : 'sim'), text: cfg.mode === 'real' ? '실제 실행' : '시뮬레이션' });
  const head = h('div', { class: 'sl-head' },
    h('div', { class: 'sl-title' }, badge, h('strong', { text: cfg.title })),
    h('p', { class: 'sl-mode small muted', text: cfg.modeNote }),
  );
  const variantBar = h('div', { class: 'sl-variants', role: 'group', 'aria-label': '코드 선택' });
  const variantNote = h('p', { class: 'sl-variant-note small' });
  const controlsHost = h('div', { class: 'sl-controls' });
  const predictHost = h('div', { class: 'sl-predict' });
  const narration = h('div', { class: 'sl-narration', 'aria-live': 'polite' });
  const codeHost = h('div', { class: 'sl-code-host' });
  const stateHost = h('div', { class: 'sl-state' });
  const resultHost = h('div', { class: 'sl-result' });
  const finishHost = h('div', { class: 'sl-finish' });

  const btnFirst = h('button', { class: 'btn secondary', type: 'button', 'aria-label': '처음으로', text: '⏮' });
  const btnPrev = h('button', { class: 'btn secondary', type: 'button', 'aria-label': '이전 단계', text: '◀ 이전' });
  const btnNext = h('button', { class: 'btn', type: 'button', 'aria-label': '다음 단계', text: '다음 ▶' });
  const btnPlay = h('button', { class: 'btn secondary', type: 'button', 'aria-label': '자동 재생', text: '⏯' });
  const speedSel = h('select', { class: 'sl-speed', 'aria-label': '재생 속도' },
    h('option', { value: 'slow', text: '느리게' }),
    h('option', { value: 'normal', text: '보통', selected: true }),
    h('option', { value: 'fast', text: '빠르게' }),
  );
  const timeline = h('input', { class: 'sl-timeline', type: 'range', min: '0', max: '0', value: '0', 'aria-label': '실행 타임라인' });
  const counter = h('span', { class: 'sl-counter small muted' });
  const transport = h('div', { class: 'sl-transport' },
    h('div', { class: 'sl-buttons' }, btnFirst, btnPrev, btnNext, btnPlay, speedSel),
    h('div', { class: 'sl-time' }, timeline, counter),
  );

  root.append(
    head, variantBar, variantNote, controlsHost, predictHost,
    narration,
    transport,
    h('div', { class: 'sl-grid' }, codeHost, stateHost),
    resultHost, finishHost,
  );

  const api: LabApi = { rebuild, variant: () => variant, goTo, root };

  /* ----- 변형 선택 ----- */
  function paintVariants() {
    variantBar.replaceChildren();
    for (const v of cfg.variants) {
      const b = h('button', {
        type: 'button', class: 'sl-variant' + (v.buggy ? ' buggy' : ''),
        'aria-pressed': String(v.id === variant), text: (v.buggy ? '🐞 ' : '') + v.label,
      });
      b.addEventListener('click', () => { if (variant !== v.id) { variant = v.id; predicted = null; paintVariants(); rebuild(); } });
      variantBar.append(b);
    }
    const cur = cfg.variants.find((v) => v.id === variant);
    variantNote.textContent = cur?.note ?? '';
    variantNote.hidden = !cur?.note;
    variantNote.classList.toggle('buggy', Boolean(cur?.buggy));
  }

  /* ----- 예측 ----- */
  function paintPredict() {
    predictHost.replaceChildren();
    const p = cfg.predict?.(variant);
    if (!p) { predicted = predicted ?? ''; return; }
    if (predicted !== null) {
      predictHost.append(h('div', { class: 'sl-predicted small' },
        predicted === '' ? '예측을 건너뛰었습니다.' : `내 예측: ${labelOf(p, predicted)}`,
      ));
      return;
    }
    const box = h('div', { class: 'sl-predict-box' }, h('strong', { text: '🔮 실행 전에 예측해 보세요' }), h('p', { text: p.prompt }));
    let input: HTMLInputElement | HTMLSelectElement;
    if (p.kind === 'number') {
      input = h('input', { type: 'number', inputmode: 'numeric', class: 'sl-input', 'aria-label': '예측 값' });
    } else {
      input = h('select', { class: 'sl-input', 'aria-label': '예측 선택' }, h('option', { value: '', text: '선택하세요' }),
        ...(p.choices ?? []).map((c) => h('option', { value: c.value, text: c.label })));
    }
    const ok = h('button', { class: 'btn', type: 'button', text: '예측 확정하고 실행' });
    const skip = h('button', { class: 'btn ghost', type: 'button', text: '건너뛰기' });
    ok.addEventListener('click', () => {
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      predicted = v; paintPredict(); paintStep();
    });
    skip.addEventListener('click', () => { predicted = ''; paintPredict(); paintStep(); });
    input.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') ok.click(); });
    box.append(h('div', { class: 'row' }, input, ok, skip));
    predictHost.append(box);
  }
  function labelOf(p: Prediction, v: string) {
    return p.kind === 'choice' ? (p.choices?.find((c) => c.value === v)?.label ?? v) : v;
  }

  /* ----- 코드 ----- */
  function paintCode(step: Step<S>) {
    const blocks = cfg.codeBlocks(variant);
    codeHost.replaceChildren();
    for (const b of blocks) {
      const active = step.code ? step.code === b.id : b === blocks[0];
      const lines = b.code.split('\n');
      const pre = h('div', { class: 'sl-code', role: 'region', 'aria-label': b.title });
      lines.forEach((ln, i) => {
        const cur = active && step.line === i + 1;
        const row = h('div', { class: 'sl-ln', 'data-cur': cur ? 'true' : undefined },
          h('span', { class: 'no', text: String(i + 1), 'aria-hidden': 'true' }),
          h('span', { class: 'src' }, highlight(ln || ' ')),
        );
        if (cur) row.setAttribute('aria-current', 'step');
        pre.append(row);
      });
      codeHost.append(h('div', { class: 'sl-code-wrap', 'data-active': String(active) },
        h('div', { class: 'sl-code-title small' }, h('span', { text: b.title }), active ? h('span', { class: 'sl-now', text: '● 실행 중' }) : null),
        pre,
      ));
    }
  }

  /* ----- 단계 그리기 ----- */
  function locked() { return Boolean(cfg.predict?.(variant)) && predicted === null; }

  function paintStep() {
    const step = steps[index];
    if (!step) return;
    narration.replaceChildren(
      h('div', { class: 'sl-phase small', text: `${index + 1} / ${steps.length} · ${step.phase}` }),
      h('strong', { class: 'sl-step-title', text: step.title }),
      h('p', { class: 'sl-step-detail', text: step.detail }),
    );
    narration.dataset.tone = step.tone ?? 'normal';
    paintCode(step);
    stateHost.replaceChildren();
    cfg.renderState(stateHost, step, { variant, index, steps });

    const isLocked = locked();
    root.classList.toggle('sl-locked', isLocked);
    transport.hidden = isLocked; // 예측 전에는 조작 바를 숨긴다
    btnFirst.disabled = isLocked || index === 0;
    btnPrev.disabled = isLocked || index === 0;
    btnNext.disabled = isLocked || index === steps.length - 1;
    btnPlay.disabled = isLocked || index === steps.length - 1;
    timeline.disabled = isLocked;
    timeline.max = String(steps.length - 1);
    timeline.value = String(index);
    counter.textContent = `${index + 1}/${steps.length}`;
    if (index === steps.length - 1) stop();
    btnPlay.textContent = timer ? '⏸' : '⏯';
    btnPlay.setAttribute('aria-label', timer ? '일시 정지' : '자동 재생');

    resultHost.replaceChildren();
    finishHost.replaceChildren();
    if (index === steps.length - 1) {
      const p = cfg.predict?.(variant);
      if (p && predicted) {
        const correct = String(predicted).trim() === String(p.answer);
        resultHost.append(h('div', { class: 'sl-verdict ' + (correct ? 'ok' : 'no') },
          h('strong', { text: correct ? `✅ 예측 적중! (${labelOf(p, predicted)})` : `❗ 예측: ${labelOf(p, predicted)} → 실제: ${labelOf(p, p.answer)}` }),
          h('p', { text: p.explain(predicted, correct) }),
        ));
      }
      cfg.onFinish?.(step, variant, finishHost, api);
    }
  }

  function goTo(i: number) {
    if (locked()) return;
    index = Math.max(0, Math.min(steps.length - 1, i));
    paintStep();
  }
  function stop() { if (timer) { clearInterval(timer); timer = 0; } }
  function play() {
    if (timer) { stop(); paintStep(); return; }
    if (index >= steps.length - 1) index = 0;
    timer = window.setInterval(() => goTo(index + 1), SPEEDS[speed]);
    paintStep();
  }

  function rebuild() {
    stop();
    steps = cfg.build(variant);
    index = 0;
    paintPredict();
    paintStep();
  }

  btnFirst.addEventListener('click', () => { stop(); goTo(0); });
  btnPrev.addEventListener('click', () => { stop(); goTo(index - 1); });
  btnNext.addEventListener('click', () => { stop(); goTo(index + 1); });
  btnPlay.addEventListener('click', play);
  speedSel.addEventListener('change', () => { speed = speedSel.value; if (timer) { stop(); play(); } });
  timeline.addEventListener('input', () => { stop(); goTo(Number(timeline.value)); });
  root.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('input, select, textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stop(); goTo(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); goTo(index - 1); }
  });
  // 화면 밖으로 나가면 자동 재생 정지
  new IntersectionObserver((es) => { if (!es[0].isIntersecting && timer) { stop(); paintStep(); } }).observe(root);

  paintVariants();
  cfg.controls?.(controlsHost, () => { predicted = null; rebuild(); }, api);
  rebuild();
  return api;
}
