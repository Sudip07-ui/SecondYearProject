import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

function Review() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const [rating,   setRating]   = useState(0);
  const [hover,    setHover]    = useState(0);
  const [comment,  setComment]  = useState('');
  const [saving,   setSaving]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) { toast.error('Please select a star rating.'); return; }
    setSaving(true);
    try {
      await API.post('/reviews', { booking_id: parseInt(bookingId), rating, comment });
      toast.success('Review submitted! Thank you ');
      navigate('/my-bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally { setSaving(false); }
  }

  return (
    <div className="container" style={{ padding: '40px 0 80px', maxWidth: 500 }}>
      <h1 className="page-title"> Write a Review</h1>
      <p style={{ color: 'var(--gray-500)', marginTop: 4, marginBottom: 28 }}>Share your experience to help other renters.</p>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="form-label" style={{ marginBottom: 12 }}>Your Rating *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4,5].map(star => (
                  <span key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    style={{ fontSize: 40, cursor: 'pointer', transition: 'transform .1s',
                      transform: (hover || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                      filter: (hover || rating) >= star ? 'none' : 'grayscale(1) opacity(.3)' }}>
                    
                  </span>
                ))}
              </div>
              {rating > 0 && (
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--gray-500)' }}>
                  {['', 'Poor ', 'Fair ', 'Good ', 'Very Good ', 'Excellent '][rating]}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Your Comment (optional)</label>
              <textarea className="form-control" rows={4} placeholder="Tell others about your experience — the vehicle condition, staff service, pickup process..."
                value={comment} onChange={e => setComment(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/my-bookings')}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                {saving ? <><span className="spinner" /> Submitting...</> : 'Submit Review ⭐'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Review;
