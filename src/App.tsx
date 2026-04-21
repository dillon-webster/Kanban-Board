import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Home from './components/Home';
import Board from './components/Board';
import AuthPage from './components/AuthPage';
import './App.css';

const LAST_BOARD_KEY = 'flow-last-board';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [boardId, setBoardId] = useState<string | null>(
    () => localStorage.getItem(LAST_BOARD_KEY)
  );

  const selectBoard = (id: string) => {
    localStorage.setItem(LAST_BOARD_KEY, id);
    setBoardId(id);
  };

  const goHome = () => {
    localStorage.removeItem(LAST_BOARD_KEY);
    setBoardId(null);
  };

  if (loading) return <div className="board-loading">Loading...</div>;
  if (!user) return <AuthPage />;

  if (boardId) {
    return <Board boardId={boardId} onBack={goHome} onSignOut={signOut} />;
  }

  return <Home onSelectBoard={selectBoard} onSignOut={signOut} />;
}
