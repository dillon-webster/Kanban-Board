import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useJobTypes } from '../hooks/useJobTypes';
import type { Profile } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  onBack: () => void;
  onSignOut: () => void;
}

export default function AdminPanel({ onBack, onSignOut }: Props) {
  const { jobTypes, createJobType, deleteJobType, addStage, deleteStage } = useJobTypes();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<{ id: string; email: string }[]>([]);

  const [newJobTypeName, setNewJobTypeName] = useState('');
  const [newStageName, setNewStageName] = useState<Record<string, string>>({});
  const [newStageNotify, setNewStageNotify] = useState<Record<string, boolean>>({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [deletingJobTypeId, setDeletingJobTypeId] = useState<string | null>(null);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'employee').order('full_name');
    if (data) setEmployees(data);
  };

  const fetchInvites = async () => {
    const { data } = await supabase.from('invites').select('*').order('created_at');
    if (data) setInvites(data);
  };

  useEffect(() => {
    fetchEmployees();
    fetchInvites();
  }, []);

  const handleCreateJobType = async () => {
    if (!newJobTypeName.trim()) return;
    await createJobType(newJobTypeName.trim());
    setNewJobTypeName('');
  };

  const handleAddStage = async (jobTypeId: string) => {
    const name = newStageName[jobTypeId]?.trim();
    if (!name) return;
    await addStage(jobTypeId, name, newStageNotify[jobTypeId] ?? false);
    setNewStageName(prev => ({ ...prev, [jobTypeId]: '' }));
    setNewStageNotify(prev => ({ ...prev, [jobTypeId]: false }));
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    const { error } = await supabase.from('invites').insert({ email });
    if (error) {
      setInviteMessage(error.message);
    } else {
      setInviteMessage(`Invite created for ${email}. Share the signup link with them.`);
      setInviteEmail('');
      fetchInvites();
    }
  };

  const handleDeleteInvite = async (id: string) => {
    await supabase.from('invites').delete().eq('id', id);
    fetchInvites();
  };

  return (
    <div className="home-wrapper">
      <header className="board-header">
        <img src="/PNG image.png" alt="Wood River Furniture" className="board-header-logo" />
        <div className="board-header-divider" />
        <button className="back-btn" onClick={onBack}>← Dashboard</button>
        <div className="board-header-divider" />
        <h1 className="board-title" style={{ cursor: 'default' }}>Admin Panel</h1>
        <div style={{ marginLeft: 'auto' }} />
        <button className="btn btn-ghost signout-btn" onClick={onSignOut}>Sign out</button>
      </header>

      <main className="admin-main">
        {/* Job Types */}
        <section className="admin-section">
          <h2 className="admin-section-title">Workflows & Steps</h2>

          <div className="admin-inline-form">
            <input
              className="input"
              placeholder="New workflow (e.g. Cabinet, Furniture)"
              value={newJobTypeName}
              onChange={e => setNewJobTypeName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateJobType(); }}
            />
            <button className="btn btn-primary" onClick={handleCreateJobType}>Add</button>
          </div>

          <div className="job-type-list">
            {jobTypes.map(jt => (
              <div key={jt.id} className="job-type-item">
                <div className="job-type-header">
                  <span className="job-type-name">{jt.name}</span>
                  <button className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    onClick={() => setDeletingJobTypeId(jt.id)}>
                    Delete
                  </button>
                </div>

                <div className="stage-list">
                  {jt.stages.map((stage, i) => (
                    <div key={stage.id} className="stage-list-item">
                      <span className="stage-position">{i + 1}</span>
                      <span className="stage-list-name">{stage.name}</span>
                      {stage.notify_admin && <span className="notify-badge" title="Notifies admin">★</span>}
                      <button className="icon-btn" onClick={() => deleteStage(jt.id, stage.id)}>✕</button>
                    </div>
                  ))}
                </div>

                <div className="admin-inline-form" style={{ marginTop: 8 }}>
                  <input
                    className="input"
                    placeholder="Add step..."
                    value={newStageName[jt.id] ?? ''}
                    onChange={e => setNewStageName(prev => ({ ...prev, [jt.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddStage(jt.id); }}
                  />
                  <label className="notify-checkbox">
                    <input
                      type="checkbox"
                      checked={newStageNotify[jt.id] ?? false}
                      onChange={e => setNewStageNotify(prev => ({ ...prev, [jt.id]: e.target.checked }))}
                    />
                    Notify admin
                  </label>
                  <button className="btn btn-ghost" onClick={() => handleAddStage(jt.id)}>Add</button>
                </div>
              </div>
            ))}
            {jobTypes.length === 0 && (
              <p className="admin-empty">No workflows yet. Add one above.</p>
            )}
          </div>
        </section>

        {/* Employees */}
        <section className="admin-section">
          <h2 className="admin-section-title">Employees</h2>

          <div className="admin-inline-form">
            <input
              className="input"
              placeholder="Employee email to invite"
              type="email"
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); setInviteMessage(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
            />
            <button className="btn btn-primary" onClick={handleInvite}>Invite</button>
          </div>
          {inviteMessage && <p className="auth-message" style={{ marginTop: 8 }}>{inviteMessage}</p>}

          {invites.length > 0 && (
            <div className="employee-list" style={{ marginTop: 16 }}>
              <p className="admin-label">Pending invites</p>
              {invites.map(invite => (
                <div key={invite.id} className="employee-list-item">
                  <span>{invite.email}</span>
                  <button className="icon-btn" onClick={() => handleDeleteInvite(invite.id)}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="employee-list" style={{ marginTop: 16 }}>
            <p className="admin-label">Active employees</p>
            {employees.length === 0 ? (
              <p className="admin-empty">No employees yet.</p>
            ) : (
              employees.map(emp => (
                <div key={emp.id} className="employee-list-item">
                  <span>{emp.full_name}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {deletingJobTypeId && (
        <ConfirmDialog
          message={`Delete this job type and all its stages? Active jobs using it will lose their stage info.`}
          onConfirm={async () => { await deleteJobType(deletingJobTypeId); setDeletingJobTypeId(null); }}
          onCancel={() => setDeletingJobTypeId(null)}
        />
      )}
    </div>
  );
}
