import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useJobTypes } from './hooks/useJobTypes';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import JobBoard from './components/JobBoard';
import EmployeeView from './components/EmployeeView';
import AdminPanel from './components/AdminPanel';
import AllJobsView from './components/AllJobsView';
import type { JobType } from './types';
import './App.css';

type View = 'dashboard' | 'job-board' | 'admin' | 'all-jobs';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user);
  const { jobTypes, loading: jobTypesLoading } = useJobTypes();
  const [view, setView] = useState<View>('dashboard');
  const [selectedJobType, setSelectedJobType] = useState<JobType | null>(null);

  if (authLoading || profileLoading) return <div className="board-loading">Loading...</div>;
  if (!user) return <AuthPage />;
  if (jobTypesLoading) return <div className="board-loading">Loading...</div>;

  if (profile?.role === 'employee') {
    return <EmployeeView name={profile.full_name} onSignOut={signOut} />;
  }

  if (view === 'all-jobs') {
    return (
      <AllJobsView
        jobTypes={jobTypes}
        onBack={() => setView('dashboard')}
        onSignOut={signOut}
      />
    );
  }

  if (view === 'admin') {
    return (
      <AdminPanel
        onBack={() => setView('dashboard')}
        onSignOut={signOut}
      />
    );
  }

  if (view === 'job-board' && selectedJobType) {
    return (
      <JobBoard
        jobType={selectedJobType}
        jobTypes={jobTypes}
        onBack={() => { setView('dashboard'); setSelectedJobType(null); }}
        onSignOut={signOut}
      />
    );
  }

  return (
    <Dashboard
      jobTypes={jobTypes}
      onSelectJobType={jt => { setSelectedJobType(jt); setView('job-board'); }}
      onOpenAdmin={() => setView('admin')}
      onAllJobs={() => setView('all-jobs')}
      onSignOut={signOut}
    />
  );
}
