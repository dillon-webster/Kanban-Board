import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Job, Profile } from '../types';
import { mapChecklistCompletion } from '../types';

type RawAssignment = { profiles: Pick<Profile, 'id' | 'full_name' | 'role'> | null };

type JobSaveParams = {
  title: string;
  customer_name: string;
  due_date: string;
  notes: string;
  job_type_id: string;
  current_stage_id: string | null;
  assignee_ids: string[];
};

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
      .select('*, job_assignments(profiles(id, full_name, role)), checklist_completions:job_checklist_completions(stage_checklist_item_id, completed_at, checker:profiles!completed_by(full_name))')
      .eq('job_type_id', jobTypeId)
      .order('created_at');

    if (data) {
      setJobs(data.map(job => ({
        ...job,
        assignees: (job.job_assignments as RawAssignment[] || [])
          .map(a => a.profiles)
          .filter((p): p is Pick<Profile, 'id' | 'full_name' | 'role'> => p !== null),
        checklist_completions: (job.checklist_completions || []).map(mapChecklistCompletion),
      })));
    }
    setLoading(false);
  }, [jobTypeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async, setState only runs after await
    fetchJobs().catch(console.error);

    const channel = supabase
      .channel('jobs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, fetchJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_checklist_completions' }, fetchJobs)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchJobs]);

  const moveJob = async (jobId: string, stageId: string) => {
    const snapshot = jobs;
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, current_stage_id: stageId } : j));
    const { error } = await supabase.from('jobs').update({ current_stage_id: stageId }).eq('id', jobId);
    if (error) {
      setJobs(snapshot);
      return error.message;
    }
    return null;
  };

  const createJob = async (params: JobSaveParams) => {
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        title: params.title,
        customer_name: params.customer_name || null,
        due_date: params.due_date || null,
        notes: params.notes || null,
        job_type_id: params.job_type_id,
        current_stage_id: params.current_stage_id,
      })
      .select()
      .single();
    if (error) return error.message;
    if (data && params.assignee_ids.length > 0) {
      const { error: assignmentError } = await supabase.from('job_assignments').insert(
        params.assignee_ids.map(id => ({ job_id: data.id, employee_id: id }))
      );
      if (assignmentError) {
        await supabase.from('jobs').delete().eq('id', data.id);
        return assignmentError.message;
      }
    }
    await fetchJobs();
    return null;
  };

  const updateJob = async (jobId: string, params: Omit<JobSaveParams, 'job_type_id' | 'current_stage_id'>) => {
    const existingJob = jobs.find(job => job.id === jobId);
    if (!existingJob) return 'Job not found.';

    const previousAssigneeIds = existingJob.assignees.map(assignee => assignee.id);
    const { error } = await supabase.from('jobs').update({
      title: params.title,
      customer_name: params.customer_name || null,
      due_date: params.due_date || null,
      notes: params.notes || null,
    }).eq('id', jobId);
    if (error) return error.message;

    const { error: deleteAssignmentsError } = await supabase.from('job_assignments').delete().eq('job_id', jobId);
    if (deleteAssignmentsError) return deleteAssignmentsError.message;

    if (params.assignee_ids.length > 0) {
      const { error: insertAssignmentsError } = await supabase.from('job_assignments').insert(
        params.assignee_ids.map(id => ({ job_id: jobId, employee_id: id }))
      );
      if (insertAssignmentsError) {
        if (previousAssigneeIds.length > 0) {
          await supabase.from('job_assignments').insert(
            previousAssigneeIds.map(id => ({ job_id: jobId, employee_id: id }))
          );
        }
        return insertAssignmentsError.message;
      }
    }

    await fetchJobs();
    return null;
  };

  const deleteJob = async (jobId: string) => {
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (error) return error.message;
    setJobs(prev => prev.filter(j => j.id !== jobId));
    return null;
  };

  return { jobs, loading, moveJob, createJob, updateJob, deleteJob, refetch: fetchJobs };
}
