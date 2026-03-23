import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import './VehicleDetail.css';

const VehicleDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [vehicle,    setVehicle]    = useState(null);
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [booking,    setBooking]    = useState({ start_date: '', end_date: '', notes: '' });
  const [available,  setAvailable]  = useState(null);
  const [checking,   setChecking]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      API.get(`/vehicles/${id}`),
      API.get(`/reviews/vehicle/${id}`)
    ]).then(([vr, rr]) => {
      setVehicle(vr.data.vehicle);
      setReviews(rr.data.reviews || []);
    }).catch(() => navigate('/vehicles'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (booking.start_date && booking.end_date) {
      setChecking(true);
      API.get(`/vehicles/${id}/availability?start_date=${booking.start_date}&end_date=${booking.end_date}`)
        .then(r => setAvailable(r.data.available))
        .catch(() => setAvailable(null))
        .finally(() => setChecking(false));
    }
  }, [booking.start_date, booking.end_date, id]);

  const totalDays = booking.start_date && booking.end_date
    ? Math.max(0, Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / 86400000))
    : 0;
  const totalPrice = vehicle ? totalDays * parseFloat(vehicle.price_per_day) : 0;

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login', { state: { from: `/vehicles/${id}` } }); return; }
    if (!booking.start_date || !booking.end_date) { toast.error('Please select dates.'); return; }
    if (!available) { toast.error('Vehicle not available for selected dates.'); return; }
    setSubmitting(true);
    try {
      await API.post('/bookings', { vehicle_id: id, ...booking });
      toast.success('Booking submitted! Awaiting admin approval. Check My Bookings.');
      navigate('/my-bookings');
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed.';
      if (err.response?.data?.redirect) {
        toast.error(msg);
        navigate(err.response.data.redirect);
      } else {
        toast.error(msg);
      }
    } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--gray-500)' }}>Loading vehicle details...</div>;
  if (!vehicle) return null;

  const { model_name, brand, type, fuel_type, transmission, price_per_day,
          status, color, description, registration_number, year_manufactured, image_url } = vehicle;
  const typeIcon = { bike: '', scooter: '', car: '' }[type];
  const stars = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="vd-page container">
      <div className="breadcrumb">
        <Link to="/vehicles">Vehicles</Link> / {brand} {model_name}
      </div>

      <div className="vd-layout">
        {/* Left */}
        <div className="vd-left">
          <div className="vd-img-wrap">
            <img src={image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800'}
              alt={`${brand} ${model_name}`} className="vd-img" />
            <span className={`status-pill ${status}`}>{status}</span>
          </div>

          <div className="vd-info card">
            <div className="card-body">
              <div className="vd-tags">
                <span className="badge badge-info">{typeIcon} {type}</span>
                <span className="badge badge-secondary"> {fuel_type}</span>
                <span className="badge badge-secondary"> {transmission}</span>
                <span className="badge badge-secondary"> {year_manufactured}</span>
                <span className="badge badge-secondary"> {color}</span>
              </div>
              <h1 className="vd-title">{brand} {model_name}</h1>
              <div className="vd-reg">Registration: <strong>{registration_number}</strong></div>
              {stars && <div className="vd-rating"> {stars} ({reviews.length} reviews)</div>}
              <p className="vd-desc">{description}</p>

              <div className="vd-price-big">
                <span className="price-big">NPR {parseFloat(price_per_day).toLocaleString()}</span>
                <span className="per-day"> / day</span>
              </div>

              <div className="specs-grid">
                <div className="spec-item"><span>Type</span><strong>{type}</strong></div>
                <div className="spec-item"><span>Fuel</span><strong>{fuel_type}</strong></div>
                <div className="spec-item"><span>Transmission</span><strong>{transmission}</strong></div>
                <div className="spec-item"><span>Year</span><strong>{year_manufactured}</strong></div>
                <div className="spec-item"><span>Color</span><strong>{color}</strong></div>
                <div className="spec-item"><span>Status</span>
                  <strong style={{ color: status === 'available' ? 'var(--success)' : 'var(--warning)', textTransform: 'capitalize' }}>
                    {status}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-body">
                <h3 style={{ marginBottom: 16, color: 'var(--secondary)' }}>Customer Reviews  {stars}</h3>
                {reviews.map(r => (
                  <div key={r.id} className="review-item">
                    <div className="review-head">
                      <div className="reviewer">{r.first_name} {r.last_name}</div>
                      <div className="stars">{''.repeat(r.rating)}</div>
                    </div>
                    {r.comment && <p className="review-comment">{r.comment}</p>}
                    <div className="review-date">{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking */}
        <aside className="vd-right">
          <div className="booking-card card">
            <div className="card-body">
              <h3 className="booking-title"> Book This Vehicle</h3>
              {status !== 'available' ? (
                <div className="alert alert-warning">
                  This vehicle is currently <strong>{status}</strong> and not available for booking.
                </div>
              ) : (
                <form onSubmit={handleBook} className="booking-form">
                  <div className="form-group">
                    <label className="form-label">Pick-up Date *</label>
                    <input type="date" className="form-control" min={today}
                      value={booking.start_date}
                      onChange={e => setBooking(b => ({ ...b, start_date: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Return Date *</label>
                    <input type="date" className="form-control" min={booking.start_date || today}
                      value={booking.end_date}
                      onChange={e => setBooking(b => ({ ...b, end_date: e.target.value }))} required />
                  </div>

                  {checking && <div className="avail-check"> Checking availability...</div>}
                  {!checking && available === true  && <div className="alert alert-success"> Available for selected dates!</div>}
                  {!checking && available === false && <div className="alert alert-error"> Already booked for these dates.</div>}

                  {totalDays > 0 && (
                    <div className="price-summary">
                      <div className="price-row">
                        <span>NPR {parseFloat(price_per_day).toLocaleString()} × {totalDays} day{totalDays > 1 ? 's' : ''}</span>
                        <span>NPR {totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="price-total">
                        <span>Total</span>
                        <span>NPR {totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Special Notes</label>
                    <textarea className="form-control" rows={2} placeholder="Any special requests..."
                      value={booking.notes}
                      onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))} />
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg w-full"
                    disabled={submitting || available === false || !totalDays}>
                    {submitting
                      ? <><span className="spinner" /> Submitting...</>
                      : `Submit Booking Request – NPR ${totalPrice.toLocaleString()}`}
                  </button>

                  <p className="soft-lock-note" style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>
                    📋 Admin will review and approve your request. You pay after approval.
                  </p>

                  {!user && (
                    <div className="alert alert-info" style={{ marginTop: 12 }}>
                      Please <Link to="/login">login</Link> to book this vehicle.
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>

          <div className="policy-card card" style={{ marginTop: 16 }}>
            <div className="card-body">
              <h4>📋 Rental Policy</h4>
              <ul className="policy-list">
                <li> Minimum rental: 1 day</li>
                <li> Age requirement: 18+ years</li>
                <li> Valid driver's license required</li>
                <li> Full refund if cancelled 24h+ before pickup</li>
                <li> 50% fee if cancelled within 24h</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default VehicleDetail;
