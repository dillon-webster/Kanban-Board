import type { JobType } from '../types';

interface Props {
  jobTypes: JobType[];
  onSelectJobType: (jobType: JobType) => void;
  onOpenAdmin: () => void;
  onAllJobs: () => void;
  onSignOut: () => void;
}

export default function Dashboard({ jobTypes, onSelectJobType, onOpenAdmin, onAllJobs, onSignOut }: Props) {
  return (
    <div className="home-wrapper">
      <header className="home-header">
        <img src="/PNG image.png" alt="Wood River Furniture" className="board-header-logo" />
        <span className="home-header-sub">Shop Management</span>
        <button className="btn btn-ghost signout-btn" onClick={onSignOut}>Sign out</button>
      </header>

      <main className="home-main">
        <div className="home-title-row">
          <h2 className="home-heading">Job Types</h2>
          <button className="btn btn-ghost" onClick={onAllJobs}>All Jobs</button>
          <button className="btn btn-ghost" onClick={onOpenAdmin}>Admin Panel</button>
        </div>

        {jobTypes.length === 0 ? (
          <div className="home-empty">
            <p>No job types set up yet.</p>
            <button className="btn btn-primary" onClick={onOpenAdmin}>Open Admin Panel</button>
          </div>
        ) : (
          <div className="boards-grid">
            {jobTypes.map(jt => (
              <div key={jt.id} className="board-card" onClick={() => onSelectJobType(jt)}>
                <div className="board-card-color" style={{ background: '#6366f1' }} />
                <div className="board-card-body">
                  <h3 className="board-card-title">{jt.name}</h3>
                  <span className="board-card-count">{jt.stages.length} stage{jt.stages.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
