import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Job, StageChecklistItem } from '../types';

interface Props {
  job: Job;
  stageChecklistItems: StageChecklistItem[];
  onClick: () => void;
}

export default function JobCard({ job, stageChecklistItems, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    data: { type: 'job' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isOverdue = job.due_date && new Date(job.due_date) < new Date();
  const completedIds = new Set(job.checklist_completions.map(c => c.stage_checklist_item_id));
  const completedCount = stageChecklistItems.filter(item => completedIds.has(item.id)).length;
  const allComplete = stageChecklistItems.length > 0 && completedCount === stageChecklistItems.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="job-card"
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <span className="job-card-title">{job.title}</span>
      {job.customer_name && (
        <span className="job-card-customer">{job.customer_name}</span>
      )}
      <div className="job-card-footer">
        {job.due_date && (
          <span className={`job-card-due ${isOverdue ? 'overdue' : ''}`}>
            {new Date(job.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        <div className="job-card-right">
          {stageChecklistItems.length > 0 && (
            <span className={`checklist-progress ${allComplete ? 'complete' : ''}`}>
              ✓ {completedCount}/{stageChecklistItems.length}
            </span>
          )}
          {job.assignees.length > 0 && (
            <div className="job-card-assignees">
              {job.assignees.slice(0, 3).map(a => (
                <span key={a.id} className="assignee-chip" title={a.full_name}>
                  {a.full_name.charAt(0).toUpperCase()}
                </span>
              ))}
              {job.assignees.length > 3 && (
                <span className="assignee-chip">+{job.assignees.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
