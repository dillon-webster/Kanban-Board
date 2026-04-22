import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { JobType } from '../types';

export function useJobTypes() {
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobTypes = useCallback(async () => {
    const { data } = await supabase
      .from('job_types')
      .select('*, stages(*)')
      .order('name');

    if (data) {
      setJobTypes(data.map(jt => ({
        ...jt,
        stages: (jt.stages || []).sort((a: any, b: any) => a.position - b.position),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobTypes(); }, [fetchJobTypes]);

  const createJobType = async (name: string): Promise<string | null> => {
    const { data, error } = await supabase.from('job_types').insert({ name }).select().single();
    if (error) return error.message;
    if (data) setJobTypes(prev => [...prev, { ...data, stages: [] }]);
    return null;
  };

  const deleteJobType = async (id: string) => {
    await supabase.from('jobs').delete().eq('job_type_id', id);
    await supabase.from('job_types').delete().eq('id', id);
    setJobTypes(prev => prev.filter(jt => jt.id !== id));
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
        jt.id === jobTypeId ? { ...jt, stages: [...jt.stages, data] } : jt
      ));
    }
  };

  const deleteStage = async (jobTypeId: string, stageId: string) => {
    const { error } = await supabase.from('stages').delete().eq('id', stageId);
    if (!error) {
      setJobTypes(prev => prev.map(jt =>
        jt.id === jobTypeId ? { ...jt, stages: jt.stages.filter(s => s.id !== stageId) } : jt
      ));
    } else {
      console.error('Failed to delete stage:', error.message);
    }
  };

  return { jobTypes, loading, createJobType, deleteJobType, addStage, deleteStage, refetch: fetchJobTypes };
}
