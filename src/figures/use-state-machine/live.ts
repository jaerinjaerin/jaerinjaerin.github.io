/**
 * Fig 4-1 동작 코드. 단계는 단계 실습과 같은 simulate()에서 만든다.
 * 매 프레임: 목표 위치로 지수 감쇠 이동(τ 0.25s), 화면 밖이면 정지, 동작 줄이기 설정이면 즉시 이동·자동 재생 없음.
 */
import { translateAlong } from '../kit/iso-kit.mjs';
import { simulate } from '../../labs/react/use-state-queue';

type Live = { SLOTS: number[]; SPAWN_X: number; PRESS_X: number; PLUNGER_REST: number; PLUNGER_DOWN: number; RAIL_Z: number };

const SCENES: Record<string, { ids: string[]; name: string }> = {
  value3: { ids: ['v1', 'v1', 'v1'], name: 'setCount(count + 1) × 3' },
  fn3: { ids: ['f1', 'f1', 'f1'], name: 'setCount(c => c + 1) × 3' },
  mixed: { ids: ['v5', 'f1', 'v42'], name: 'count + 5 → c + 1 → 42' },
};
const ORDER = ['value3', 'fn3', 'mixed'];

const short = (label: string, kind: string) =>
  kind === 'value' ? '= ' + label.replace('값 ', '') : label.replace(/\s/g, '').replace('c=>', '').replace('*', '×');

export function mountUseStateFigure(root: HTMLElement, live: Live, P: any) {
  const svg = root.querySelector('svg')!;
  const tickets = [...svg.querySelectorAll<SVGGElement>('[data-part="ticket"]')];
  const plunger = svg.querySelector<SVGGElement>('[data-part="plunger"]')!;
  const counter = svg.querySelector<SVGTextElement>('[data-part="counter"]')!;
  const snapshot = svg.querySelector<SVGTextElement>('[data-part="snapshot"]')!;
  const screen = svg.querySelector<SVGTextElement>('[data-part="screen"]')!;
  const readout = root.querySelector<HTMLElement>('[data-readout]')!;
  const narration = root.querySelector<HTMLElement>('[data-narration]')!;
  const sceneBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-scene]')];
  const playBtn = root.querySelector<HTMLButtonElement>('[data-play]')!;
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-prev]')!;
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-next]')!;
  const still = matchMedia('(prefers-reduced-motion: reduce)');

  // 테마: 사이트 테마(html[data-theme])를 그림 판에 따라가게 한다
  const iso = root.closest<HTMLElement>('.iso') ?? root;
  const syncTheme = () => { iso.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; };
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let scene = 'value3';
  let steps = simulate(SCENES[scene].ids, 0, 1);
  let index = 0;
  let playing = !still.matches;
  let visible = false;
  let hold = 0;          // 다음 단계까지 남은 시간(초)
  let frame = 0;
  let last = 0;

  type Pose = { x: number; z: number; o: number };
  const pose: Pose[] = tickets.map(() => ({ x: live.SPAWN_X, z: 0, o: 0 }));
  let plungerZ = live.PLUNGER_REST;

  function targets() {
    const st = steps[index].state;
    let seen = 0;
    for (let i = 0; i <= index; i++) seen = Math.max(seen, steps[i].state.queue.length);
    const allGone = st.queue.length === 0 && seen > 0;
    const out = tickets.map((_, j) => {
      if (j >= seen) return { x: live.SPAWN_X, z: 0, o: 0, mode: 'hidden' as const };
      const q = st.queue[j];
      if (allGone || q?.done) return { x: live.PRESS_X, z: -4, o: 0, mode: 'gone' as const };
      if (q?.cur) return { x: live.PRESS_X, z: 0, o: 1, mode: 'press' as const };
      return { x: live.SLOTS[j], z: 0, o: 1, mode: 'slot' as const };
    });
    return { out, press: out.some((t) => t.mode === 'press') };
  }

  function paintFaces() {
    // 티켓 종류·글자는 이 장면에서 처음 큐에 들어간 모습으로 정한다
    const first: { kind: string; label: string }[] = [];
    for (const s of steps) s.state.queue.forEach((q, j) => { if (!first[j]) first[j] = { kind: q.kind, label: q.label }; });
    const { out } = targets();
    tickets.forEach((t, j) => {
      const info = first[j] ?? { kind: 'value', label: '값 0' };
      const lit = out[j].mode === 'press';
      t.querySelectorAll<SVGGElement>('[data-face]').forEach((g) => {
        g.style.display = g.dataset.face === `${info.kind}-${lit ? 'on' : 'off'}` ? '' : 'none';
        const text = g.querySelector('text');
        if (text) text.textContent = short(info.label, info.kind);
      });
    });
  }

  function paintText() {
    const s = steps[index];
    const st = s.state;
    const shown = st.acc ?? st.stored;
    counter.textContent = String(shown).padStart(2, '0').slice(-2);
    snapshot.textContent = `count = ${st.snapshot}`;
    screen.textContent = String(st.screen);
    readout.textContent = `${index + 1}/${steps.length} · ${s.phase.split(' · ')[0]}`;
    narration.replaceChildren();
    const b = document.createElement('strong');
    b.textContent = s.title;
    const p = document.createElement('span');
    p.textContent = ' — ' + s.detail;
    narration.append(b, p);
    playBtn.textContent = playing ? '⏸ 일시정지' : '▶ 자동 재생';
    playBtn.setAttribute('aria-pressed', String(playing));
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === steps.length - 1;
    sceneBtns.forEach((b2) => b2.setAttribute('aria-pressed', String(b2.dataset.scene === scene)));
  }

  function draw() {
    tickets.forEach((t, j) => {
      t.setAttribute('transform', translateAlong(P, [pose[j].x, 0, pose[j].z]));
      t.style.opacity = String(Math.round(pose[j].o * 100) / 100);
    });
    plunger.setAttribute('transform', translateAlong(P, [0, 0, plungerZ]));
  }

  function settleNow() {
    const { out, press } = targets();
    out.forEach((t, j) => { pose[j] = { x: t.x, z: t.z, o: t.o }; });
    plungerZ = press ? live.PLUNGER_DOWN : live.PLUNGER_REST;
    draw();
  }

  function go(i: number) {
    index = Math.max(0, Math.min(steps.length - 1, i));
    hold = index === steps.length - 1 ? 3.2 : 1.9;
    paintFaces();
    paintText();
    if (still.matches) settleNow();
    run();
  }

  function setScene(id: string) {
    scene = id;
    steps = simulate(SCENES[scene].ids, 0, 1);
    tickets.forEach((_, j) => { pose[j] = { x: live.SPAWN_X, z: 0, o: 0 }; });
    plungerZ = live.PLUNGER_REST;
    draw();
    go(0);
  }

  function tick(now: number) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
    last = now;
    const { out, press } = targets();
    const ease = 1 - Math.exp(-dt / 0.25);
    let moving = false;
    out.forEach((t, j) => {
      const p = pose[j];
      // 새로 나타나는 티켓은 발행기 출구에서 출발
      if (p.o === 0 && t.o > 0) { p.x = live.SPAWN_X; p.z = 0; }
      p.x += (t.x - p.x) * ease;
      p.z += (t.z - p.z) * ease;
      p.o += (t.o - p.o) * ease;
      if (Math.abs(t.x - p.x) < 0.02) p.x = t.x;
      if (Math.abs(t.z - p.z) < 0.02) p.z = t.z;
      if (Math.abs(t.o - p.o) < 0.01) p.o = t.o;
      if (p.x !== t.x || p.z !== t.z || p.o !== t.o) moving = true;
    });
    const want = press ? live.PLUNGER_DOWN : live.PLUNGER_REST;
    plungerZ += (want - plungerZ) * (1 - Math.exp(-dt / 0.18));
    if (Math.abs(want - plungerZ) < 0.02) plungerZ = want;
    else moving = true;
    draw();

    if (playing) {
      hold -= dt;
      if (hold <= 0) {
        if (index < steps.length - 1) go(index + 1);
        else setScene(ORDER[(ORDER.indexOf(scene) + 1) % ORDER.length]);
      }
    }
    frame = visible && (moving || playing) ? requestAnimationFrame(tick) : 0;
  }

  function run() {
    if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); }
  }

  sceneBtns.forEach((b) => b.addEventListener('click', () => { setScene(b.dataset.scene!); }));
  playBtn.addEventListener('click', () => { playing = !playing; if (playing && index === steps.length - 1) setScene(scene); paintText(); run(); });
  prevBtn.addEventListener('click', () => { playing = false; go(index - 1); });
  nextBtn.addEventListener('click', () => { playing = false; go(index + 1); });
  root.querySelector('.iso-stage')?.addEventListener('keydown', (e) => {
    const key = (e as KeyboardEvent).key;
    if (key === 'ArrowRight') { e.preventDefault(); playing = false; go(index + 1); }
    if (key === 'ArrowLeft') { e.preventDefault(); playing = false; go(index - 1); }
    if (key === ' ') { e.preventDefault(); playBtn.click(); }
  });
  new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: '80px 0px' }).observe(svg);
  still.addEventListener?.('change', () => { if (still.matches) { playing = false; settleNow(); paintText(); } });

  setScene(scene);
  if (still.matches) settleNow();
}
