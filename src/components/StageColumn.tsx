import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Job, Stage } from '../types';
import JobCard from './JobCard';

interface Props {
  stage: Stage;
  jobs: Job[];
  onJobClick: (job: Job) => void;
}

export default function StageColumn({ stage, jobs, onJobClick }: Props) {
  const { setNodeRef } = useDroppable({ id: stage.id, data: { type: 'stage' } });

  return (
    <div className={`stage-column ${stage.notify_admin ? 'notify-stage' : ''}`}>
      <div className="stage-header">
        <span className="stage-title">{stage.name}</span>
        <span className="stage-count">{jobs.length}</span>
        {stage.notify_admin && <span className="notify-badge" title="Admin is notified when jobs reach this stage">★</span>}
      </div>

      <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
        <div className="stage-job-list" ref={setNodeRef}>
          {jobs.map(job => (
            <JobCard key={job.id} job={job} stageChecklistItems={stage.checklist_items} onClick={() => onJobClick(job)} />
          ))}
          {jobs.length === 0 && <div className="stage-empty">No jobs</div>}
        </div>
      </SortableContext>
    </div>
  );
}
