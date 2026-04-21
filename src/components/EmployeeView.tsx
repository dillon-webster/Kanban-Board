import { useMyJobs } from '../hooks/useMyJobs';
import type { Stage } from '../types';

interface Props {
  onSignOut: () => void;
}

export default function EmployeeView({ onSignOut }: Props) {
  const { jobs, loading, advanceJob } = useMyJobs();

  const getNextStage = (stages: Stage[], currentStageId: string | null): Stage | null => {
    if (!currentStageId) return stages[0] ?? null;
    const idx = stages.findIndex(s => s.id === currentStageId);
    return idx >= 0 && idx < stages.length - 1 ? stages[idx + 1] : null;
  };

  if (loading) return <div className="board-loading">Loading...</div>;

  return (
    <div className="home-wrapper">
      <header className="board-header">
        <span className="board-header-logo">ShopFlow</span>
        <div style={{ marginLeft: 'auto' }} />
        <button className="btn btn-ghost signout-btn" onClick={onSignOut}>Sign out</button>
      </header>

      <main className="home-main">
        <h2 className="home-heading" style={{ marginBottom: 24 }}>My Jobs</h2>

        {jobs.length === 0 ? (
          <div className="home-empty">
            <p>No jobs assigned to you yet.</p>
          </div>
        ) : (
          <div className="employee-job-list">
            {jobs.map(job => {
              const stages = job.job_type?.stages ?? [];
              const nextStage = getNextStage(stages, job.current_stage_id);
              const isOverdue = job.due_date && new Date(job.due_date) < new Date();

              return (
                <div key={job.id} className="employee-job-item">
                  <div className="employee-job-main">
                    <span className="employee-job-title">{job.title}</span>
                    <div className="employee-job-meta">
                      {job.customer_name && <span className="employee-job-customer">{job.customer_name}</span>}
                      {job.due_date && (
                        <span className={`job-card-due ${isOverdue ? 'overdue' : ''}`}>
                          Due {new Date(job.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <span className="employee-job-type">{job.job_type?.name}</span>
                    </div>
                    {job.notes && <p className="employee-job-notes">{job.notes}</p>}
                  </div>

                  <div className="employee-job-right">
                    <span className="current-stage-badge">
                      {job.current_stage?.name ?? 'Not started'}
                    </span>
                    {nextStage && (
                      <button
                        className="btn btn-primary"
                        onClick={() => advanceJob(job.id, nextStage.id)}
                      >
                        → {nextStage.name}
                      </button>
                    )}
                    {!nextStage && job.current_stage_id && (
                      <span className="done-badge">Complete</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
