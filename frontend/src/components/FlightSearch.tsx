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
    departure_id: 'SIN',
    arrival_id: 'HKG',
    outbound_date: defaultOutbound,
    return_date: defaultReturn,
    adults: '1',
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    const query = new URLSearchParams(searchParams).toString();
    
    try {
      const response = await fetch(`/api/flights?${query}`);
      if (!response.ok) throw new Error('伺服器回應錯誤');
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '搜尋失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
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
                placeholder="出發地 (例如: SIN)" 
                title="出發城市代碼"
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
                placeholder="目的地 (例如: HKG)" 
                title="抵達城市代碼"
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

        {results && (
          <div className="results-wrapper">
            <div className="results-header">
              <h2>最佳航班建議</h2>
              <span className="results-count">找到 {results.best_flights?.length || 0} 個最佳推薦</span>
            </div>
            
            <div className="flight-list">
              {results.best_flights?.map((flight: any, idx: number) => (
                <FlightCard key={idx} data={flight} />
              ))}
            </div>

            {results.other_flights && (
              <div className="other-flights mt-12">
                <hr className="my-8 opacity-20" />
                <h3 className="mb-6 opacity-80">其他航班選項</h3>
                <div className="flight-list">
                  {results.other_flights.slice(0, 10).map((flight: any, idx: number) => (
                    <FlightCard key={`other-${idx}`} data={flight} />
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
