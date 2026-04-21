import { useState } from 'react';
import type { BoardSummary } from '../types';
import { useBoards } from '../hooks/useBoards';
import CreateBoardModal from './CreateBoardModal';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  onSelectBoard: (boardId: string) => void;
}

export default function Home({ onSelectBoard }: Props) {
  const { boards, loading, createBoard, deleteBoard } = useBoards();
  const [creating, setCreating] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState<BoardSummary | null>(null);

  const handleCreate = async (title: string, color: string) => {
    const id = await createBoard(title, color);
    onSelectBoard(id);
  };

  const handleDelete = async () => {
    if (!deletingBoard) return;
    await deleteBoard(deletingBoard.id);
    setDeletingBoard(null);
  };

  if (loading) {
    return <div className="board-loading">Loading...</div>;
  }

  return (
    <div className="home-wrapper">
      <header className="home-header">
        <span className="board-header-logo">Flow</span>
      </header>

      <main className="home-main">
        <div className="home-title-row">
          <h2 className="home-heading">Your Boards</h2>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>+ New Board</button>
        </div>

        {boards.length === 0 ? (
          <div className="home-empty">
            <p>No boards yet.</p>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>Create your first board</button>
          </div>
        ) : (
          <div className="boards-grid">
            {boards.map(board => (
              <div
                key={board.id}
                className="board-card"
                style={{ '--board-color': board.color } as React.CSSProperties}
                onClick={() => onSelectBoard(board.id)}
              >
                <div className="board-card-color" />
                <div className="board-card-body">
                  <h3 className="board-card-title">{board.title}</h3>
                  <span className="board-card-count">{board.cardCount} card{board.cardCount !== 1 ? 's' : ''}</span>
                </div>
                <button
                  className="board-card-delete"
                  onClick={e => { e.stopPropagation(); setDeletingBoard(board); }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </main>

      {creating && (
        <CreateBoardModal onClose={() => setCreating(false)} onCreate={handleCreate} />
      )}

      {deletingBoard && (
        <ConfirmDialog
          message={`Delete "${deletingBoard.title}"? This will remove all its lists and cards.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingBoard(null)}
        />
      )}
    </div>
  );
}
