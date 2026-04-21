import { useState, useCallback, useEffect } from 'react';
import type { Board, Card } from '../types';
import { initialBoard } from '../data';

const STORAGE_KEY = 'kanban-board';

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function loadBoard(): Board {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as Board;
  } catch {
    // corrupted data — fall back to defaults
  }
  return initialBoard;
}

export function useBoard() {
  const [board, setBoard] = useState<Board>(loadBoard);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }, [board]);

  const addList = useCallback((title: string) => {
    setBoard(prev => ({
      ...prev,
      lists: [...prev.lists, { id: generateId(), title, cards: [] }],
    }));
  }, []);

  const deleteList = useCallback((listId: string) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.filter(l => l.id !== listId),
    }));
  }, []);

  const renameList = useCallback((listId: string, title: string) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(l => (l.id === listId ? { ...l, title } : l)),
    }));
  }, []);

  const addCard = useCallback((listId: string, title: string) => {
    const card: Card = { id: generateId(), title, description: '' };
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(l =>
        l.id === listId ? { ...l, cards: [...l.cards, card] } : l
      ),
    }));
  }, []);

  const updateCard = useCallback((listId: string, card: Card) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(l =>
        l.id === listId
          ? { ...l, cards: l.cards.map(c => (c.id === card.id ? card : c)) }
          : l
      ),
    }));
  }, []);

  const deleteCard = useCallback((listId: string, cardId: string) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(l =>
        l.id === listId ? { ...l, cards: l.cards.filter(c => c.id !== cardId) } : l
      ),
    }));
  }, []);

  const moveCard = useCallback((cardId: string, toListId: string, toIndex: number) => {
    setBoard(prev => {
      const fromList = prev.lists.find(l => l.cards.some(c => c.id === cardId));
      if (!fromList) return prev;
      const card = fromList.cards.find(c => c.id === cardId)!;
      const fromListId = fromList.id;

      return {
        ...prev,
        lists: prev.lists.map(l => {
          if (l.id === fromListId && l.id === toListId) {
            const cards = l.cards.filter(c => c.id !== cardId);
            cards.splice(toIndex, 0, card);
            return { ...l, cards };
          }
          if (l.id === fromListId) {
            return { ...l, cards: l.cards.filter(c => c.id !== cardId) };
          }
          if (l.id === toListId) {
            const cards = [...l.cards];
            cards.splice(toIndex, 0, card);
            return { ...l, cards };
          }
          return l;
        }),
      };
    });
  }, []);

  const renamBoard = useCallback((title: string) => {
    setBoard(prev => ({ ...prev, title }));
  }, []);

  return { board, addList, deleteList, renameList, addCard, updateCard, deleteCard, moveCard, renamBoard };
}
