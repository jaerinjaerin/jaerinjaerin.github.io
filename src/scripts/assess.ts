/** 평가 컴포넌트(Predict · BugHunt · Explain) 공통 동작 */
function feedback(box: HTMLElement, ok: boolean, head: string, extra?: string, reveal = false) {
  const fb = box.querySelector<HTMLElement>('.feedback')!;
  fb.hidden = false;
  fb.className = 'feedback ' + (ok ? 'ok' : 'no');
  fb.replaceChildren();
  const s = document.createElement('strong');
  s.textContent = head;
  fb.append(s);
  if (extra) { const p = document.createElement('p'); p.style.margin = '6px 0 0'; p.textContent = extra; fb.append(p); }
  if (ok || reveal) fb.append(box.querySelector('template')!.content.cloneNode(true));
}

function setupHints(box: HTMLElement) {
  const hints: string[] = JSON.parse(box.dataset.hints || '[]');
  const btn = box.querySelector<HTMLButtonElement>('.hint-btn');
  const host = box.querySelector<HTMLElement>('.hints');
  if (!btn || !host) return;
  let shown = 0;
  btn.addEventListener('click', () => {
    if (shown >= hints.length) return;
    const d = document.createElement('div');
    d.className = 'hint';
    d.textContent = `힌트 ${shown + 1}. ${hints[shown]}`;
    host.append(d);
    shown++;
    btn.textContent = shown >= hints.length ? '힌트를 모두 봤어요' : `💡 다음 힌트 (${shown + 1}/${hints.length})`;
    btn.disabled = shown >= hints.length;
  });
}

document.querySelectorAll<HTMLElement>('[data-assess="choice"]').forEach((box) => {
  if (box.dataset.ready) return; box.dataset.ready = '1';
  const ans = Number(box.dataset.answer);
  const why: string[] = JSON.parse(box.dataset.why || '[]');
  let tries = 0;
  setupHints(box);
  box.querySelectorAll<HTMLButtonElement>('.option').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.i);
    tries++;
    box.querySelectorAll<HTMLElement>('.option').forEach((o) => o.removeAttribute('data-state'));
    b.dataset.state = i === ans ? 'correct' : 'wrong';
    if (i === ans) feedback(box, true, tries === 1 ? '✅ 정답! 한 번에 맞혔어요.' : '✅ 정답입니다.', why[i]);
    else feedback(box, false, '❗ 아직 아니에요. 다시 골라 보세요.', why[i], tries >= 3);
  }));
});

document.querySelectorAll<HTMLElement>('[data-assess="bug"]').forEach((box) => {
  if (box.dataset.ready) return; box.dataset.ready = '1';
  const bug: number[] = JSON.parse(box.dataset.bug || '[]');
  const why: Record<string, string> = JSON.parse(box.dataset.why || '{}');
  let tries = 0;
  setupHints(box);
  box.querySelectorAll<HTMLButtonElement>('.code-line').forEach((b) => b.addEventListener('click', () => {
    const n = Number(b.dataset.line);
    tries++;
    box.querySelectorAll<HTMLElement>('.code-line').forEach((o) => o.removeAttribute('data-state'));
    const ok = bug.includes(n);
    b.dataset.state = ok ? 'correct' : 'wrong';
    if (ok) feedback(box, true, `✅ 찾았어요! ${n}번 줄이 문제입니다.`, why[String(n)]);
    else feedback(box, false, `${n}번 줄은 괜찮아요.`, why[String(n)] ?? '이 줄은 의도대로 동작합니다. 값이 언제 계산되고 언제 바뀌는지 따라가 보세요.', tries >= 3);
  }));
});

document.querySelectorAll<HTMLElement>('[data-assess="explain"]').forEach((box) => {
  if (box.dataset.ready) return; box.dataset.ready = '1';
  const key = 'cs-explain:' + location.pathname + ':' + box.dataset.id;
  const ta = box.querySelector<HTMLTextAreaElement>('textarea')!;
  try { ta.value = localStorage.getItem(key) || ''; } catch {}
  ta.addEventListener('input', () => { try { localStorage.setItem(key, ta.value); } catch {} });
  box.querySelector<HTMLButtonElement>('.reveal')!.addEventListener('click', () => {
    if (ta.value.trim().length < 15) { ta.focus(); ta.placeholder = '먼저 두세 문장이라도 직접 써 보세요. 쓰는 과정이 이해를 만듭니다.'; return; }
    box.querySelector<HTMLElement>('.feedback')!.hidden = false;
  });
});
