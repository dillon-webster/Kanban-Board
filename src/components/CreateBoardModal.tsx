import { useState } from 'react';

const COLORS = [
  '#6366f1', '#a855f7', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

interface Props {
  onClose: () => void;
  onCreate: (title: string, color: string) => void;
}

export default function CreateBoardModal({ onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate(title.trim(), color);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Board</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <label>Name</label>
        <input
          className="input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onClose(); }}
          placeholder="Board name..."
          autoFocus
        />

        <label>Color</label>
        <div className="color-picker">
          {COLORS.map(c => (
            <button
              key={c}
              className={`color-swatch ${color === c ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="modal-actions">
          <span />
          <button className="btn btn-primary" onClick={handleSubmit}>Create Board</button>
        </div>
      </div>
    </div>
  );
}
