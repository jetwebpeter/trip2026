import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users, Loader2, AlertCircle, Plane } from 'lucide-react';
import FlightCard from './FlightCard';

const FlightSearch: React.FC = () => {
  const getTodayPlus = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const defaultOutbound = getTodayPlus(3);
  const defaultReturn = (() => {
    const d = new Date(defaultOutbound);
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  })();

  const [searchParams, setSearchParams] = useState({
    departure_id: 'TPE',
    arrival_id: 'SIN',
    outbound_date: defaultOutbound,
    return_date: defaultReturn,
    adults: '1',
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReturnSearch, setIsReturnSearch] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState<string | null>(null);
  const [selectedOutbound, setSelectedOutbound] = useState<any>(null);
  const [outboundDateStr, setOutboundDateStr] = useState<string>('');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

  const getAirportCode = (input: string): string => {
    const val = input.trim().toLowerCase();
    
    // 如果輸入本身看起來就像是 3 碼的代碼，直接轉大寫回傳
    if (val.length === 3 && /^[a-z]{3}$/.test(val)) {
      return val.toUpperCase();
    }
    
    // 常見機場名稱對應表
    const mappings: Record<string, string> = {
      '台北': 'TPE',
      '臺北': 'TPE',
      'taipei': 'TPE',
      '桃園': 'TPE',
      '台灣': 'TPE',
      'taiwan': 'TPE',
      '新加坡': 'SIN',
      'singapore': 'SIN',
      '樟宜': 'SIN',
      '香港': 'HKG',
      'hong kong': 'HKG',
      'hongkong': 'HKG',
      '澳門': 'MFM',
      'macau': 'MFM',
      '東京': 'TYO',
      'tokyo': 'TYO',
      '大阪': 'OSA',
      'osaka': 'OSA',
      '關西': 'KIX',
      '首爾': 'SEL',
      'seoul': 'SEL',
      '仁川': 'ICN',
      '曼谷': 'BKK',
      'bangkok': 'BKK',
      '峇里島': 'DPS',
      'bali': 'DPS',
      '沖繩': 'OKA',
      'okinawa': 'OKA',
      '胡志明': 'SGN',
      'ho chi minh': 'SGN'
    };

    for (const [name, code] of Object.entries(mappings)) {
      if (val.includes(name)) {
        return code;
      }
    }
    
    return input.trim().toUpperCase();
  };

  const fetchFlights = async (paramsToUse: any, filterAirline: string | null, isReturn: boolean) => {
    setLoading(true);
    setError(null);
    setResults(null);

    // 在組成 JSON / Query 時換成三碼 ISO Airport Code
    const actualDeparture = getAirportCode(paramsToUse.departure_id);
    const actualArrival = getAirportCode(paramsToUse.arrival_id);

    const apiParams = {
      ...paramsToUse,
      departure_id: actualDeparture,
      arrival_id: actualArrival
    };

    const query = new URLSearchParams(apiParams).toString();
    
    try {
      const response = await fetch(`/api/flights?${query}`);
      if (!response.ok) throw new Error('伺服器回應錯誤');
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

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
    // 取得所選去程航班的航空公司
    const airline = flight.flights[0].airline;
    
    // 交換出發與抵達機場，並將出發日期改為原本的回程日期 (不改變畫面搜尋欄的 searchParams 狀態)
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
    
    // 直接發動回程搜尋
    fetchFlights(newParams, airline, true);
  };

  const handleSelectReturn = (flight: any) => {
    setSelectedReturn(flight);
  };

  return (
    <div className="container flight-search-container">
      <div className="search-hero">
        <h1>探索下一個目的地</h1>
        <p>搜尋全球最優惠的航班，開啟您的精彩旅程</p>
      </div>

      <div className="flight-search-bar shadow-xl">
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-group">
            <div className="input-with-icon">
              <MapPin className="icon" size={20} />
              <input 
                type="text" 
                placeholder="出發地 (提供中英文或機場代碼，如: 台北 或 TPE)" 
                title="出發機場名稱或代碼"
                value={searchParams.departure_id}
                onChange={e => setSearchParams({...searchParams, departure_id: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-with-icon">
              <MapPin className="icon" size={20} />
              <input 
                type="text" 
                placeholder="目的地 (提供中英文或機場代碼，如: 新加坡 或 SIN)" 
                title="抵達機場名稱或代碼"
                value={searchParams.arrival_id}
                onChange={e => setSearchParams({...searchParams, arrival_id: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-with-icon">
              <Calendar className="icon" size={20} />
              <input 
                type="date" 
                title="出發日期"
                value={searchParams.outbound_date}
                onChange={e => setSearchParams({...searchParams, outbound_date: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-with-icon">
              <Calendar className="icon" size={20} />
              <input 
                type="date" 
                title="回程日期"
                value={searchParams.return_date}
                onChange={e => setSearchParams({...searchParams, return_date: e.target.value})}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn-primary btn-search" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Search size={22} />}
            <span>搜尋航班</span>
          </button>
        </form>
      </div>

      <div className="results-section">
        {loading && (
          <div className="loading-state">
            <Loader2 className="animate-spin loading-icon" size={48} />
            <p>正在搜尋最佳航班...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <AlertCircle className="error-icon" size={48} />
            <h3>搜尋發生問題</h3>
            <p>{error}</p>
          </div>
        )}

        {selectedOutbound && selectedReturn && (
          <div className="summary-wrapper p-8 bg-white rounded-2xl shadow-lg mt-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-800">來回行程總覽</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-600">去程航班({outboundDateStr})</h3>
              <FlightCard data={selectedOutbound} disabled={true} buttonText="已確認" />
            </div>
            
            <hr className="my-8 opacity-20" />
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-600">回程航班({searchParams.return_date})</h3>
              <FlightCard data={selectedReturn} disabled={true} buttonText="已確認" hidePrice={true} />
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-6 rounded-xl mt-8 mb-8">
               <div className="text-gray-600 text-xl">總票價</div>
               <div className="text-3xl font-bold text-blue-600">TWD {selectedOutbound.price.toLocaleString()}</div>
            </div>
            
            <div className="mt-8 text-center">
              <button 
                className="btn-primary"
                style={{width: '200px', height: '50px', fontSize: '1.2rem'}}
                onClick={() => alert('準備進入結帳或下一步流程...')}
              >
                前往結帳
              </button>
            </div>
          </div>
        )}

        {results && isReturnSearch && selectedOutbound && !selectedReturn && (
          <div className="results-wrapper mb-12">
            <div className="results-header">
              <h2 className="text-red-500">去程航班({outboundDateStr})</h2>
            </div>
            <div className="flight-list">
              <FlightCard data={selectedOutbound} disabled={true} buttonText="已選擇" />
            </div>
          </div>
        )}

        {results && !selectedReturn && (
          <div className="results-wrapper">
            <div className="results-header">
              <h2 className={isReturnSearch ? "text-red-500" : ""}>
                {isReturnSearch ? `回程航班(${searchParams.return_date})` : '最佳航班建議'}
              </h2>
              <span className="results-count">找到 {results.best_flights?.length || 0} 個最佳推薦</span>
            </div>
            
            <div className="flight-list">
              {results.best_flights?.map((flight: any, idx: number) => (
                <FlightCard 
                  key={idx} 
                  data={flight} 
                  onSelect={isReturnSearch ? handleSelectReturn : handleSelectOutbound}
                  disabled={!searchParams.return_date && !isReturnSearch}
                  buttonText={isReturnSearch ? '確認行程' : '選擇航班'}
                  hidePrice={isReturnSearch}
                />
              ))}
            </div>

            {results.other_flights && (
              <div className="other-flights mt-12">
                <hr className="my-8 opacity-20" />
                <h3 className="mb-6 opacity-80">其他航班選項</h3>
                <div className="flight-list">
                  {results.other_flights.slice(0, 10).map((flight: any, idx: number) => (
                    <FlightCard 
                      key={`other-${idx}`} 
                      data={flight} 
                      onSelect={isReturnSearch ? handleSelectReturn : handleSelectOutbound}
                      disabled={!searchParams.return_date && !isReturnSearch}
                      buttonText={isReturnSearch ? '確認行程' : '選擇航班'}
                      hidePrice={isReturnSearch}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !results && !error && (
          <div className="empty-state">
            <Plane size={64} className="empty-icon" />
            <h3>準備好出發了嗎？</h3>
            <p>輸入出發地、目的地及日期開始搜尋</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightSearch;
