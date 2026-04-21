import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Job } from '../types';

export function useJobs(jobTypeId: string | null) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    if (!jobTypeId) {
      setJobs([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('jobs')
      .select('*, job_assignments(profiles(id, full_name, role))')
      .eq('job_type_id', jobTypeId)
      .order('created_at');

    if (data) {
      setJobs(data.map(job => ({
        ...job,
        assignees: (job.job_assignments || [])
          .map((a: any) => a.profiles)
          .filter(Boolean),
      })));
    }
    setLoading(false);
  }, [jobTypeId]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const moveJob = async (jobId: string, stageId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, current_stage_id: stageId } : j));
    await supabase.from('jobs').update({ current_stage_id: stageId }).eq('id', jobId);
  };

  const createJob = async (params: {
    title: string;
    customer_name: string;
    due_date: string;
    notes: string;
    job_type_id: string;
    current_stage_id: string | null;
    assignee_ids: string[];
  }) => {
    const { assignee_ids, ...jobData } = params;
    const { data } = await supabase
      .from('jobs')
      .insert({
        ...jobData,
        customer_name: jobData.customer_name || null,
        due_date: jobData.due_date || null,
        notes: jobData.notes || null,
        current_stage_id: jobData.current_stage_id || null,
      })
      .select()
      .single();
    if (data && assignee_ids.length > 0) {
      await supabase.from('job_assignments').insert(
        assignee_ids.map(id => ({ job_id: data.id, employee_id: id }))
      );
    }
    await fetchJobs();
  };

  const updateJob = async (jobId: string, params: {
    title: string;
    customer_name: string;
    due_date: string;
    notes: string;
    assignee_ids: string[];
  }) => {
    const { assignee_ids, ...fields } = params;
    await supabase.from('jobs').update({
      ...fields,
      customer_name: fields.customer_name || null,
      due_date: fields.due_date || null,
      notes: fields.notes || null,
    }).eq('id', jobId);
    await supabase.from('job_assignments').delete().eq('job_id', jobId);
    if (assignee_ids.length > 0) {
      await supabase.from('job_assignments').insert(
        assignee_ids.map(id => ({ job_id: jobId, employee_id: id }))
      );
    }
    await fetchJobs();
  };

  const deleteJob = async (jobId: string) => {
    await supabase.from('jobs').delete().eq('id', jobId);
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  return { jobs, loading, moveJob, createJob, updateJob, deleteJob, refetch: fetchJobs };
}
