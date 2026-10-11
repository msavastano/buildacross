import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { useConfirm } from './useConfirm';

function Harness() {
  const { dialog, confirm } = useConfirm();
  const [result, setResult] = useState('none');
  return (
    <>
      <button type="button" onClick={async () => setResult(String(await confirm({ title: 'Delete it?', body: 'Gone for good.', confirmLabel: 'Delete puzzle' })))}>
        Ask
      </button>
      <output>{result}</output>
      {dialog}
    </>
  );
}

describe('useConfirm', () => {
  it('resolves true on the confirm action and false on Cancel', async () => {
    render(<Harness />);
    await act(async () => { fireEvent.click(screen.getByText('Ask')); });
    expect(screen.getByRole('heading', { name: 'Delete it?' })).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByText('Delete puzzle')); });
    expect(screen.getByRole('status').textContent).toBe('true');
    expect(screen.queryByRole('heading', { name: 'Delete it?' })).toBeNull();

    await act(async () => { fireEvent.click(screen.getByText('Ask')); });
    await act(async () => { fireEvent.click(screen.getByText('Cancel')); });
    expect(screen.getByRole('status').textContent).toBe('false');
  });
});
