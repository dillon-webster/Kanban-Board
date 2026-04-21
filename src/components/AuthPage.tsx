import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setError('');
    setMessage('');
    setLoading(true);

    if (mode === 'login') {
      const err = await signIn(email, password);
      if (err) setError(err.message);
    } else {
      const err = await signUp(email, password);
      if (err) setError(err.message);
      else setMessage('Check your email to confirm your account, then log in.');
    }

    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h1 className="board-header-logo auth-logo">Flow</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </p>

        <div className="auth-fields">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            autoFocus
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          />
        </div>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}

        <button className="btn btn-primary auth-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? '...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className="auth-switch-btn" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
