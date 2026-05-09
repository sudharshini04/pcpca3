import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!form.username || !form.email || !form.password) return setError('All fields required');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const user = await register(form.username, form.email, form.password, form.role);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.06) 0%, transparent 60%)',
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 800, color: '#000',
            margin: '0 auto 1rem',
          }}>RL</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-bright)' }}>
            Create Account
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Username</label>
            <input className="input" placeholder="johndoe" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label>Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label>Password</label>
            <input className="input" type="password" placeholder="Min 6 characters" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label>Role</label>
            <select className="input" value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              style={{ cursor: 'pointer' }}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
            {loading ? 'Creating account...' : 'Register →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
