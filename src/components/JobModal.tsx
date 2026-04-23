import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Job, JobType, Profile, Stage, StageChecklistItem } from '../types';

interface Props {
  jobTypes: JobType[];
  job?: Job | null;
  defaultJobTypeId?: string;
  onSave: (params: {
    title: string;
    customer_name: string;
    due_date: string;
    notes: string;
    job_type_id: string;
    current_stage_id: string | null;
    assignee_ids: string[];
  }) => Promise<void>;
  onDelete?: () => void;
  onClose: () => void;
}

export default function JobModal({ jobTypes, job, defaultJobTypeId, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(job?.title ?? '');
  const [customerName, setCustomerName] = useState(job?.customer_name ?? '');
  const [dueDate, setDueDate] = useState(job?.due_date ?? '');
  const [notes, setNotes] = useState(job?.notes ?? '');
  const [jobTypeId, setJobTypeId] = useState(job?.job_type_id ?? defaultJobTypeId ?? jobTypes[0]?.id ?? '');
  const [currentStageId, setCurrentStageId] = useState<string>(job?.current_stage_id ?? '');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(job?.assignees.map(a => a.id) ?? []);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(job?.checklist_completions.map(c => c.stage_checklist_item_id) ?? [])
  );

  const selectedJobType = jobTypes.find(jt => jt.id === jobTypeId);
  const stages: Stage[] = selectedJobType?.stages ?? [];
  const currentStageChecklistItems: StageChecklistItem[] = job
    ? (stages.find(s => s.id === currentStageId)?.checklist_items ?? [])
    : [];

  const toggleChecklistItem = async (itemId: string) => {
    if (!job) return;
    const wasCompleted = completedIds.has(itemId);
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(itemId); else next.add(itemId);
      return next;
    });
    if (wasCompleted) {
      await supabase.from('job_checklist_completions')
        .delete().eq('job_id', job.id).eq('stage_checklist_item_id', itemId);
    } else {
      await supabase.from('job_checklist_completions')
        .insert({ job_id: job.id, stage_checklist_item_id: itemId });
    }
  };

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .order('full_name')
      .then(({ data }) => { if (data) setEmployees(data); });
  }, []);

  useEffect(() => {
    if (!currentStageId && stages.length > 0) {
      setCurrentStageId(stages[0].id);
    }
  }, [jobTypeId]);

  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title.trim() || !jobTypeId) return;
    setLoading(true);
    await onSave({
      title: title.trim(),
      customer_name: customerName.trim(),
      due_date: dueDate,
      notes: notes.trim(),
      job_type_id: jobTypeId,
      current_stage_id: currentStageId || null,
      assignee_ids: selectedEmployeeIds,
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{job ? 'Edit Job' : 'New Job'}</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <label>Job Title</label>
        <input
          className="input"
          placeholder="e.g. Kitchen Cabinets - Smith"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />

        <label>Job Type</label>
        <select
          className="input"
          value={jobTypeId}
          onChange={e => { setJobTypeId(e.target.value); setCurrentStageId(''); }}
          disabled={!!job}
        >
          {jobTypes.map(jt => (
            <option key={jt.id} value={jt.id}>{jt.name}</option>
          ))}
        </select>

        {stages.length > 0 && (
          <>
            <label>Starting Stage</label>
            <select
              className="input"
              value={currentStageId}
              onChange={e => setCurrentStageId(e.target.value)}
            >
              {stages.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </>
        )}

        <label>Customer Name</label>
        <input
          className="input"
          placeholder="Optional"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
        />

        <label>Due Date</label>
        <input
          className="input"
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />

        <label>Notes</label>
        <textarea
          className="textarea"
          placeholder="Optional"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />

        {currentStageChecklistItems.length > 0 && (
          <>
            <label>Stage Checklist</label>
            <div className="modal-checklist">
              {currentStageChecklistItems.map(item => {
                const done = completedIds.has(item.id);
                return (
                  <label key={item.id} className="modal-checklist-item">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleChecklistItem(item.id)}
                    />
                    <span className={done ? 'modal-checklist-text-done' : ''}>{item.text}</span>
                  </label>
                );
              })}
            </div>
          </>
        )}

        {employees.length > 0 && (
          <>
            <label>Assign Employees</label>
            <div className="employee-select">
              {employees.map(emp => (
                <label key={emp.id} className="employee-option">
                  <input
                    type="checkbox"
                    checked={selectedEmployeeIds.includes(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                  />
                  {emp.full_name}
                </label>
              ))}
            </div>
          </>
        )}

        <div className="modal-actions">
          {onDelete ? (
            <button className="btn btn-danger" onClick={onDelete}>Delete job</button>
          ) : <span />}
          <button className="btn btn-primary" onClick={handleSave} disabled={loading || !title.trim()}>
            {loading ? '...' : job ? 'Save changes' : 'Create job'}
          </button>
        </div>
      </div>
    </div>
  );
}
