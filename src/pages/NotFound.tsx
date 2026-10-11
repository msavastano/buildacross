import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';

export function NotFound({ message = 'This page does not exist.' }: { message?: string }) {
  return (
    <>
      <AppHeader />
      <main className="setup">
        <h1 className="ac-text-display">Not found</h1>
        <p className="muted">{message}</p>
        <div className="actions">
          <Link className="link-btn link-btn--primary" to="/new">Start a puzzle</Link>
          <Link className="link-btn" to="/puzzles">Your puzzles</Link>
        </div>
      </main>
    </>
  );
}
