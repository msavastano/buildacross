import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { NewPuzzle } from './pages/NewPuzzle';
import { Editor } from './pages/Editor';
import { Settings } from './pages/Settings';
import { PrintView } from './pages/PrintView';
import { SavedPuzzles } from './pages/SavedPuzzles';
import { NotFound } from './pages/NotFound';

export function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/new" element={<NewPuzzle />} />
      <Route path="/puzzles" element={<SavedPuzzles />} />
      <Route path="/puzzle/:id" element={<Editor />} />
      <Route path="/puzzle/:id/settings" element={<Settings />} />
      <Route path="/puzzle/:id/print" element={<PrintView />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
