import React from 'react';
import { Link } from 'react-router-dom';
import './VehicleCard.css';

const typeIcon  = { bike: '', scooter: '', car: '' };
const fuelIcon  = { petrol: '', electric: '', diesel: '' };

const VehicleCard = ({ vehicle }) => {
  const { id, model_name, brand, type, fuel_type, transmission, price_per_day, status, color, image_url, year_manufactured } = vehicle;

  return (
    <div className="vehicle-card">
      <div className="vehicle-img-wrap">
        <img
          src={image_url || `https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop`}
          alt={`${brand} ${model_name}`}
          className="vehicle-img"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=600&auto=format&fit=crop'; }}
        />
        <span className={`status-pill ${status}`}>{status}</span>
        <span className="type-pill">{typeIcon[type]} {type}</span>
      </div>
      <div className="vehicle-info">
        <div className="vehicle-meta">
          <span className="vehicle-year">{year_manufactured}</span>
          <span className="vehicle-color"> {color}</span>
        </div>
        <h3 className="vehicle-name">{brand} {model_name}</h3>
        <div className="vehicle-specs">
          <span>{fuelIcon[fuel_type]} {fuel_type}</span>
          <span>⚙️ {transmission}</span>
        </div>
        <div className="vehicle-footer">
          <div className="vehicle-price">
            <span className="price-amount">NPR {parseFloat(price_per_day).toLocaleString()}</span>
            <span className="price-unit">/day</span>
          </div>
          <Link to={`/vehicles/${id}`} className="btn btn-primary btn-sm">
            {status === 'available' ? 'Book Now' : 'View Details'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
