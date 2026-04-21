import { useState } from 'react';
import Home from './components/Home';
import Board from './components/Board';
import './App.css';

export default function App() {
  const [boardId, setBoardId] = useState<string | null>(null);

  if (boardId) {
    return <Board boardId={boardId} onBack={() => setBoardId(null)} />;
  }

  return <Home onSelectBoard={setBoardId} />;
}
