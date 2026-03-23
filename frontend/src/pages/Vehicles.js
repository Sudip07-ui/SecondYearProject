import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../utils/api';
import VehicleCard from '../components/common/VehicleCard';
import './Vehicles.css';

const Vehicles = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filters,  setFilters]  = useState({
    search:       searchParams.get('search') || '',
    type:         '',
    fuel_type:    '',
    transmission: '',
    min_price:    '',
    max_price:    '',
  });

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const { data } = await API.get(`/vehicles?${params}`);
      setVehicles(data.vehicles || []);
    } catch { setVehicles([]); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const clearFilters = () => setFilters({ search:'',type:'',fuel_type:'',transmission:'',min_price:'',max_price:'' });

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="vehicles-page container">
      <div className="vehicles-layout">
        {/* Sidebar Filters */}
        <aside className="filter-sidebar">
          <div className="filter-header">
            <h3>Filters {activeCount > 0 && <span className="filter-count">{activeCount}</span>}</h3>
            {activeCount > 0 && <button onClick={clearFilters} className="clear-btn">Clear all</button>}
          </div>

          <div className="filter-section">
            <label className="filter-label">Search</label>
            <input className="form-control" placeholder="Model or brand..." value={filters.search}
              onChange={e => handleFilter('search', e.target.value)} />
          </div>

          <div className="filter-section">
            <label className="filter-label">Vehicle Type</label>
            {['', 'bike', 'scooter', 'car'].map(t => (
              <label key={t} className="radio-option">
                <input type="radio" name="type" value={t} checked={filters.type === t} onChange={() => handleFilter('type', t)} />
                <span>{t === '' ? 'All Types' : t === 'bike' ? ' Bike' : t === 'scooter' ? ' Scooter' : ' Car'}</span>
              </label>
            ))}
          </div>

          <div className="filter-section">
            <label className="filter-label">Fuel Type</label>
            {['', 'petrol', 'electric', 'diesel'].map(f => (
              <label key={f} className="radio-option">
                <input type="radio" name="fuel_type" value={f} checked={filters.fuel_type === f} onChange={() => handleFilter('fuel_type', f)} />
                <span>{f === '' ? 'All' : f === 'petrol' ? ' Petrol' : f === 'electric' ? ' Electric' : ' Diesel'}</span>
              </label>
            ))}
          </div>

          <div className="filter-section">
            <label className="filter-label">Transmission</label>
            {['', 'manual', 'automatic'].map(t => (
              <label key={t} className="radio-option">
                <input type="radio" name="transmission" value={t} checked={filters.transmission === t} onChange={() => handleFilter('transmission', t)} />
                <span>{t === '' ? 'All' : t === 'manual' ? ' Manual' : ' Automatic'}</span>
              </label>
            ))}
          </div>

          <div className="filter-section">
            <label className="filter-label">Price Range (NPR/day)</label>
            <div className="price-inputs">
              <input className="form-control" type="number" placeholder="Min" value={filters.min_price}
                onChange={e => handleFilter('min_price', e.target.value)} />
              <span>–</span>
              <input className="form-control" type="number" placeholder="Max" value={filters.max_price}
                onChange={e => handleFilter('max_price', e.target.value)} />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="vehicles-main">
          <div className="vehicles-top">
            <div>
              <h1 className="page-title">Available Vehicles</h1>
              <p style={{color:'var(--gray-500)',fontSize:'14px',marginTop:'4px'}}>
                {loading ? 'Loading...' : `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <h3>No vehicles found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className="btn btn-primary" style={{marginTop:'16px'}}>Clear Filters</button>
            </div>
          ) : (
            <div className="grid-3">
              {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Vehicles;
