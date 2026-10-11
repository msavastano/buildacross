import { cx } from './cx';
import type { Direction } from './numberGrid';

export interface Clue { number: number; text: string; done?: boolean }

export interface ClueListProps {
  direction?: Direction;
  title?: string;
  clues: Clue[];
  activeNumber?: number;
  crossingNumber?: number;
  onSelect?: (number: number) => void;
  className?: string;
}

export function ClueList({ direction = 'across', title, clues, activeNumber, crossingNumber, onSelect, className }: ClueListProps) {
  const heading = title ?? (direction === 'down' ? 'Down' : 'Across');
  return (
    <section className={cx('ac-cluelist', className)} aria-label={`${heading} clues`}>
      <h3 className="ac-cluelist__title">{heading}</h3>
      <ol className="ac-cluelist__items">
        {clues.map((cl) => {
          const active = cl.number === activeNumber;
          return (
            <li key={cl.number}>
              <button
                type="button"
                className={cx('ac-clue', active && 'ac-clue--active', cl.number === crossingNumber && 'ac-clue--crossing', cl.done && 'ac-clue--done')}
                aria-current={active ? 'true' : undefined}
                onClick={onSelect ? () => onSelect(cl.number) : undefined}
              >
                <span className="ac-clue__num">{cl.number}</span>
                <span className="ac-clue__text">{cl.text}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
