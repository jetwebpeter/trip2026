import React, { useState } from 'react';
import { 
  Plane, Clock, Info, TreeDeciduous, ChevronDown, ChevronUp, 
  AlertTriangle, Wifi, Power, Tv, ShieldAlert, MonitorPlay 
} from 'lucide-react';

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
  extensions?: string[];
  often_delayed_by_over_30_min?: boolean;
  travel_class?: string;
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

const FlightCard: React.FC<{ 
  data: FlightData; 
  onSelect?: (data: FlightData) => void; 
  disabled?: boolean; 
  buttonText?: string; 
  hidePrice?: boolean; 
}> = ({ data, onSelect, disabled, buttonText = '選擇航班', hidePrice = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const segments = data.flights || [];
  const outbound = segments[0];
  const finalSegment = segments[segments.length - 1];

  const formatTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr.replace(' ', 'T'));
      return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return timeStr.split(' ')[1] || timeStr;
    }
  };

  const formatDate = (timeStr: string) => {
    try {
      const d = new Date(timeStr.replace(' ', 'T'));
      return d.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', weekday: 'short' });
    } catch {
      return timeStr.split(' ')[0] || '';
    }
  };

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}小時 ${m}分鐘`;
  };

  const getCityName = (code: string) => {
    const map: Record<string, string> = {
      'TPE': '台北(桃園)', 'TSA': '台北(松山)',
      'SIN': '新加坡(樟宜)', 'HKG': '香港(赤鱲角)',
      'MFM': '澳門(國際)', 'TYO': '東京(市區)',
      'NRT': '東京(成田)', 'HND': '東京(羽田)',
      'OSA': '大阪(市區)', 'KIX': '大阪(關西)',
      'ITM': '大阪(伊丹)', 'SEL': '首爾(市區)',
      'ICN': '首爾(仁川)', 'GMP': '首爾(金浦)',
      'BKK': '曼谷(素萬那普)', 'DMK': '曼谷(廊曼)',
      'DPS': '峇里島(伍拉·賴)', 'OKA': '沖繩(那霸)',
      'SGN': '胡志明(新山一)', 'PEK': '北京(首都)',
      'AUS': '奧斯汀(伯格史壯)',
    };
    return map[code] || code;
  };

  // Determine layovers
  const stopCount = segments.length - 1;
  const isDirect = stopCount === 0;

  // Compute intermediate airports
  const layoverAirports = segments.slice(0, -1).map(seg => seg.arrival_airport.id);

  // Parse warning checks (if any flight is often delayed)
  const isOftenDelayed = segments.some(seg => seg.often_delayed_by_over_30_min);

  // Compute layover time between two segments
  const calculateLayover = (arrTime: string, depTime: string) => {
    try {
      const arr = new Date(arrTime.replace(' ', 'T'));
      const dep = new Date(depTime.replace(' ', 'T'));
      const diffMs = dep.getTime() - arr.getTime();
      if (diffMs <= 0) return '';
      const diffMins = Math.floor(diffMs / 60000);
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      return `${h}小時 ${m}分鐘`;
    } catch {
      return '';
    }
  };

  return (
    <div className={`flight-card-container ${isExpanded ? 'expanded-card' : ''} bg-white border border-gray-200 rounded-2xl shadow-sm mb-4 transition-all duration-300 hover:shadow-md`}>
      <div className="flight-card">
        <div className="flight-card-body p-6 flex flex-col md:flex-row items-center gap-6">
          {/* Airline Logo & Name */}
          <div className="airline-info flex items-center gap-3 w-full md:w-[180px] shrink-0">
            <img 
              src={data.airline_logo || outbound.airline_logo} 
              alt={outbound.airline} 
              className="airline-logo w-10 h-10 object-contain rounded-md" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://www.gstatic.com/flights/airline_logos/70px/${outbound.airline.substring(0, 2).toUpperCase()}.png`;
              }}
            />
            <div className="airline-name-group">
              <span className="airline-name font-bold text-gray-800 text-sm block">{outbound.airline}</span>
              <span className="flight-number text-xs text-gray-400 block">
                {segments.map(seg => seg.flight_number).join(' + ')}
              </span>
            </div>
          </div>

          {/* Time & Stops Line */}
          <div className="flight-timeline flex items-center justify-between gap-6 w-full flex-1">
            {/* Departure */}
            <div className="time-point text-left">
              <div className="time text-2xl font-extrabold text-blue-900 leading-tight">
                {formatTime(outbound.departure_airport.time)}
              </div>
              <div className="airport-code font-bold text-gray-700 text-sm mt-0.5">
                {outbound.departure_airport.id}
              </div>
              <div className="airport-name text-xs text-gray-400 font-medium">
                {getCityName(outbound.departure_airport.id)}
              </div>
            </div>
            
            {/* Duration and Stops line */}
            <div className="duration-path flex-1 flex flex-col items-center gap-1.5 px-4 text-center">
              <span className="duration-text text-xs text-gray-500 font-semibold">{formatDuration(data.total_duration)}</span>
              <div className="path-line w-full flex items-center gap-1.5">
                <div className="dot start w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <div className="line flex-1 h-[2px] bg-gray-200 relative">
                  {/* Visual layover dots */}
                  {segments.length > 1 && segments.slice(0, -1).map((_, idx) => (
                    <div 
                      key={idx}
                      className="layover-mark-dot absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500 border-2 border-white"
                      style={{ left: `${((idx + 1) / segments.length) * 100}%` }}
                      title={`轉機於 ${segments[idx].arrival_airport.id}`}
                    />
                  ))}
                </div>
                <Plane className="plane-icon text-blue-600 transform rotate-90" size={14} />
                <div className="dot end w-1.5 h-1.5 rounded-full bg-gray-400"></div>
              </div>
              
              <span className={`stops-text text-xs font-bold px-2 py-0.5 rounded-full ${isDirect ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}>
                {isDirect ? '直飛' : `轉機 ${stopCount} 次 (${layoverAirports.join(', ')})`}
              </span>
            </div>

            {/* Arrival */}
            <div className="time-point text-right">
              <div className="time text-2xl font-extrabold text-blue-900 leading-tight">
                {formatTime(finalSegment.arrival_airport.time)}
              </div>
              <div className="airport-code font-bold text-gray-700 text-sm mt-0.5">
                {finalSegment.arrival_airport.id}
              </div>
              <div className="airport-name text-xs text-gray-400 font-medium">
                {getCityName(finalSegment.arrival_airport.id)}
              </div>
            </div>
          </div>

          {/* Badges / Extras */}
          <div className="flight-quick-details hidden lg:flex flex-col gap-1.5 items-end justify-center w-[160px] shrink-0 text-right">
            <span className="text-xs text-gray-500 font-medium">{outbound.airplane}</span>
            {data.carbon_emissions && (
              <span className={`detail-item carbon text-xs font-semibold flex items-center gap-1 ${data.carbon_emissions.difference_percent < 0 ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded' : 'text-gray-400'}`}>
                <TreeDeciduous size={12} />
                {data.carbon_emissions.difference_percent < 0 
                  ? `碳排放減 ${Math.abs(data.carbon_emissions.difference_percent)}%`
                  : `${Math.round(data.carbon_emissions.this_flight / 1000)}kg 碳`}
              </span>
            )}
            {isOftenDelayed && (
              <span className="warning-pill bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 border border-red-100">
                <ShieldAlert size={10} /> 常有延誤
              </span>
            )}
          </div>
        </div>

        {/* Flight Action panel */}
        <div className="flight-card-action p-6 border-t md:border-t-0 md:border-l border-dashed border-gray-200 w-full md:w-[200px] shrink-0 flex flex-col justify-center items-center bg-gray-50/50">
          {!hidePrice && (
            <div className="price-tag text-center mb-3">
              <span className="currency text-[10px] text-gray-400 font-bold block uppercase tracking-wide">TWD 總金額起</span>
              <span className="amount text-3xl font-extrabold text-blue-900 leading-none">
                {data.price ? data.price.toLocaleString() : '---'}
              </span>
            </div>
          )}
          <button 
            className="btn-select w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm transition-all duration-200" 
            onClick={() => onSelect && onSelect(data)}
            disabled={disabled}
            style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {disabled && buttonText === '選擇航班' ? '不可選擇' : buttonText}
          </button>
          
          <button 
            type="button"
            className="toggle-expander-btn text-xs text-blue-600 font-bold mt-2.5 flex items-center gap-0.5 hover:underline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            航班詳情
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Expanded Accordion Panel: 航班詳情 details timeline */}
      {isExpanded && (
        <div className="flight-expanded-details-timeline p-6 border-t border-gray-100 bg-gray-50/30 animate-fade-in rounded-b-2xl">
          <h4 className="font-bold text-gray-700 text-sm mb-4 border-b border-gray-100 pb-2">航段詳細資訊 (Flight Details Timeline)</h4>
          
          <div className="vertical-timeline pl-4 relative border-l-2 border-blue-100 ml-2 space-y-8">
            {segments.map((seg, idx) => {
              const showLayover = idx < stopCount;
              return (
                <div key={idx} className="timeline-segment-card relative">
                  {/* Timeline point indicator */}
                  <div className="absolute -left-[25px] top-1 bg-blue-700 w-4 h-4 rounded-full border-4 border-white shadow-sm flex items-center justify-center"></div>

                  <div className="segment-card bg-white p-4 rounded-xl border border-gray-150 shadow-sm ml-2">
                    {/* Header: Date and Airport code */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        航段 {idx + 1} · {formatDate(seg.departure_airport.time)}
                      </span>
                      <span className="text-xs font-extrabold text-blue-700">
                        {seg.departure_airport.id} ✈ {seg.arrival_airport.id}
                      </span>
                    </div>

                    {/* Timeline row info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">出發時間與航站</div>
                        <div className="text-base font-bold text-gray-800 mt-0.5">{formatTime(seg.departure_airport.time)}</div>
                        <div className="text-xs text-gray-500 font-medium">{seg.departure_airport.name}</div>
                      </div>
                      
                      <div className="flex flex-col items-center text-center justify-center border-t border-b border-dashed border-gray-100 py-2 md:border-none md:py-0">
                        <Plane size={14} className="text-gray-400 mb-0.5" />
                        <span className="text-xs font-bold text-gray-600">{seg.airline} {seg.flight_number}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">{formatDuration(seg.duration)}</span>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">抵達時間與航站</div>
                        <div className="text-base font-bold text-gray-800 mt-0.5">{formatTime(seg.arrival_airport.time)}</div>
                        <div className="text-xs text-gray-500 font-medium">{seg.arrival_airport.name}</div>
                      </div>
                    </div>

                    {/* Flight Specs & Extras */}
                    <div className="segment-specs-row flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <span className="font-semibold bg-blue-50/50 text-blue-800 px-2 py-1 rounded">{seg.airplane}</span>
                      <span className="font-semibold bg-gray-50 text-gray-600 px-2 py-1 rounded">艙等: {seg.travel_class === 'Economy' ? '經濟艙' : seg.travel_class}</span>
                      {seg.legroom && <span className="font-semibold bg-gray-50 text-gray-600 px-2 py-1 rounded">椅距: {seg.legroom}</span>}
                    </div>

                    {/* Segments extensions listed as amenities */}
                    {seg.extensions && seg.extensions.length > 0 && (
                      <div className="amenities-tags-grid flex flex-wrap gap-1.5 mt-2.5">
                        {seg.extensions.map((ext, extIdx) => {
                          let extIcon = <Info size={10} />;
                          if (ext.toLowerCase().includes('wi-fi') || ext.toLowerCase().includes('wifi')) extIcon = <Wifi size={10} />;
                          if (ext.toLowerCase().includes('power') || ext.toLowerCase().includes('outlet') || ext.toLowerCase().includes('usb')) extIcon = <Power size={10} />;
                          if (ext.toLowerCase().includes('video') || ext.toLowerCase().includes('screen') || ext.toLowerCase().includes('on-demand')) extIcon = <Tv size={10} />;
                          
                          return (
                            <span key={extIdx} className="amenity-tag bg-gray-100/70 hover:bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-gray-200/50">
                              {extIcon} {ext}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Segment level delay alert */}
                    {seg.often_delayed_by_over_30_min && (
                      <div className="segment-alert bg-red-50/70 text-red-700 text-xs px-3 py-2 rounded-lg mt-3 flex items-center gap-1.5 border border-red-100">
                        <AlertTriangle size={14} className="shrink-0 animate-pulse" />
                        <span className="font-semibold">注意：該航段班機經常延誤 30 分鐘以上，敬請保留足夠的轉機時間。</span>
                      </div>
                    )}
                  </div>

                  {/* Layover block between segments */}
                  {showLayover && (
                    <div className="layover-block ml-8 my-4 relative animate-fade-in">
                      <div className="absolute -left-[35px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center">
                        <Clock size={10} className="text-orange-600" />
                      </div>
                      <div className="layover-content inline-flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-full px-4 py-1.5 text-xs text-orange-800 font-bold shadow-sm">
                        <span>轉機於 {getCityName(seg.arrival_airport.id)} ({seg.arrival_airport.id})</span>
                        <span className="text-orange-400">·</span>
                        <span>等待時間 {calculateLayover(seg.arrival_airport.time, segments[idx + 1].departure_airport.time)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightCard;
