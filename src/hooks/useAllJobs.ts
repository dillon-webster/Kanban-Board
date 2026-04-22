import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AllJob {
  id: string;
  title: string;
  customer_name: string | null;
  due_date: string | null;
  notes: string | null;
  job_type_id: string;
  current_stage_id: string | null;
  created_at: string;
  job_type: { id: string; name: string } | null;
  current_stage: { id: string; name: string } | null;
  assignees: { id: string; full_name: string }[];
}

export function useAllJobs() {
  const [jobs, setJobs] = useState<AllJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllJobs = useCallback(async () => {
    const { data } = await supabase
      .from('jobs')
      .select(`
        *,
        job_type:job_types(id, name),
        current_stage:stages(id, name),
        job_assignments(profiles(id, full_name))
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setJobs(data.map(job => ({
        ...job,
        assignees: (job.job_assignments || [])
          .map((a: any) => a.profiles)
          .filter(Boolean),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllJobs();

    const channel = supabase
      .channel('all-jobs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchAllJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, fetchAllJobs)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAllJobs]);

  return { jobs, loading, refetch: fetchAllJobs };
}
