import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

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

type RawAssignment = { profiles: Pick<Profile, 'id' | 'full_name'> | null };

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
        assignees: (job.job_assignments as RawAssignment[] || [])
          .map(a => a.profiles)
          .filter((p): p is Pick<Profile, 'id' | 'full_name'> => p !== null),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async, setState only runs after await
    fetchAllJobs().catch(console.error);

    const channel = supabase
      .channel('all-jobs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchAllJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, fetchAllJobs)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAllJobs]);

  return { jobs, loading, refetch: fetchAllJobs };
}
