import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Cell, ClueList } from '../design-system/across/components/src';
import { ClueText } from '../components/ClueText';
import { clueToPlain } from '../lib/clueFormat';
import { analyze } from '../lib/grid';
import { loadPuzzle } from '../lib/storage';
import { NotFound } from './NotFound';

/** A printable page: blank numbered grid and both clue lists, with an optional answer key. */
export function PrintView() {
  const { id = '' } = useParams();
  const [answers, setAnswers] = useState(false);
  const p = loadPuzzle(id);
  if (!p) return <NotFound message="This puzzle is not saved in this browser." />;

  const m = analyze(p.grid, p.rows, p.cols);
  const size = Math.max(p.rows, p.cols) <= 7 ? 'lg' : Math.max(p.rows, p.cols) <= 15 ? 'md' : 'sm';
  const clues = (list: typeof m.across) => list.map((w) => {
    const c = p.clues[w.key]?.trim();
    return { number: w.num, text: c && clueToPlain(c).trim() ? <ClueText clue={c} /> : '—' };
  });

  return (
    <div className="print-page" data-theme="light">
      <main className="print">
        <div className="print__bar no-print">
          <Button variant="primary" className="tall" onClick={() => window.print()}>Print</Button>
          <label className="check">
            <input type="checkbox" checked={answers} onChange={() => setAnswers(!answers)} />
            Show answers
          </label>
          <Link to={`/puzzle/${p.id}`} style={{ marginLeft: 'auto', fontWeight: 600 }}>Back to the grid</Link>
        </div>
        <header className="print__head">
          <h1 className="ac-text-display">{p.title}</h1>
          {p.author && <p className="muted">By {p.author}</p>}
        </header>
        <div className="print__body">
          <div className={`print-grid ac-grid--${size}`} style={{ gridTemplateColumns: `repeat(${p.cols}, var(--ac-cell))` }}
            role="img" aria-label={`${p.rows} by ${p.cols} crossword grid`}>
            {p.grid.map((v, i) => (
              <Cell key={i} inGrid size={size} state={v === '#' ? 'block' : 'empty'}
                number={m.num[i] || undefined} letter={answers && v !== '#' ? v : ''} />
            ))}
          </div>
          <div className="print__clues">
            <ClueList direction="across" clues={clues(m.across)} />
            <ClueList direction="down" clues={clues(m.down)} />
          </div>
        </div>
      </main>
    </div>
  );
}
