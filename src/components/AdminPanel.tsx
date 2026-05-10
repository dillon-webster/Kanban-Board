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
  const { jobTypes, createJobType, deleteJobType, addStage, deleteStage, addStageChecklistItem, deleteStageChecklistItem } = useJobTypes();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<{ id: string; email: string }[]>([]);

  const [newJobTypeName, setNewJobTypeName] = useState('');
  const [newStageName, setNewStageName] = useState<Record<string, string>>({});
  const [newStageNotify, setNewStageNotify] = useState<Record<string, boolean>>({});
  const [newChecklistText, setNewChecklistText] = useState<Record<string, string>>({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [deletingJobTypeId, setDeletingJobTypeId] = useState<string | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [employeeError, setEmployeeError] = useState<string | null>(null);

  const fetchInvites = async () => {
    const { data, error } = await supabase.from('invites').select('*').order('created_at');
    if (error) {
      setEmployeeError(error.message);
      return;
    }
    if (data) setInvites(data);
  };

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'employee').order('full_name')
      .then(({ data }) => { if (data) setEmployees(data); });
    supabase.from('invites').select('*').order('created_at')
      .then(({ data }) => { if (data) setInvites(data); });
  }, []);

  const handleCreateJobType = async () => {
    if (!newJobTypeName.trim()) return;
    const error = await createJobType(newJobTypeName.trim());
    if (error) { setWorkflowError(error); return; }
    setNewJobTypeName('');
    setWorkflowError(null);
  };

  const handleAddStage = async (jobTypeId: string) => {
    const name = newStageName[jobTypeId]?.trim();
    if (!name) return;
    const error = await addStage(jobTypeId, name, newStageNotify[jobTypeId] ?? false);
    if (error) {
      setWorkflowError(error);
      return;
    }
    setNewStageName(prev => ({ ...prev, [jobTypeId]: '' }));
    setNewStageNotify(prev => ({ ...prev, [jobTypeId]: false }));
    setWorkflowError(null);
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    const { error } = await supabase.from('invites').insert({ email });
    if (error) {
      setInviteMessage(error.message);
      setEmployeeError(error.message);
    } else {
      setInviteMessage(`Invite created for ${email}. Share the signup link with them.`);
      setEmployeeError(null);
      setInviteEmail('');
      fetchInvites();
    }
  };

  const handleDeleteInvite = async (id: string) => {
    const { error } = await supabase.from('invites').delete().eq('id', id);
    if (error) {
      setEmployeeError(error.message);
      return;
    }
    setEmployeeError(null);
    fetchInvites();
  };

  return (
    <div className="home-wrapper">
      <header className="board-header">
        <img src="/PNG image.png" alt="Wood River Furniture" className="board-header-logo" />
        <span className="header-company-name">Wood River Furniture</span>
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
          {workflowError && <p className="auth-message" style={{ marginTop: 8, color: 'red' }}>{workflowError}</p>}

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
                      <div className="stage-item-header">
                        <span className="stage-position">{i + 1}</span>
                        <span className="stage-list-name">{stage.name}</span>
                        {stage.notify_admin && <span className="notify-badge" title="Notifies admin">★</span>}
                        <button className="icon-btn" onClick={async () => {
                          const error = await deleteStage(jt.id, stage.id);
                          setWorkflowError(error);
                        }}>✕</button>
                      </div>

                      {stage.checklist_items.length > 0 && (
                        <div className="stage-checklist-list">
                          {stage.checklist_items.map(item => (
                            <div key={item.id} className="stage-checklist-row">
                              <span className="stage-checklist-bullet">—</span>
                              <span className="stage-checklist-item-text">{item.text}</span>
                              <button className="icon-btn" onClick={async () => {
                                const error = await deleteStageChecklistItem(stage.id, item.id);
                                setWorkflowError(error);
                              }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="stage-checklist-add-row">
                        <input
                          className="input"
                          style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                          placeholder="Add requirement..."
                          value={newChecklistText[stage.id] ?? ''}
                          onChange={e => setNewChecklistText(prev => ({ ...prev, [stage.id]: e.target.value }))}
                          onKeyDown={async e => {
                            if (e.key === 'Enter') {
                              const text = newChecklistText[stage.id]?.trim();
                              if (text) {
                                const error = await addStageChecklistItem(stage.id, text);
                                if (error) setWorkflowError(error);
                                else {
                                  setWorkflowError(null);
                                  setNewChecklistText(prev => ({ ...prev, [stage.id]: '' }));
                                }
                              }
                            }
                          }}
                        />
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                          onClick={() => {
                            const text = newChecklistText[stage.id]?.trim();
                            if (text) {
                              addStageChecklistItem(stage.id, text).then(error => {
                                if (error) setWorkflowError(error);
                                else {
                                  setWorkflowError(null);
                                  setNewChecklistText(prev => ({ ...prev, [stage.id]: '' }));
                                }
                              });
                            }
                          }}
                        >+</button>
                      </div>
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
          {employeeError && <p className="auth-error" style={{ marginTop: 8 }}>{employeeError}</p>}

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
          message={`Delete this workflow and its steps? This is only allowed when no jobs use it.`}
          onConfirm={async () => {
            const error = await deleteJobType(deletingJobTypeId);
            setWorkflowError(error);
            setDeletingJobTypeId(null);
          }}
          onCancel={() => setDeletingJobTypeId(null)}
        />
      )}
    </div>
  );
}
