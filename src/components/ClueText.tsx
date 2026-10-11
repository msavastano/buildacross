import { parseClue } from '../lib/clueFormat';

/** A stored clue rendered with its italic and bold runs. */
export function ClueText({ clue }: { clue: string }) {
  return (
    <>
      {parseClue(clue).map((r, k) => {
        let node = <>{r.text}</>;
        if (r.i) node = <em>{node}</em>;
        if (r.b) node = <strong>{node}</strong>;
        return <span key={k}>{node}</span>;
      })}
    </>
  );
}
