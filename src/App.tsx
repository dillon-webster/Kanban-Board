import { useState } from 'react';
import Home from './components/Home';
import Board from './components/Board';
import './App.css';

const LAST_BOARD_KEY = 'flow-last-board';

export default function App() {
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

  if (boardId) {
    return <Board boardId={boardId} onBack={goHome} />;
  }

  return <Home onSelectBoard={selectBoard} />;
}
