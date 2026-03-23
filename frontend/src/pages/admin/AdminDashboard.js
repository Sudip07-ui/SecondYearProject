import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const statusColor = {
  pending:   { bg: '#fef9c3', color: '#854d0e' },
  confirmed: { bg: '#dbeafe', color: '#1e40af' },
  active:    { bg: '#dcfce7', color: '#166534' },
  completed: { bg: '#f3f4f6', color: '#374151' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

function Badge({ status }) {
  const s = statusColor[status] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700,
      background: s.bg, color: s.color, textTransform: 'capitalize' }}>
      {status}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
      padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
      borderLeft: `4px solid ${color}` }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--secondary)',
          fontFamily: 'var(--font-head)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--gray-700)', marginTop: 3, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    API.get('/admin/stats')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function approveBooking(id) {
    try {
      await API.put(`/bookings/${id}/status`, { status: 'confirmed' });
      toast.success('Booking confirmed! Customer notified.');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  }

  async function rejectBooking(id) {
    if (!window.confirm('Reject and cancel this booking?')) return;
    try {
      await API.put(`/bookings/${id}/status`, { status: 'cancelled' });
      toast.success('Booking rejected.');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  }

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <div style={{ color: 'var(--gray-500)', fontSize: 15 }}>Loading dashboard...</div>
      </div>
    );
  }
  if (!data) return null;

  const { today, stats, recentBookings, monthlyRevenue, bookingsByStatus, pendingVerifications } = data;
  const todayDate = new Date().toLocaleDateString('en-NP', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const pendingList = recentBookings.filter(b => b.status === 'pending');

  return (
    <div style={{ padding: '24px 0 64px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontFamily: 'var(--font-head)', color: 'var(--secondary)', marginBottom: 4 }}>
          📊 Admin Dashboard
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>📅 {todayDate}</p>
      </div>

      {/* TODAY - 3 big cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>

        {/* Today's Trips */}
        <div style={{ background: 'linear-gradient(135deg,#1D3557,#2a6496)', borderRadius: 16,
          padding: '24px 28px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 80, opacity: .1 }}>🚗</div>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: .65, textTransform: 'uppercase',
            letterSpacing: '.08em', marginBottom: 12 }}>Total Trips Today</div>
          <div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'var(--font-head)', lineHeight: 1 }}>
            {today.trips}
          </div>
          <div style={{ opacity: .7, fontSize: 13, marginTop: 8 }}>
            {today.trips === 0 ? 'No trips yet today' : `${today.trips} booking${today.trips > 1 ? 's' : ''} made`}
          </div>
        </div>

        {/* Today's Revenue */}
        <div style={{ background: 'linear-gradient(135deg,#E63946,#c1121f)', borderRadius: 16,
          padding: '24px 28px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 80, opacity: .1 }}>💰</div>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: .65, textTransform: 'uppercase',
            letterSpacing: '.08em', marginBottom: 12 }}>Revenue Today</div>
          <div style={{ fontSize: today.revenue > 0 ? 36 : 48, fontWeight: 800, fontFamily: 'var(--font-head)', lineHeight: 1 }}>
            {today.revenue > 0 ? `NPR ${today.revenue.toLocaleString()}` : '0'}
          </div>
          <div style={{ opacity: .7, fontSize: 13, marginTop: 8 }}>
            {today.revenue === 0 ? 'No payments today yet' : 'Collected today'}
          </div>
        </div>

        {/* Currently Rented Vehicles */}
        <div style={{ background: 'linear-gradient(135deg,#2DC653,#1a9e3f)', borderRadius: 16,
          padding: '24px 28px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 80, opacity: .1 }}>🛵</div>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: .65, textTransform: 'uppercase',
            letterSpacing: '.08em', marginBottom: 12 }}>Vehicles Currently Rented</div>
          <div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'var(--font-head)', lineHeight: 1 }}>
            {today.rentedVehicles}
          </div>
          <div style={{ opacity: .7, fontSize: 13, marginTop: 8 }}>
            out of {stats.totalVehicles} total vehicles
          </div>
        </div>

      </div>

      {/* All-time stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard icon="" label="Total Revenue"   value={`NPR ${Math.round(stats.totalRevenue/1000)}K`} color="#E63946" />
        <StatCard icon="" label="Total Bookings"  value={stats.totalBookings}  color="#457B9D" />
        <StatCard icon="" label="Total Users"     value={stats.totalUsers}     color="#2DC653" />
        <StatCard icon="" label="Total Vehicles"  value={stats.totalVehicles}  sub={`${stats.availableVehicles} available`} color="#F4A261" />
      </div>

      {/* Alert cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div style={{ background: stats.pendingBookings > 0 ? '#fffbeb' : '#f0fdf4',
          border: `2px solid ${stats.pendingBookings > 0 ? '#fcd34d' : '#86efac'}`,
          borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 36 }}>{stats.pendingBookings > 0 ? '⏳' : '✅'}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 26, color: 'var(--secondary)', fontFamily: 'var(--font-head)' }}>
              {stats.pendingBookings}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Bookings Awaiting Approval</div>
            {stats.pendingBookings > 0 && (
              <button onClick={() => navigate('/admin/bookings')}
                style={{ fontSize: 12, color: 'var(--primary)', background:'none', border:'none', cursor:'pointer', fontWeight:700, padding:0, marginTop:4 }}>
                Review now →
              </button>
            )}
          </div>
        </div>
        <div style={{ background: stats.pendingVerifications > 0 ? '#fff7ed' : '#f0fdf4',
          border: `2px solid ${stats.pendingVerifications > 0 ? '#fb923c' : '#86efac'}`,
          borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 36 }}>{stats.pendingVerifications > 0 ? '🪪' : '✅'}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 26, color: 'var(--secondary)', fontFamily: 'var(--font-head)' }}>
              {stats.pendingVerifications}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Verifications Pending</div>
            {stats.pendingVerifications > 0 && (
              <button onClick={() => navigate('/admin/verification')}
                style={{ fontSize: 12, color: 'var(--primary)', background:'none', border:'none', cursor:'pointer', fontWeight:700, padding:0, marginTop:4 }}>
                Review now →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Revenue bars */}
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:14, padding:24 }}>
          <h3 style={{ color:'var(--secondary)', fontSize:15, fontWeight:700, marginBottom:18 }}>📈 Monthly Revenue</h3>
          {monthlyRevenue.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 0', color:'var(--gray-500)', fontSize:13 }}>No revenue data yet.</div>
          ) : monthlyRevenue.map((m, i) => {
            const max = Math.max(...monthlyRevenue.map(x => parseFloat(x.revenue)));
            const pct = max > 0 ? (parseFloat(m.revenue) / max) * 100 : 0;
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:52, fontSize:11, color:'var(--gray-500)', fontWeight:600 }}>{m.mo}</div>
                <div style={{ flex:1, background:'var(--gray-100)', borderRadius:6, height:24, overflow:'hidden' }}>
                  <div style={{ width:`${Math.max(pct,8)}%`, height:'100%',
                    background:'linear-gradient(90deg,var(--primary),var(--accent))',
                    borderRadius:6, display:'flex', alignItems:'center', paddingLeft:8 }}>
                    <span style={{ fontSize:11, color:'#fff', fontWeight:700, whiteSpace:'nowrap' }}>
                      NPR {Math.round(parseFloat(m.revenue)/1000)}K
                    </span>
                  </div>
                </div>
                <div style={{ fontSize:11, color:'var(--gray-500)', width:36, textAlign:'right' }}>{m.transactions}bk</div>
              </div>
            );
          })}
        </div>

        {/* Status breakdown */}
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:14, padding:24 }}>
          <h3 style={{ color:'var(--secondary)', fontSize:15, fontWeight:700, marginBottom:18 }}>📋 Booking Breakdown</h3>
          {bookingsByStatus.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 0', color:'var(--gray-500)', fontSize:13 }}>No bookings yet.</div>
          ) : bookingsByStatus.map(b => {
            const total = bookingsByStatus.reduce((s,x) => s + parseInt(x.cnt), 0);
            const pct   = total > 0 ? Math.round((parseInt(b.cnt)/total)*100) : 0;
            const s     = statusColor[b.status] || { bg:'#f3f4f6', color:'#374151' };
            return (
              <div key={b.status} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ width:82, padding:'3px 8px', borderRadius:100, fontSize:11, fontWeight:700,
                  background:s.bg, color:s.color, textAlign:'center', textTransform:'capitalize', flexShrink:0 }}>
                  {b.status}
                </span>
                <div style={{ flex:1, background:'var(--gray-100)', borderRadius:6, height:22, overflow:'hidden' }}>
                  <div style={{ width:`${Math.max(pct,4)}%`, height:'100%', background:s.color, opacity:.65, borderRadius:6 }} />
                </div>
                <span style={{ fontSize:13, fontWeight:800, width:28, textAlign:'right' }}>{b.cnt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending bookings for approval */}
      {pendingList.length > 0 && (
        <div style={{ background:'#fff', border:'2px solid #fcd34d', borderRadius:14, padding:24, marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ color:'var(--secondary)', fontSize:15, fontWeight:700 }}>
              ⏳ Pending Approval ({pendingList.length})
            </h3>
            <Link to="/admin/bookings" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {pendingList.map(b => (
              <div key={b.id} style={{ display:'flex', alignItems:'center', gap:14,
                padding:'12px 16px', background:'#fffbeb', borderRadius:10,
                border:'1px solid #fde68a', flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--secondary)' }}>
                    #{b.id} — {b.brand} {b.model_name} 
                  </div>
                  <div style={{ fontSize:12, color:'var(--gray-500)', marginTop:3 }}>
                    👤 {b.first_name} {b.last_name} &nbsp;·&nbsp;
                    📅 {new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()} &nbsp;·&nbsp;
                    💰 NPR {parseFloat(b.total_price).toLocaleString()}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-success btn-sm" onClick={() => approveBooking(b.id)}>✅ Approve</button>
                  <button className="btn btn-danger btn-sm"  onClick={() => rejectBooking(b.id)}>❌ Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's bookings table */}
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:14, padding:24, marginBottom:20 }}>
        <h3 style={{ color:'var(--secondary)', fontSize:15, fontWeight:700, marginBottom:16 }}>
          📅 Today's Bookings ({today.trips})
        </h3>
        {today.bookingsList.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--gray-500)', fontSize:13 }}>No bookings today yet. ☕</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Customer</th><th>Vehicle</th><th>Amount</th><th>Status</th><th>Time</th></tr>
              </thead>
              <tbody>
                {today.bookingsList.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight:600 }}>#{b.id}</td>
                    <td>{b.first_name} {b.last_name}</td>
                    <td>{b.brand} {b.model_name}</td>
                    <td style={{ fontWeight:700, color:'var(--primary)' }}>NPR {parseFloat(b.total_price).toLocaleString()}</td>
                    
                    <td><Badge status={b.status} /></td>
                    <td style={{ fontSize:12, color:'var(--gray-500)' }}>{new Date(b.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick nav */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {[
          { to:'/admin/vehicles',     icon:'🛵', label:'Vehicles' },
          { to:'/admin/bookings',     icon:'📅', label:'All Bookings' },
          { to:'/admin/verification', icon:'🪪', label:'Verifications' },
          { to:'/admin/users',        icon:'👥', label:'Users' },
          { to:'/admin/reports',      icon:'📊', label:'Reports' },
        ].map(a => (
          <Link key={a.to} to={a.to} className="btn btn-ghost">{a.icon} {a.label}</Link>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
