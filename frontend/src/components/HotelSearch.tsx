import { useState, useEffect, useRef, useCallback } from 'react';

// ===== API Base URL (hotel-server on port 3002) =====
const API = '';

// ===== Types =====
interface HotelProperty {
  name: string; type?: string; description?: string;
  overall_rating?: number; reviews?: number;
  rate_per_night?: { lowest?: string; extracted_lowest?: number; before_taxes_fees?: string };
  total_rate?: { lowest?: string; extracted_lowest?: number };
  prices?: { source: string; rate_per_night?: { lowest: string } }[];
  nearby_places?: { name: string; transportations?: { type: string; duration: string }[] }[];
  hotel_class?: number;
  images?: { thumbnail: string; original_image?: string }[];
  amenities?: string[];
  deal?: string; deal_description?: string;
  check_in_time?: string; check_out_time?: string;
  link?: string;
  gps_coordinates?: { latitude: number; longitude: number };
}

interface MapHotel {
  title: string; rating: number | null; reviews: number;
  price: string; address: string; website: string;
  thumbnail: string; lat: number | null; lng: number | null;
}

// ===== Helpers =====
const CITIES: Record<string, { lat: number; lng: number }> = {
  '新加坡':{lat:1.3521,lng:103.8198},'東京':{lat:35.6762,lng:139.6503},'大阪':{lat:34.6937,lng:135.5023},
  '京都':{lat:35.0116,lng:135.7681},'首爾':{lat:37.5665,lng:126.978},'香港':{lat:22.3193,lng:114.1694},
  '曼谷':{lat:13.7563,lng:100.5018},'台北':{lat:25.033,lng:121.565},'巴黎':{lat:48.8566,lng:2.3522},
  '倫敦':{lat:51.5074,lng:-0.1278},'紐約':{lat:40.7128,lng:-74.006},'峇里島':{lat:-8.3405,lng:115.092},
  'HKG':{lat:22.3193,lng:114.1694},'SIN':{lat:1.3521,lng:103.8198},'TYO':{lat:35.6762,lng:139.6503},
  'TPE':{lat:25.033,lng:121.565},'BKK':{lat:13.7563,lng:100.5018},'NYC':{lat:40.7128,lng:-74.006},
};
const addDays = (d: string, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const today2 = () => addDays(new Date().toISOString().slice(0, 10), 2);
const fmtPrice = (s: string) => {
  if (!s) return '';
  if (s.includes('NT$') || s.includes('US$') || s.includes('¥') || s.includes('€')) return s;
  return s.replace(/\$/g, 'NT$');
};

// ===== Component =====
export default function HotelSearch() {
  const [q, setQ] = useState('');
  const [checkIn, setCheckIn] = useState(today2());
  const [checkOut, setCheckOut] = useState(addDays(today2(), 1));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [hotels, setHotels] = useState<HotelProperty[]>([]);
  const [mapHotels, setMapHotels] = useState<MapHotel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<HotelProperty | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Load Leaflet
  const loadLeaflet = useCallback((): Promise<void> => {
    return new Promise(resolve => {
      if ((window as any).L) { resolve(); return; }
      if (!document.getElementById('lf-css')) {
        const lk = document.createElement('link'); lk.id = 'lf-css'; lk.rel = 'stylesheet';
        lk.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(lk);
      }
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      s.onload = () => resolve(); document.head.appendChild(s);
    });
  }, []);

  // Search list (google_hotels, currency=TWD)
  const searchList = async () => {
    if (!q.trim()) { setError('請輸入目的地'); return; }
    setLoading(true); setError(''); setSearched(true); setSelected(null);
    const params = new URLSearchParams({
      q: q.trim(), check_in_date: checkIn, check_out_date: checkOut,
      adults: String(adults), gl: 'tw', hl: 'zh-tw', currency: 'TWD'
    });
    if (children > 0) { params.set('children', String(children)); if (childAges) params.set('children_ages', childAges); }
    try {
      const res = await fetch(`${API}/api/hotels/search?${params}`);
      const data = await res.json();
      if (data.error) { setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error)); return; }
      setHotels(data.properties || []); setTotal(data.total || 0);
    } catch (e) { setError('搜尋失敗：' + (e as Error).message); }
    finally { setLoading(false); }
  };

  // Search map (google_maps, q=Hotels)
  const searchMap = useCallback(async (lat: number, lng: number, zoom = 14) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/hotels/map?q=Hotels&ll=${encodeURIComponent('@' + lat + ',' + lng + ',' + zoom + 'z')}`);
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setMapHotels(d.results || []); setTotal(d.total || 0);
    } catch { setError('地圖搜尋失敗'); }
    finally { setLoading(false); }
  }, []);

  const handleSearch = () => {
    if (view === 'map') {
      const city = CITIES[q.trim()];
      if (city) { searchMap(city.lat, city.lng); if (leafletMap.current) leafletMap.current.setView([city.lat, city.lng], 14); }
      else { searchList(); setView('list'); }
    } else { searchList(); }
  };

  // Init map
  useEffect(() => {
    if (view !== 'map' || !mapRef.current) return;
    if (leafletMap.current) { leafletMap.current.invalidateSize(); return; }
    (async () => {
      await loadLeaflet();
      const L = (window as any).L; if (!L || !mapRef.current) return;
      const city = CITIES[q.trim()] || CITIES['台北'];
      const map = L.map(mapRef.current).setView([city.lat, city.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
      leafletMap.current = map;
      map.on('moveend', () => { const c = map.getCenter(); searchMap(c.lat, c.lng, map.getZoom()); });
      searchMap(city.lat, city.lng, 14);
    })();
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, [view]);

  // Update markers
  useEffect(() => {
    if (!leafletMap.current || view !== 'map') return;
    const L = (window as any).L; if (!L) return;
    markersRef.current.forEach(m => m.remove()); markersRef.current = [];
    mapHotels.forEach(h => {
      if (!h.lat || !h.lng) return;
      const m = L.marker([h.lat, h.lng]).addTo(leafletMap.current);
      m.bindPopup(`<div style="min-width:160px"><b>${h.title}</b>${h.rating ? '<br>★ ' + h.rating + ' (' + h.reviews + ')' : ''}${h.price ? '<br><b style="color:#1a4b8c">' + fmtPrice(h.price) + '</b>' : ''}</div>`);
      markersRef.current.push(m);
    });
  }, [mapHotels, view]);

  const flyTo = (lat: number, lng: number) => leafletMap.current?.setView([lat, lng], 16);
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  // ===== RENDER =====
  return (
    <div className="main-content">
      <div className="container hotel-search-container">
        <div className="search-hero">
          <h1>尋找最理想的住宿</h1>
          <p>搜尋全球酒店與民宿，體驗如家一般的舒適</p>
        </div>

        <div className="flight-search-bar shadow-xl">
          <div className="search-form">
            <div className="input-group">
              <div className="input-with-icon">
                <span style={{fontSize:16}}>📍</span>
                <input type="text" value={q} onChange={e => setQ(e.target.value)}
                  placeholder="目的地 / 酒店名稱" onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  list="hotel-cities" />
                <datalist id="hotel-cities">{Object.keys(CITIES).filter(c => c.length > 2).map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="input-with-icon"><span style={{fontSize:16}}>📅</span>
                <input type="date" value={checkIn} onChange={e => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1)); }} />
              </div>
              <div className="input-with-icon"><span style={{fontSize:16}}>📅</span>
                <input type="date" value={checkOut} min={addDays(checkIn, 1)} onChange={e => setCheckOut(e.target.value)} />
              </div>
              <div className="input-with-icon"><span style={{fontSize:16}}>👥</span>
                <select value={adults} onChange={e => setAdults(+e.target.value)}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} 位大人</option>)}
                </select>
              </div>
            </div>
            <button className="btn-primary btn-search" onClick={handleSearch} disabled={loading}>
              🔍 {loading ? '搜尋中...' : '搜尋酒店'}
            </button>
            <div style={{display:'flex',gap:12,alignItems:'center',marginTop:8,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{background:'#1a4b8c',color:'#fff',padding:'2px 8px',borderRadius:4,fontSize:12,fontWeight:600}}>TWD</span>
                <span style={{fontSize:13,color:'#666'}}>幣別：新台幣</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:13,color:'#666'}}>兒童:</span>
                <select value={children} onChange={e => setChildren(+e.target.value)} style={{padding:'2px 6px',borderRadius:4,border:'1px solid #ddd',fontSize:13}}>
                  {[0,1,2,3,4].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              {children > 0 && <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:13,color:'#666'}}>年齡:</span>
                <input value={childAges} onChange={e => setChildAges(e.target.value)} placeholder="10" style={{width:60,padding:'2px 6px',borderRadius:4,border:'1px solid #ddd',fontSize:13}} />
              </div>}
            </div>
          </div>
        </div>

        {error && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:8,fontSize:13,marginTop:16}}>{error}</div>}

        {(searched || hotels.length > 0 || mapHotels.length > 0) && (
          <div className="results-section"><div className="results-wrapper">
            <div className="results-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
              <h2>熱門住宿建議</h2>
              <span className="results-count">找到 {total} 間{view === 'list' ? '符合的住宿' : '飯店 (地圖)'}{view === 'list' ? ` · ${nights} 晚` : ''}</span>
              <div style={{display:'flex',gap:4,background:'#f0f2f5',borderRadius:8,padding:3}}>
                {(['list','map'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{
                    padding:'7px 16px',fontSize:13,border:'none',borderRadius:6,cursor:'pointer',fontWeight:500,
                    background:view===v?'#fff':'transparent',color:view===v?'#1a4b8c':'#666',
                    boxShadow:view===v?'0 1px 4px rgba(0,0,0,.1)':'none',transition:'all .15s'
                  }}>{v === 'list' ? '📋 列表' : '🗺 地圖'}</button>
                ))}
              </div>
            </div>

            {/* MAP */}
            {view === 'map' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 320px',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden',height:520,marginTop:16}}>
                <div ref={mapRef} style={{width:'100%',height:'100%'}} />
                <div style={{overflowY:'auto',background:'#fff',borderLeft:'1px solid #e5e7eb'}}>
                  {loading && <div style={{padding:16,textAlign:'center',color:'#888',fontSize:13}}>🔍 搜尋中...</div>}
                  {!loading && mapHotels.length === 0 && <div style={{padding:16,textAlign:'center',color:'#888',fontSize:13}}>拖動地圖搜尋附近飯店</div>}
                  {mapHotels.map((h, i) => (
                    <div key={i} onClick={() => h.lat && h.lng && flyTo(h.lat, h.lng)}
                      style={{padding:'12px 14px',borderBottom:'1px solid #f3f4f6',cursor:'pointer',transition:'background .15s'}}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{h.title}</div>
                      <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:3}}>
                        {h.rating && <span style={{background:'#1a4b8c',color:'#fff',padding:'1px 6px',borderRadius:4,fontSize:11,fontWeight:600}}>{h.rating}</span>}
                        {h.price && <span style={{color:'#1a4b8c',fontWeight:600,fontSize:13}}>{fmtPrice(h.price)}</span>}
                      </div>
                      <div style={{fontSize:11,color:'#888'}}>{(h.address || '').slice(0, 50)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LIST */}
            {view === 'list' && (
              <div className="hotel-grid">
                {loading && <div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'#888'}}>搜尋 Google Hotels 中...</div>}
                {!loading && searched && hotels.length === 0 && !error && <div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'#888'}}>沒有找到飯店</div>}
                {!loading && hotels.map((h, i) => (
                  <div key={i} className="hotel-card" onClick={() => setSelected(h)} style={{cursor:'pointer'}}>
                    <div className="hotel-thumbnail-wrapper">
                      {h.images?.[0] ? <img src={h.images[0].thumbnail} alt={h.name} className="hotel-thumbnail" loading="lazy" />
                        : <div className="hotel-thumbnail" style={{background:'linear-gradient(135deg,#85B7EB,#378ADD)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14}}>{h.name}</div>}
                      {h.overall_rating && <div className="hotel-rating-overlay"><span>⭐ {h.overall_rating}</span></div>}
                    </div>
                    <div className="hotel-info">
                      <div className="hotel-header-row">
                        <h3 className="hotel-name">{h.name}</h3>
                        <div className="hotel-price-group">
                          {h.rate_per_night?.before_taxes_fees && <span style={{fontSize:12,color:'#888',textDecoration:'line-through'}}>{fmtPrice(h.rate_per_night.before_taxes_fees)}</span>}
                          <span style={{fontSize:18,fontWeight:700,color:'#1a4b8c'}}>{fmtPrice(h.rate_per_night?.lowest || '')}</span>
                          {h.rate_per_night?.lowest && <span style={{fontSize:12,color:'#888'}}>每晚</span>}
                        </div>
                      </div>
                      {h.type && <div className="hotel-location">{h.type}</div>}
                      {h.description && <p style={{fontSize:13,color:'#555',margin:'6px 0',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden'}}>{h.description}</p>}
                      {h.amenities && h.amenities.length > 0 && (
                        <div className="hotel-amenities-tags">
                          {h.amenities.slice(0, 3).map((a, j) => <span key={j} className="amenity-tag">{a}</span>)}
                          {h.amenities.length > 3 && <span className="amenity-tag-more">+{h.amenities.length - 3}</span>}
                        </div>
                      )}
                      <div className="hotel-footer">
                        {h.reviews && <div className="hotel-reviews"><span className="review-count">{h.reviews.toLocaleString()} 則評論</span></div>}
                        {h.deal_description && <span style={{fontSize:11,color:'#16a34a',padding:'2px 8px',background:'#f0fdf4',borderRadius:4}}>{h.deal_description}</span>}
                        <button className="btn-hotel-link" onClick={e => { e.stopPropagation(); setSelected(h); }}>查看詳情 ↗</button>
                      </div>
                      {h.total_rate?.lowest && nights > 1 && <div style={{fontSize:12,color:'#888',marginTop:4}}>{nights} 晚共 {fmtPrice(h.total_rate.lowest)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div></div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}} onClick={() => setSelected(null)}>
          <div style={{background:'#fff',borderRadius:16,maxWidth:700,width:'100%',maxHeight:'90vh',overflowY:'auto'}} onClick={e => e.stopPropagation()}>
            {selected.images?.[0] && <img src={selected.images[0].original_image || selected.images[0].thumbnail} alt="" style={{width:'100%',height:280,objectFit:'cover',borderRadius:'16px 16px 0 0'}} />}
            <div style={{padding:'20px 24px'}}>
              <h2 style={{margin:'0 0 8px',fontSize:22}}>{selected.name}</h2>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:12}}>
                {selected.hotel_class && <span style={{color:'#ca8a04'}}>{'★'.repeat(Math.min(Number(selected.hotel_class) || 0, 5))}</span>}
                {selected.overall_rating && <span style={{background:'#1a4b8c',color:'#fff',padding:'2px 8px',borderRadius:4,fontSize:13,fontWeight:600}}>{selected.overall_rating}</span>}
                {selected.reviews && <span style={{fontSize:13,color:'#888'}}>{selected.reviews.toLocaleString()} 則評價</span>}
              </div>
              {selected.description && <p style={{fontSize:14,lineHeight:1.7,margin:'0 0 12px'}}>{selected.description}</p>}
              {selected.check_in_time && <div style={{fontSize:13,color:'#666',marginBottom:8}}>入住 {selected.check_in_time} · 退房 {selected.check_out_time}</div>}
              {selected.amenities && selected.amenities.length > 0 && (
                <div style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>設施</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>{selected.amenities.slice(0, 15).map((a, i) => <span key={i} style={{fontSize:12,padding:'3px 10px',background:'#f3f4f6',borderRadius:4}}>{a}</span>)}</div>
                </div>
              )}
              {selected.nearby_places && selected.nearby_places.length > 0 && (
                <div style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>附近景點</div>
                  {selected.nearby_places.slice(0, 5).map((p, i) => <div key={i} style={{fontSize:13,color:'#666',marginBottom:2}}>{p.name}{p.transportations?.[0] ? ` · ${p.transportations[0].type} ${p.transportations[0].duration}` : ''}</div>)}
                </div>
              )}
              {selected.prices && selected.prices.length > 0 && (
                <div style={{borderTop:'1px solid #e5e7eb',paddingTop:12,marginTop:12}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>各平台比價</div>
                  {selected.prices.map((p, i) => <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f3f4f6',fontSize:14}}><span>{p.source}</span><span style={{fontWeight:600,color:'#1a4b8c'}}>{fmtPrice(p.rate_per_night?.lowest || '—')}</span></div>)}
                </div>
              )}
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20}}>
                <button onClick={() => setSelected(null)} style={{padding:'8px 20px',border:'1px solid #ddd',borderRadius:8,background:'#fff',cursor:'pointer',fontSize:14}}>關閉</button>
                {selected.link && <a href={selected.link} target="_blank" rel="noopener noreferrer" style={{padding:'8px 20px',background:'#1a4b8c',color:'#fff',borderRadius:8,textDecoration:'none',fontSize:14}}>前往預訂</a>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
