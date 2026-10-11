import { useTheme } from '../theme';

export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  return (
    <button type="button" className="text-btn" aria-pressed={theme === 'dark'} onClick={toggle}>
      Night edition
    </button>
  );
}
