import { useRef, useState, type ReactNode } from 'react';
import { Button, Dialog } from '../design-system/across/components/src';

interface ConfirmOptions {
  title: string;
  body: ReactNode;
  /** names the result, e.g. "Delete puzzle" */
  confirmLabel: string;
}

/**
 * In-app replacement for window.confirm. Render `dialog` once; `confirm(...)` opens it and
 * resolves true when the person picks the confirm action, false on Cancel or Escape.
 */
export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(ok: boolean) => void>();

  function confirm(o: ConfirmOptions): Promise<boolean> {
    resolver.current?.(false);
    setOpts(o);
    return new Promise((resolve) => { resolver.current = resolve; });
  }

  function finish(ok: boolean) {
    resolver.current?.(ok);
    resolver.current = undefined;
    setOpts(null);
  }

  const dialog = (
    <Dialog
      open={!!opts}
      title={opts?.title ?? ''}
      onClose={() => finish(false)}
      actions={
        <>
          <Button autoFocus onClick={() => finish(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => finish(true)}>{opts?.confirmLabel}</Button>
        </>
      }
    >
      {typeof opts?.body === 'string' ? <p>{opts.body}</p> : opts?.body}
    </Dialog>
  );

  return { dialog, confirm };
}
