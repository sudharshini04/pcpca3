import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', maxRequests: '', windowMinutes: '', description: '' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [summary, setSummary] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('rules'); // 'rules' | 'users' | 'logs'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAll = async (pg = 1) => {
    try {
      const [rulesRes, summaryRes, logsRes] = await Promise.all([
        api.get('/rate-limits'),
        api.get('/usage/summary'),
        api.get(`/usage/all?page=${pg}&limit=15`),
      ]);
      setRules(rulesRes.data.rules || []);
      setSummary(summaryRes.data.summary || []);
      setLogs(logsRes.data.logs || []);
      setLogStats({ total: logsRes.data.total, blocked: logsRes.data.blocked, allowed: logsRes.data.allowed });
      setTotalPages(logsRes.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(page); }, [page]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.maxRequests || !form.windowMinutes) {
      return showMsg('error', 'Name, max requests, and window minutes are required.');
    }
    try {
      if (editId) {
        await api.put(`/rate-limits/${editId}`, form);
        showMsg('success', 'Rule updated successfully.');
      } else {
        await api.post('/rate-limits', form);
        showMsg('success', 'Rule created successfully.');
      }
      setForm(emptyForm);
      setEditId(null);
      fetchAll(page);
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to save rule.');
    }
  };

  const handleEdit = (rule) => {
    setEditId(rule._id);
    setForm({ name: rule.name, maxRequests: rule.maxRequests, windowMinutes: rule.windowMinutes, description: rule.description || '' });
    setTab('rules');
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await api.delete(`/rate-limits/${id}`);
      showMsg('success', 'Rule deleted.');
      fetchAll(page);
    } catch (err) {
      showMsg('error', 'Failed to delete rule.');
    }
  };

  const toggleActive = async (rule) => {
    try {
      await api.put(`/rate-limits/${rule._id}`, { ...rule, isActive: !rule.isActive });
      fetchAll(page);
    } catch (err) {
      showMsg('error', 'Failed to toggle rule.');
    }
  };

  if (loading) return <div className="loading">Loading admin dashboard...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-bright)' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Signed in as <span style={{ color: 'var(--accent)' }}>@{user.username}</span>
          </p>
        </div>
        {/* Global stats */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[
            { label: 'Total', val: logStats.total ?? 0, color: 'var(--text-bright)' },
            { label: 'Allowed', val: logStats.allowed ?? 0, color: 'var(--accent3)' },
            { label: 'Blocked', val: logStats.blocked ?? 0, color: 'var(--accent2)' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ minWidth: 90, textAlign: 'center', padding: '0.75rem 1rem' }}>
              <div className="stat-value" style={{ color: s.color, fontSize: '1.4rem' }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {['rules', 'users', 'logs'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t ? 'var(--accent)' : 'var(--text-dim)',
            fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
            fontWeight: tab === t ? 700 : 400,
            padding: '0.5rem 1.25rem',
            borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: '-1px', transition: 'color 0.2s',
          }}>
            {t === 'rules' ? '⚙ Rules' : t === 'users' ? '👥 Users' : '📋 All Logs'}
          </button>
        ))}
      </div>

      {msg.text && (
        <div className={msg.type === 'error' ? 'error-msg' : 'success-msg'} style={{ marginBottom: '1rem' }}>
          {msg.text}
        </div>
      )}

      {/* ─── RULES TAB ─── */}
      {tab === 'rules' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Form */}
          <div className="card">
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
              {editId ? '✏ Edit Rule' : '➕ New Rule'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Rule Name</label>
                <input className="input" placeholder="e.g. Default Limit" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label>Max Requests</label>
                  <input className="input" type="number" min="1" placeholder="10" value={form.maxRequests}
                    onChange={e => setForm({ ...form, maxRequests: e.target.value })} />
                </div>
                <div>
                  <label>Window (min)</label>
                  <input className="input" type="number" min="1" placeholder="1" value={form.windowMinutes}
                    onChange={e => setForm({ ...form, windowMinutes: e.target.value })} />
                </div>
              </div>
              <div>
                <label>Description (optional)</label>
                <input className="input" placeholder="Brief description..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 1, justifyContent: 'center' }}>
                  {editId ? 'Update Rule' : 'Create Rule'}
                </button>
                {editId && (
                  <button className="btn btn-ghost" onClick={() => { setEditId(null); setForm(emptyForm); }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Rules List */}
          <div className="card">
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '1rem' }}>
              Configured Rules
            </h2>
            {rules.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No rules yet. Create one.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rules.map(rule => (
                  <div key={rule._id} style={{
                    background: 'var(--bg)', border: `1px solid ${rule.isActive ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`,
                    borderRadius: 8, padding: '1rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: '0.9rem' }}>{rule.name}</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: rule.isActive ? 'var(--accent)' : 'var(--text-dim)', marginTop: '0.2rem' }}>
                          {rule.maxRequests} req / {rule.windowMinutes} min
                        </div>
                      </div>
                      <span className={`badge ${rule.isActive ? 'badge-allowed' : 'badge-blocked'}`}>
                        {rule.isActive ? 'active' : 'inactive'}
                      </span>
                    </div>
                    {rule.description && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>{rule.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost" onClick={() => handleEdit(rule)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem' }}>
                        Edit
                      </button>
                      <button className="btn btn-ghost" onClick={() => toggleActive(rule)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem', color: rule.isActive ? 'var(--warn)' : 'var(--accent3)' }}>
                        {rule.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(rule._id)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── USERS TAB ─── */}
      {tab === 'users' && (
        <div className="card">
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '1rem' }}>
            Per-User Usage Summary
          </h2>
          {summary.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No usage data yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Total</th>
                  <th>Allowed</th>
                  <th>Blocked</th>
                  <th>Last Request</th>
                </tr>
              </thead>
              <tbody>
                {summary.map(row => (
                  <tr key={row._id}>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>@{row.user.username}</td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>{row.user.email}</td>
                    <td><span className={`badge badge-${row.user.role}`}>{row.user.role}</span></td>
                    <td style={{ fontWeight: 700 }}>{row.totalRequests}</td>
                    <td style={{ color: 'var(--accent3)' }}>{row.allowedRequests}</td>
                    <td style={{ color: 'var(--accent2)' }}>{row.blockedRequests}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {new Date(row.lastRequest).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─── LOGS TAB ─── */}
      {tab === 'logs' && (
        <div className="card">
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '1rem' }}>
            All API Request Logs
          </h2>
          {logs.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No logs yet.</p>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>User</th>
                      <th>Endpoint</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log._id}>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ color: 'var(--accent)' }}>@{log.user?.username || '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{log.endpoint}</td>
                        <td style={{ color: 'var(--warn)' }}>{log.method}</td>
                        <td>{log.statusCode}</td>
                        <td>
                          <span className={`badge ${log.blocked ? 'badge-blocked' : 'badge-allowed'}`}>
                            {log.blocked ? 'blocked' : 'allowed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}>← Prev</button>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', alignSelf: 'center' }}>
                  {page} / {totalPages}
                </span>
                <button className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}>Next →</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
