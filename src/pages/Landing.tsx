import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusIcon } from '../components/StatusIcon';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../design-system/across/components/src';
import { analyze } from '../lib/grid';

/* ---------- Hero animation: a 9 × 9 grid built in stepped 140ms ticks ---------- */
const N = 9;
const TICK = 140;
const PAIRS: [number, number][][] = [[[0, 4], [8, 4]], [[1, 4], [7, 4]], [[3, 0], [5, 8]]];
const WORDS = [
  { r: 0, c: 0, w: 'GRID', clue: 'Crossword framework' },
  { r: 0, c: 5, w: 'CLUE', clue: 'Hint at the end of a line?' },
  { r: 2, c: 0, w: 'SYMMETRIC', clue: 'Like a grid that looks the same upside down' },
  { r: 4, c: 0, w: 'CROSSWORD', clue: 'Puzzle with Across and Down' },
  { r: 6, c: 0, w: 'INTERLOCK', clue: 'Connect, as every corner of a good grid' },
  { r: 8, c: 0, w: 'INKS', clue: 'Signs, as a contract' },
  { r: 8, c: 5, w: 'DONE', clue: 'Finished' },
];
const BLOCKS_DONE = 15;
const PLAN = (() => {
  let t = 17;
  const words = WORDS.map((w) => {
    const p = { w, start: t, typeStart: t + 3, end: t + 3 + w.w.length };
    t = t + 3 + w.w.length + 1;
    return p;
  });
  return { words, fillEnd: t };
})();
const CHECK_AT = [2, 5, 8, 11].map((d) => PLAN.fillEnd + d);
const READY = PLAN.fillEnd + 13;
const LOOP = PLAN.fillEnd + 46;
const FULL = (() => {
  const g: string[] = new Array(N * N).fill('');
  PAIRS.forEach(([a, b]) => { g[a[0] * N + a[1]] = '#'; g[b[0] * N + b[1]] = '#'; });
  return analyze(g, N, N);
})();
const CHECK_LABELS = ['Symmetry', 'Interlock', '3+ letters', 'All checked'];

function heroModel(t: number) {
  const blocks = new Set<number>();
  PAIRS.forEach(([a, b], j) => {
    if (t >= 2 + j * 4) blocks.add(a[0] * N + a[1]);
    if (t >= 3 + j * 4) blocks.add(b[0] * N + b[1]);
  });
  const letters: Record<number, string> = {};
  const activeCells = new Set<number>();
  let active: (typeof PLAN.words)[number] | null = null;
  let cursor = -1;
  for (const p of PLAN.words) {
    const len = p.w.w.length;
    let typed = 0;
    if (t >= p.end) typed = len;
    else if (t >= p.typeStart) typed = Math.min(len, t - p.typeStart + 1);
    for (let j = 0; j < typed; j++) letters[p.w.r * N + p.w.c + j] = p.w.w[j];
    if (t >= p.start && t <= p.end) {
      active = p;
      for (let k = 0; k < len; k++) activeCells.add(p.w.r * N + p.w.c + k);
      cursor = p.w.r * N + p.w.c + (t < p.typeStart ? 0 : Math.min(typed, len - 1));
    }
  }
  let chip: string;
  let text: string;
  if (t < BLOCKS_DONE) { chip = 'Blocks'; text = 'Each black square gets a partner, rotated 180°.'; }
  else if (active) { chip = `${FULL.num[active.w.r * N + active.w.c]}A`; text = active.w.clue; }
  else if (t < PLAN.fillEnd) { chip = 'Fill'; text = 'Typing answers into the grid.'; }
  else if (t < READY) { chip = 'Checks'; text = 'Running NYT submission checks.'; }
  else { chip = 'Ready'; text = 'Every check passes. Ready to submit.'; }
  return { blocks, letters, activeCells, cursor, chip, text, showNums: t >= BLOCKS_DONE, checks: CHECK_AT.map((at) => t >= at) };
}

function reducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function Hero() {
  const [paused, setPaused] = useState(reducedMotion);
  const [t, setT] = useState(() => (reducedMotion() ? READY : 0));
  useEffect(() => {
    if (paused) return;
    const h = setInterval(() => setT((x) => (x + 1) % LOOP), TICK);
    return () => clearInterval(h);
  }, [paused]);
  const h = heroModel(t);

  return (
    <div className="hero__art">
      <div className="hero__bar">
        <span className="label">{h.chip}</span>
        <span className="ac-text-clue">{h.text}</span>
      </div>
      <div className="hero__grid" role="img"
        aria-label="A 9 by 9 crossword grid being built: black squares placed in mirrored pairs, then answers typed in.">
        {Array.from({ length: N * N }, (_, i) => {
          const isBlock = h.blocks.has(i);
          const cls = isBlock ? '' : i === h.cursor ? ' hero__sq--cur' : h.activeCells.has(i) ? ' hero__sq--word' : '';
          return (
            <div key={i} className={`hero__sq${cls}`}>
              {isBlock && <div className="ax-drop" />}
              {!isBlock && h.showNums && FULL.num[i] > 0 && <span className="hero__num">{FULL.num[i]}</span>}
              {!isBlock && h.letters[i] && <span className="hero__let"><span className="ax-stamp">{h.letters[i]}</span></span>}
            </div>
          );
        })}
      </div>
      <div className="hero__checks">
        {CHECK_LABELS.map((l, j) => (
          <span key={l} className={`tag${h.checks[j] ? '' : ' tag--pending'}`}>
            <StatusIcon status={h.checks[j] ? 'pass' : 'todo'} decorative />
            {l}
          </span>
        ))}
        <button type="button" className="text-btn" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? 'Play animation' : 'Pause animation'}
        </button>
      </div>
    </div>
  );
}

/* ---------- Try the rules: a 7 × 7 practice grid ---------- */
const TRY_N = 7;
function tryStart() {
  const g: string[] = new Array(TRY_N * TRY_N).fill('');
  g[0] = '#'; g[24] = '#'; g[48] = '#';
  return g;
}

function TryRules() {
  const [g, setG] = useState(tryStart);
  const [mirror, setMirror] = useState(true);
  const m = useMemo(() => analyze(g, TRY_N, TRY_N), [g]);
  const flagged = new Set([...m.asym, ...m.unchecked, ...m.short, ...m.cut]);

  function toggle(i: number) {
    const next = g.slice();
    const v = next[i] === '#' ? '' : '#';
    next[i] = v;
    if (mirror) next[TRY_N * TRY_N - 1 - i] = v;
    setG(next);
  }

  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
  const rules = [
    { label: 'Rotational symmetry', ok: !m.asym.length, good: 'Turn it 180° and the pattern matches.', bad: `${m.asym.length} black ${plural(m.asym.length, 'square has', 'squares have')} no partner.` },
    { label: 'All-over interlock', ok: !m.cut.length, good: 'Every white square connects to the rest.', bad: `${m.cut.length} squares are walled off.` },
    { label: 'Every answer 3+ letters', ok: !m.shortCount, good: 'No 2-letter entries.', bad: `${m.shortCount} ${plural(m.shortCount, 'entry is', 'entries are')} too short.` },
    { label: 'No unchecked squares', ok: !m.unchecked.length, good: 'Every letter belongs to an Across and a Down.', bad: `${m.unchecked.length} ${plural(m.unchecked.length, 'square belongs', 'squares belong')} to only one word.` },
  ];

  return (
    <div className="split">
      <div className="split__text">
        <div className="label muted">Try the rules</div>
        <h2 className="section-title">Click a square. Watch its partner follow.</h2>
        <p className="muted" style={{ maxWidth: 460 }}>
          Every black square you place is mirrored 180° around the center, the way NYT grids are built.
          Turn mirroring off to see what breaks. Squares that fail a rule get a slash.
        </p>
        <div className="rules">
          {rules.map((r) => (
            <div key={r.label}>
              <StatusIcon status={r.ok ? 'pass' : 'fail'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className={`check-row__label${r.ok ? '' : ' check-row__label--fail'}`}>{r.label}</span>
                <span className="check-row__detail">{r.ok ? r.good : r.bad}</span>
              </div>
            </div>
          ))}
          <div>
            <StatusIcon status="todo" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="check-row__label">Word count</span>
              <span className="check-row__detail">{m.words} words in this grid.</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center' }}>
          <label className="check">
            <input type="checkbox" checked={mirror} onChange={() => setMirror(!mirror)} />
            Mirror automatically
          </label>
          <Button className="tall" onClick={() => { setG(tryStart()); setMirror(true); }}>Reset grid</Button>
        </div>
      </div>
      <div style={{ flex: '0 1 392px', minWidth: 0, width: '100%', maxWidth: 392 }}>
        <div className="try-grid">
          {g.map((v, i) => {
            const isBlock = v === '#';
            const r = Math.floor(i / TRY_N);
            const c = i % TRY_N;
            return (
              <button key={i} type="button" className="try-sq" aria-pressed={isBlock} onClick={() => toggle(i)}
                aria-label={`Row ${r + 1}, column ${c + 1}, ${isBlock ? 'black square' : 'white square'}${flagged.has(i) ? ', breaks a rule' : ''}`}>
                {!isBlock && m.num[i] > 0 && <span className="try-sq__num" aria-hidden>{m.num[i]}</span>}
                {flagged.has(i) && <span className="try-sq__slash" aria-hidden />}
              </button>
            );
          })}
        </div>
        <p className="muted" style={{ marginTop: 8, fontSize: 13, lineHeight: '18px' }}>
          7 × 7 practice grid · {m.words} words · {m.blocks} black squares
        </p>
      </div>
    </div>
  );
}

function Check({ status, children }: { status: 'pass' | 'fail'; children: string }) {
  return (
    <div className={status === 'fail' ? 'summary--fail' : undefined}>
      <StatusIcon status={status} decorative />
      {children}
    </div>
  );
}

export function Landing() {
  return (
    <>
      <header className="app-header app-header--wide">
        <div className="app-header__inner">
          <Link to="/" className="wordmark">Across</Link>
          <nav aria-label="Main" className="app-header__nav">
            <a href="#how">How it works</a>
            <a href="#try">Try the rules</a>
            <a href="#assistant">Assistant</a>
            <Link to="/puzzles">Your puzzles</Link>
          </nav>
          <div className="app-header__actions">
            <ThemeToggle />
            <Link to="/new" className="link-btn link-btn--primary">Start a puzzle</Link>
          </div>
        </div>
      </header>

      <main>
        <section id="top" className="landing-inner hero">
          <div className="hero__copy">
            <div className="label muted">Crossword construction</div>
            <h1 className="hero__title">Build the grid. Write the clues. Submit with confidence.</h1>
            <p className="hero__lede">
              Across is a workbench for crossword constructors. Pick a grid size, place mirrored black squares,
              write every clue beside its entry, and check your puzzle against NYT submission rules as you go.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Link to="/new" className="link-btn link-btn--primary link-btn--big">Start a puzzle</Link>
              <a href="#how" className="link-btn link-btn--big">See how it works</a>
            </div>
          </div>
          <Hero />
        </section>

        <section id="how" className="landing-section landing-section--white">
          <div className="landing-inner">
            <div className="section-head">
              <div className="label muted">How it works</div>
              <h2 className="section-title">From empty squares to a puzzle an editor will read.</h2>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step__num">1</div>
                <h3 className="step__title">Choose a grid</h3>
                <p className="muted">Start with a 5 × 5 mini, a 15 × 15 daily, a 21 × 21 Sunday, or a custom size. Begin blank or from a sample pattern.</p>
                <div className="chips">
                  <span className="tag">5 × 5</span>
                  <span className="tag">15 × 15</span>
                  <span className="tag">21 × 21</span>
                  <span className="tag tag--pending">Custom</span>
                </div>
              </div>
              <div className="step">
                <div className="step__num">2</div>
                <h3 className="step__title">Fill and clue</h3>
                <p className="muted">Black squares mirror themselves. Entries number automatically, and every Across and Down answer gets its own clue field, side by side with the grid.</p>
                <div className="hero__bar" style={{ minHeight: 0, padding: '8px 12px' }}>
                  <span className="label" style={{ minWidth: 0 }}>14A</span>
                  <span className="ac-text-clue">Speed ___</span>
                </div>
              </div>
              <div className="step">
                <div className="step__num">3</div>
                <h3 className="step__title">Check before you submit</h3>
                <p className="muted">Turn on NYT rules and every change is checked: symmetry, interlock, unchecked squares, 3-letter minimum, word count and repeats.</p>
                <div className="mini-checks">
                  <Check status="pass">Rotational symmetry</Check>
                  <Check status="pass">76 of 78 words</Check>
                  <Check status="fail">2 entries under 3 letters</Check>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="try" className="landing-section">
          <div className="landing-inner"><TryRules /></div>
        </section>

        <section id="assistant" className="landing-section landing-section--white">
          <div className="landing-inner split">
            <div className="split__text">
              <div className="label muted">Assistant</div>
              <h2 className="section-title">Help when you ask for it. Quiet when you don't.</h2>
              <p className="muted" style={{ maxWidth: 480 }}>
                The assistant sits in a side panel and knows your grid, your crossings and which checks are failing.
                It suggests; you decide what goes in.
              </p>
              <div className="feature-list">
                <div><span className="label">Fill</span><span>Finds words that fit your crossings, like C?U?E.</span></div>
                <div><span className="label">Clues</span><span>Drafts clues in house style, from Monday-easy to Saturday-tricky.</span></div>
                <div><span className="label">Rules</span><span>Explains why a check fails and which squares to move.</span></div>
                <div><span className="label">Style</span><span>Flags clues that repeat their answer or break house style.</span></div>
              </div>
            </div>
            <div className="demo-chat" aria-label="Example conversation with the assistant">
              <div className="demo-chat__head">
                <span className="panel__title">Assistant</span>
                <span className="label muted">23A · C?U?E</span>
              </div>
              <div className="demo-chat__body">
                <div className="msg msg--you">
                  <span className="msg__who">YOU</span>
                  <div className="msg__body"><span>What fits 23 Across?</span></div>
                </div>
                <div className="msg">
                  <span className="msg__who">ASSISTANT</span>
                  <div className="msg__body">
                    <span>Four fit your crossings. CHUTE reads freshest; CRUSE is crosswordese.</span>
                    <div className="chips">
                      {['CHUTE', 'CAUSE', 'CRUDE', 'CRUSE'].map((w) => <span key={w} className="tag">{w}</span>)}
                    </div>
                  </div>
                </div>
                <div className="msg msg--you">
                  <span className="msg__who">YOU</span>
                  <div className="msg__body"><span>Clue CHUTE for a Tuesday.</span></div>
                </div>
                <div className="msg">
                  <span className="msg__who">ASSISTANT</span>
                  <div className="msg__body ac-text-clue">
                    <span>Laundry ___</span>
                    <span>Parachute, informally</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="landing-inner">
            <h2>Your next puzzle starts with one empty square.</h2>
            <Link to="/new" className="link-btn link-btn--primary link-btn--big">Start a puzzle</Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <span className="serif" style={{ fontSize: 20, lineHeight: '26px', fontWeight: 600, color: 'var(--ink)' }}>Across</span>
          <span>Not affiliated with The New York Times.</span>
        </div>
      </footer>
    </>
  );
}
