import { useState } from 'react';
import type { Card } from '../types';

interface Props {
  card: Card;
  onClose: () => void;
  onSave: (card: Card) => void;
  onDelete: () => void;
}

export default function CardModal({ card, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ ...card, title: title.trim(), description: description.trim() });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Card</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <label>Title</label>
        <input
          className="input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />

        <label>Description</label>
        <textarea
          className="textarea"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          placeholder="Add a description..."
        />

        <div className="modal-actions">
          <button className="btn btn-danger" onClick={onDelete}>Delete</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
