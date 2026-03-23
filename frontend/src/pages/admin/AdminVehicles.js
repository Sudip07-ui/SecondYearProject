import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const EMPTY = {
  model_name:'', brand:'', type:'bike', fuel_type:'petrol',
  transmission:'manual', price_per_day:'', registration_number:'',
  year_manufactured:'', color:'', description:'',

};

const statusColor = { available:'#dcfce7', rented:'#fef9c3', maintenance:'#fee2e2' };

function AdminVehicles() {
  const [vehicles,  setVehicles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [imgFile,   setImgFile]   = useState(null);
  const [imgPreview,setImgPreview]= useState(null);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');

  function load() {
    setLoading(true);
    API.get('/vehicles?all=1')
      .then(r => setVehicles(r.data.vehicles || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm(EMPTY); setEditing(null);
    setImgFile(null); setImgPreview(null);
    setModal(true);
  }

  function openEdit(v) {
    setForm({ ...v, year_manufactured: v.year_manufactured || '' });
    setEditing(v.id);
    setImgFile(null);
    setImgPreview(v.image_url || null);
    setModal(true);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let image_url = form.image_url || null;

      // Upload image if a new file was selected
      if (imgFile) {
        try {
          const fd = new FormData();
          fd.append('vehicle_image', imgFile);
          const { data } = await API.post('/admin/upload-vehicle-image', fd);
          image_url = `http://localhost:5001${data.image_url}`;
        } catch (uploadErr) {
          toast.error('Image upload failed. Saving without image.');
          image_url = null;
        }
      }

      const payload = {
        model_name:           form.model_name,
        brand:                form.brand,
        type:                 form.type,
        fuel_type:            form.fuel_type,
        transmission:         form.transmission,
        price_per_day:        form.price_per_day,
        registration_number:  form.registration_number,
        year_manufactured:    form.year_manufactured || null,
        color:                form.color || null,
        description:          form.description || null,
        status:               form.status || 'available',
        image_url,
      };

      if (editing) {
        await API.put(`/vehicles/${editing}`, payload);
        toast.success('Vehicle updated!');
      } else {
        await API.post('/vehicles', payload);
        toast.success('Vehicle added successfully!');
      }
      setModal(false);
      load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Save failed. Check all required fields.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      await API.delete(`/vehicles/${id}`);
      toast.success('Vehicle deleted.'); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed.'); }
  }

  const filtered = vehicles.filter(v =>
    `${v.brand} ${v.model_name} ${v.registration_number}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px 0 64px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 className="page-title">🛵 Vehicle Management</h1>
          <p style={{ color:'var(--gray-500)', fontSize:14, marginTop:4 }}>Add, edit and manage vehicle inventory</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Vehicle</button>
      </div>

      <div style={{ marginBottom:16 }}>
        <input className="form-control" style={{ maxWidth:320 }}
          placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--gray-500)' }}>Loading...</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Vehicle</th><th>Type</th><th>Fuel</th><th>Gear</th><th>Price/Day</th><th>Reg No</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <img src={v.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=100'}
                          alt={v.model_name}
                          style={{ width:56, height:42, objectFit:'cover', borderRadius:6 }}
                          onError={e => { e.target.src='https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=100'; }} />
                        <div>
                          <div style={{ fontWeight:600 }}>{v.brand} {v.model_name}</div>
                          <div style={{ fontSize:12, color:'var(--gray-500)' }}>{v.year_manufactured} · {v.color}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textTransform:'capitalize' }}>{v.type}</td>
                    <td style={{ textTransform:'capitalize' }}>{v.fuel_type}</td>
                    <td style={{ textTransform:'capitalize' }}>{v.transmission}</td>
                    <td style={{ fontWeight:700, color:'var(--primary)' }}>NPR {parseFloat(v.price_per_day).toLocaleString()}</td>
                    <td style={{ fontSize:13 }}>{v.registration_number}</td>
                    <td>
                      <span style={{ padding:'3px 10px', borderRadius:100, fontSize:12, fontWeight:600,
                        background: statusColor[v.status]||'#f0f0f0', textTransform:'capitalize', display:'inline-block' }}>
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(v)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--gray-500)' }}>No vehicles found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:2000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:'100%',
            maxWidth:640, maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:22 }}>
              <h2 style={{ color:'var(--secondary)', fontSize:20 }}>{editing ? '✏️ Edit Vehicle' : '➕ Add New Vehicle'}</h2>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'var(--gray-500)' }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Image Upload */}
              <div className="form-group">
                <label className="form-label">Vehicle Photo</label>
                <label style={{ display:'block', cursor:'pointer' }}>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display:'none' }} />
                  {imgPreview ? (
                    <div style={{ position:'relative', display:'inline-block' }}>
                      <img src={imgPreview} alt="preview"
                        style={{ width:'100%', height:160, objectFit:'cover', borderRadius:10,
                          border:'2px solid var(--success)' }} />
                      <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,.6)',
                        color:'#fff', padding:'4px 10px', borderRadius:6, fontSize:12, fontWeight:600 }}>
                        Click to change
                      </div>
                    </div>
                  ) : (
                    <div style={{ border:'2px dashed var(--border)', borderRadius:10, padding:'28px 20px',
                      textAlign:'center', background:'var(--gray-100)' }}>
                      <div style={{ fontSize:36, marginBottom:8 }}></div>
                      <div style={{ fontWeight:600, color:'var(--gray-700)', fontSize:14 }}>Click to upload vehicle photo</div>
                      <div style={{ fontSize:12, color:'var(--gray-500)', marginTop:4 }}>JPG, PNG · Max 5MB</div>
                    </div>
                  )}
                </label>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Brand *</label>
                  <input name="brand" className="form-control" value={form.brand} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Model Name *</label>
                  <input name="model_name" className="form-control" value={form.model_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select name="type" className="form-control" value={form.type} onChange={handleChange}>
                    <option value="bike"> Bike</option>
                    <option value="scooter"> Scooter</option>
                    <option value="car"> Car</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fuel Type</label>
                  <select name="fuel_type" className="form-control" value={form.fuel_type} onChange={handleChange}>
                    <option value="petrol"> Petrol</option>
                    <option value="electric"> Electric</option>
                    <option value="diesel"> Diesel</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Transmission</label>
                  <select name="transmission" className="form-control" value={form.transmission} onChange={handleChange}>
                    <option value="manual"> Manual</option>
                    <option value="automatic"> Automatic</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price per Day (NPR) *</label>
                  <input name="price_per_day" type="number" className="form-control" value={form.price_per_day} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Registration No. *</label>
                  <input name="registration_number" className="form-control" value={form.registration_number} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input name="year_manufactured" type="number" className="form-control" placeholder="2022" value={form.year_manufactured} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input name="color" className="form-control" placeholder="Black" value={form.color} onChange={handleChange} />
                </div>
                {editing && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                      <option value="available">Available</option>
                      <option value="rented">Rented</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea name="description" className="form-control" rows={2} value={form.description} onChange={handleChange} />
              </div>

              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex:1 }} disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving...</> : editing ? '💾 Update Vehicle' : '➕ Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVehicles;
