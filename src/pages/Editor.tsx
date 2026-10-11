import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiKeyDialog } from '../components/ApiKeyDialog';
import { applyFormat, ClueInput } from '../components/ClueInput';
import { ClueText } from '../components/ClueText';
import { RebusDialog } from '../components/RebusDialog';
import { AppHeader } from '../components/AppHeader';
import { SavingExplainerButton } from '../components/SavingExplainer';
import { StatusIcon } from '../components/StatusIcon';
import { useConfirm } from '../components/useConfirm';
import { useMediaQuery } from '../components/useMediaQuery';
import {
  Button, ClueBar, ConstructGrid, type CellSize, type ConstructMode, type Direction,
} from '../design-system/across/components/src';
import {
  cluesMessage, explainChecks, fillMessage, INTRO, reviewClueStyle, type AssistantMessage, type Chip,
} from '../lib/assistant';
import { callAssistant, serverAvailable, type AssistantRoute } from '../lib/assistantApi';
import { clearOwnKey, getOwnKey, setOwnKey } from '../lib/apiKey';
import {
  buildContext, LIMITS, type AssistantRequest, type AssistantResponse, type HistoryItem,
} from '../lib/assistantContext';
import { allWords, analyze, findActive, wordChip, wordLabel, wordText, type Dir, type Word } from '../lib/grid';
import { canExportPuz, exportPuz, puzFileName } from '../lib/puz';
import { puzzleTypeName, type Puzzle } from '../lib/puzzle';
import { NYT_RULES } from '../lib/rules';
import { loadPuzzle, savePuzzle } from '../lib/storage';
import { validate, type CheckId } from '../lib/validate';
import { loadWordList, suggestFill } from '../lib/wordlist';
import { serializeClue } from '../lib/clueFormat';
import { NotFound } from './NotFound';

type AssistantReply = Extract<AssistantResponse, { task: string }>;

const CHECKS_HIDDEN = 'across.checksHidden';
const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd' : 'Ctrl';

function readChecksHidden(): boolean {
  try { return localStorage.getItem(CHECKS_HIDDEN) === '1'; } catch { return false; }
}

const toDirection = (d: Dir): Direction => (d === 'A' ? 'across' : 'down');
const toDir = (d: Direction): Dir => (d === 'across' ? 'A' : 'D');

function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Editor() {
  const { id = '' } = useParams();
  return <EditorLoader key={id} id={id} />;
}

function EditorLoader({ id }: { id: string }) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(() => loadPuzzle(id));
  if (!puzzle) return <NotFound message="This puzzle is not saved in this browser." />;
  return <EditorView puzzle={puzzle} setPuzzle={setPuzzle} />;
}

function firstWhite(g: string[]): number {
  const i = g.findIndex((v) => v !== '#');
  return i < 0 ? 0 : i;
}

function EditorView({ puzzle: p, setPuzzle }: { puzzle: Puzzle; setPuzzle: (p: Puzzle) => void }) {
  const { rows: R, cols: C, grid: g } = p;
  const [cursor, setCursor] = useState(() => firstWhite(p.grid));
  const [dir, setDir] = useState<Dir>('A');
  const [mode, setMode] = useState<ConstructMode>('letters');
  const [flag, setFlag] = useState<CheckId | null>(null);
  const [tab, setTab] = useState<Dir>('A');
  const [aiOpen, setAiOpen] = useState(true);
  const [aiMsgs, setAiMsgs] = useState<AssistantMessage[]>([INTRO]);
  const [exportOpen, setExportOpen] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  /** null while checking whether the server has a Claude API key */
  const [serverKey, setServerKey] = useState<boolean | null>(null);
  const [own, setOwn] = useState(getOwnKey);
  const [keyOpen, setKeyOpen] = useState(false);
  const [checksHidden, setChecksHidden] = useState(() => readChecksHidden());
  /** the square whose rebus is being edited */
  const [rebusAt, setRebusAt] = useState<number | null>(null);
  const clueBoxRef = useRef<HTMLDivElement>(null);
  const { dialog: confirmDialog, confirm } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const narrow = useMediaQuery('(max-width: 720px)');

  // Save on every change; this browser's storage is the only copy.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSaveFailed(!savePuzzle(p));
  }, [p]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [aiMsgs, busy]);

  useEffect(() => {
    let live = true;
    serverAvailable().then((ok) => { if (live) setServerKey(ok); });
    return () => { live = false; };
  }, []);

  const update = (ch: Partial<Puzzle>) => setPuzzle({ ...p, ...ch, updatedAt: Date.now() });

  const m = useMemo(() => analyze(g, R, C), [g, R, C]);
  const active = findActive(m, cursor, dir);
  const checks = useMemo(
    () => validate({ rows: R, cols: C, grid: g, clues: p.clues, nyt: p.nyt, ptype: p.ptype }, m),
    [R, C, g, p.clues, p.nyt, p.ptype, m],
  );
  const flagged = checks.find((c) => c.id === flag && c.status !== 'pass');
  const marks = flagged ? flagged.cells : [];
  const mirror = p.mirror || p.nyt;
  const pencil = useMemo(() => p.pencil ?? [], [p.pencil]);
  const pencilSet = useMemo(() => new Set(pencil), [pencil]);

  const maxDim = Math.max(R, C);
  const size: CellSize = maxDim <= 7 ? 'lg' : maxDim <= 15 && !narrow ? 'md' : 'sm';

  const counted = checks.filter((c) => c.status !== 'todo');
  const passing = counted.filter((c) => c.status === 'pass').length;
  const allDone = checks.every((c) => c.status === 'pass');
  // The panel can only be minimized while nothing fails; a new problem opens it again.
  const issues = checks.some((c) => c.status === 'fail' || c.status === 'warn');
  const checksCollapsed = !issues && checksHidden;

  function toggleChecks() {
    const next = !checksCollapsed;
    setChecksHidden(next);
    if (next) setFlag(null);
    try { localStorage.setItem(CHECKS_HIDDEN, next ? '1' : ''); } catch { /* ignore */ }
  }

  // Clue drafts and questions go through the server's key when it has one, else the constructor's own.
  const route: AssistantRoute | null = serverKey ? { via: 'server' } : own.key ? { via: 'own', key: own.key } : null;
  const aiReady = serverKey === null ? null : !!route;

  function selectWord(w: Word) {
    if (active && active.key === w.key) return;
    setCursor(w.cells[0]);
    setDir(w.dir);
    setTab(w.dir);
  }

  function stepClue(d: 1 | -1) {
    const all = allWords(m);
    if (!all.length) return;
    const idx = active ? all.findIndex((w) => w.key === active.key) : -1;
    const nx = all[(idx + d + all.length) % all.length];
    setCursor(nx.cells[0]);
    setDir(nx.dir);
    setTab(nx.dir);
  }

  function post(...msgs: AssistantMessage[]) {
    setAiMsgs((prev) => [...prev, ...msgs].slice(-14));
    setAiOpen(true);
  }

  function say(userText: string, reply: AssistantMessage) {
    post({ role: 'you', text: userText }, reply);
  }

  const aiSay = (text: string): AssistantMessage => ({ role: 'ai', text });

  function focusWord(w: Word) {
    setCursor(w.cells[0]);
    setDir(w.dir);
    setTab(w.dir);
  }

  function editGrid(grid: string[], changed: number[]) {
    // Any square the constructor writes stops being a suggestion.
    const gone = new Set(changed);
    update({ grid, pencil: pencil.filter((i) => !gone.has(i)) });
  }

  async function suggest() {
    if (!active) { say('Suggest fill', aiSay('Select an entry first.')); return; }
    const w = active;
    // Pencil letters are suggestions, so look past them.
    const base = g.map((v, i) => (pencilSet.has(i) ? '' : v));
    post({ role: 'you', text: `Suggest fill for ${wordLabel(w)}` });
    setBusy(true);
    try {
      post(fillMessage(w, suggestFill(await loadWordList(), base, m, w)));
    } catch {
      post(aiSay('The word list did not load. Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function runRemote(req: AssistantRequest, onOk: (r: AssistantReply) => AssistantMessage) {
    setBusy(true);
    try {
      if (!route) return;
      const res = await callAssistant(req, route);
      if ('error' in res) post(aiSay(res.error));
      else if ('refused' in res) post(aiSay(res.text));
      else post(onOk(res));
    } finally {
      setBusy(false);
    }
  }

  function draftClues() {
    if (!active) { say('Draft clues', aiSay('Select an entry first.')); return; }
    const w = active;
    const answer = wordText(g, w);
    if (answer.includes('?')) {
      say(`Draft clues for ${wordLabel(w)}`, aiSay(`Fill every square of ${wordLabel(w)} first. I draft clues for complete answers.`));
      return;
    }
    post({ role: 'you', text: `Draft clues for ${wordLabel(w)}` });
    runRemote({ task: 'clues', context: context() }, (r) =>
      r.task === 'clues' ? cluesMessage(w, answer, r.clues) : aiSay('The assistant answered something else. Try again.'));
  }

  function ask(e: FormEvent) {
    e.preventDefault();
    const q = question.trim().slice(0, LIMITS.question);
    if (!q || busy) return;
    const history: HistoryItem[] = aiMsgs.filter((x) => x !== INTRO).slice(-LIMITS.historyItems)
      .map((x) => ({ role: x.role, text: x.text.slice(0, LIMITS.historyText) }));
    post({ role: 'you', text: q });
    setQuestion('');
    runRemote({ task: 'ask', context: context(), question: q, history }, (r) =>
      aiSay(r.task === 'ask' ? r.text : 'The assistant answered something else. Try again.'));
  }

  function context() {
    return buildContext(p, puzzleTypeName(p), m, active, checks);
  }

  function place(key: string, word: string) {
    const w = allWords(m).find((x) => x.key === key);
    const clash = !w || w.cells.length !== word.length
      || w.cells.some((cell, k) => g[cell] && !pencilSet.has(cell) && g[cell] !== word[k]);
    if (!w || clash) { post(aiSay(`${word} no longer fits there. Ask for new suggestions.`)); return; }
    const next = g.slice();
    const pen = new Set(pencilSet);
    w.cells.forEach((cell, k) => {
      if (!g[cell] || pencilSet.has(cell)) { next[cell] = word[k]; pen.add(cell); }
    });
    update({ grid: next, pencil: [...pen] });
    focusWord(w);
    post({
      role: 'ai',
      text: `Placed ${word} at ${wordLabel(w)} in pencil. Type over a letter to change it, or ink the word in.`,
      chips: [{ kind: 'ink', key: w.key, label: `Ink in ${word}` }],
    });
  }

  function applyChip(c: Chip) {
    if (c.kind === 'flag') { setFlag(c.id); return; }
    if (c.kind === 'place') { place(c.key, c.word); return; }
    const w = allWords(m).find((x) => x.key === c.key);
    if (!w) { post(aiSay('That entry is no longer in the grid.')); return; }
    focusWord(w);
    if (c.kind === 'ink') {
      const cells = new Set(w.cells);
      update({ pencil: pencil.filter((i) => !cells.has(i)) });
    } else if (c.kind === 'clue') {
      update({ clues: { ...p.clues, [w.key]: serializeClue([{ text: c.text, i: false, b: false }]) } });
    }
  }

  async function clearLetters() {
    const ok = await confirm({
      title: 'Clear every letter?',
      body: 'All letters in the grid are removed. Black squares and clues stay.',
      confirmLabel: 'Clear letters',
    });
    if (!ok) return;
    update({ grid: g.map((v) => (v === '#' ? '#' : '')), pencil: [] });
  }

  const puzOk = canExportPuz(p);
  const meta = `${R} × ${C} · ${puzzleTypeName(p)} · ${p.nyt ? 'NYT rules on' : 'NYT rules off'}${p.author ? ` · by ${p.author}` : ''}`;
  const list = tab === 'D' ? m.down : m.across;
  const activeClue = active ? (p.clues[active.key] || '') : '';

  // Keep the selected entry's clue field in view in the clue list, without moving the page.
  const activeKey = active?.key;
  useEffect(() => {
    const box = clueBoxRef.current;
    const row = activeKey ? box?.querySelector<HTMLElement>(`[data-key="${activeKey}"]`) : null;
    if (!box || !row) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < box.scrollTop) box.scrollTop = top;
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight;
  }, [activeKey, tab]);

  /** Italic and Bold buttons act on the clue field that has focus. */
  function formatClue(cmd: 'italic' | 'bold') {
    const el = document.activeElement;
    if (el instanceof HTMLElement && el.classList.contains('clue-input')) applyFormat(cmd);
  }

  return (
    <>
      <AppHeader
        title={p.title}
        meta={meta}
        actions={
          <>
            <Link className="link-btn" to={`/puzzle/${p.id}/settings`}>Puzzle settings</Link>
            <Button className="tall" aria-pressed={aiOpen} onClick={() => setAiOpen(!aiOpen)}>Assistant</Button>
            <Button className="tall" variant="primary" aria-expanded={exportOpen} aria-controls="export-panel"
              onClick={() => setExportOpen(!exportOpen)}>Export puzzle</Button>
          </>
        }
      />

      {exportOpen && (
        <section id="export-panel" className="export" aria-label="Export">
          <Button className="tall" disabled={!puzOk.ok}
            onClick={() => download(puzFileName(p.title), exportPuz(p).slice().buffer, 'application/x-crossword')}>
            Download .puz file
          </Button>
          <Link className="link-btn" to={`/puzzle/${p.id}/print`}>Open print view</Link>
          <Button className="tall"
            onClick={() => download(puzFileName(p.title).replace(/\.puz$/, '.json'), JSON.stringify(p, null, 2), 'application/json')}>
            Download backup (.json)
          </Button>
          {!puzOk.ok && <span className="muted" style={{ fontSize: 14 }}>{puzOk.reason}</span>}
          {puzOk.ok && pencil.length > 0 && (
            <span className="muted" style={{ fontSize: 14 }}>
              {pencil.length} {pencil.length === 1 ? 'square is' : 'squares are'} still in pencil. They export as regular letters.
            </span>
          )}
          <button type="button" className="text-btn" style={{ marginLeft: 'auto' }} onClick={() => setExportOpen(false)}>Close</button>
        </section>
      )}

      {saveFailed && (
        <div className="notice" role="alert" style={{ margin: 'var(--space-4) clamp(16px, 2.5vw, 32px) 0' }}>
          <StatusIcon status="warn" decorative />
          <span>This browser would not save your changes. Download a backup from Export puzzle before you leave the page.</span>
        </div>
      )}

      <main className="editor">
        <section className="editor__grid" aria-label="Grid">
          <div className="editor__toolbar">
            <div className="segmented" role="group" aria-label="Edit mode">
              <button type="button" aria-pressed={mode === 'letters'} onClick={() => setMode('letters')}>Letters</button>
              <button type="button" aria-pressed={mode === 'blocks'} onClick={() => setMode('blocks')}>Black squares</button>
            </div>
            <label className={`check${p.nyt ? ' check--disabled' : ''}`}>
              <input type="checkbox" checked={mirror} disabled={p.nyt} onChange={() => update({ mirror: !p.mirror })} />
              Mirror black squares
            </label>
            {pencil.length > 0 && (
              <button type="button" className="text-btn push" onClick={() => update({ pencil: [] })}>
                Ink in pencil letters ({pencil.length})
              </button>
            )}
            <button type="button" className={`text-btn${pencil.length ? '' : ' push'}`} onClick={clearLetters}>Clear letters</button>
            <Button className="small-btn" disabled={mode !== 'letters' || g[cursor] === '#'} onClick={() => setRebusAt(cursor)}>
              Rebus
            </Button>
          </div>

          {active ? (
            <ClueBar number={active.num} direction={toDirection(active.dir)} onPrev={() => stepClue(-1)} onNext={() => stepClue(1)}
              className={activeClue ? undefined : 'cluebar-empty'}>
              {activeClue ? <ClueText clue={activeClue} /> : 'No clue yet. Write one in the list.'}
            </ClueBar>
          ) : (
            <div className="ac-cluebar cluebar-empty">
              <span className="ac-cluebar__text">Select a white square.</span>
            </div>
          )}

          <div className="editor__scroll">
            <ConstructGrid
              rows={R}
              cols={C}
              grid={g}
              cursor={cursor}
              direction={toDirection(dir)}
              mode={mode}
              mirror={mirror}
              marks={marks}
              pencil={pencil}
              size={size}
              onChange={editGrid}
              onRebus={setRebusAt}
              onCursorChange={(c, d) => {
                setCursor(c);
                setDir(toDir(d));
                const w = findActive(m, c, toDir(d));
                if (w) setTab(w.dir);
              }}
            />
          </div>
          <p className="help">
            {mode === 'blocks'
              ? `Click a square to make it black${mirror ? '; its partner mirrors at 180°.' : '.'} Arrows move, Space toggles.`
              : 'Type to fill. Space turns direction, Backspace clears, period places a black square, Insert or Esc adds a rebus.'}
          </p>
          <p className="help">
            Saved in this browser only. <SavingExplainerButton className="text-btn--inline" />
          </p>
        </section>

        <section className="editor__side" aria-label="Checks and clues">
          <div className={`panel${checksCollapsed ? ' panel--collapsed' : ''}`}>
            <div className="panel__head">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 className="panel__title">{p.nyt ? 'NYT checks' : 'Checks'}</h2>
                <span className={`label ${allDone ? '' : passing === counted.length ? 'muted' : 'summary--fail'}`}>
                  {allDone ? 'Ready to submit' : `${passing} of ${counted.length} rules pass`}
                </span>
              </div>
              <div className="panel__head-actions">
                <label className="check">
                  <input type="checkbox" checked={p.nyt} onChange={() => { update({ nyt: !p.nyt }); setFlag(null); }} />
                  NYT rules
                </label>
                {!issues && (
                  <Button className="small-btn checks-toggle" aria-expanded={!checksCollapsed} aria-controls="checks-body"
                    onClick={toggleChecks}>
                    {checksCollapsed ? 'Show checks' : 'Hide checks'}
                  </Button>
                )}
              </div>
            </div>
            {!checksCollapsed && (
              <div id="checks-body">
                {p.nyt && R === 15 && C === 15 && (
                  <div className="panel__sub">
                    <label htmlFor="ptype-select" style={{ fontSize: 13, fontWeight: 600 }}>Puzzle type</label>
                    <select id="ptype-select" className="select" value={p.ptype}
                      onChange={(e) => update({ ptype: e.target.value === 'themeless' ? 'themeless' : 'themed' })}>
                      <option value="themed">Themed · {NYT_RULES.maxWords.themed} words</option>
                      <option value="themeless">Themeless · {NYT_RULES.maxWords.themeless} words</option>
                    </select>
                  </div>
                )}
                <div>
                  {checks.map((c) => {
                    const showing = flag === c.id;
                    return (
                      <div key={c.id} className="check-row" data-showing={showing}>
                        <StatusIcon status={c.status} />
                        <span className="check-row__text">
                          <span className={`check-row__label${c.status === 'fail' ? ' check-row__label--fail' : ''}`}>{c.label}</span>
                          <span className="check-row__detail">{c.detail}</span>
                        </span>
                        {c.status !== 'pass' && c.cells.length > 0 && (
                          <Button className="small-btn" aria-pressed={showing} onClick={() => setFlag(showing ? null : c.id)}>
                            {showing ? 'Hide' : 'Show'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="segmented segmented--fill" role="group" aria-label="Clue lists">
              <button type="button" aria-pressed={tab === 'A'} onClick={() => setTab('A')}>ACROSS · {m.across.length}</button>
              <button type="button" aria-pressed={tab === 'D'} onClick={() => setTab('D')}>DOWN · {m.down.length}</button>
            </div>
            <div className="clue-tools" role="group" aria-label="Clue formatting">
              <Button className="fmt-italic" onMouseDown={(e) => e.preventDefault()} onClick={() => formatClue('italic')}>Italic</Button>
              <Button className="fmt-bold" onMouseDown={(e) => e.preventDefault()} onClick={() => formatClue('bold')}>Bold</Button>
              <span className="help">Select words in a clue, then {MOD}+I or {MOD}+B.</span>
            </div>
            <div className="clue-rows" ref={clueBoxRef}>
              {list.length === 0 && <p className="clue-empty">No {tab === 'A' ? 'Across' : 'Down'} entries yet.</p>}
              {list.map((w) => {
                const isAct = !!active && active.key === w.key;
                const dirWord = w.dir === 'A' ? 'Across' : 'Down';
                return (
                  <div key={w.key} className="clue-row" data-active={isAct} data-key={w.key}>
                    <button type="button" className="clue-row__head" aria-label={`Select ${w.num} ${dirWord}`} onClick={() => selectWord(w)}>
                      <span className="clue-row__num">{wordChip(w)}</span>
                      <span className="clue-row__pattern">{w.cells.map((i) => (g[i].length > 1 ? `[${g[i]}]` : g[i] || '·')).join('')}</span>
                      <span className="clue-row__len">({w.cells.length})</span>
                    </button>
                    <ClueInput
                      value={p.clues[w.key] || ''}
                      placeholder="Write a clue"
                      label={`Clue for ${w.num} ${dirWord}`}
                      onFocus={() => selectWord(w)}
                      onChange={(v) => update({ clues: { ...p.clues, [w.key]: v } })}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {aiOpen && (
          <aside className="panel assistant" aria-label="Assistant">
            <div className="panel__head" style={{ padding: '8px 8px 8px 16px' }}>
              <h2 className="panel__title">Assistant</h2>
              <button type="button" className="text-btn" onClick={() => setAiOpen(false)}>Close</button>
            </div>
            <div className="assistant__tasks">
              <span className="label muted">
                {active ? `Working on ${wordLabel(active)} · ${wordText(g, active)}` : 'No entry selected'}
              </span>
              <div className="assistant__grid">
                <Button disabled={busy} onClick={suggest}>Suggest fill</Button>
                <Button disabled={busy || !aiReady} onClick={draftClues}>Draft clues</Button>
                <Button onClick={() => say('Explain checks', explainChecks(checks))}>Explain checks</Button>
                <Button onClick={() => say('Review clue style', reviewClueStyle(g, m, p.clues))}>Review clue style</Button>
              </div>
            </div>
            <div className="assistant__log" aria-live="polite" ref={logRef}>
              {aiMsgs.map((msg, i) => (
                <div key={i} className={`msg${msg.role === 'you' ? ' msg--you' : ''}`}>
                  <span className="msg__who">{msg.role === 'you' ? 'YOU' : 'ASSISTANT'}</span>
                  <div className="msg__body">
                    <span className="msg__text">{msg.text}</span>
                    {!!msg.chips?.length && (
                      <div className="chips">
                        {msg.chips.map((c, j) => (
                          <Button key={j} className="chip" onClick={() => applyChip(c)}>{c.label}</Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="msg">
                  <span className="msg__who">ASSISTANT</span>
                  <div className="msg__body"><span className="msg__text muted">Working on it.</span></div>
                </div>
              )}
            </div>
            <form className="assistant__ask" onSubmit={ask}>
              <label htmlFor="ask-input" className="ac-sr-only">Ask about this puzzle</label>
              <input id="ask-input" className="input" type="text" value={question} maxLength={LIMITS.question}
                placeholder={aiReady === false ? 'Add an API key to ask questions' : 'Ask about this puzzle'}
                disabled={!aiReady} onChange={(e) => setQuestion(e.target.value)} />
              <Button type="submit" disabled={!aiReady || busy || !question.trim()}>Ask</Button>
            </form>
            {serverKey === false && (
              <div className="assistant__note assistant__key">
                {own.key ? (
                  <>
                    <span>
                      Clue drafts and questions use your API key
                      {own.remembered ? ', remembered on this browser.' : ' until you close this tab.'}
                    </span>
                    <button type="button" className="text-btn" onClick={() => setKeyOpen(true)}>Change key</button>
                  </>
                ) : (
                  <>
                    <span>
                      Clue drafts and questions need a Claude API key. This site has none, so you can add your own.
                      Suggest fill works without one.
                    </span>
                    <Button onClick={() => setKeyOpen(true)}>Add your API key</Button>
                  </>
                )}
              </div>
            )}
          </aside>
        )}
      </main>
      <ApiKeyDialog
        open={keyOpen}
        current={own.key}
        remembered={own.remembered}
        onClose={() => setKeyOpen(false)}
        onSave={(key, remember) => {
          // Even if the browser refuses to store it, the key works until the page closes.
          setOwnKey(key, remember);
          setOwn({ key, remembered: remember });
          setKeyOpen(false);
          post(aiSay('Your API key is set. Draft clues and questions now go from this browser to Anthropic.'));
        }}
        onRemove={() => {
          clearOwnKey();
          setOwn({ key: '', remembered: false });
          setKeyOpen(false);
          post(aiSay('Your API key is removed from this browser.'));
        }}
      />
      {confirmDialog}
      <RebusDialog
        at={rebusAt === null ? null : { row: Math.floor(rebusAt / C) + 1, col: (rebusAt % C) + 1, value: g[rebusAt] === '#' ? '' : g[rebusAt] }}
        onClose={() => setRebusAt(null)}
        onSave={(v) => {
          if (rebusAt === null) return;
          const next = g.slice();
          next[rebusAt] = v;
          editGrid(next, [rebusAt]);
          setRebusAt(null);
        }}
      />
    </>
  );
}
