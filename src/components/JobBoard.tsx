import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Job, JobType } from '../types';
import { useJobs } from '../hooks/useJobs';
import StageColumn from './StageColumn';
import JobModal from './JobModal';
import JobDetailModal from './JobDetailModal';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  jobType: JobType;
  jobTypes: JobType[];
  onBack: () => void;
  onSignOut: () => void;
}

export default function JobBoard({ jobType, jobTypes, onBack, onSignOut }: Props) {
  const { jobs, loading, moveJob, createJob, updateJob, deleteJob } = useJobs(jobType.id);
  const [creatingJob, setCreatingJob] = useState(false);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveJobId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveJobId(null);
    if (!over) return;

    const overType = over.data.current?.type;
    const targetStageId = overType === 'stage'
      ? (over.id as string)
      : jobs.find(j => j.id === over.id)?.current_stage_id;

    if (targetStageId && targetStageId !== jobs.find(j => j.id === active.id)?.current_stage_id) {
      moveJob(active.id as string, targetStageId);
    }
  };

  const activeJob = jobs.find(j => j.id === activeJobId);

  const notifyCount = jobType.stages
    .filter(s => s.notify_admin)
    .reduce((count, s) => count + jobs.filter(j => j.current_stage_id === s.id).length, 0);

  if (loading) return <div className="board-loading">Loading...</div>;

  return (
    <div className="board-wrapper">
      <header className="board-header">
        <img src="/PNG image.png" alt="Wood River Furniture" className="board-header-logo" />
        <span className="header-company-name">Wood River Furniture</span>
        <div className="board-header-divider" />
        <button className="back-btn" onClick={onBack}>← Jobs</button>
        <div className="board-header-divider" />
        <h1 className="board-title" style={{ cursor: 'default' }}>{jobType.name}</h1>
        {notifyCount > 0 && (
          <span className="notify-count" title="Jobs awaiting admin attention">{notifyCount}</span>
        )}
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setCreatingJob(true)}>
          + New Job
        </button>
        <button className="btn btn-ghost signout-btn" onClick={onSignOut}>Sign out</button>
      </header>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="board-lists">
          {jobType.stages.map(stage => (
            <StageColumn
              key={stage.id}
              stage={stage}
              jobs={jobs.filter(j => j.current_stage_id === stage.id)}
              onJobClick={job => setViewingJob(job)}
            />
          ))}
          {jobType.stages.length === 0 && (
            <div className="board-empty">
              <p>No stages set up for this job type yet.</p>
              <p>Go to Admin Panel to add stages.</p>
            </div>
          )}
        </div>

        <DragOverlay>
          {activeJob && (
            <div className="job-card dragging">
              <span className="job-card-title">{activeJob.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {creatingJob && (
        <JobModal
          jobTypes={jobTypes}
          defaultJobTypeId={jobType.id}
          onSave={createJob}
          onClose={() => setCreatingJob(false)}
        />
      )}

      {viewingJob && (
        <JobDetailModal
          job={viewingJob}
          jobType={jobType}
          onEdit={() => { setEditingJob(viewingJob); setViewingJob(null); }}
          onClose={() => setViewingJob(null)}
        />
      )}

      {editingJob && (
        <JobModal
          jobTypes={jobTypes}
          job={editingJob}
          onSave={params => updateJob(editingJob.id, params)}
          onDelete={() => { setDeletingJob(editingJob); setEditingJob(null); }}
          onClose={() => setEditingJob(null)}
        />
      )}

      {deletingJob && (
        <ConfirmDialog
          message={`Delete "${deletingJob.title}"? This cannot be undone.`}
          onConfirm={async () => { await deleteJob(deletingJob.id); setDeletingJob(null); }}
          onCancel={() => setDeletingJob(null)}
        />
      )}
    </div>
  );
}
