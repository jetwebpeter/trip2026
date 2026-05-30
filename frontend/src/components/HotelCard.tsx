import React from 'react';
import { Star, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

interface Hotel {
  name: string;
  link: string;
  description: string;
  rate_per_night: {
    lowest: string;
    extracted_lowest: number;
    before_taxes_fees: string;
  };
  total_rate: {
    lowest: string;
    extracted_lowest: number;
    before_taxes_fees: string;
  };
  rating: number;
  reviews: number;
  thumbnail: string;
  amenities: string[];
}

const HotelCard: React.FC<{ hotel: Hotel }> = ({ hotel }) => {
  return (
    <div className="hotel-card">
      <div className="hotel-thumbnail-wrapper">
        <img 
          src={hotel.thumbnail} 
          alt={hotel.name} 
          className="hotel-thumbnail"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="hotel-rating-overlay">
          <Star size={14} className="fill-current text-yellow-400" />
          <span>{(hotel.rating || 0).toFixed(1)}</span>
        </div>
      </div>
      
      <div className="hotel-info">
        <div className="hotel-header-row">
          <h3 className="hotel-name">{hotel.name}</h3>
          <div className="hotel-price-group">
            <span className="hotel-price">{hotel.rate_per_night.lowest}</span>
            <span className="hotel-price-label">每晚</span>
          </div>
        </div>

        <div className="hotel-location">
          <MapPin size={14} />
          <span>{hotel.description.split(',')[0]}</span>
        </div>

        <div className="hotel-amenities-tags">
          {hotel.amenities?.slice(0, 3).map((amenity, idx) => (
            <span key={idx} className="amenity-tag">{amenity}</span>
          ))}
          {hotel.amenities?.length > 3 && (
            <span className="amenity-tag-more">+{hotel.amenities.length - 3}</span>
          )}
        </div>

        <div className="hotel-footer">
          <div className="hotel-reviews">
            <span className="review-count">{hotel.reviews.toLocaleString()} 則評論</span>
          </div>
          <a href={hotel.link} target="_blank" rel="noopener noreferrer" className="btn-hotel-link">
            <span>查看詳情</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
