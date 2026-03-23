import React, { useState } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

function AdminReports() {
  const [tab,     setTab]     = useState('bookings');
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');
  const [report,  setReport]  = useState([]);
  const [total,   setTotal]   = useState(null);
  const [loading, setLoading] = useState(false);

  async function runReport() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (from) q.append('from', from);
      if (to)   q.append('to', to);
      const url = `/admin/reports/${tab}?${q}`;
      const { data } = await API.get(url);
      setReport(data.report || []);
      setTotal(data.total || null);
    } catch { toast.error('Failed to generate report.'); }
    finally { setLoading(false); }
  }

  function exportCSV() {
    if (!report.length) { toast.error('No data to export.'); return; }
    const keys = Object.keys(report[0]);
    const rows = [keys.join(','), ...report.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `rento_${tab}_report.csv`; a.click();
    toast.success('CSV exported!');
  }

  return (
    <div style={{ padding: '24px 0 64px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title"> Reports & Analytics</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>Generate booking and revenue reports</p>
      </div>

      {/* Report type tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        <button onClick={() => { setTab('bookings'); setReport([]); setTotal(null); }}
          className={`btn btn-sm ${tab === 'bookings' ? 'btn-primary' : 'btn-ghost'}`}> Bookings Report</button>
        <button onClick={() => { setTab('revenue'); setReport([]); setTotal(null); }}
          className={`btn btn-sm ${tab === 'revenue' ? 'btn-primary' : 'btn-ghost'}`}> Revenue Report</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
              <label className="form-label">From Date</label>
              <input type="date" className="form-control" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
              <label className="form-label">To Date</label>
              <input type="date" className="form-control" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={runReport} disabled={loading} style={{ marginBottom: 0 }}>
              {loading ? <><span className="spinner" /> Generating...</> : '▶ Generate Report'}
            </button>
            {report.length > 0 && (
              <button className="btn btn-ghost" onClick={exportCSV}> Export CSV</button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {total !== null && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Total Records</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--secondary)', fontFamily: 'var(--font-head)' }}>{report.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Total Revenue</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-head)' }}>NPR {parseFloat(total).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {report.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table>
              {tab === 'bookings' ? (
                <>
                  <thead>
                    <tr><th>#</th><th>Customer</th><th>Vehicle</th><th>Type</th><th>Start</th><th>End</th><th>Days</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {report.map(b => (
                      <tr key={b.id}>
                        <td>#{b.id}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{b.first_name} {b.last_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{b.email}</div>
                        </td>
                        <td>{b.brand} {b.model_name}</td>
                        <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{b.type}</td>
                        <td style={{ fontSize: 12 }}>{new Date(b.start_date).toLocaleDateString()}</td>
                        <td style={{ fontSize: 12 }}>{new Date(b.end_date).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'center' }}>{b.total_days}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>NPR {parseFloat(b.total_price).toLocaleString()}</td>
                        <td><span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr><th>#</th><th>Customer</th><th>Vehicle</th><th>Days</th><th>Method</th><th>Amount</th><th>Transaction ID</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {report.map(p => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.first_name} {p.last_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{p.email}</div>
                        </td>
                        <td>{p.brand} {p.model_name}</td>
                        <td style={{ textAlign: 'center' }}>{p.total_days}</td>
                        <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{p.payment_method}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>NPR {parseFloat(p.amount).toLocaleString()}</td>
                        <td style={{ fontSize: 11, color: 'var(--gray-500)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.transaction_id}</td>
                        <td style={{ fontSize: 12 }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      )}

      {!loading && report.length === 0 && (
        <div className="empty-state">
          <div className="icon"></div>
          <h3>No report generated yet</h3>
          <p>Set date range and click Generate Report</p>
        </div>
      )}
    </div>
  );
}

export default AdminReports;
