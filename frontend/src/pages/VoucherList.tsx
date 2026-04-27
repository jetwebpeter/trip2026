import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = '';

interface Voucher {
  voucher_uuid: string;
  voucher_code: string;
  voucher_name: string;
  city_code: string;
  category: string;
  identity_type: string;
  direct_price: number;
  agency_price: number;
  features: string;
  notice: string;
  spot_relation: string;
  image_url: string;
  valid_from?: string;
  valid_to?: string;
}

const fmt = (n: number) => 'NT$ ' + (n ?? 0).toLocaleString();

export default function VoucherList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Voucher[]>([]);
  const [total, setTotal] = useState(0);
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('price_asc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    setLoading(true); setError('');
    const p = new URLSearchParams({ city, category, keyword, sort, page: String(page), pageSize: '12' });
    try {
      const res = await fetch(`${API}/api/vouchers?${p}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setItems(data.items || []); setTotal(data.total || 0);
    } catch (e) { setError('搜尋失敗：' + (e as Error).message); }
    finally { setLoading(false); }
  };

  useEffect(() => { search(); }, [city, category, sort, page]);
  useEffect(() => { setPage(1); }, [city, category, keyword]);

  const handleSearch = () => { setPage(1); search(); };
  const pages = Math.max(1, Math.ceil(total / 12));

  return (
    <div className="main-content">
      <div className="container hotel-search-container">
        {/* Hero */}
        <div className="search-hero">
          <h1>票券・門票・地接服務</h1>
          <p>即買即用的旅遊票券，含主題樂園、機場交通、當地行程</p>
        </div>

        {/* Search */}
        <div className="flight-search-bar shadow-xl">
          <div className="search-form">
            <div className="input-group">
              <div className="input-with-icon">
                <span style={{fontSize:16}}>🔍</span>
                <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
                  placeholder="搜尋票券名稱、景點..."
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
              <div className="input-with-icon">
                <span style={{fontSize:16}}>🏙</span>
                <select value={city} onChange={e => setCity(e.target.value)}>
                  <option value="">全部城市</option>
                  <option value="TYO">東京</option>
                  <option value="SIN">新加坡</option>
                  <option value="SEL">首爾</option>
                  <option value="KYO">京都</option>
                  <option value="BKK">曼谷</option>
                  <option value="HKG">香港</option>
                  <option value="OSA">大阪</option>
                  <option value="DPS">峇里島</option>
                </select>
              </div>
              <div className="input-with-icon">
                <span style={{fontSize:16}}>🏷</span>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">全部類別</option>
                  <option>票券</option>
                  <option>門票</option>
                  <option>交通</option>
                  <option>地接行程</option>
                </select>
              </div>
              <div className="input-with-icon">
                <span style={{fontSize:16}}>↕️</span>
                <select value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="price_asc">價格低→高</option>
                  <option value="price_desc">價格高→低</option>
                  <option value="newest">最新上架</option>
                </select>
              </div>
            </div>
            <button className="btn-primary btn-search" onClick={handleSearch} disabled={loading}>
              🔍 {loading ? '搜尋中...' : '搜尋票券'}
            </button>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8}}>
              <span style={{background:'#1a4b8c',color:'#fff',padding:'2px 8px',borderRadius:4,fontSize:12,fontWeight:600}}>TWD</span>
              <span style={{fontSize:13,color:'#666'}}>幣別：新台幣</span>
            </div>
          </div>
        </div>

        {error && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:8,fontSize:13,marginTop:16}}>{error}</div>}

        {/* Results */}
        <div className="results-section">
          <div className="results-wrapper">
            <div className="results-header">
              <h2>熱門票券</h2>
              <span className="results-count">共 {total} 個票券</span>
            </div>

            <div className="hotel-grid">
              {loading && <div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'#888'}}>搜尋票券中...</div>}
              {!loading && items.length === 0 && <div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'#888'}}>沒有符合條件的票券</div>}
              {!loading && items.map(v => (
                <div key={v.voucher_uuid} className="hotel-card" onClick={() => navigate(`/vouchers/${v.voucher_uuid}`)} style={{cursor:'pointer'}}>
                  <div className="hotel-thumbnail-wrapper">
                    <img src={v.image_url || 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600'}
                      alt={v.voucher_name} className="hotel-thumbnail" loading="lazy" />
                    <div className="hotel-rating-overlay">
                      <span style={{background:'rgba(26,75,140,0.9)',padding:'2px 8px',borderRadius:4,fontSize:11}}>
                        {v.category}
                      </span>
                    </div>
                  </div>
                  <div className="hotel-info">
                    <div className="hotel-header-row">
                      <h3 className="hotel-name">{v.voucher_name}</h3>
                      <div className="hotel-price-group">
                        {v.direct_price > v.agency_price && (
                          <span style={{fontSize:12,color:'#888',textDecoration:'line-through'}}>NT$ {v.direct_price.toLocaleString()}</span>
                        )}
                        <span style={{fontSize:18,fontWeight:700,color:'#1a4b8c'}}>NT$ {v.agency_price.toLocaleString()}</span>
                        <span style={{fontSize:12,color:'#888'}}>起 / {v.identity_type}</span>
                      </div>
                    </div>
                    <div className="hotel-location">
                      <span>{v.city_code}</span>
                      {v.spot_relation && <span> · {v.spot_relation}</span>}
                    </div>
                    {v.features && (
                      <p style={{fontSize:13,color:'#555',margin:'6px 0',lineHeight:1.5,
                        display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden'}}>
                        {v.features}
                      </p>
                    )}
                    <div className="hotel-amenities-tags">
                      <span className="amenity-tag">{v.category}</span>
                      <span className="amenity-tag">{v.identity_type}</span>
                      {v.city_code && <span className="amenity-tag">{v.city_code}</span>}
                    </div>
                    <div className="hotel-footer">
                      <span style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace'}}>{v.voucher_code}</span>
                      <button className="btn-hotel-link" onClick={e => { e.stopPropagation(); navigate(`/vouchers/${v.voucher_uuid}`); }}>
                        我要預訂 ↗
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:24}}>
                <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                  style={{padding:'6px 12px',border:'1px solid #ddd',borderRadius:6,background:'#fff',cursor:'pointer'}}>‹</button>
                {Array.from({length: pages}, (_, i) => i+1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{padding:'6px 12px',border:'1px solid #ddd',borderRadius:6,cursor:'pointer',
                      background: p === page ? '#1a4b8c' : '#fff',
                      color: p === page ? '#fff' : '#333'}}>
                    {p}
                  </button>
                ))}
                <button disabled={page===pages} onClick={() => setPage(p=>p+1)}
                  style={{padding:'6px 12px',border:'1px solid #ddd',borderRadius:6,background:'#fff',cursor:'pointer'}}>›</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
