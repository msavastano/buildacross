import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { PuzzleForm, type PuzzleFormValues } from '../components/PuzzleForm';
import { newId, startingGrid, type Puzzle } from '../lib/puzzle';
import { savePuzzle } from '../lib/storage';

const AUTHOR_KEY = 'across.author';

function lastAuthor(): string {
  try { return localStorage.getItem(AUTHOR_KEY) ?? ''; } catch { return ''; }
}

export function NewPuzzle() {
  const navigate = useNavigate();
  const initial: PuzzleFormValues = {
    title: 'Untitled puzzle', author: lastAuthor(), sizeId: 'daily', rows: 15, cols: 15,
    nyt: true, ptype: 'themed', start: 'sample',
  };

  function create(v: PuzzleFormValues) {
    const { grid, clues } = startingGrid(v.sizeId, v.rows, v.cols, v.start);
    const now = Date.now();
    const p: Puzzle = {
      id: newId(), title: v.title.trim() || 'Untitled puzzle', author: v.author.trim(),
      rows: v.rows, cols: v.cols, sizeId: v.sizeId, grid, clues,
      nyt: v.nyt, ptype: v.ptype, mirror: true, createdAt: now, updatedAt: now,
    };
    savePuzzle(p);
    try { localStorage.setItem(AUTHOR_KEY, p.author); } catch { /* ignore */ }
    navigate(`/puzzle/${p.id}`);
  }

  return (
    <>
      <AppHeader title="" meta="New puzzle" />
      <main className="setup">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h1 className="ac-text-display">New puzzle</h1>
          <p className="muted">Set the size and rules. You can change the title and clues later.</p>
        </div>
        <PuzzleForm initial={initial} submitLabel="Create puzzle" onSubmit={create} />
      </main>
    </>
  );
}
