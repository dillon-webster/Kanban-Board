import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Job, JobType, Profile, Stage } from '../types';

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

  const selectedJobType = jobTypes.find(jt => jt.id === jobTypeId);
  const stages: Stage[] = selectedJobType?.stages ?? [];

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
