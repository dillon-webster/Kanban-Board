import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { useBoard } from '../hooks/useBoard';
import ListColumn from './ListColumn';
import type { Card } from '../types';

interface Props {
  boardId: string;
  onBack: () => void;
  onSignOut: () => void;
}

export default function Board({ boardId, onBack, onSignOut }: Props) {
  const { board, loading, addList, deleteList, renameList, addCard, updateCard, deleteCard, moveCard, saveMoveToSupabase, renameBoard } =
    useBoard(boardId);

  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [editingBoardTitle, setEditingBoardTitle] = useState(false);
  const [boardTitleValue, setBoardTitleValue] = useState('');
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const submitList = () => {
    if (newListTitle.trim()) addList(newListTitle.trim());
    setNewListTitle('');
    setAddingList(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'card') {
      const listId = active.data.current.listId as string;
      const list = board.lists.find(l => l.id === listId);
      const card = list?.cards.find(c => c.id === active.id);
      if (card) setActiveCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== 'card') return;

    const overType = over.data.current?.type;
    const overListId = overType === 'list' ? (over.id as string) : (over.data.current?.listId as string);
    if (!overListId) return;

    const activeListId = active.data.current?.listId as string;
    if (activeListId === overListId) return;

    const toList = board.lists.find(l => l.id === overListId);
    if (!toList) return;

    const toIndex = overType === 'card' ? toList.cards.findIndex(c => c.id === over.id) : toList.cards.length;
    moveCard(active.id as string, overListId, toIndex < 0 ? toList.cards.length : toIndex);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (active.data.current?.type === 'card') {
      if (over && active.id !== over.id) {
        const overType = over.data.current?.type;
        const overListId = overType === 'list' ? (over.id as string) : (over.data.current?.listId as string);
        const activeListId = active.data.current?.listId as string;

        if (overListId && activeListId === overListId) {
          const activeList = board.lists.find(l => l.id === activeListId);
          if (activeList) {
            const toIndex = activeList.cards.findIndex(c => c.id === over.id);
            if (toIndex >= 0) moveCard(active.id as string, overListId, toIndex);
          }
        }
      }
      setTimeout(() => saveMoveToSupabase(), 0);
    }
  };

  if (loading) {
    return <div className="board-loading">Loading...</div>;
  }

  return (
    <div className="board-wrapper">
      <header className="board-header">
        <span className="board-header-logo">Flow</span>
        <div className="board-header-divider" />
        <button className="back-btn" onClick={onBack}>← Boards</button>
        <div className="board-header-divider" />
        {editingBoardTitle ? (
          <input
            className="input board-title-input"
            value={boardTitleValue}
            onChange={e => setBoardTitleValue(e.target.value)}
            onBlur={() => { renameBoard(boardTitleValue.trim() || board.title); setEditingBoardTitle(false); }}
            onKeyDown={e => {
              if (e.key === 'Enter') { renameBoard(boardTitleValue.trim() || board.title); setEditingBoardTitle(false); }
              if (e.key === 'Escape') setEditingBoardTitle(false);
            }}
            autoFocus
          />
        ) : (
          <h1
            className="board-title"
            onClick={() => { setBoardTitleValue(board.title); setEditingBoardTitle(true); }}
          >
            {board.title}
          </h1>
        )}
        <div className="board-header-accent" style={{ background: board.color }} />
        <button className="btn btn-ghost signout-btn" onClick={onSignOut}>Sign out</button>
      </header>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="board-lists">
          {board.lists.map(list => (
            <ListColumn
              key={list.id}
              list={list}
              onAddCard={title => addCard(list.id, title)}
              onUpdateCard={card => updateCard(list.id, card)}
              onDeleteCard={cardId => deleteCard(list.id, cardId)}
              onDeleteList={() => deleteList(list.id)}
              onRenameList={title => renameList(list.id, title)}
            />
          ))}

          <div className="add-list-column">
            {addingList ? (
              <div className="add-list-form">
                <input
                  className="input"
                  placeholder="List title..."
                  value={newListTitle}
                  onChange={e => setNewListTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitList(); if (e.key === 'Escape') setAddingList(false); }}
                  autoFocus
                />
                <div className="add-card-actions">
                  <button className="btn btn-primary" onClick={submitList}>Add list</button>
                  <button className="icon-btn" onClick={() => setAddingList(false)}>✕</button>
                </div>
              </div>
            ) : (
              <button className="add-list-btn" onClick={() => setAddingList(true)}>+ Add another list</button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="card-item dragging">
              <span className="card-title">{activeCard.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
