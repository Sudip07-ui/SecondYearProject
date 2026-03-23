const router    = require('express').Router();
const db        = require('../config/db');
const { protect, staffOnly } = require('../middleware/auth');

// ── GET /api/vehicles ──────────────────────────────
// REQ-2.1, REQ-2.2, REQ-2.3: browse, filter, search
router.get('/', async (req, res) => {
  const { type, fuel_type, transmission, min_price, max_price, search, status, all } = req.query;
  let query = 'SELECT * FROM vehicles WHERE 1=1';
  const p = [];

  if (!all) { query += ' AND status = "available"'; }
  else if (status) { query += ' AND status = ?'; p.push(status); }

  if (type)         { query += ' AND type = ?';                        p.push(type); }
  if (fuel_type)    { query += ' AND fuel_type = ?';                   p.push(fuel_type); }
  if (transmission) { query += ' AND transmission = ?';                p.push(transmission); }
  if (min_price)    { query += ' AND price_per_day >= ?';              p.push(min_price); }
  if (max_price)    { query += ' AND price_per_day <= ?';              p.push(max_price); }
  if (search)       { query += ' AND (model_name LIKE ? OR brand LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }

  query += ' ORDER BY created_at DESC';

  try {
    const [vehicles] = await db.query(query, p);
    res.json({ success: true, count: vehicles.length, vehicles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/vehicles/:id ─────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    res.json({ success: true, vehicle: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── GET /api/vehicles/:id/availability ───────────
// REQ-3.2: real-time availability check
router.get('/:id/availability', async (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date)
    return res.status(400).json({ success: false, message: 'start_date and end_date required.' });
  try {
    const [conflicts] = await db.query(
      `SELECT id FROM bookings
       WHERE vehicle_id = ? AND status NOT IN ('cancelled')
       AND NOT (end_date < ? OR start_date > ?)`,
      [req.params.id, start_date, end_date]
    );
    res.json({ success: true, available: conflicts.length === 0 });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── POST /api/vehicles ─── REQ-6.1 (Admin CRUD) ──
router.post('/', staffOnly, async (req, res) => {
  const { model_name, brand, type, fuel_type, transmission, price_per_day,
          registration_number, year_manufactured, color, description, image_url } = req.body;

  if (!model_name || !brand || !type || !price_per_day || !registration_number)
    return res.status(400).json({ success: false, message: 'Required fields: model name, brand, type, price, registration number.' });

  // Safely parse year - MySQL YEAR type rejects empty strings
  const yearVal = year_manufactured && year_manufactured !== '' ? parseInt(year_manufactured) : null;

  try {
    const [r] = await db.query(
      `INSERT INTO vehicles
        (model_name, brand, type, fuel_type, transmission, price_per_day,
         registration_number, year_manufactured, color, description, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        model_name.trim(),
        brand.trim(),
        type,
        fuel_type || 'petrol',
        transmission || 'manual',
        parseFloat(price_per_day),
        registration_number.trim(),
        yearVal,
        color || null,
        description || null,
        image_url || null
      ]
    );
    res.status(201).json({ success: true, message: 'Vehicle added successfully.', id: r.insertId });
  } catch (err) {
    console.error('Add vehicle error:', err.message);
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: 'Registration number already exists.' });
    res.status(500).json({ success: false, message: `Database error: ${err.message}` });
  }
});

// ── PUT /api/vehicles/:id ─────────────────────────
router.put('/:id', staffOnly, async (req, res) => {
  const { model_name, brand, type, fuel_type, transmission, price_per_day,
          status, year_manufactured, color, description, image_url } = req.body;

  const yearVal = year_manufactured && year_manufactured !== '' ? parseInt(year_manufactured) : null;

  try {
    await db.query(
      `UPDATE vehicles SET model_name=?, brand=?, type=?, fuel_type=?, transmission=?,
        price_per_day=?, status=?, year_manufactured=?, color=?, description=?, image_url=?
       WHERE id=?`,
      [
        model_name, brand, type, fuel_type, transmission,
        parseFloat(price_per_day),
        status || 'available',
        yearVal,
        color || null,
        description || null,
        image_url || null,
        req.params.id
      ]
    );
    res.json({ success: true, message: 'Vehicle updated.' });
  } catch (err) {
    console.error('Update vehicle error:', err.message);
    res.status(500).json({ success: false, message: `Database error: ${err.message}` });
  }
});

// ── DELETE /api/vehicles/:id ──────────────────────
router.delete('/:id', staffOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Vehicle deleted.' });
  } catch { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
