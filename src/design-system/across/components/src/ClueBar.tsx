import type { ReactNode } from 'react';
import { cx } from './cx';
import type { Direction } from './numberGrid';

export interface ClueBarProps {
  number: number;
  direction: Direction;
  children?: ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

export function ClueBar({ number, direction, children, onPrev, onNext, className }: ClueBarProps) {
  return (
    <div className={cx('ac-cluebar', className)} aria-live="polite">
      {onPrev && <button type="button" className="ac-cluebar__nav" onClick={onPrev} aria-label="Previous clue">‹</button>}
      <span className="ac-cluebar__chip" aria-label={`${number} ${direction}`}>
        {number}{direction === 'down' ? 'D' : 'A'}
      </span>
      <span className="ac-cluebar__text">{children}</span>
      {onNext && <button type="button" className="ac-cluebar__nav" onClick={onNext} aria-label="Next clue">›</button>}
    </div>
  );
}
