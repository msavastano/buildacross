import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { PuzzleForm, type PuzzleFormValues } from '../components/PuzzleForm';
import { loadPuzzle, savePuzzle } from '../lib/storage';
import { NotFound } from './NotFound';

export function Settings() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const p = loadPuzzle(id);
  if (!p) return <NotFound message="This puzzle is not saved in this browser." />;

  const initial: PuzzleFormValues = {
    title: p.title, author: p.author, sizeId: p.sizeId, rows: p.rows, cols: p.cols,
    nyt: p.nyt, ptype: p.ptype, start: 'blank',
  };

  function save(v: PuzzleFormValues) {
    savePuzzle({ ...p!, title: v.title.trim() || 'Untitled puzzle', author: v.author.trim(), nyt: v.nyt, ptype: v.ptype, updatedAt: Date.now() });
    navigate(`/puzzle/${id}`);
  }

  return (
    <>
      <AppHeader title={p.title} meta="Puzzle settings" />
      <main className="setup">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h1 className="ac-text-display">Puzzle settings</h1>
          <p className="muted">Change the title, constructor and rules. The grid and clues stay as they are.</p>
        </div>
        <PuzzleForm
          initial={initial}
          existing
          submitLabel="Save settings"
          onSubmit={save}
          secondary={<Link className="link-btn link-btn--big" to={`/puzzle/${id}`}>Back to the grid</Link>}
        />
      </main>
    </>
  );
}
