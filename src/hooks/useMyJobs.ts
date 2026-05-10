import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MyJob, Stage, StageChecklistItem } from '../types';
import { mapChecklistCompletion } from '../types';

type RawStage = Omit<Stage, 'checklist_items'> & { stage_checklist_items: StageChecklistItem[] };

export function useMyJobs() {
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyJobs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('jobs')
      .select(`
        *,
        job_assignments!inner(employee_id),
        job_type:job_types(id, name, stages(*, stage_checklist_items(id, text, position))),
        current_stage:stages!current_stage_id(name),
        checklist_completions:job_checklist_completions(stage_checklist_item_id, completed_at, checker:profiles!completed_by(full_name))
      `)
      .eq('job_assignments.employee_id', user.id)
      .order('created_at');

    if (data) {
      setJobs(data.map(job => ({
        ...job,
        job_type: {
          ...job.job_type,
          stages: (job.job_type?.stages as RawStage[] || [])
            .sort((a, b) => a.position - b.position)
            .map(s => ({
              ...s,
              checklist_items: (s.stage_checklist_items || []).sort((a, b) => a.position - b.position),
            })),
        },
        checklist_completions: (job.checklist_completions || []).map(mapChecklistCompletion),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async, setState only runs after await
    fetchMyJobs().catch(console.error);

    const channel = supabase
      .channel('my-jobs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchMyJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, fetchMyJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_checklist_completions' }, fetchMyJobs)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMyJobs]);

  const advanceJob = async (jobId: string, nextStageId: string) => {
    const snapshot = jobs;
    setJobs(prev => prev.map(j =>
      j.id === jobId ? { ...j, current_stage_id: nextStageId } : j
    ));
    const { error } = await supabase.from('jobs').update({ current_stage_id: nextStageId }).eq('id', jobId);
    if (error) {
      setJobs(snapshot);
      return error.message;
    } else {
      await fetchMyJobs();
    }
    return null;
  };

  const toggleChecklistItem = async (jobId: string, itemId: string, completed: boolean) => {
    const snapshot = jobs;
    setJobs(prev => prev.map(j => {
      if (j.id !== jobId) return j;
      if (completed) {
        return { ...j, checklist_completions: j.checklist_completions.filter(c => c.stage_checklist_item_id !== itemId) };
      }
      return { ...j, checklist_completions: [...j.checklist_completions, { stage_checklist_item_id: itemId, completed_at: null, checker: null }] };
    }));

    if (completed) {
      const { error } = await supabase.from('job_checklist_completions')
        .delete()
        .eq('job_id', jobId)
        .eq('stage_checklist_item_id', itemId);
      if (error) {
        setJobs(snapshot);
        return error.message;
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('job_checklist_completions')
        .insert({ job_id: jobId, stage_checklist_item_id: itemId, completed_by: user?.id });
      if (error) {
        setJobs(snapshot);
        return error.message;
      }
    }
    return null;
  };

  return { jobs, loading, advanceJob, toggleChecklistItem, refetch: fetchMyJobs };
}
