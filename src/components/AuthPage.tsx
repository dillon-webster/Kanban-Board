import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    if (mode === 'signup' && !fullName.trim()) return;
    setError('');
    setMessage('');
    setLoading(true);

    if (mode === 'login') {
      const err = await signIn(email, password);
      if (err) setError(err.message);
    } else {
      const err = await signUp(email, password, fullName.trim());
      if (err) setError(err.message);
      else setMessage('Account created! Check your email to confirm, then log in.');
    }

    setLoading(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setMessage('');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <img src="/Logo.png" alt="Wood River Furniture" className="auth-logo" />
        <p className="auth-subtitle">
          {mode === 'login' ? 'Welcome back' : 'Accept your invitation'}
        </p>

        <div className="auth-fields">
          {mode === 'signup' && (
            <input
              className="input"
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
              autoFocus
            />
          )}
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            autoFocus={mode === 'login'}
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
          {loading ? '...' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>

        <p className="auth-switch">
          {mode === 'login' ? 'Have an invite? ' : 'Already have an account? '}
          <button className="auth-switch-btn" onClick={switchMode}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
