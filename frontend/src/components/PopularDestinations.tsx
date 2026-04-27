import React, { useState, useEffect } from 'react';
import { MapPin, Plane, Hotel, ChevronRight, Loader2, Calendar, Clock } from 'lucide-react';

interface Destination {
  name: string;
  country: string;
  link: string;
  flight_price: number;
  hotel_price: number;
  thumbnail: string;
  start_date: string;
  end_date: string;
  flight_duration: number;
}

const PopularDestinations: React.FC<{ region?: string }> = ({ region }) => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  const formatPrice = (p: number) => `NT$ ${p.toLocaleString()}`;
  
  // Format dates like "5/29 - 6/4"
  const formatDateRange = (start: string, end: string) => {
    if (!start || !end) return '';
    const d1 = new Date(start);
    const d2 = new Date(end);
    return `${d1.getMonth() + 1}/${d1.getDate()} - ${d2.getMonth() + 1}/${d2.getDate()}`;
  };

  const formatDuration = (mins: number) => {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  useEffect(() => {
    const fetchDestinations = async () => {
      setLoading(true);
      try {
        const query = region ? region : '';
        const response = await fetch(`/api/destinations?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setDestinations(data.destinations || []);
      } catch (error) {
        console.error('Failed to fetch destinations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, [region]);

  if (loading) return (
    <div className="destinations-loading">
      <Loader2 className="animate-spin" />
      <span>搜尋熱門景點...</span>
    </div>
  );

  if (destinations.length === 0) return null;

  return (
    <div className="popular-destinations-section">
      <div className="section-header">
        <h2 className="section-title">熱門旅遊目的地</h2>
        <p className="section-subtitle">由台北 (TPE) 出發的熱門探索建議</p>
      </div>

      <div className="destinations-scroll-container">
        {destinations.slice(0, 10).map((dest, idx) => (
          <a key={idx} href={dest.link} target="_blank" rel="noopener noreferrer" className="destination-card-mini" style={{ paddingBottom: '12px' }}>
            <div className="dest-thumb-wrapper">
              <img src={dest.thumbnail} alt={dest.name} className="dest-thumb" />
              <div className="dest-price-overlay">
                {dest.flight_price && (
                  <div className="mini-price-item">
                    <Plane size={10} />
                    <span>{formatPrice(dest.flight_price)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="dest-mini-info">
              <h3 className="dest-title">{dest.name}</h3>
              <p className="dest-desc">{dest.country}</p>
              
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                {dest.start_date && dest.end_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    <span>{formatDateRange(dest.start_date, dest.end_date)}</span>
                  </div>
                )}
                {dest.flight_duration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>航程 {formatDuration(dest.flight_duration)}</span>
                  </div>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default PopularDestinations;
