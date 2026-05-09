import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [rule, setRule] = useState(null);
  const [apiResult, setApiResult] = useState(null);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async (pg = 1) => {
    try {
      const [usageRes, ruleRes] = await Promise.all([
        api.get(`/usage/me?page=${pg}&limit=10`),
        api.get('/rate-limits'),
      ]);
      setStats({ total: usageRes.data.total, blocked: usageRes.data.blocked, allowed: usageRes.data.allowed });
      setLogs(usageRes.data.logs);
      setTotalPages(usageRes.data.pages);
      setRule(ruleRes.data.rule);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(page); }, [page]);

  const callApi = async (endpoint) => {
    setCalling(true);
    setApiResult(null);
    setApiError('');
    try {
      const res = await api.get(`/protected/${endpoint}`);
      setApiResult(res.data);
      fetchData(page);
    } catch (err) {
      const data = err.response?.data;
      setApiError(data?.message || 'Request failed');
      if (err.response?.status === 429) {
        setApiResult(data);
        fetchData(page);
      }
    } finally {
      setCalling(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-bright)' }}>
          User Dashboard
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
          Welcome back, <span style={{ color: 'var(--accent)' }}>@{user.username}</span>
        </p>
      </div>

      {/* Active Rule Banner */}
      {rule && (
        <div style={{
          background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
          borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Active Rate Limit
          </span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
            {rule.maxRequests} requests / {rule.windowMinutes} min
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>— {rule.name}</span>
        </div>
      )}
      {!rule && (
        <div style={{
          background: 'rgba(255,165,2,0.06)', border: '1px solid rgba(255,165,2,0.2)',
          borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.5rem',
          color: 'var(--warn)', fontSize: '0.85rem',
        }}>
          ⚠ No active rate limit rule configured. Ask an admin to set one.
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--text-bright)' }}>{stats?.total ?? 0}</div>
          <div className="stat-label">Total Requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent3)' }}>{stats?.allowed ?? 0}</div>
          <div className="stat-label">Allowed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{stats?.blocked ?? 0}</div>
          <div className="stat-label">Blocked</div>
        </div>
      </div>

      {/* Test API Buttons */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '1rem', letterSpacing: '0.04em' }}>
          🚀 Test Protected APIs
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button className="btn btn-primary" onClick={() => callApi('data')} disabled={calling}>
            GET /data
          </button>
          <button className="btn btn-ghost" onClick={() => callApi('resource')} disabled={calling}>
            GET /resource
          </button>
        </div>

        {calling && <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>Calling API...</div>}

        {apiError && !apiResult && <div className="error-msg" style={{ marginTop: '0.5rem' }}>{apiError}</div>}

        {apiResult && (
          <div style={{
            background: 'var(--bg)', border: `1px solid ${apiError ? 'rgba(255,71,87,0.3)' : 'rgba(46,213,115,0.3)'}`,
            borderRadius: 6, padding: '1rem', marginTop: '0.5rem',
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {apiError ? '⛔ Rate Limited — Response' : '✅ Success — Response'}
            </div>
            <pre style={{ fontSize: '0.8rem', color: apiError ? 'var(--accent2)' : 'var(--accent3)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(apiResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Usage Logs */}
      <div className="card">
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '1rem', letterSpacing: '0.04em' }}>
          📋 My Request History
        </h2>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', padding: '1rem 0' }}>
            No requests yet. Try hitting the API buttons above.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{log.endpoint}</td>
                      <td><span style={{ color: 'var(--warn)' }}>{log.method}</span></td>
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
            {/* Pagination */}
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
    </div>
  );
}
