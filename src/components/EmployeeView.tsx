import { useRef, useState } from 'react';
import { useMyJobs } from '../hooks/useMyJobs';
import type { MyJob, Stage } from '../types';

interface Props {
  onSignOut: () => void;
}

const SWIPE_THRESHOLD = 80;

interface SwipeableJobProps {
  job: MyJob;
  nextStage: Stage | null;
  prevStage: Stage | null;
  onAdvance: () => void;
  onGoBack: () => void;
}

function SwipeableJobCard({ job, nextStage, prevStage, onAdvance, onGoBack }: SwipeableJobProps) {
  const [dragX, setDragX] = useState(0);
  const startXRef = useRef(0);
  const draggingRef = useRef(false);
  const isOverdue = job.due_date && new Date(job.due_date) < new Date();
  const isAdvancing = dragX >= SWIPE_THRESHOLD;
  const isGoingBack = dragX <= -SWIPE_THRESHOLD;

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    draggingRef.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    const delta = e.touches[0].clientX - startXRef.current;
    const min = prevStage ? -120 : 0;
    const max = nextStage ? 120 : 0;
    setDragX(Math.max(min, Math.min(max, delta)));
  };

  const onTouchEnd = () => {
    if (isAdvancing && nextStage) onAdvance();
    else if (isGoingBack && prevStage) onGoBack();
    setDragX(0);
    draggingRef.current = false;
  };

  const hintParts = [];
  if (prevStage) hintParts.push('← go back');
  if (nextStage) hintParts.push('swipe to advance →');

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14 }}>
      {/* Left hint (go back) */}
      {prevStage && (
        <div style={{
          position: 'absolute', inset: 0,
          background: isGoingBack ? '#E8A030' : '#c97d10',
          display: 'flex', alignItems: 'center', paddingLeft: 24,
          color: '#1E2A4A', fontWeight: 700, fontSize: '0.9rem',
          opacity: dragX < 0 ? 1 : 0,
          transition: 'background 0.15s',
        }}>
          ← {prevStage.name}
        </div>
      )}

      {/* Right hint (advance) */}
      {nextStage && (
        <div style={{
          position: 'absolute', inset: 0,
          background: isAdvancing ? '#22c55e' : '#16a34a',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          paddingRight: 24,
          color: '#fff', fontWeight: 700, fontSize: '0.9rem',
          opacity: dragX > 0 ? 1 : 0,
          transition: 'background 0.15s',
        }}>
          → {nextStage.name}
        </div>
      )}

      <div
        className="employee-job-item"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: draggingRef.current ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
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
          {!nextStage && job.current_stage_id && (
            <span className="done-badge">Complete</span>
          )}
        </div>

        {hintParts.length > 0 && (
          <p className="swipe-hint">{hintParts.join(' · ')}</p>
        )}
      </div>
    </div>
  );
}

export default function EmployeeView({ onSignOut }: Props) {
  const { jobs, loading, advanceJob } = useMyJobs();

  const getNextStage = (stages: Stage[], currentStageId: string | null): Stage | null => {
    if (!currentStageId) return stages[0] ?? null;
    const idx = stages.findIndex(s => s.id === currentStageId);
    return idx >= 0 && idx < stages.length - 1 ? stages[idx + 1] : null;
  };

  const getPrevStage = (stages: Stage[], currentStageId: string | null): Stage | null => {
    if (!currentStageId) return null;
    const idx = stages.findIndex(s => s.id === currentStageId);
    return idx > 0 ? stages[idx - 1] : null;
  };

  if (loading) return <div className="board-loading">Loading...</div>;

  return (
    <div className="home-wrapper">
      <header className="board-header">
        <img src="/PNG image.png" alt="Wood River Furniture" className="board-header-logo" />
        <span className="header-company-name">Wood River Furniture</span>
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
              const prevStage = getPrevStage(stages, job.current_stage_id);
              return (
                <SwipeableJobCard
                  key={job.id}
                  job={job}
                  nextStage={nextStage}
                  prevStage={prevStage}
                  onAdvance={() => advanceJob(job.id, nextStage!.id)}
                  onGoBack={() => advanceJob(job.id, prevStage!.id)}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
