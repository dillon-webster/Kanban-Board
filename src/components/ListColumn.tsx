import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { List, Card } from '../types';
import CardItem from './CardItem';

interface Props {
  list: List;
  onAddCard: (title: string) => void;
  onUpdateCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteList: () => void;
  onRenameList: (title: string) => void;
}

export default function ListColumn({
  list,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onDeleteList,
  onRenameList,
}: Props) {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);

  const { setNodeRef } = useDroppable({ id: list.id, data: { type: 'list' } });

  const submitCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(newCardTitle.trim());
      setNewCardTitle('');
    }
    setAddingCard(false);
  };

  const submitTitle = () => {
    if (titleValue.trim()) onRenameList(titleValue.trim());
    else setTitleValue(list.title);
    setEditingTitle(false);
  };

  return (
    <div className="list-column">
      <div className="list-header">
        {editingTitle ? (
          <input
            className="input list-title-input"
            value={titleValue}
            onChange={e => setTitleValue(e.target.value)}
            onBlur={submitTitle}
            onKeyDown={e => { if (e.key === 'Enter') submitTitle(); if (e.key === 'Escape') { setTitleValue(list.title); setEditingTitle(false); } }}
            autoFocus
          />
        ) : (
          <h3 className="list-title" onClick={() => setEditingTitle(true)}>{list.title}</h3>
        )}
        <button className="icon-btn" onClick={onDeleteList} title="Delete list">✕</button>
      </div>

      <SortableContext items={list.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="card-list" ref={setNodeRef}>
          {list.cards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              listId={list.id}
              onUpdate={onUpdateCard}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </div>
      </SortableContext>

      {addingCard ? (
        <div className="add-card-form">
          <textarea
            className="textarea"
            placeholder="Card title..."
            value={newCardTitle}
            onChange={e => setNewCardTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitCard(); } if (e.key === 'Escape') setAddingCard(false); }}
            autoFocus
            rows={2}
          />
          <div className="add-card-actions">
            <button className="btn btn-primary" onClick={submitCard}>Add card</button>
            <button className="icon-btn" onClick={() => setAddingCard(false)}>✕</button>
          </div>
        </div>
      ) : (
        <button className="add-card-btn" onClick={() => setAddingCard(true)}>+ Add a card</button>
      )}
    </div>
  );
}
