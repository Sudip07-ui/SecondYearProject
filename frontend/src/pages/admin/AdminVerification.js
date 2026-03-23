import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const BACKEND = 'http://localhost:5001';
const statusColor = { pending:'badge-warning', approved:'badge-success', rejected:'badge-danger' };

function DocLink({ filename, label }) {
  if (!filename) return null;
  const url = `${BACKEND}/uploads/${filename}`;
  const isPdf = filename.toLowerCase().endsWith('.pdf');
  return (
    <a href={url} target="_blank" rel="noreferrer"
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px',
        border:'1px solid var(--border)', borderRadius:8, fontSize:13, fontWeight:600,
        color:'var(--secondary)', background:'#fff', textDecoration:'none', transition:'all .2s' }}
      onMouseEnter={e => { e.currentTarget.style.background='var(--gray-100)'; }}
      onMouseLeave={e => { e.currentTarget.style.background='#fff'; }}>
      {isPdf ? '📄' : '🖼️'} {label}
    </a>
  );
}

function DocPreview({ filename, label }) {
  if (!filename) return null;
  const url  = `${BACKEND}/uploads/${filename}`;
  const isPdf = filename.toLowerCase().endsWith('.pdf');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' }}>
      <div style={{ fontSize:11, color:'var(--gray-500)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>{label}</div>
      {isPdf ? (
        <a href={url} target="_blank" rel="noreferrer"
          style={{ display:'flex', alignItems:'center', justifyContent:'center', width:120, height:90,
            background:'#f8f8f8', border:'2px solid var(--border)', borderRadius:10,
            fontSize:32, textDecoration:'none' }}>
          📄
        </a>
      ) : (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={label}
            style={{ width:120, height:90, objectFit:'cover', borderRadius:10,
              border:'2px solid var(--border)', display:'block' }}
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
          <div style={{ display:'none', width:120, height:90, background:'#f8f8f8',
            border:'2px solid var(--border)', borderRadius:10,
            alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--gray-500)' }}>
            Cannot preview
          </div>
        </a>
      )}
    </div>
  );
}

function AdminVerification() {
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('pending');
  const [rejectId, setRejectId] = useState(null);
  const [reason,   setReason]   = useState('');
  const [acting,   setActing]   = useState(false);

  function load(status) {
    setLoading(true);
    API.get(`/verification?status=${status}`)
      .then(r => setList(r.data.verifications || []))
      .catch(() => toast.error('Failed to load verifications'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(filter); }, [filter]);

  async function approve(id) {
    setActing(true);
    try {
      await API.put(`/verification/${id}`, { status: 'approved' });
      toast.success('✅ Verification approved! Customer notified.');
      load(filter);
    } catch { toast.error('Failed.'); }
    finally { setActing(false); }
  }

  async function reject() {
    if (!reason.trim()) { toast.error('Please provide a rejection reason.'); return; }
    setActing(true);
    try {
      await API.put(`/verification/${rejectId}`, { status: 'rejected', rejection_reason: reason });
      toast.success('Verification rejected. Customer notified.');
      setRejectId(null); setReason(''); load(filter);
    } catch { toast.error('Failed.'); }
    finally { setActing(false); }
  }

  return (
    <div style={{ padding:'24px 0 64px' }}>
      <div style={{ marginBottom:24 }}>
        <h1 className="page-title">🪪 Identity Verification</h1>
        <p style={{ color:'var(--gray-500)', fontSize:14, marginTop:4 }}>
          Review customer identity documents and approve or reject
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:24 }}>
        {['pending','approved','rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter===s ? 'btn-primary' : 'btn-ghost'}`}
            style={{ textTransform:'capitalize' }}>
            {s} {filter === s && list.length > 0 ? `(${list.length})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--gray-500)' }}>Loading...</div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✅</div>
          <h3>No {filter} verifications</h3>
          <p>All caught up!</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {list.map(v => (
            <div key={v.id} className="card">
              <div className="card-body">
                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                  <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                    <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--primary)',
                      color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:700, fontSize:18, flexShrink:0 }}>
                      {v.first_name?.[0]}{v.last_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:17, color:'var(--secondary)' }}>
                        {v.first_name} {v.last_name}
                      </div>
                      <div style={{ fontSize:13, color:'var(--gray-500)', marginTop:2 }}>
                        {v.email} &nbsp;·&nbsp; {v.phone}
                      </div>
                      <div style={{ fontSize:12, color:'var(--gray-400)', marginTop:3 }}>
                        Submitted: {new Date(v.submitted_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${statusColor[v.status]}`} style={{ fontSize:13, padding:'5px 14px' }}>
                    {v.status}
                  </span>
                </div>

                {v.rejection_reason && (
                  <div style={{ marginBottom:14, padding:'8px 14px', background:'#fee2e2',
                    borderRadius:8, fontSize:13, color:'var(--danger)', fontWeight:600 }}>
                    ❌ Rejection reason: {v.rejection_reason}
                  </div>
                )}

                {/* Document Previews */}
                <div style={{ background:'var(--gray-100)', borderRadius:12, padding:16, marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--gray-600)',
                    textTransform:'uppercase', letterSpacing:'.05em', marginBottom:14 }}>
                    📎 Submitted Documents
                  </div>
                  <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'flex-start' }}>
                    <DocPreview filename={v.citizenship_doc} label="Citizenship / ID" />
                    <DocPreview filename={v.license_doc}     label="Driver's License" />
                    <DocPreview filename={v.user_photo}      label="User Photo" />
                  </div>
                  {!v.citizenship_doc && !v.license_doc && !v.user_photo && (
                    <div style={{ color:'var(--gray-500)', fontSize:13 }}>No documents uploaded.</div>
                  )}
                </div>

                {/* Open full size links */}
                <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                  <DocLink filename={v.citizenship_doc} label="Open Citizenship" />
                  <DocLink filename={v.license_doc}     label="Open License" />
                  <DocLink filename={v.user_photo}      label="Open Photo" />
                </div>

                {/* Action buttons for pending */}
                {v.status === 'pending' && (
                  <div style={{ display:'flex', gap:10, paddingTop:14, borderTop:'1px solid var(--border)' }}>
                    <button className="btn btn-success" style={{ flex:1 }}
                      disabled={acting} onClick={() => approve(v.id)}>
                      ✅ Approve Verification
                    </button>
                    <button className="btn btn-danger" style={{ flex:1 }}
                      onClick={() => { setRejectId(v.id); setReason(''); }}>
                      ❌ Reject Verification
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:2000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:'100%', maxWidth:440 }}>
            <h3 style={{ marginBottom:16, color:'var(--secondary)' }}>❌ Reject Verification</h3>
            <p style={{ fontSize:13, color:'var(--gray-500)', marginBottom:14 }}>
              The customer will be notified with this reason and asked to resubmit.
            </p>
            <div className="form-group">
              <label className="form-label">Rejection Reason *</label>
              <textarea className="form-control" rows={3} value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Document is blurry, ID is expired, Photo does not match..." />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setRejectId(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex:1 }} onClick={reject} disabled={acting}>
                {acting ? <><span className="spinner spinner-dark" /> Rejecting...</> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVerification;
