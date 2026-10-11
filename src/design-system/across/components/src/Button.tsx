import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: one per view, ink fill · secondary: outlined (default) · quiet: underlined text */
  variant?: 'primary' | 'secondary' | 'quiet';
}

export function Button({ variant = 'secondary', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={cx('ac-btn', `ac-btn--${variant}`, className)} {...rest} />;
}
