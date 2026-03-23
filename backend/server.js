require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app = express();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Middleware ────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (vehicle images, identity docs)
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static(uploadsDir));

// ── Routes ────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/vehicles',      require('./routes/vehicles'));
app.use('/api/bookings',      require('./routes/bookings'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/verification',  require('./routes/verification'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/reviews',       require('./routes/reviews'));

// ── Health check ──────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', service: 'Rento API', timestamp: new Date().toISOString() })
);

// ── 404 handler ───────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` })
);

// ── Global error handler ──────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`\n🛵  Rento API running on http://localhost:${PORT}\n`)
);
