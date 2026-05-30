import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Calendar, Users, Loader2, AlertCircle, Plane, Globe,
  ChevronDown, ArrowUpDown, Plus, Minus, Info, SlidersHorizontal, Check, RefreshCw 
} from 'lucide-react';
import FlightCard from './FlightCard';

const popularAirports = [
  { city: '台北 (桃園) / Taipei (TPE)', code: 'TPE', name: '桃園國際機場 / Taoyuan Airport', type: 'airport' },
  { city: '新加坡 / Singapore (SIN)', code: 'SIN', name: '樟宜國際機場 / Changi Airport', type: 'airport' },
  { city: '東京 (成田) / Tokyo (NRT)', code: 'NRT', name: '成田國際機場 / Narita Airport', type: 'airport' },
  { city: '東京 (羽田) / Tokyo (HND)', code: 'HND', name: '羽田國際機場 / Haneda Airport', type: 'airport' },
  { city: '香港 / Hong Kong (HKG)', code: 'HKG', name: '香港國際機場 / Hong Kong Airport', type: 'airport' },
  { city: '首爾 (仁川) / Seoul (ICN)', code: 'ICN', name: '仁川國際機場 / Incheon Airport', type: 'airport' },
  { city: '曼谷 / Bangkok (BKK)', code: 'BKK', name: '素萬那普機場 / Suvarnabhumi Airport', type: 'airport' },
  { city: '大阪 (關西) / Osaka (KIX)', code: 'KIX', name: '關西國際機場 / Kansai Airport', type: 'airport' },
];

const FlightSearch: React.FC = () => {
  const getTodayPlus = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const defaultOutbound = getTodayPlus(3);
  const defaultReturn = (() => {
    const d = new Date(defaultOutbound);
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  })();

  // Enhanced search configurations
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>('round-trip');
  const [cabinClass, setCabinClass] = useState<'1' | '2' | '3' | '4'>('1'); // 1: Economy, 2: Premium Econ, 3: Business, 4: First
  const [passengers, setPassengers] = useState({
    adults: 1,
    children: 0,
    infants_in_seat: 0,
    infants_on_lap: 0,
  });

  const [searchParams, setSearchParams] = useState({
    departure_id: 'TPE',
    arrival_id: 'SIN',
    outbound_date: defaultOutbound,
    return_date: defaultReturn,
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReturnSearch, setIsReturnSearch] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState<string | null>(null);
  const [selectedOutbound, setSelectedOutbound] = useState<any>(null);
  const [outboundDateStr, setOutboundDateStr] = useState<string>('');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState<'price_asc' | 'duration_asc'>('price_asc');
  const [stopsFilter, setStopsFilter] = useState<string>(''); // '': Any, '0': Direct, '1': 1 Stop or fewer

  // Popover toggles
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const [showDepSuggestions, setShowDepSuggestions] = useState(false);
  const [showArrSuggestions, setShowArrSuggestions] = useState(false);

  // Autocomplete states
  const [displayDep, setDisplayDep] = useState('台北 (桃園)');
  const [displayArr, setDisplayArr] = useState('新加坡');
  const [depSuggestionsList, setDepSuggestionsList] = useState<any[]>([]);
  const [arrSuggestionsList, setArrSuggestionsList] = useState<any[]>([]);

  // Fetch autocomplete debounced
  useEffect(() => {
    if (displayDep.length < 2) {
      setDepSuggestionsList([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/flights/autocomplete?q=${encodeURIComponent(displayDep)}`);
        const d = await res.json();
        if (d.suggestions) setDepSuggestionsList(d.suggestions);
      } catch (e) {}
    }, 400);
    return () => clearTimeout(t);
  }, [displayDep]);

  useEffect(() => {
    if (displayArr.length < 2) {
      setArrSuggestionsList([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/flights/autocomplete?q=${encodeURIComponent(displayArr)}`);
        const d = await res.json();
        if (d.suggestions) setArrSuggestionsList(d.suggestions);
      } catch (e) {}
    }, 400);
    return () => clearTimeout(t);
  }, [displayArr]);

  const passengerRef = useRef<HTMLDivElement>(null);
  const depRef = useRef<HTMLDivElement>(null);
  const arrRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (passengerRef.current && !passengerRef.current.contains(event.target as Node)) {
        setShowPassengerDropdown(false);
      }
      if (depRef.current && !depRef.current.contains(event.target as Node)) {
        setShowDepSuggestions(false);
      }
      if (arrRef.current && !arrRef.current.contains(event.target as Node)) {
        setShowArrSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAirportCode = (input: string): string => {
    const val = input.trim().toLowerCase();
    if (val.length === 3 && /^[a-z]{3}$/.test(val)) {
      return val.toUpperCase();
    }
    const mappings: Record<string, string> = {
      '台北': 'TPE', '臺北': 'TPE', 'taipei': 'TPE', '桃園': 'TPE', '台灣': 'TPE', 'taiwan': 'TPE',
      '新加坡': 'SIN', 'singapore': 'SIN', '樟宜': 'SIN',
      '香港': 'HKG', 'hong kong': 'HKG', 'hongkong': 'HKG',
      '澳門': 'MFM', 'macau': 'MFM',
      '東京': 'TYO', 'tokyo': 'TYO', '成田': 'NRT', '羽田': 'HND',
      '大阪': 'OSA', 'osaka': 'OSA', '關西': 'KIX',
      '首爾': 'SEL', 'seoul': 'SEL', '仁川': 'ICN',
      '曼谷': 'BKK', 'bangkok': 'BKK',
      '峇里島': 'DPS', 'bali': 'DPS',
      '沖繩': 'OKA', 'okinawa': 'OKA',
      '胡志明': 'SGN', 'ho chi minh': 'SGN'
    };
    for (const [name, code] of Object.entries(mappings)) {
      if (val.includes(name)) return code;
    }
    return input.trim().toUpperCase();
  };

  const totalPassengerCount = passengers.adults + passengers.children + passengers.infants_in_seat + passengers.infants_on_lap;

  const getCabinClassLabel = (code: string) => {
    switch (code) {
      case '1': return '經濟艙';
      case '2': return '優選經濟艙';
      case '3': return '商務艙';
      case '4': return '頭等艙';
      default: return '經濟艙';
    }
  };

  const fetchFlights = async (paramsToUse: any, filterAirline: string | null, isReturn: boolean) => {
    setLoading(true);
    setError(null);
    setResults(null);

    const checkId = (id: string) => String(id).startsWith('/') ? id : getAirportCode(id);
    const actualDeparture = checkId(paramsToUse.departure_id);
    const actualArrival = checkId(paramsToUse.arrival_id);

    const apiParams: any = {
      departure_id: actualDeparture,
      arrival_id: actualArrival,
      outbound_date: paramsToUse.outbound_date,
      currency: 'TWD',
      adults: passengers.adults.toString(),
      children: passengers.children.toString(),
      infants_in_seat: passengers.infants_in_seat.toString(),
      infants_on_lap: passengers.infants_on_lap.toString(),
      travel_class: cabinClass,
      stops: stopsFilter,
      type: tripType === 'round-trip' ? '1' : '2'
    };

    if (tripType === 'round-trip' && paramsToUse.return_date) {
      apiParams.return_date = paramsToUse.return_date;
    }

    const query = new URLSearchParams(apiParams).toString();
    
    try {
      const response = await fetch(`/api/flights?${query}`);
      if (!response.ok) throw new Error('伺服器回應錯誤');
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      // Apply frontend airline filter if needed
      if (filterAirline) {
        if (data.best_flights) {
          data.best_flights = data.best_flights.filter((f: any) => f.flights[0].airline === filterAirline);
        }
        if (data.other_flights) {
          data.other_flights = data.other_flights.filter((f: any) => f.flights[0].airline === filterAirline);
        }
      }
      
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '搜尋失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReturnSearch(false);
    setSelectedAirline(null);
    setSelectedOutbound(null);
    setSelectedReturn(null);
    fetchFlights(searchParams, null, false);
  };

  const handleSelectOutbound = (flight: any) => {
    if (tripType === 'one-way') {
      // For One-way flights, selecting the flight directly finishes the itinerary!
      setSelectedOutbound(flight);
      setOutboundDateStr(searchParams.outbound_date);
      setSelectedReturn(null);
      return;
    }

    // For Round-trip: proceed with return search flow
    const airline = flight.flights[0].airline;
    const newParams = {
      ...searchParams,
      departure_id: searchParams.arrival_id,
      arrival_id: searchParams.departure_id,
      outbound_date: searchParams.return_date
    };
    
    setIsReturnSearch(true);
    setSelectedAirline(airline);
    setSelectedOutbound(flight);
    setOutboundDateStr(searchParams.outbound_date);
    setSelectedReturn(null);
    
    fetchFlights(newParams, airline, true);
  };

  const handleSelectReturn = (flight: any) => {
    setSelectedReturn(flight);
  };

  const adjustPassenger = (type: keyof typeof passengers, operation: 'inc' | 'dec') => {
    setPassengers(prev => {
      const val = prev[type];
      if (operation === 'dec') {
        if (type === 'adults' && val <= 1) return prev;
        if (val <= 0) return prev;
        return { ...prev, [type]: val - 1 };
      } else {
        if (val >= 9) return prev;
        return { ...prev, [type]: val + 1 };
      }
    });
  };

  const swapAirports = () => {
    setSearchParams(prev => ({
      ...prev,
      departure_id: prev.arrival_id,
      arrival_id: prev.departure_id
    }));
    const tempDep = displayDep;
    setDisplayDep(displayArr);
    setDisplayArr(tempDep);
  };

  const processFlights = (flightsList: any[]) => {
    if (!flightsList) return [];
    let filtered = [...flightsList];

    // Filter by stops
    if (stopsFilter !== '') {
      const maxStops = parseInt(stopsFilter, 10);
      filtered = filtered.filter(f => (f.flights?.length - 1) <= maxStops);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'price_asc') {
        return (a.price || 0) - (b.price || 0);
      } else if (sortBy === 'duration_asc') {
        return (a.total_duration || 0) - (b.total_duration || 0);
      }
      return 0;
    });

    return filtered;
  };

  return (
    <div className="container flight-search-container">
      {/* HERO & SEARCH */}
      <div className="hotel-hero-section" style={{ marginTop: '20px' }}>
        <div className="hotel-hero-bg" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4f46e5 60%, #6366f1 85%, #818cf8 100%)' }} />
        <div className="hotel-hero-content">
          <div className="hotel-hero-badge">✈️ 全球機票即時比價</div>
          <h1 className="hotel-hero-title">開啟您的探險之旅</h1>
          <p className="hotel-hero-subtitle">搜尋全球優質航線與最低票價，開啟一段令人驚嘆的旅程</p>
        </div>
        
        <div className="hotel-search-card">
          {/* Top Controls */}
          <div className="search-bar-top-controls" style={{ padding: '16px', borderBottom: '1px solid #e8ecf2', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Trip Type capsule selector */}
            <div className="hotel-view-toggle" style={{ margin: 0, padding: '4px', background: '#f1f5f9', borderRadius: '10px' }}>
              <button 
                type="button"
                className={`hotel-view-btn ${tripType === 'round-trip' ? 'active' : ''}`} 
                onClick={() => {
                  setTripType('round-trip');
                  setSelectedOutbound(null);
                  setSelectedReturn(null);
                  setResults(null);
                }}
              >
                來回航班
              </button>
              <button 
                type="button"
                className={`hotel-view-btn ${tripType === 'one-way' ? 'active' : ''}`} 
                onClick={() => {
                  setTripType('one-way');
                  setSelectedOutbound(null);
                  setSelectedReturn(null);
                  setResults(null);
                }}
              >
                單程機票
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {/* Passenger Selector Counter */}
              <div className="dropdown-wrapper" ref={passengerRef} style={{ position: 'relative' }}>
                <button 
                  type="button" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#475569', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                  onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Users size={16} />
                  <span>{totalPassengerCount} 位旅客</span>
                  <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: showPassengerDropdown ? 'rotate(180deg)' : 'none' }} />
                </button>
                
                {showPassengerDropdown && (
                  <div className="passenger-picker-card shadow-xl animate-fade-in" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', zIndex: 50, width: '320px' }}>
                    <div className="picker-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div className="label-group">
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>成人</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>滿 12 歲</div>
                      </div>
                      <div className="counter" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button type="button" onClick={() => adjustPassenger('adults', 'dec')} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Minus size={14} /></button>
                        <span style={{ width: '16px', textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>{passengers.adults}</span>
                        <button type="button" onClick={() => adjustPassenger('adults', 'inc')} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Plus size={14} /></button>
                      </div>
                    </div>
                    <div className="picker-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div className="label-group">
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>兒童</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>2 - 11 歲</div>
                      </div>
                      <div className="counter" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button type="button" onClick={() => adjustPassenger('children', 'dec')} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Minus size={14} /></button>
                        <span style={{ width: '16px', textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>{passengers.children}</span>
                        <button type="button" onClick={() => adjustPassenger('children', 'inc')} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Plus size={14} /></button>
                      </div>
                    </div>
                    <div className="picker-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div className="label-group">
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>嬰兒 (佔位)</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>低於 2 歲</div>
                      </div>
                      <div className="counter" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button type="button" onClick={() => adjustPassenger('infants_in_seat', 'dec')} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Minus size={14} /></button>
                        <span style={{ width: '16px', textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>{passengers.infants_in_seat}</span>
                        <button type="button" onClick={() => adjustPassenger('infants_in_seat', 'inc')} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Plus size={14} /></button>
                      </div>
                    </div>
                    <div className="picker-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div className="label-group">
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>嬰兒 (不佔位)</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>抱在膝上</div>
                      </div>
                      <div className="counter" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button type="button" onClick={() => adjustPassenger('infants_on_lap', 'dec')} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Minus size={14} /></button>
                        <span style={{ width: '16px', textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>{passengers.infants_on_lap}</span>
                        <button type="button" onClick={() => adjustPassenger('infants_on_lap', 'inc')} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Plus size={14} /></button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <button type="button" onClick={() => setShowPassengerDropdown(false)} style={{ padding: '8px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>確定</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cabin Class Selector */}
              <div className="cabin-class-select-wrapper">
                <select 
                  value={cabinClass} 
                  onChange={e => setCabinClass(e.target.value as any)}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#475569', fontWeight: 600, fontSize: '14px', cursor: 'pointer', outline: 'none', appearance: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <option value="1">經濟艙</option>
                  <option value="2">優選經濟艙</option>
                  <option value="3">商務艙</option>
                  <option value="4">頭等艙</option>
                </select>
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch} style={{ padding: '16px' }}>
            <div className="hotel-search-fields" style={{ display: 'flex', flexWrap: 'wrap', gap: '0', overflow: 'visible', borderRadius: '14px', background: '#fff' }}>
              
              {/* Departure Input */}
              <div className="hotel-field" ref={depRef} style={{ flex: '1 1 200px', borderTopLeftRadius: '14px', borderBottomLeftRadius: '14px' }}>
                <div className="hotel-field-icon"><Plane size={18} /></div>
                <div className="hotel-field-content" style={{ position: 'relative' }}>
                  <span className="hotel-field-label">出發地</span>
                  <input 
                    type="text" 
                    placeholder="機場名稱或代碼" 
                    className="hotel-field-input"
                    value={displayDep}
                    onFocus={() => setShowDepSuggestions(true)}
                    onChange={e => {
                      setDisplayDep(e.target.value);
                      setSearchParams({...searchParams, departure_id: e.target.value});
                      setShowDepSuggestions(true);
                    }}
                    required 
                  />
                  {showDepSuggestions && (
                    <div className="suggestions-panel shadow-lg" style={{ position: 'absolute', top: '100%', left: '-46px', width: '380px', marginTop: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', zIndex: 60, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
                      <div style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>{displayDep.length < 2 ? '熱門出發地' : '搜尋建議'}</div>
                      {(displayDep.length < 2 ? popularAirports : depSuggestionsList).map((s: any, i: number) => {
                        const sId = s.id || s.code || '';
                        const sName = s.name || s.city || '';
                        return (
                          <div 
                            key={`${sId}-${i}`} 
                            style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            onClick={() => {
                              setSearchParams({ ...searchParams, departure_id: sId });
                              setDisplayDep(sName);
                              setShowDepSuggestions(false);
                            }}
                          >
                            <div style={{ color: '#64748b' }}>
                              {s.type === 'airport' ? <Plane size={16} /> : s.type === 'country' ? <Globe size={16} /> : <MapPin size={16} />}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {sName}
                                {s.code && <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>{s.code}</span>}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{s.description || s.city || ''}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="hotel-field-divider" />
              
              {/* Swap Button (Desktop floating) */}
              <button type="button" onClick={swapAirports} style={{ position: 'absolute', left: '26%', top: '65%', transform: 'translate(-50%, -50%)', zIndex: 10, width: '32px', height: '32px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} title="交換機場">
                <RefreshCw size={14} />
              </button>

              {/* Arrival Input */}
              <div className="hotel-field" ref={arrRef} style={{ flex: '1 1 200px' }}>
                <div className="hotel-field-icon"><MapPin size={18} /></div>
                <div className="hotel-field-content" style={{ position: 'relative' }}>
                  <span className="hotel-field-label">目的地</span>
                  <input 
                    type="text" 
                    placeholder="機場名稱或代碼" 
                    className="hotel-field-input"
                    value={displayArr}
                    onFocus={() => setShowArrSuggestions(true)}
                    onChange={e => {
                      setDisplayArr(e.target.value);
                      setSearchParams({...searchParams, arrival_id: e.target.value});
                      setShowArrSuggestions(true);
                    }}
                    required 
                  />
                  {showArrSuggestions && (
                    <div className="suggestions-panel shadow-lg" style={{ position: 'absolute', top: '100%', left: '-46px', width: '380px', marginTop: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', zIndex: 60, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
                      <div style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>{displayArr.length < 2 ? '熱門目的地' : '搜尋建議'}</div>
                      {(displayArr.length < 2 ? popularAirports : arrSuggestionsList).map((s: any, i: number) => {
                        const sId = s.id || s.code || '';
                        const sName = s.name || s.city || '';
                        return (
                          <div 
                            key={`${sId}-${i}`} 
                            style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            onClick={() => {
                              setSearchParams({ ...searchParams, arrival_id: sId });
                              setDisplayArr(sName);
                              setShowArrSuggestions(false);
                            }}
                          >
                            <div style={{ color: '#64748b' }}>
                              {s.type === 'airport' ? <Plane size={16} /> : s.type === 'country' ? <Globe size={16} /> : <MapPin size={16} />}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {sName}
                                {s.code && <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>{s.code}</span>}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{s.description || s.city || ''}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="hotel-field-divider" />

              {/* Outbound Date */}
              <div className="hotel-field" style={{ flex: '1 1 140px' }}>
                <div className="hotel-field-icon"><Calendar size={18} /></div>
                <div className="hotel-field-content">
                  <span className="hotel-field-label">出發日期</span>
                  <input 
                    type="date" 
                    className="hotel-field-input"
                    value={searchParams.outbound_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setSearchParams({...searchParams, outbound_date: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="hotel-field-divider" />

              {/* Return Date */}
              <div className={`hotel-field ${tripType === 'one-way' ? 'opacity-50' : ''}`} style={{ flex: '1 1 140px', pointerEvents: tripType === 'one-way' ? 'none' : 'auto' }}>
                <div className="hotel-field-icon"><Calendar size={18} /></div>
                <div className="hotel-field-content">
                  <span className="hotel-field-label">回程日期</span>
                  <input 
                    type="date" 
                    className="hotel-field-input"
                    value={searchParams.return_date}
                    min={searchParams.outbound_date}
                    onChange={e => setSearchParams({...searchParams, return_date: e.target.value})}
                    disabled={tripType === 'one-way'}
                    required={tripType === 'round-trip'}
                  />
                </div>
              </div>

              <div className="hotel-field-divider" style={{ display: 'none' }} />

              <div style={{ flex: '1 1 140px', padding: '8px', display: 'flex' }}>
                <button type="submit" className="hotel-search-btn" style={{ margin: 0 }} disabled={loading}>
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> 搜尋中</>
                  ) : (
                    <><Search size={18} /> 搜尋航班</>
                  )}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>

      {/* Results and Itinerary Overview */}
      <div className="results-section">
        
        {/* Shimmering Skeleton Ticket Loader Cards */}
        {loading && (
          <div className="skeleton-loader-container">
            <div className="skeleton-loading-header">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p>我們正在實時調取 SerpAPI Google Flights V2 搜尋數據...</p>
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-ticket-card shimmer">
                <div className="skeleton-col skeleton-col-left">
                  <div className="ske-logo"></div>
                  <div className="ske-airline"></div>
                </div>
                <div className="skeleton-col skeleton-col-mid">
                  <div className="ske-timeline">
                    <div className="ske-point"></div>
                    <div className="ske-path-line"></div>
                    <div className="ske-point"></div>
                  </div>
                  <div className="ske-fact-row">
                    <div className="ske-fact"></div>
                    <div className="ske-fact"></div>
                  </div>
                </div>
                <div className="skeleton-col skeleton-col-right">
                  <div className="ske-price"></div>
                  <div className="ske-btn"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="error-state card-like shadow-md">
            <AlertCircle className="error-icon" size={48} />
            <h3>搜尋航班失敗</h3>
            <p>{error}</p>
            <button onClick={() => fetchFlights(searchParams, selectedAirline, isReturnSearch)} className="btn-retry mt-4">
              重新搜尋
            </button>
          </div>
        )}

        {/* Confirmed Itinerary view */}
        {selectedOutbound && (tripType === 'one-way' || selectedReturn) && (
          <div className="summary-wrapper p-8 bg-white rounded-2xl shadow-xl mt-8 border border-blue-100 animate-slide-up">
            <div className="summary-banner bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">🎉 您的精彩行程已確認</h2>
                  <p className="opacity-90 text-sm">請核對您的航班資訊，準備啟程！</p>
                </div>
                <div className="summary-badge bg-white/20 text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider">
                  {tripType === 'round-trip' ? '來回票' : '單程票'}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 text-blue-900 flex items-center gap-2">
                <span className="dot-indicator bg-blue-600"></span>去程航班 ({outboundDateStr})
              </h3>
              <FlightCard data={selectedOutbound} disabled={true} buttonText="已選定去程" />
            </div>
            
            {tripType === 'round-trip' && selectedReturn && (
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 text-orange-950 flex items-center gap-2">
                  <span className="dot-indicator bg-orange-500"></span>回程航班 ({searchParams.return_date})
                </h3>
                <FlightCard data={selectedReturn} disabled={true} buttonText="已選定回程" hidePrice={true} />
              </div>
            )}

            <div className="summary-checkout-bar flex flex-col md:flex-row justify-between items-center bg-gray-50 border border-gray-100 p-6 rounded-xl mt-8 gap-4">
               <div>
                 <div className="text-gray-500 text-sm font-semibold uppercase tracking-wide">機票總金額 ({totalPassengerCount} 位)</div>
                 <div className="text-sm text-gray-400 mt-1">{getCabinClassLabel(cabinClass)} · 以去程金額計價</div>
               </div>
               <div className="flex items-center gap-6">
                 <div className="text-4xl font-extrabold text-blue-800">
                   <span className="text-base font-normal text-gray-500 mr-1">TWD</span>
                   {selectedOutbound.price ? selectedOutbound.price.toLocaleString() : '---'}
                 </div>
                 <button 
                   className="btn-checkout shadow-lg shadow-blue-500/20"
                   onClick={() => alert(`完成機票選購！\n艙等：${getCabinClassLabel(cabinClass)}\n乘客人數：${totalPassengerCount} 人\n總金額：TWD ${selectedOutbound.price?.toLocaleString()}`)}
                 >
                   確認並前往結帳
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* Selected Outbound flight shown at top during return flight search */}
        {results && isReturnSearch && selectedOutbound && !selectedReturn && (
          <div className="results-wrapper outbound-sticky-summary mb-8 animate-fade-in">
            <div className="results-header text-blue-900 font-bold mb-3 flex items-center justify-between">
              <span>已選擇去程航班 ({outboundDateStr})</span>
              <button 
                className="btn-text-only text-xs text-blue-600 flex items-center gap-1 hover:underline"
                onClick={() => {
                  setIsReturnSearch(false);
                  setSelectedOutbound(null);
                  setResults(null);
                }}
              >
                重選去程
              </button>
            </div>
            <div className="flight-list">
              <FlightCard data={selectedOutbound} disabled={true} buttonText="已選擇去程" />
            </div>
          </div>
        )}

        {/* Query Results Flights List */}
        {results && !selectedReturn && (!isReturnSearch || selectedOutbound) && (
          <div className="results-wrapper animate-slide-up">
            
            {/* Filter and Sorting Panel */}
            <div className="results-controls shadow-sm bg-white p-4 rounded-xl mb-6 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Stops Quick filter */}
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">篩選轉機：</span>
                  <select 
                    value={stopsFilter} 
                    onChange={e => setStopsFilter(e.target.value)}
                    className="quick-filter-select text-xs"
                  >
                    <option value="">所有轉機次數</option>
                    <option value="0">直飛航班 (直飛)</option>
                    <option value="1">最多轉機 1 次</option>
                  </select>
                </div>

                {/* Sorting options */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={14} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">排序依據：</span>
                  <button 
                    type="button" 
                    className={`sort-pill ${sortBy === 'price_asc' ? 'active' : ''}`}
                    onClick={() => setSortBy('price_asc')}
                  >
                    最便宜
                  </button>
                  <button 
                    type="button" 
                    className={`sort-pill ${sortBy === 'duration_asc' ? 'active' : ''}`}
                    onClick={() => setSortBy('duration_asc')}
                  >
                    最快速
                  </button>
                </div>
              </div>

              <span className="results-count font-medium text-xs text-gray-400">
                找到 {processFlights(results.best_flights).length} 個最佳推薦
              </span>
            </div>

            {/* Main Best Flights Section */}
            <div className="results-header flex justify-between items-baseline mb-4">
              <h2 className={isReturnSearch ? "text-orange-950 font-extrabold" : "text-blue-950 font-extrabold"}>
                {isReturnSearch ? `回程航班選擇 (${searchParams.return_date})` : '推薦航班 (Best Flights)'}
              </h2>
              <span className="text-xs text-gray-400 font-semibold bg-gray-100 px-2.5 py-1 rounded-full">高性價比極速航線</span>
            </div>
            
            <div className="flight-list">
              {processFlights(results.best_flights).length > 0 ? (
                processFlights(results.best_flights).map((flight: any, idx: number) => (
                  <FlightCard 
                    key={idx} 
                    data={flight} 
                    onSelect={isReturnSearch ? handleSelectReturn : handleSelectOutbound}
                    disabled={tripType === 'round-trip' && !searchParams.return_date && !isReturnSearch}
                    buttonText={isReturnSearch ? '確認行程' : '選擇航班'}
                    hidePrice={isReturnSearch}
                  />
                ))
              ) : (
                <div className="empty-results-card bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
                  <Plane size={36} className="text-gray-300 mx-auto mb-3 animate-pulse" />
                  <h4 className="font-bold text-gray-600">無符合目前篩選條件的航班</h4>
                  <p className="text-gray-400 text-xs mt-1">請嘗試調整轉機限制或篩選條件</p>
                </div>
              )}
            </div>

            {/* Other Flights Options Section */}
            {results.other_flights && results.other_flights.length > 0 && (
              <div className="other-flights mt-12">
                <hr className="my-8 opacity-30 border-dashed" />
                <div className="results-header mb-4">
                  <h3 className="font-extrabold text-gray-600 flex items-center gap-2 text-lg">
                    <SlidersHorizontal size={16} />其他班次選項
                  </h3>
                  <span className="text-xs text-gray-400">完整搜尋列表備用選項</span>
                </div>
                <div className="flight-list">
                  {processFlights(results.other_flights).slice(0, 10).map((flight: any, idx: number) => (
                    <FlightCard 
                      key={`other-${idx}`} 
                      data={flight} 
                      onSelect={isReturnSearch ? handleSelectReturn : handleSelectOutbound}
                      disabled={tripType === 'round-trip' && !searchParams.return_date && !isReturnSearch}
                      buttonText={isReturnSearch ? '確認行程' : '選擇航班'}
                      hidePrice={isReturnSearch}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State visual */}
        {!loading && !results && !error && !selectedOutbound && (
          <div className="empty-state card-like shadow-md p-16 animate-fade-in">
            <div className="empty-plane-logo">
              <Plane size={36} className="text-blue-500 animate-bounce" />
            </div>
            <h3>您想去哪裡探險？</h3>
            <p className="max-w-md mx-auto">輸入您的出發地、目的地及理想的旅遊日期，我們將為您抓取全世界最棒的機票優惠！</p>
            <div className="quick-cities-grid mt-6">
              <span className="quick-lbl text-xs text-gray-400 mr-2">熱門速配：</span>
              {['台北 ✈ 新加坡', '台北 ✈ 東京', '台北 ✈ 香港', '台北 ✈ 首爾'].map((path, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    const cities = path.split(' ✈ ');
                    setSearchParams({
                      ...searchParams,
                      departure_id: getAirportCode(cities[0]),
                      arrival_id: getAirportCode(cities[1])
                    });
                  }}
                  className="quick-route-pill"
                >
                  {path}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightSearch;
