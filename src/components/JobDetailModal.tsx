import type { Job, JobType } from '../types';

interface Props {
  job: Job;
  jobType: JobType;
  onEdit: () => void;
  onClose: () => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function JobDetailModal({ job, jobType, onEdit, onClose }: Props) {
  const stages = jobType.stages;
  const currentStageIdx = stages.findIndex(s => s.id === job.current_stage_id);
  const completionMap = new Map(job.checklist_completions.map(c => [c.stage_checklist_item_id, c]));
  const isOverdue = job.due_date && new Date(job.due_date) < new Date();
  const stagesWithChecklist = stages.filter(s => s.checklist_items.length > 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-detail" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{job.title}</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-ghost" style={{ fontSize: '0.82rem' }} onClick={onEdit}>Edit</button>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="detail-meta">
          {job.customer_name && <span className="detail-meta-item">{job.customer_name}</span>}
          {job.due_date && (
            <span className={`detail-meta-item ${isOverdue ? 'overdue' : ''}`}>
              Due {new Date(job.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {job.current_stage_id && (
            <span className="current-stage-badge" style={{ fontSize: '0.72rem' }}>
              {stages.find(s => s.id === job.current_stage_id)?.name}
            </span>
          )}
        </div>

        {job.assignees.length > 0 && (
          <div className="detail-assignees">
            {job.assignees.map(a => (
              <span key={a.id} className="assignee-chip detail-assignee-chip" title={a.full_name}>
                {a.full_name.charAt(0).toUpperCase()}
              </span>
            ))}
            <span className="detail-assignee-names">
              {job.assignees.map(a => a.full_name).join(', ')}
            </span>
          </div>
        )}

        {job.notes && <p className="detail-notes">{job.notes}</p>}

        {stagesWithChecklist.length > 0 && (
          <>
            <div className="detail-divider" />
            <div className="detail-stages">
              {stagesWithChecklist.map(stage => {
                const stageIdx = stages.findIndex(s => s.id === stage.id);
                const isPast = stageIdx < currentStageIdx;
                const isCurrent = stage.id === job.current_stage_id;
                const isFuture = stageIdx > currentStageIdx;
                const completedCount = stage.checklist_items.filter(item => completionMap.has(item.id)).length;
                const allComplete = completedCount === stage.checklist_items.length;

                return (
                  <div key={stage.id} className="detail-stage">
                    <div className="detail-stage-header">
                      <span className={`detail-stage-label ${isPast ? 'past' : isCurrent ? 'current' : 'future'}`}>
                        {stage.name}
                      </span>
                      {!isFuture && (
                        <span className={`detail-stage-count ${allComplete ? 'complete' : ''}`}>
                          {completedCount}/{stage.checklist_items.length}
                        </span>
                      )}
                    </div>

                    <div className="detail-checklist">
                      {stage.checklist_items.map(item => {
                        const completion = completionMap.get(item.id);
                        const done = !!completion;
                        return (
                          <div key={item.id} className="detail-checklist-item">
                            <span className={`detail-checklist-icon ${done ? 'done' : ''}`}>
                              {done ? '✓' : '○'}
                            </span>
                            <span className={`detail-checklist-text ${done ? 'done' : ''} ${isFuture ? 'future' : ''}`}>
                              {item.text}
                            </span>
                            {done && completion?.completed_at && (
                              <span className="detail-checklist-meta">
                                {completion.checker?.full_name ?? '—'} · {formatDate(completion.completed_at)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
