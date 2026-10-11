import { useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../design-system/across/components/src';
import { newId, puzzleTypeName, type Puzzle } from '../lib/puzzle';
import { deletePuzzle, listPuzzles, savePuzzle } from '../lib/storage';

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function isPuzzle(x: unknown): x is Puzzle {
  const p = x as Puzzle;
  return !!p && typeof p.rows === 'number' && typeof p.cols === 'number' && Array.isArray(p.grid)
    && p.grid.length === p.rows * p.cols && typeof p.clues === 'object';
}

export function SavedPuzzles() {
  const [items, setItems] = useState(listPuzzles);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  function remove(p: Puzzle) {
    if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    deletePuzzle(p.id);
    setItems(listPuzzles());
  }

  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const data: unknown = JSON.parse(await f.text());
      if (!isPuzzle(data)) throw new Error('shape');
      const p: Puzzle = { ...data, id: newId(), updatedAt: Date.now() };
      savePuzzle(p);
      navigate(`/puzzle/${p.id}`);
    } catch {
      setError('That file is not an Across backup.');
    }
  }

  return (
    <>
      <AppHeader title="" meta="Your puzzles" />
      <main className="setup">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h1 className="ac-text-display">Your puzzles</h1>
          <p className="muted">Saved in this browser. Download a backup from Export puzzle to keep a copy elsewhere.</p>
        </div>
        {items.length === 0 ? (
          <p>No puzzles yet.</p>
        ) : (
          <ul className="list">
            {items.map((p) => (
              <li key={p.id}>
                <Link className="list__name" to={`/puzzle/${p.id}`}>{p.title}</Link>
                <span className="list__meta muted" style={{ fontSize: 14 }}>
                  {p.rows} × {p.cols} · {puzzleTypeName(p)} · edited {dateFmt.format(p.updatedAt)}
                </span>
                <Button variant="quiet" onClick={() => remove(p)} aria-label={`Delete ${p.title}`}>Delete</Button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="notice" role="alert">{error}</p>}
        <div className="actions">
          <Link className="link-btn link-btn--primary link-btn--big" to="/new">Start a puzzle</Link>
          <Button className="big" onClick={() => fileRef.current?.click()}>Import a backup</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importFile} />
        </div>
      </main>
    </>
  );
}
