import { useState } from 'react';
import { useAllJobs } from '../hooks/useAllJobs';
import type { JobType } from '../types';

interface Props {
  jobTypes: JobType[];
  onBack: () => void;
  onSignOut: () => void;
}

export default function AllJobsView({ jobTypes, onBack, onSignOut }: Props) {
  const { jobs, loading } = useAllJobs();
  const [filterJobType, setFilterJobType] = useState('');
  const [filterStage, setFilterStage] = useState('');

  const selectedJobType = jobTypes.find(jt => jt.id === filterJobType);
  const stageOptions = selectedJobType?.stages ?? [];

  const filtered = jobs.filter(job => {
    if (filterJobType && job.job_type_id !== filterJobType) return false;
    if (filterStage && job.current_stage_id !== filterStage) return false;
    return true;
  });

  if (loading) return <div className="board-loading">Loading...</div>;

  return (
    <div className="home-wrapper">
      <header className="board-header">
        <img src="/PNG image.png" alt="Wood River Furniture" className="board-header-logo" />
        <span className="header-company-name">Wood River Furniture</span>
        <div className="board-header-divider" />
        <button className="back-btn" onClick={onBack}>← Dashboard</button>
        <div className="board-header-divider" />
        <h1 className="board-title" style={{ cursor: 'default' }}>All Jobs</h1>
        <div style={{ marginLeft: 'auto' }} />
        <button className="btn btn-ghost signout-btn" onClick={onSignOut}>Sign out</button>
      </header>

      <main className="home-main">
        <div className="all-jobs-filters">
          <select
            className="input"
            style={{ width: 'auto' }}
            value={filterJobType}
            onChange={e => { setFilterJobType(e.target.value); setFilterStage(''); }}
          >
            <option value="">All job types</option>
            {jobTypes.map(jt => (
              <option key={jt.id} value={jt.id}>{jt.name}</option>
            ))}
          </select>

          <select
            className="input"
            style={{ width: 'auto' }}
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            disabled={!filterJobType}
          >
            <option value="">All stages</option>
            {stageOptions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <span className="all-jobs-count">{filtered.length} job{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="home-empty">
            <p>No jobs found.</p>
          </div>
        ) : (
          <div className="all-jobs-table">
            <div className="all-jobs-header-row">
              <span>Job</span>
              <span>Type</span>
              <span>Stage</span>
              <span>Customer</span>
              <span>Due</span>
              <span>Assigned to</span>
            </div>
            {filtered.map(job => {
              const isOverdue = job.due_date && new Date(job.due_date) < new Date();
              return (
                <div key={job.id} className="all-jobs-row">
                  <span className="all-jobs-title">{job.title}</span>
                  <span className="all-jobs-cell muted">{job.job_type?.name ?? '—'}</span>
                  <span className="all-jobs-cell">
                    {job.current_stage ? (
                      <span className="current-stage-badge">{job.current_stage.name}</span>
                    ) : '—'}
                  </span>
                  <span className="all-jobs-cell muted">{job.customer_name ?? '—'}</span>
                  <span className={`all-jobs-cell ${isOverdue ? 'overdue' : 'muted'}`}>
                    {job.due_date
                      ? new Date(job.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '—'}
                  </span>
                  <span className="all-jobs-cell muted">
                    {job.assignees.length > 0
                      ? job.assignees.map(a => a.full_name).join(', ')
                      : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
