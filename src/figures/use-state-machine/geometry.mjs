/**
 * Fig: useState 업데이트 큐를 "티켓 레일 계수기"로 만든 Anatomy 그림 (React Native 4강)
 *
 * 무엇이 움직이고 무엇을 뜻하는가 (한 문장):
 *   발행기(이벤트 핸들러)가 찍어낸 티켓(업데이트)이 레일(큐)에 줄을 서고, 다시 렌더할 때 하나씩 프레스(큐 처리)로
 *   들어가 계수기(React가 보관한 값)를 "교체"하거나 "더하고", 마지막에 뒤의 화면 패널(커밋)이 바뀐다.
 *
 * 숫자는 모두 src/labs/react/use-state-queue.ts 의 simulate()가 만든 단계에서 나온다(같은 모델).
 * 좌표: x, y 바닥, z 위. 단위는 약 1px. Anatomy kit(MIT) 사용.
 */
import * as k from '../kit/iso-kit.mjs';

export const WIDTH = 600;
export const HEIGHT = 360;

const PLATE = { x: -158, y: -60, w: 316, d: 100, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

// 앞줄: 발행기 → 레일 → 프레스 → 계수기
const PRINTER = { x: -134, y: -18, w: 40, d: 36, r: 3 };
const PRINTER_H = 30;
const RAIL_Z = 20;                   // 레일 윗면 = 티켓 바닥
const RAIL_FROM = -88;
const RAIL_TO = 38;
const RAILS_Y = [-12, 8];            // 레일 두 줄 (폭 4)
const TICKET = { w: 16, d: 26, h: 2 };
export const SLOTS = [14, -8, -30, -52];   // 큐 칸(앞쪽이 먼저 처리)
export const SPAWN_X = -80;               // 발행기 출구
export const PRESS_X = 58;                // 프레스 아래
const BED = { x: 40, y: -16, w: 36, d: 32, r: 2 };
const BEAM_Z = 58;
export const PLUNGER_REST = 36;           // 스탬프 바닥 높이 (쉼)
export const PLUNGER_DOWN = RAIL_Z + TICKET.h + 0.2;
const COUNTER = { x: 90, y: -18, w: 44, d: 36, r: 3 };
const COUNTER_H = 30;

// 뒷줄: 스냅샷 사진판(왼쪽) · 화면 패널(오른쪽)
const SNAP = { x: -146, y: -52, w: 52, d: 5, r: 1.2 };
const SNAP_Z = [20, 48];
const SCREEN = { x: 92, y: -52, w: 56, d: 5, r: 1.2 };
const SCREEN_Z = [20, 56];

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [SNAP.x, SNAP.y, SNAP_Z[1] + 4], [SCREEN.x + SCREEN.w, SCREEN.y, SCREEN_Z[1] + 4], [PRESS_X, -24, BEAM_Z + 8]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 55 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const planeOf = (y) => k.sideMatrix([0, y], 0, P, 'left');               // y = 일정한 앞면 (x, -z)
const flat = (x0, z0, x1, z1, r, steps = 6) =>
  k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);

/* ---------- 받침판 ---------- */
function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: 'lo' }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: 'mid' }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: 'lo' }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // 큐 칸 눈금자: 레일 앞쪽 바닥에, 칸마다 큰 눈금
  const strip = { x: RAIL_FROM - 2, y: 18, w: RAIL_TO - RAIL_FROM + 4, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  // 칸 표시: 눈금자 위 네 개의 점
  out.push(D(SLOTS.map((x) => at([x, strip.y + 5.2, 0.6])), { size: 0.6, tone: 'hi' }));
  // 이름판
  const label = { x: 96, y: 24, w: 40, d: 10, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: 'lo', crease: 'none' }));
  out.push(L([28, 20, 24].map((w, i) => k.lineOnTop([label.x + 4, label.y + 2.6 + i * 2.4], [label.x + 4 + w, label.y + 2.6 + i * 2.4], 0.8, P)).join(''), { tone: 'lo', free: true }));
  out.push(D([at([label.x + label.w - 3, label.y + 2.6, 0.8]), at([label.x + label.w - 3, label.y + label.d - 2.6, 0.8])], { size: 0.45 }));
  return out.join('');
}

/* ---------- 뒷줄 패널(스냅샷 · 화면): 받침, 기둥 둘, 패널, 창 ---------- */
function panel(plan, [z0, z1], win, part, text, size) {
  const out = [];
  const base = { x: plan.x - 2, y: plan.y - 4, w: plan.w + 4, d: 12, r: 2 };
  out.push(S(k.slabOf(base, 0, 4, P, 4, 0.6), { tone: 'mid' }));
  out.push(D([at([base.x + 4, base.y + 6, 4]), at([base.x + base.w - 4, base.y + 6, 4])], { size: 0.45 }));
  const posts = [plan.x + 8, plan.x + plan.w - 8];
  for (const x of posts) {
    out.push(S(k.cylinder(x, plan.y + plan.d / 2, 3.6, 4, 2, P, 20), { tone: 'mid' }));
    out.push(S(k.cylinder(x, plan.y + plan.d / 2, 2.2, 6, z0 - 6, P, 20), { tone: 'mid', crease: 'none' }));
  }
  const face = plan.y + plan.d;
  const seam = k.sideSeam(plan, z1 - 3, P, 3);
  out.push(S(k.slabOf(plan, z0, z1 - z0, P, 3, 0.5), { tone: 'mid', inner: L(seam, { tone: 'faint' }) }));
  // 창: 앞면에 우묵한 테두리 + 글자
  const id = `usm-${part}`;
  const shape = flat(win[0], win[1], win[2], win[3], 1.4);
  out.push(
    `<clipPath id="${id}"><path transform="${planeOf(face)}" d="${shape}"/></clipPath>`,
    `<g transform="${planeOf(face)}"><path class="usm-well" d="${shape}"/></g>`,
    `<g clip-path="url(#${id})"><g transform="${planeOf(face)}">`,
    `<text class="iso-face-text usm-digits" data-part="${part}" data-tone="hi" x="${(win[0] + win[2]) / 2}" y="${-(win[1] + (win[3] - win[1]) * 0.28)}" font-size="${size}" text-anchor="middle">${text}</text>`,
    `</g></g>`,
    `<g transform="${planeOf(face)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
  );
  // 윗면 고정 나사 두 개
  out.push(D([at([plan.x + 4, plan.y + plan.d / 2, z1]), at([plan.x + plan.w - 4, plan.y + plan.d / 2, z1])], { size: 0.45 }));
  return out.join('');
}

/* ---------- 발행기(이벤트 핸들러) ---------- */
function printer() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(PRINTER, 2), 0, 0.1, P)}" style="filter:blur(4px)"/>`];
  const seam = k.sideSeam(PRINTER, PRINTER_H - 6, P, 4);
  out.push(S(k.slabOf(PRINTER, 0, PRINTER_H, P, 4, 0.8), { tone: 'mid', inner: L(seam, { tone: 'faint' }) }));
  const lid = k.insetPlan(PRINTER, 2);
  out.push(S(k.slabOf(lid, PRINTER_H, 3, P, 4, 0.6), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(lid, 3), PRINTER_H + 3, P), { tone: 'faint' }));
  out.push(D(k.corners(lid, 4).map(([x, y]) => at([x, y, PRINTER_H + 3])), { size: 0.45 }));
  // 크랭크: 뚜껑 위 손잡이(누르면 티켓이 나온다 = onPress)
  const knob = [PRINTER.x + 14, PRINTER.y + 14];
  out.push(S(k.cylinder(knob[0], knob[1], 5, PRINTER_H + 3, 3, P, 28), { tone: 'mid' }));
  out.push(L(k.knurl(knob[0], knob[1], 5, PRINTER_H + 3, PRINTER_H + 6, 30, P), { tone: 'lo' }));
  out.push(S(k.slabOf({ x: knob[0] - 1.2, y: knob[1] - 1.2, w: 14, d: 2.4, r: 1 }, PRINTER_H + 6, 1.6, P, 2), { tone: 'mid' }));
  out.push(S(k.cylinder(knob[0] + 12, knob[1], 1.8, PRINTER_H + 7.6, 6, P, 16), { tone: 'hi' }));
  // 출구 슬롯(+x 면): 닫힌 윤곽선
  const sx = PRINTER.x + PRINTER.w;
  const slot = k.pathOf(k.roundedPlan({ x: -12, y: RAIL_Z + 0.6, w: 24, d: 3, r: 1.2 }, 4).map(([u, z]) => at([sx, u, z])), true);
  out.push(L(slot, { tone: 'lo' }));
  // 출구 받침대: 발행기와 레일 끝을 잇는다
  out.push(S(k.slabOf({ x: sx, y: -14, w: RAIL_FROM - sx + 2, d: 28, r: 1 }, RAIL_Z - 2, 2, P, 2), { tone: 'mid' }));
  return out.join('');
}

/* ---------- 레일(업데이트 큐) ---------- */
function railBack() {
  const out = [];
  for (const x of [RAIL_FROM + 8, RAIL_TO - 8]) {
    for (const y of RAILS_Y) {
      out.push(S(k.cylinder(x, y + 2, 4, 0, 1.6, P, 20), { tone: 'lo' }));
      out.push(S(k.cylinder(x, y + 2, 2.4, 1.6, RAIL_Z - 4.6, P, 20), { tone: 'mid', crease: 'none' }));
    }
  }
  // 가로 연결대
  for (const x of [RAIL_FROM + 8, RAIL_TO - 8]) out.push(S(k.slabOf({ x: x - 2, y: RAILS_Y[0], w: 4, d: RAILS_Y[1] - RAILS_Y[0] + 4, r: 1 }, RAIL_Z - 6, 3, P, 2), { tone: 'mid' }));
  for (const y of RAILS_Y) {
    out.push(S(k.slabOf({ x: RAIL_FROM, y, w: RAIL_TO - RAIL_FROM, d: 4, r: 1 }, RAIL_Z - 3, 3, P, 3, 0.4), { tone: 'mid' }));
    out.push(D([RAIL_FROM + 4, RAIL_TO - 4].map((x) => at([x, y + 2, RAIL_Z])), { size: 0.4 }));
  }
  // 왼쪽 끝 멈춤쇠
  out.push(S(k.slabOf({ x: RAIL_FROM - 4, y: RAILS_Y[0] - 2, w: 4, d: RAILS_Y[1] - RAILS_Y[0] + 8, r: 1 }, RAIL_Z - 3, 6, P, 3, 0.4), { tone: 'mid' }));
  return out.join('');
}

/* ---------- 티켓(업데이트 하나) : 원점에서 만들고 translate로 옮긴다 ---------- */
export function ticketSvg(kind, label, lit) {
  const plan = { x: -TICKET.w / 2, y: -TICKET.d / 2, w: TICKET.w, d: TICKET.d, r: 1.2 };
  const out = [];
  out.push(S(k.slabOf(plan, RAIL_Z, TICKET.h, P, 3, 0.4), { tone: 'hi', crease: 'lo', lit }));
  out.push(L(k.planOutline(k.insetPlan(plan, 1.6), RAIL_Z + TICKET.h, P, 3), { tone: 'faint' }));
  if (kind === 'fn') {
    // 함수 티켓: 캠 핀이 솟아 있다 (직전 결과를 받아 "계산"하는 표)
    out.push(S(k.cylinder(0, -7, 2.4, RAIL_Z + TICKET.h, 3.2, P, 20), { tone: 'hi', lit }));
    out.push(L(k.ring(0, -7, 1.2, RAIL_Z + TICKET.h + 3.2, P, 12), { tone: 'lo' }));
  } else {
    // 값 티켓: 평평한 도장면 (그 값으로 "교체")
    out.push(L(k.planOutline({ x: -5, y: -11, w: 10, d: 7, r: 1 }, RAIL_Z + TICKET.h, P, 3), { tone: 'lo' }));
  }
  out.push(k.faceTextSvg(k.topMatrix([-6.6, 7.6], RAIL_Z + TICKET.h, P, 'x'), label, { size: 5.4, tone: lit ? 'hi' : 'mid', anchor: 'start' }));
  return out.join('');
}

/* ---------- 프레스(큐 처리) ---------- */
function pressBack() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(BED, 2), 0, 0.1, P)}" style="filter:blur(4px)"/>`);
  // 뒤 기둥 둘 (작업대보다 먼저)
  for (const x of [BED.x + 5, BED.x + BED.w - 5]) {
    out.push(S(k.cylinder(x, BED.y - 2, 4.4, 0, RAIL_Z + 2, P, 24), { tone: 'mid' }));
    out.push(S(k.cylinder(x, BED.y - 2, 3, RAIL_Z + 2, BEAM_Z - RAIL_Z - 2, P, 24), { tone: 'mid', crease: 'none' }));
    out.push(L([30, 44].map((z) => k.sideArc(x, BED.y - 2, 3, z, P, 16)).join(''), { tone: 'faint' }));
  }
  // 작업대는 뒤 기둥보다 앞에 있으므로 기둥 다음에 그린다
  out.push(S(k.slabOf(BED, 0, RAIL_Z, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(BED, RAIL_Z - 5, P, 3), { tone: 'faint' }) }));
  out.push(L(k.planOutline(k.insetPlan(BED, 3), RAIL_Z, P, 3), { tone: 'faint' }));
  return out.join('');
}

export function plungerSvg() {
  // 원점 높이(z=0)를 스탬프 바닥으로 만든다. translateAlong(z)로 내린다.
  const out = [];
  out.push(S(k.cylinder(PRESS_X, 0, 2.6, 2.4, 26, P, 20), { tone: 'mid', crease: 'none' }));
  out.push(S(k.cylinder(PRESS_X, 0, 7, 0, 2.4, P, 32, 0.4), { tone: 'mid' }));
  return out.join('');
}

function pressFront() {
  const out = [];
  const beam = { x: BED.x - 2, y: BED.y - 8, w: BED.w + 4, d: 26, r: 2 };
  out.push(S(k.cylinder(PRESS_X, 0, 5.2, BEAM_Z - 10, 10, P, 28), { tone: 'mid' }));
  out.push(L(k.sideArc(PRESS_X, 0, 5.2, BEAM_Z - 6, P, 20), { tone: 'faint' }));
  out.push(S(k.slabOf(beam, BEAM_Z, 6, P, 3, 0.6), { tone: 'mid' }));
  out.push(D(k.corners(beam, 3.5).map(([x, y]) => at([x, y, BEAM_Z + 6])), { size: 0.45 }));
  // 위의 실린더 캡 + 손잡이
  out.push(S(k.cylinder(PRESS_X, 0, 4, BEAM_Z + 6, 3, P, 24), { tone: 'mid' }));
  out.push(L(k.knurl(PRESS_X, 0, 4, BEAM_Z + 6, BEAM_Z + 9, 22, P), { tone: 'lo' }));
  // 프레스 → 계수기 구동축
  out.push(S(k.slabOf({ x: BED.x + BED.w, y: -3, w: COUNTER.x - BED.x - BED.w, d: 6, r: 1 }, 8, 4, P, 2, 0.3), { tone: 'mid' }));
  return out.join('');
}

/* ---------- 계수기(React가 보관한 값: hook.memoizedState) ---------- */
function counter() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(COUNTER, 2), 0, 0.1, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(COUNTER, 0, COUNTER_H, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(COUNTER, 5, P, 4), { tone: 'faint' }) }));
  out.push(L(k.planOutline(k.insetPlan(COUNTER, 3.5), COUNTER_H, P), { tone: 'faint' }));
  out.push(D(k.corners(COUNTER, 3).map(([x, y]) => at([x, y, COUNTER_H])), { size: 0.45 }));
  const face = COUNTER.y + COUNTER.d;
  const win = [COUNTER.x + 8, 11, COUNTER.x + COUNTER.w - 8, 25];
  const shape = flat(win[0], win[1], win[2], win[3], 1.6);
  // 숫자 바퀴 칸막이(가운데 세로선이 창 위아래 테두리에 닿는다)
  const mid = (win[0] + win[2]) / 2;
  out.push(
    `<clipPath id="usm-counter"><path transform="${planeOf(face)}" d="${shape}"/></clipPath>`,
    `<g transform="${planeOf(face)}"><path class="usm-well" d="${shape}"/></g>`,
    `<g clip-path="url(#usm-counter)"><g transform="${planeOf(face)}">`,
    `<path class="iso-line" data-tone="faint" d="M${mid} ${-win[1]}V${-win[3]}"/>`,
    `<text class="iso-face-text usm-digits" data-part="counter" data-tone="hi" x="${mid}" y="${-(win[1] + 3.4)}" font-size="9.5" text-anchor="middle" letter-spacing="5.2">00</text>`,
    `</g></g>`,
    `<g transform="${planeOf(face)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
  );
  // 리셋 노브(윗면)
  const knob = [COUNTER.x + COUNTER.w - 11, COUNTER.y + 10];
  out.push(S(k.cylinder(knob[0], knob[1], 4.4, COUNTER_H, 4, P, 28), { tone: 'mid' }));
  out.push(L(k.knurl(knob[0], knob[1], 4.4, COUNTER_H, COUNTER_H + 4, 26, P), { tone: 'lo' }));
  out.push(L(k.lineOnTop([knob[0] - 2, knob[1]], [knob[0] + 3.4, knob[1]], COUNTER_H + 4, P), { tone: 'hi' }));
  return out.join('');
}

/* ---------- 바닥 배선: 사진판 → 발행기, 계수기 → 화면 ---------- */
function wires() {
  return [
    k.wireSvg(at([-112, SNAP.y + 8, 0]), at([-112, PRINTER.y, 0]), { tone: 'lo', size: 1 }),
    k.wireSvg(at([118, COUNTER.y, 0]), at([118, SCREEN.y + 8, 0]), { tone: 'lo', size: 1 }),
  ].join('');
}

export const TICKETS = 4;

export function buildFigure() {
  const body = [
    plate(),
    wires(),
    panel(SNAP, SNAP_Z, [SNAP.x + 5, SNAP_Z[0] + 5, SNAP.x + SNAP.w - 5, SNAP_Z[1] - 5], 'snapshot', 'count = 0', 5.6),
    panel(SCREEN, SCREEN_Z, [SCREEN.x + 6, SCREEN_Z[0] + 5, SCREEN.x + SCREEN.w - 6, SCREEN_Z[1] - 5], 'screen', '0', 17),
    printer(),
    railBack(),
    pressBack(),
    // 티켓 자리(발행 순서대로 0..3). 각 티켓은 보통/강조 두 벌을 갖고 하나만 보인다.
    ...Array.from({ length: TICKETS }, (_, i) =>
      `<g data-part="ticket" data-i="${i}" style="opacity:0" transform="${k.translateAlong(P, [SPAWN_X, 0, 0])}">` +
      `<g data-face="value-off">${ticketSvg('value', '= 0', false)}</g>` +
      `<g data-face="value-on" style="display:none">${ticketSvg('value', '= 0', true)}</g>` +
      `<g data-face="fn-off" style="display:none">${ticketSvg('fn', 'c+1', false)}</g>` +
      `<g data-face="fn-on" style="display:none">${ticketSvg('fn', 'c+1', true)}</g>` +
      `</g>`),
    `<g data-part="plunger" transform="${k.translateAlong(P, [0, 0, PLUNGER_REST])}">${plungerSvg()}</g>`,
    pressFront(),
    counter(),
  ];
  return k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: '받침판 위의 티켓 레일 계수기. 왼쪽 발행기가 업데이트 티켓을 찍어 레일(업데이트 큐)에 줄 세우고, 다시 렌더할 때 티켓이 하나씩 프레스로 들어가 오른쪽 계수기(React가 보관한 값)를 바꾼다. 뒤쪽 왼쪽 패널은 핸들러가 보는 스냅샷, 오른쪽 패널은 실제 화면이다.',
    body,
  });
}

export const LIVE = { SLOTS, SPAWN_X, PRESS_X, PLUNGER_REST, PLUNGER_DOWN, RAIL_Z };
