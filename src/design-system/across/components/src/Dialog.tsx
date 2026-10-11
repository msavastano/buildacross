import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './cx';

export interface DialogProps {
  open: boolean;
  /** sentence case, set in the title style */
  title: string;
  /** Escape, a click on the backdrop, and any action that dismisses the dialog all call this */
  onClose: () => void;
  children?: ReactNode;
  /** Buttons, right-aligned. Put `autoFocus` on the safe choice. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Modal dialog on the native <dialog> element: it traps focus, closes on Escape and
 * returns focus to whatever opened it. Controlled by `open`. Rendered into document.body, so it
 * can be opened from anywhere, even inside a paragraph.
 */
export function Dialog({ open, title, onClose, children, actions, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!open && d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }
  }, [open]);

  return createPortal(
    <dialog
      ref={ref}
      className={cx('ac-dialog', className)}
      aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {open && (
        <div className="ac-dialog__inner">
          <h2 id={titleId} className="ac-dialog__title">{title}</h2>
          {children && <div className="ac-dialog__body">{children}</div>}
          {actions && <div className="ac-dialog__actions">{actions}</div>}
        </div>
      )}
    </dialog>,
    document.body,
  );
}
