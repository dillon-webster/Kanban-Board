import { useState, useCallback, useEffect } from 'react';
import type { BoardSummary } from '../types';
import { supabase } from '../lib/supabase';

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export function useBoards() {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: boardsData } = await supabase
        .from('boards')
        .select('id, title, color')
        .order('created_at');

      if (!boardsData?.length) {
        setLoading(false);
        return;
      }

      const boardIds = boardsData.map(b => b.id);
      const { data: listsData } = await supabase
        .from('lists')
        .select('id, board_id')
        .in('board_id', boardIds);

      const listIds = (listsData || []).map(l => l.id);
      const { data: cardsData } = listIds.length
        ? await supabase.from('cards').select('id, list_id').in('list_id', listIds)
        : { data: [] };

      setBoards(boardsData.map(b => {
        const boardListIds = (listsData || []).filter(l => l.board_id === b.id).map(l => l.id);
        const cardCount = (cardsData || []).filter(c => boardListIds.includes(c.list_id)).length;
        return { id: b.id, title: b.title, color: b.color || '#6366f1', cardCount };
      }));

      setLoading(false);
    }
    load();
  }, []);

  const createBoard = useCallback(async (title: string, color: string): Promise<string> => {
    const id = generateId();
    await supabase.from('boards').insert({ id, title, color });
    setBoards(prev => [...prev, { id, title, color, cardCount: 0 }]);
    return id;
  }, []);

  const deleteBoard = useCallback(async (boardId: string) => {
    await supabase.from('boards').delete().eq('id', boardId);
    setBoards(prev => prev.filter(b => b.id !== boardId));
  }, []);

  return { boards, loading, createBoard, deleteBoard };
}
