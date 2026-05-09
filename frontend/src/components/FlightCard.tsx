import React from 'react';
import { Plane, Clock, Info, TreeDeciduous } from 'lucide-react';

interface Flight {
  departure_airport: {
    name: string;
    id: string;
    time: string;
  };
  arrival_airport: {
    name: string;
    id: string;
    time: string;
  };
  duration: number;
  airplane: string;
  airline: string;
  airline_logo: string;
  flight_number: string;
  legroom?: string;
}

interface CarbonEmissions {
  this_flight: number;
  typical_for_this_route: number;
  difference_percent: number;
}

interface FlightData {
  flights: Flight[];
  total_duration: number;
  price: number;
  airline_logo: string;
  carbon_emissions?: CarbonEmissions;
}

const FlightCard: React.FC<{ data: FlightData, onSelect?: (data: FlightData) => void, disabled?: boolean, buttonText?: string, hidePrice?: boolean }> = ({ data, onSelect, disabled, buttonText = '選擇航班', hidePrice = false }) => {
  const outbound = data.flights[0];
  const formatTime = (timeStr: string) => {
    const d = new Date(timeStr);
    return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  };

  const getCityName = (code: string) => {
    const map: Record<string, string> = {
      'TPE': '台北(桃園)',
      'TSA': '台北(松山)',
      'SIN': '新加坡(樟宜)',
      'HKG': '香港(赤鱲角)',
      'MFM': '澳門(國際)',
      'TYO': '東京(市區)',
      'NRT': '東京(成田)',
      'HND': '東京(羽田)',
      'OSA': '大阪(市區)',
      'KIX': '大阪(關西)',
      'ITM': '大阪(伊丹)',
      'SEL': '首爾(市區)',
      'ICN': '首爾(仁川)',
      'GMP': '首爾(金浦)',
      'BKK': '曼谷(素萬那普)',
      'DMK': '曼谷(廊曼)',
      'DPS': '峇里島(伍拉·賴)',
      'OKA': '沖繩(那霸)',
      'SGN': '胡志明(新山一)',
    };
    return map[code] || code;
  };

  return (
    <div className="flight-card">
      <div className="flight-card-body">
        <div className="airline-info">
          <img 
            src={data.airline_logo} 
            alt={outbound.airline} 
            className="airline-logo" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://www.gstatic.com/flights/airline_logos/70px/${outbound.airline.substring(0, 2).toUpperCase()}.png`;
            }}
          />
          <div className="airline-name-group">
            <span className="airline-name">{outbound.airline}</span>
            <span className="flight-number">{outbound.flight_number}</span>
          </div>
        </div>

        <div className="flight-timeline">
          <div className="time-point">
            <div className="time">{formatTime(outbound.departure_airport.time)}</div>
            <div className="airport-code">{getCityName(outbound.departure_airport.id)}</div>
          </div>
          
          <div className="duration-path">
            <span className="duration-text">{formatDuration(data.total_duration)}</span>
            <div className="path-line">
              <div className="dot start"></div>
              <div className="line"></div>
              <Plane className="plane-icon" size={14} />
              <div className="dot end"></div>
            </div>
            <span className="stops-text">直飛</span>
          </div>

          <div className="time-point">
            <div className="time">{formatTime(outbound.arrival_airport.time)}</div>
            <div className="airport-code">{getCityName(outbound.arrival_airport.id)}</div>
          </div>
        </div>

        <div className="flight-details">
          <div className="detail-item">
            <Clock size={14} />
            <span>{outbound.airplane}</span>
          </div>
          {data.carbon_emissions && (
            <div className={`detail-item carbon ${data.carbon_emissions.difference_percent < 0 ? 'good' : ''}`}>
              <TreeDeciduous size={14} />
              <span>
                {data.carbon_emissions.difference_percent < 0 
                  ? `排放量比平常少 ${Math.abs(data.carbon_emissions.difference_percent)}%`
                  : `碳排放量: ${Math.round(data.carbon_emissions.this_flight / 1000)}kg`}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flight-card-action">
        {!hidePrice && (
          <div className="price-tag">
            <span className="currency">TWD</span>
            <span className="amount">{data.price ? data.price.toLocaleString() : '---'}</span>
          </div>
        )}
        <button 
          className="btn-select" 
          onClick={() => onSelect && onSelect(data)}
          disabled={disabled}
          style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          {disabled && buttonText === '選擇航班' ? '不可選擇' : buttonText}
        </button>
      </div>
    </div>
  );
};

export default FlightCard;
