import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const STEPS = [
  { key: 'citizenship_doc', label: 'Citizenship / National ID', icon: '', desc: 'Upload a clear photo or scan of your citizenship certificate or national ID card.' },
  { key: 'license_doc',     label: "Driver's License",          icon: '', desc: 'Upload both sides of your valid driver\'s license.' },
  { key: 'user_photo',      label: 'Your Photo',                icon: '', desc: 'Upload a clear, recent photo of your face (selfie or portrait).' },
];

function Verification() {
  const [status,     setStatus]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [step,       setStep]       = useState(0);
  const [files,      setFiles]      = useState({ citizenship_doc: null, license_doc: null, user_photo: null });
  const [previews,   setPreviews]   = useState({ citizenship_doc: null, license_doc: null, user_photo: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    API.get('/verification/my')
      .then(r => setStatus(r.data.verification))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleFile(e) {
    const key  = STEPS[step].key;
    const file = e.target.files[0];
    if (!file) return;
    setFiles(f => ({ ...f, [key]: file }));
    setPreviews(p => ({ ...p, [key]: URL.createObjectURL(file) }));
  }

  async function handleSubmit() {
    const missing = STEPS.filter(s => !files[s.key]);
    if (missing.length > 0) {
      toast.error(`Please upload: ${missing.map(s => s.label).join(', ')}`);
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      Object.entries(files).forEach(([k, v]) => { if (v) form.append(k, v); });
      await API.post('/verification/submit', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Documents submitted! Staff will review within 24 hours.');
      const r = await API.get('/verification/my');
      setStatus(r.data.verification);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>Loading...</div>;

  // Already submitted
  if (status) {
    const icons   = { pending: '', approved: '', rejected: '' };
    const colors  = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
    const msgs    = {
      pending:  'Your documents have been submitted and are awaiting review by our staff. This usually takes up to 24 hours.',
      approved: 'Your identity has been verified! You can now book any vehicle on Rento.',
      rejected: `Your verification was rejected. Reason: ${status.rejection_reason || 'Documents were unclear or invalid.'}`,
    };
    return (
      <div className="container" style={{ padding: '40px 0 80px', maxWidth: 600 }}>
        <h1 className="page-title"> Identity Verification</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{icons[status.status]}</div>
            <div style={{ marginBottom: 12 }}>
              <span className={`badge ${colors[status.status]}`} style={{ fontSize: 14, padding: '6px 18px' }}>
                {status.status.toUpperCase()}
              </span>
            </div>
            <p style={{ color: 'var(--gray-700)', fontSize: 15, lineHeight: 1.7 }}>{msgs[status.status]}</p>
            <p style={{ color: 'var(--gray-500)', fontSize: 12, marginTop: 12 }}>
              Submitted: {new Date(status.submitted_at).toLocaleString()}
            </p>
            {status.status === 'rejected' && (
              <button className="btn btn-primary" style={{ marginTop: 20 }}
                onClick={() => { setStatus(null); setStep(0); setFiles({ citizenship_doc: null, license_doc: null, user_photo: null }); }}>
                Resubmit Documents
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Upload form
  return (
    <div className="container" style={{ padding: '40px 0 80px', maxWidth: 700 }}>
      <h1 className="page-title"> Identity Verification</h1>
      <p style={{ color: 'var(--gray-500)', marginTop: 4, marginBottom: 32 }}>
        Complete 3-step document verification to unlock vehicle booking.
      </p>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 40 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700,
              background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--gray-300)',
              color: i <= step ? '#fff' : 'var(--gray-700)',
              transition: 'all .3s',
            }}>
              {files[s.key] ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: 11, color: i === step ? 'var(--primary)' : 'var(--gray-500)', fontWeight: i === step ? 700 : 400, textAlign: 'center' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Current step */}
      <div className="card">
        <div className="card-body">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48 }}>{STEPS[step].icon}</div>
            <h2 style={{ fontSize: 20, color: 'var(--secondary)', margin: '12px 0 8px' }}>
              Step {step + 1}: {STEPS[step].label}
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>{STEPS[step].desc}</p>
          </div>

          {/* Preview */}
          {previews[STEPS[step].key] && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img src={previews[STEPS[step].key]} alt="preview"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '2px solid var(--success)' }} />
              <div style={{ color: 'var(--success)', fontSize: 13, marginTop: 8, fontWeight: 600 }}> File selected</div>
            </div>
          )}

          {/* Upload area */}
          <label style={{ display: 'block', cursor: 'pointer' }}>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFile} style={{ display: 'none' }} />
            <div style={{
              border: '2px dashed var(--border)', borderRadius: 12, padding: 32, textAlign: 'center',
              background: 'var(--gray-100)', transition: 'all .2s',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}></div>
              <div style={{ fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 }}>Click to upload</div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>JPG, PNG or PDF · Max 5MB</div>
            </div>
          </label>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            {step > 0 && (
              <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" style={{ flex: 1 }}
                disabled={!files[STEPS[step].key]}
                onClick={() => setStep(s => s + 1)}>
                Next →
              </button>
            ) : (
              <button className="btn btn-primary" style={{ flex: 1 }}
                disabled={submitting || STEPS.some(s => !files[s.key])}
                onClick={handleSubmit}>
                {submitting ? <><span className="spinner" /> Submitting...</> : ' Submit All Documents'}
              </button>
            )}
          </div>

          {/* All files summary */}
          <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STEPS.map(s => (
              <span key={s.key} className={`badge ${files[s.key] ? 'badge-success' : 'badge-secondary'}`}>
                {files[s.key] ? '' : ''} {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Verification;
