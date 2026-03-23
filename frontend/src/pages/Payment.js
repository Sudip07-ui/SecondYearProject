import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import './Payment.css';

const PAYMENT_METHODS = [
  { value: 'esewa',  label: 'eSewa',        icon: '', color: '#60BB46' },
  { value: 'khalti', label: 'Khalti',        icon: '', color: '#5C2D91' },
  { value: 'card',   label: 'Card',          icon: '', color: '#1D3557' },
  { value: 'cash',   label: 'Cash at Pickup',icon: '', color: '#2DC653' },
];

const Payment = () => {
  const { bookingId } = useParams();
  const navigate      = useNavigate();

  const [booking,    setBooking]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [method,     setMethod]     = useState('esewa');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    API.get(`/bookings/${bookingId}`)
      .then(r => {
        const b = r.data.booking;
        // If not confirmed by admin yet, go back
        if (b.status === 'pending') {
          toast.error('Please wait for admin to approve your booking first.');
          navigate('/my-bookings');
          return;
        }
        if (b.status === 'active' || b.status === 'completed') {
          toast.error('This booking has already been paid.');
          navigate('/my-bookings');
          return;
        }
        if (b.status === 'cancelled') {
          toast.error('This booking has been cancelled.');
          navigate('/my-bookings');
          return;
        }
        setBooking(b);
      })
      .catch(() => { toast.error('Booking not found.'); navigate('/my-bookings'); })
      .finally(() => setLoading(false));
  }, [bookingId, navigate]);

  const handlePay = async () => {
    setProcessing(true);
    try {
      await API.post('/payments', {
        booking_id:     parseInt(bookingId),
        payment_method: method,
      });
      toast.success(' Payment successful! Your booking is now active.');
      navigate('/my-bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally { setProcessing(false); }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--gray-500)' }}>
      Loading booking details...
    </div>
  );
  if (!booking) return null;

  return (
    <div className="payment-page container">
      <div className="pay-layout">

        {/* Left: Booking Summary */}
        <div className="pay-summary card">
          <div className="card-body">
            <h2 className="pay-title"> Booking Summary</h2>

            <div className="pay-vehicle">
              <img
                src={booking.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400'}
                alt={booking.model_name}
                className="pay-vehicle-img"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400'; }}
              />
              <div>
                <div className="pay-vname">{booking.brand} {booking.model_name}</div>
                <div className="pay-vcolor" style={{ textTransform: 'capitalize' }}>{booking.color} · {booking.type}</div>
              </div>
            </div>

            <div className="summary-rows">
              <div className="summary-row">
                <span>Booking ID</span>
                <strong>#{booking.id}</strong>
              </div>
              <div className="summary-row">
                <span>Pick-up Date</span>
                <strong>{new Date(booking.start_date).toLocaleDateString('en-NP', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </div>
              <div className="summary-row">
                <span>Return Date</span>
                <strong>{new Date(booking.end_date).toLocaleDateString('en-NP', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </div>
              <div className="summary-row">
                <span>Duration</span>
                <strong>{booking.total_days} day{booking.total_days > 1 ? 's' : ''}</strong>
              </div>
              <div className="summary-row">
                <span>Status</span>
                <strong style={{ color: 'var(--success)' }}> Admin Approved</strong>
              </div>
              <div className="summary-row total-row">
                <span>Total Amount</span>
                <strong className="total-amt">NPR {parseFloat(booking.total_price).toLocaleString()}</strong>
              </div>
            </div>

            {booking.notes && (
              <div className="summary-note"> Note: {booking.notes}</div>
            )}
          </div>
        </div>

        {/* Right: Payment */}
        <div className="pay-right">

          {/* Admin approved banner */}
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12,
            padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}></span>
            <div>
              <div style={{ fontWeight: 700, color: '#166534', fontSize: 14 }}>Booking Approved by Admin</div>
              <div style={{ fontSize: 12, color: '#166534', opacity: .8 }}>Please complete your payment to confirm the booking.</div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: 20, color: 'var(--secondary)' }}> Select Payment Method</h3>

              <div className="method-grid">
                {PAYMENT_METHODS.map(m => (
                  <label key={m.value} className={`method-option ${method === m.value ? 'selected' : ''}`}>
                    <input type="radio" name="method" value={m.value}
                      checked={method === m.value}
                      onChange={() => setMethod(m.value)} />
                    <span className="method-icon" style={{ background: `${m.color}22`, color: m.color }}>{m.icon}</span>
                    <span className="method-label">{m.label}</span>
                  </label>
                ))}
              </div>

              <div className="pay-total-bar">
                <span>Total to Pay</span>
                <span className="pay-total-amt">NPR {parseFloat(booking.total_price).toLocaleString()}</span>
              </div>

              <button onClick={handlePay} className="btn btn-primary btn-lg w-full"
                disabled={processing} style={{ marginTop: 16 }}>
                {processing
                  ? <><span className="spinner" /> Processing Payment...</>
                  : `Pay NPR ${parseFloat(booking.total_price).toLocaleString()} via ${PAYMENT_METHODS.find(m => m.value === method)?.label}`
                }
              </button>

              <div className="pay-secure"> Secured by 256-bit TLS encryption · PCI-DSS compliant</div>
            </div>
          </div>

          <div className="pay-cancel-link" style={{ marginTop: 12 }}>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this booking?')) {
                  API.put(`/bookings/${bookingId}/cancel`)
                    .then(() => { toast.success('Booking cancelled.'); navigate('/vehicles'); })
                    .catch(() => toast.error('Cancel failed.'));
                }
              }}
              className="btn btn-ghost btn-sm w-full">
              Cancel Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
