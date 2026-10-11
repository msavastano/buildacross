import type { CSSProperties } from 'react';
import { cx } from './cx';

export type CellState = 'empty' | 'active' | 'word' | 'block';
export type CellMark = 'wrong' | 'revealed';
export type CellSize = 'sm' | 'md' | 'lg';

export interface CellProps {
  letter?: string;
  number?: number;
  state?: CellState;
  mark?: CellMark;
  pencil?: boolean;
  circled?: boolean;
  size?: CellSize;
  /** set by Grid: the grid's gap draws the lines, so drop the standalone border */
  inGrid?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Cell({
  letter = '', number, state = 'empty', mark, pencil, circled, size = 'md', inGrid, onClick, className,
}: CellProps) {
  const block = state === 'block';
  const rebus = !block && letter.length > 1;
  const label = block
    ? `Black square${mark === 'wrong' ? ', flagged' : ''}`
    : `${number ? `${number}, ` : ''}${letter ? (rebus ? `rebus ${letter}` : letter) : 'empty'}${pencil ? ', pencil' : ''}` +
      `${mark === 'wrong' ? ', incorrect' : ''}${mark === 'revealed' ? ', revealed' : ''}`;
  return (
    <div
      className={cx(
        'ac-cell', `ac-cell--${size}`, `ac-cell--${state}`,
        inGrid && 'ac-cell--in-grid', pencil && 'ac-cell--pencil',
        mark && `ac-cell--${mark}`, circled && 'ac-cell--circled', rebus && 'ac-cell--rebus', className,
      )}
      style={rebus ? ({ '--ac-rebus-len': Math.min(letter.length, 8) } as CSSProperties) : undefined}
      role="gridcell"
      aria-label={label}
      aria-selected={state === 'active' ? true : undefined}
      onClick={onClick}
    >
      {block && mark === 'wrong' && <span className="ac-cell__slash" aria-hidden />}
      {!block && (
        <>
          {number ? <span className="ac-cell__num" aria-hidden>{number}</span> : null}
          <span className="ac-cell__letter" aria-hidden>{letter}</span>
          {mark === 'wrong' && <span className="ac-cell__slash" aria-hidden />}
          {mark === 'revealed' && <span className="ac-cell__flag" aria-hidden />}
        </>
      )}
    </div>
  );
}
