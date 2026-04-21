import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { useBoard } from '../hooks/useBoard';
import ListColumn from './ListColumn';
import type { Card } from '../types';

export default function Board() {
  const { board, loading, addList, deleteList, renameList, addCard, updateCard, deleteCard, moveCard, renameBoard } =
    useBoard();

  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [editingBoardTitle, setEditingBoardTitle] = useState(false);
  const [boardTitleValue, setBoardTitleValue] = useState(board.title);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

    // Only handle cross-list moves here; source list is resolved inside moveCard from latest state
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

    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== 'card') return;

    // Cross-list moves are already done by onDragOver — only handle same-list reordering here
    const overType = over.data.current?.type;
    const overListId = overType === 'list' ? (over.id as string) : (over.data.current?.listId as string);
    const activeListId = active.data.current?.listId as string;
    if (!overListId || activeListId !== overListId) return;

    const activeList = board.lists.find(l => l.id === activeListId);
    if (!activeList) return;

    const toIndex = activeList.cards.findIndex(c => c.id === over.id);
    if (toIndex >= 0) moveCard(active.id as string, overListId, toIndex);
  };

  if (loading) {
    return <div className="board-loading">Loading...</div>;
  }

  return (
    <div className="board-wrapper">
      <header className="board-header">
        {editingBoardTitle ? (
          <input
            className="input board-title-input"
            value={boardTitleValue}
            onChange={e => setBoardTitleValue(e.target.value)}
            onBlur={() => { renameBoard(boardTitleValue.trim() || board.title); setEditingBoardTitle(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { renameBoard(boardTitleValue.trim() || board.title); setEditingBoardTitle(false); } }}
            autoFocus
          />
        ) : (
          <h1 className="board-title" onClick={() => setEditingBoardTitle(true)}>{board.title}</h1>
        )}
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
