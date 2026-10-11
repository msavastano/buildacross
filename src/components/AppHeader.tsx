import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  /** puzzle name and meta line, shown beside the wordmark */
  title?: string;
  meta?: string;
  actions?: ReactNode;
}

export function AppHeader({ title, meta, actions }: Props) {
  return (
    <header className="app-header no-print">
      <div className="app-header__inner">
        <Link to="/" className="wordmark">Across</Link>
        <div className="app-header__title">
          {title !== undefined && <span className="name">{title}</span>}
          {meta && <span className="label muted">{meta}</span>}
        </div>
        <div className="app-header__actions">
          {actions}
          <Link to="/puzzles" className="text-btn" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Your puzzles</Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
