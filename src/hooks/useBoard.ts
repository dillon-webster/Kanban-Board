import { useState, useCallback, useEffect, useRef } from 'react';
import type { Board, Card } from '../types';
import { initialBoard } from '../data';
import { supabase } from '../lib/supabase';

const BOARD_ID = 'board-1';

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export function useBoard() {
  const [board, setBoard] = useState<Board>({ ...initialBoard, lists: [] });
  const [loading, setLoading] = useState(true);
  const boardRef = useRef(board);

  // Keep ref in sync with latest board state
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    async function load() {
      const { data: boardRow } = await supabase
        .from('boards')
        .select('id, title')
        .eq('id', BOARD_ID)
        .maybeSingle();

      if (!boardRow) {
        // First load — seed the database with initial data
        await supabase.from('boards').insert({ id: BOARD_ID, title: initialBoard.title });
        for (const [i, list] of initialBoard.lists.entries()) {
          await supabase.from('lists').insert({ id: list.id, board_id: BOARD_ID, title: list.title, position: i });
          for (const [j, card] of list.cards.entries()) {
            await supabase.from('cards').insert({ id: card.id, list_id: list.id, title: card.title, description: card.description, position: j });
          }
        }
        setBoard(initialBoard);
      } else {
        const { data: listsRows } = await supabase
          .from('lists')
          .select('id, title, position')
          .eq('board_id', BOARD_ID)
          .order('position');

        const listIds = (listsRows || []).map(l => l.id);

        const { data: cardsRows } = listIds.length
          ? await supabase.from('cards').select('id, list_id, title, description, position').in('list_id', listIds).order('position')
          : { data: [] };

        setBoard({
          id: boardRow.id,
          title: boardRow.title,
          lists: (listsRows || []).map(l => ({
            id: l.id,
            title: l.title,
            cards: (cardsRows || [])
              .filter(c => c.list_id === l.id)
              .map(c => ({ id: c.id, title: c.title, description: c.description })),
          })),
        });
      }

      setLoading(false);
    }

    load();
  }, []);

  const addList = useCallback((title: string) => {
    const id = generateId();
    setBoard(prev => {
      const position = prev.lists.length;
      supabase.from('lists').insert({ id, board_id: BOARD_ID, title, position });
      return { ...prev, lists: [...prev.lists, { id, title, cards: [] }] };
    });
  }, []);

  const deleteList = useCallback((listId: string) => {
    supabase.from('lists').delete().eq('id', listId);
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.filter(l => l.id !== listId),
    }));
  }, []);

  const renameList = useCallback((listId: string, title: string) => {
    supabase.from('lists').update({ title }).eq('id', listId);
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(l => (l.id === listId ? { ...l, title } : l)),
    }));
  }, []);

  const addCard = useCallback((listId: string, title: string) => {
    const id = generateId();
    setBoard(prev => {
      const list = prev.lists.find(l => l.id === listId);
      const position = list ? list.cards.length : 0;
      supabase.from('cards').insert({ id, list_id: listId, title, description: '', position });
      return {
        ...prev,
        lists: prev.lists.map(l =>
          l.id === listId ? { ...l, cards: [...l.cards, { id, title, description: '' }] } : l
        ),
      };
    });
  }, []);

  const updateCard = useCallback((listId: string, card: Card) => {
    supabase.from('cards').update({ title: card.title, description: card.description }).eq('id', card.id);
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
    supabase.from('cards').delete().eq('id', cardId);
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

  const saveMoveToSupabase = useCallback(() => {
    for (const list of boardRef.current.lists) {
      list.cards.forEach((c, i) => {
        supabase.from('cards').update({ list_id: list.id, position: i }).eq('id', c.id).then(({ error }) => {
          if (error) console.error('Failed to save card position:', error);
        });
      });
    }
  }, []);

  const renameBoard = useCallback((title: string) => {
    supabase.from('boards').update({ title }).eq('id', BOARD_ID);
    setBoard(prev => ({ ...prev, title }));
  }, []);

  return { board, loading, addList, deleteList, renameList, addCard, updateCard, deleteCard, moveCard, saveMoveToSupabase, renameBoard };
}
