import type { CheckStatus } from '../lib/validate';

const LABEL: Record<CheckStatus, string> = { pass: 'Passes', fail: 'Fails', warn: 'Warning', todo: 'In progress' };

/** Check-state glyphs: a tick, a cross, a triangle or an open square. The shape carries the meaning. */
export function StatusIcon({ status, decorative }: { status: CheckStatus; decorative?: boolean }) {
  const a11y = decorative ? { 'aria-hidden': true as const } : { role: 'img', 'aria-label': LABEL[status] };
  return (
    <svg className={`icon icon--${status}`} viewBox="0 0 12 12" {...a11y}>
      {status === 'pass' && <path d="M2 6.5 L5 9.5 L10 2.5" />}
      {status === 'fail' && <path d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5" />}
      {status === 'warn' && <><path d="M6 1.2 L11 10.5 L1 10.5 Z" /><path d="M6 4.5 L6 7.4 M6 8.6 L6 9.4" /></>}
      {status === 'todo' && <rect x="2" y="2" width="8" height="8" />}
    </svg>
  );
}
