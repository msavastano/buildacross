import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '../design-system/across/components/src';
import { clampDim, sampleAvailable, SIZES, type SizeId } from '../lib/puzzle';
import { isNytSize, NYT_RULES, type PuzzleType } from '../lib/rules';

export interface PuzzleFormValues {
  title: string;
  author: string;
  sizeId: SizeId;
  rows: number;
  cols: number;
  nyt: boolean;
  ptype: PuzzleType;
  start: 'sample' | 'blank';
}

interface Props {
  initial: PuzzleFormValues;
  /** settings for an existing puzzle: the size is fixed and there is no starting grid */
  existing?: boolean;
  submitLabel: string;
  onSubmit: (v: PuzzleFormValues) => void;
  secondary?: ReactNode;
}

function WarnIcon() {
  return (
    <svg className="icon icon--warn" viewBox="0 0 12 12" aria-hidden="true" style={{ marginTop: 2 }}>
      <path d="M6 1.2 L11 10.5 L1 10.5 Z" /><path d="M6 4.5 L6 7.4 M6 8.6 L6 9.4" />
    </svg>
  );
}

export function PuzzleForm({ initial, existing, submitLabel, onSubmit, secondary }: Props) {
  const [v, setV] = useState(initial);
  const set = (ch: Partial<PuzzleFormValues>) => setV((s) => ({ ...s, ...ch }));

  const size = SIZES.find((z) => z.id === v.sizeId)!;
  const rows = existing ? v.rows : v.sizeId === 'custom' ? v.rows : size.rows;
  const cols = existing ? v.cols : v.sizeId === 'custom' ? v.cols : size.cols;
  const nytSize = isNytSize(rows, cols);
  const sampleOk = sampleAvailable(v.sizeId);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ ...v, rows, cols, start: sampleOk ? v.start : 'blank' });
  }

  return (
    <form onSubmit={submit} className="setup" style={{ padding: 0 }}>
      <section className="setup__section" aria-labelledby="sec-details">
        <h2 id="sec-details" className="label">Details</h2>
        <div className="setup__row">
          <label className="field">
            Title
            <input className="input input--serif" type="text" value={v.title} onChange={(e) => set({ title: e.target.value })} />
          </label>
          <label className="field">
            Constructor
            <input className="input" type="text" value={v.author} placeholder="Your name" onChange={(e) => set({ author: e.target.value })} />
          </label>
        </div>
      </section>

      <section className="setup__section" aria-labelledby="sec-size">
        <h2 id="sec-size" className="label">Grid size</h2>
        {existing ? (
          <p>
            <span className="size-card__dims">{v.rows} × {v.cols}</span>
            <span className="muted"> · To change the size, start a new puzzle.</span>
          </p>
        ) : (
          <>
            <div className="size-grid" role="radiogroup" aria-label="Grid size">
              {SIZES.map((z) => (
                <label key={z.id} className="size-card">
                  <input type="radio" name="grid-size" checked={v.sizeId === z.id} onChange={() => set({ sizeId: z.id })} />
                  <span className="size-card__dims">{z.id === 'custom' ? `${v.rows} × ${v.cols}` : `${z.rows} × ${z.cols}`}</span>
                  <span className="ac-text-ui">{z.label}</span>
                  <span className="muted" style={{ fontSize: 13, lineHeight: '18px' }}>{z.note}</span>
                </label>
              ))}
            </div>
            {v.sizeId === 'custom' && (
              <div className="setup__row" style={{ alignItems: 'flex-end' }}>
                <label className="field">
                  Rows
                  <input className="input input--narrow" type="number" min={3} max={25} value={v.rows}
                    onChange={(e) => set({ rows: clampDim(e.target.value) })} />
                </label>
                <label className="field">
                  Columns
                  <input className="input input--narrow" type="number" min={3} max={25} value={v.cols}
                    onChange={(e) => set({ cols: clampDim(e.target.value) })} />
                </label>
                <span className="muted" style={{ fontSize: 13, lineHeight: '44px' }}>3 to 25 squares each way.</span>
              </div>
            )}
          </>
        )}
      </section>

      <section className="setup__section" aria-labelledby="sec-rules">
        <h2 id="sec-rules" className="label">Submission rules</h2>
        <label className="option-card">
          <input type="checkbox" checked={v.nyt} onChange={() => set({ nyt: !v.nyt })} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontWeight: 600 }}>Follow NYT submission guidelines</span>
            <span className="muted" style={{ fontSize: 14, lineHeight: '20px' }}>
              Checks rotational symmetry, all-over interlock, unchecked squares, 3-letter minimum, word count,
              black-square density and repeated answers as you build. Black squares always mirror.{' '}
              <a href={NYT_RULES.sourceUrl} target="_blank" rel="noreferrer">Read the guidelines</a>
            </span>
          </span>
        </label>
        {v.nyt && !nytSize && (
          <div className="notice" role="note">
            <WarnIcon />
            <span>NYT takes 15 × 15 dailies and 21 × 21 Sundays. You can still build this grid; the size check will fail.</span>
          </div>
        )}
        {v.nyt && rows === 15 && cols === 15 && (
          <fieldset className="fieldset">
            <legend>Puzzle type</legend>
            <div className="setup__row" style={{ gap: '8px 24px' }}>
              <label className="check plain">
                <input type="radio" name="ptype" checked={v.ptype !== 'themeless'} onChange={() => set({ ptype: 'themed' })} />
                Themed, Monday to Thursday · {NYT_RULES.maxWords.themed} words max
              </label>
              <label className="check plain">
                <input type="radio" name="ptype" checked={v.ptype === 'themeless'} onChange={() => set({ ptype: 'themeless' })} />
                Themeless, Friday or Saturday · {NYT_RULES.maxWords.themeless} words max
              </label>
            </div>
          </fieldset>
        )}
        {v.nyt && rows === 21 && cols === 21 && (
          <p className="muted" style={{ fontSize: 14 }}>Sunday puzzle: {NYT_RULES.maxWords.sunday} words max.</p>
        )}
      </section>

      {!existing && (
        <section className="setup__section" aria-labelledby="sec-start">
          <h2 id="sec-start" className="label">Starting grid</h2>
          <div className="setup__row" style={{ gap: '8px 24px' }}>
            <label className={`check plain${sampleOk ? '' : ' check--disabled'}`}>
              <input type="radio" name="start" disabled={!sampleOk} checked={sampleOk && v.start === 'sample'} onChange={() => set({ start: 'sample' })} />
              Sample pattern
            </label>
            <label className="check plain">
              <input type="radio" name="start" checked={!sampleOk || v.start !== 'sample'} onChange={() => set({ start: 'blank' })} />
              Blank grid
            </label>
          </div>
          {!sampleOk && <p className="muted" style={{ fontSize: 13 }}>Sample patterns come in 5 × 5 and 15 × 15.</p>}
        </section>
      )}

      <div className="actions">
        <Button type="submit" variant="primary" className="big">{submitLabel}</Button>
        {secondary}
      </div>
    </form>
  );
}
