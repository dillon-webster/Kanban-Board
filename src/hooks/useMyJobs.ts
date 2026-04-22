import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MyJob } from '../types';

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
        job_type:job_types(id, name, stages(*)),
        current_stage:stages(name)
      `)
      .eq('job_assignments.employee_id', user.id)
      .order('created_at');

    if (data) {
      setJobs(data.map(job => ({
        ...job,
        job_type: {
          ...job.job_type,
          stages: (job.job_type?.stages || []).sort((a: any, b: any) => a.position - b.position),
        },
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMyJobs();

    const channel = supabase
      .channel('my-jobs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchMyJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, fetchMyJobs)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMyJobs]);

  const advanceJob = async (jobId: string, nextStageId: string) => {
    setJobs(prev => prev.map(j =>
      j.id === jobId ? { ...j, current_stage_id: nextStageId } : j
    ));
    await supabase.from('jobs').update({ current_stage_id: nextStageId }).eq('id', jobId);
    await fetchMyJobs();
  };

  return { jobs, loading, advanceJob, refetch: fetchMyJobs };
}
