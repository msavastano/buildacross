import type * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: one per view, ink fill · secondary: outlined (default) · quiet: underlined text */
  variant?: 'primary' | 'secondary' | 'quiet';
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface CellProps {
  letter?: string;
  number?: number;
  state?: 'empty' | 'active' | 'word' | 'block';
  mark?: 'wrong' | 'revealed';
  pencil?: boolean;
  circled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** set by Grid: drop the standalone border */
  inGrid?: boolean;
  onClick?: () => void;
  className?: string;
}
export declare function Cell(props: CellProps): React.ReactElement;

export type Direction = 'across' | 'down';
export interface ActiveWord { number: number; direction: Direction; row: number; col: number; length: number }
export interface GridProps {
  /** rows of the answer grid, '#' = black square */
  solution: string[];
  /** same shape: '.' empty, UPPERCASE pen, lowercase pencil */
  entries?: string[];
  marks?: Record<string, 'wrong' | 'revealed'>;
  /** "row,col" keys of circled squares */
  circles?: string[];
  active?: { row: number; col: number; direction?: Direction };
  size?: 'sm' | 'md' | 'lg';
  pencilMode?: boolean;
  readOnly?: boolean;
  label?: string;
  onSelect?: (word: ActiveWord) => void;
  onChange?: (entries: string[]) => void;
  className?: string;
}
export declare function Grid(props: GridProps): React.ReactElement;

export interface ClueBarProps {
  number: number;
  direction: Direction;
  children?: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}
export declare function ClueBar(props: ClueBarProps): React.ReactElement;

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
export declare function ClueList(props: ClueListProps): React.ReactElement;

export interface Entry { number: number; row: number; col: number; length: number; answer: string }
export declare function numberGrid(solution: string[]): { numbers: number[][]; across: Entry[]; down: Entry[]; rows: number; cols: number };

declare global {
  interface Window {
    Across: { Button: typeof Button; Cell: typeof Cell; Grid: typeof Grid; ClueBar: typeof ClueBar; ClueList: typeof ClueList; numberGrid: typeof numberGrid };
  }
}
