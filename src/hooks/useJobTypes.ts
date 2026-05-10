import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { JobType, Stage, StageChecklistItem } from '../types';

type RawStage = Omit<Stage, 'checklist_items'> & { stage_checklist_items: StageChecklistItem[] };

export function useJobTypes() {
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobTypes = useCallback(async () => {
    const { data } = await supabase
      .from('job_types')
      .select('*, stages(*, stage_checklist_items(id, text, position))')
      .order('name');

    if (data) {
      setJobTypes(data.map(jt => ({
        ...jt,
        stages: (jt.stages as RawStage[] || [])
          .sort((a, b) => a.position - b.position)
          .map(s => ({
            ...s,
            checklist_items: (s.stage_checklist_items || []).sort((a, b) => a.position - b.position),
          })),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async, setState only runs after await
    fetchJobTypes().catch(console.error);
  }, [fetchJobTypes]);

  const createJobType = async (name: string): Promise<string | null> => {
    const { data, error } = await supabase.from('job_types').insert({ name }).select().single();
    if (error) return error.message;
    if (data) setJobTypes(prev => [...prev, { ...data, stages: [] }]);
    return null;
  };

  const deleteJobType = async (id: string) => {
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('job_type_id', id);
    if (countError) return countError.message;
    if ((count ?? 0) > 0) return 'Move or delete jobs in this workflow before deleting it.';

    const { error } = await supabase.from('job_types').delete().eq('id', id);
    if (error) return error.message;
    setJobTypes(prev => prev.filter(jt => jt.id !== id));
    return null;
  };

  const addStage = async (jobTypeId: string, name: string, notifyAdmin = false) => {
    const jobType = jobTypes.find(jt => jt.id === jobTypeId);
    const position = jobType?.stages.length ?? 0;
    const { data } = await supabase
      .from('stages')
      .insert({ job_type_id: jobTypeId, name, position, notify_admin: notifyAdmin })
      .select()
      .single();
    if (data) {
      setJobTypes(prev => prev.map(jt =>
        jt.id === jobTypeId ? { ...jt, stages: [...jt.stages, { ...data, checklist_items: [] }] } : jt
      ));
      return null;
    }
    return 'Failed to add stage.';
  };

  const deleteStage = async (jobTypeId: string, stageId: string) => {
    const { error } = await supabase.from('stages').delete().eq('id', stageId);
    if (!error) {
      setJobTypes(prev => prev.map(jt =>
        jt.id === jobTypeId ? { ...jt, stages: jt.stages.filter(s => s.id !== stageId) } : jt
      ));
      return null;
    } else {
      console.error('Failed to delete stage:', error.message);
      return error.message;
    }
  };

  const addStageChecklistItem = async (stageId: string, text: string) => {
    const stage = jobTypes.flatMap(jt => jt.stages).find(s => s.id === stageId);
    const position = stage?.checklist_items.length ?? 0;
    const { data } = await supabase
      .from('stage_checklist_items')
      .insert({ stage_id: stageId, text, position })
      .select()
      .single();
    if (data) {
      setJobTypes(prev => prev.map(jt => ({
        ...jt,
        stages: jt.stages.map(s =>
          s.id === stageId ? { ...s, checklist_items: [...s.checklist_items, data] } : s
        ),
      })));
      return null;
    }
    return 'Failed to add requirement.';
  };

  const deleteStageChecklistItem = async (stageId: string, itemId: string) => {
    const { error } = await supabase.from('stage_checklist_items').delete().eq('id', itemId);
    if (error) return error.message;
    setJobTypes(prev => prev.map(jt => ({
      ...jt,
      stages: jt.stages.map(s =>
        s.id === stageId ? { ...s, checklist_items: s.checklist_items.filter(ci => ci.id !== itemId) } : s
      ),
    })));
    return null;
  };

  return { jobTypes, loading, createJobType, deleteJobType, addStage, deleteStage, addStageChecklistItem, deleteStageChecklistItem, refetch: fetchJobTypes };
}
