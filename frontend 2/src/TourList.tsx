import { useEffect, useMemo, useState } from 'react';
import PopularDestinations from './components/PopularDestinations';

interface Tour {
  tour_product_no: string;
  tour_product_name: string;
  arrival_city: string;
  region: string;
  city_code: string;
  duration_days: number;
  first_departure_date: string;
  direct_price: number;
  agency_price: number;
  agency_rebate_pct: number;
  tag: string;
  cover_color: string;
  cover_image?: string;
}

interface ApiResponse {
  total: number;
  page: number;
  pageSize: number;
  items: Tour[];
}

type SortKey = 'price_asc' | 'price_desc' | 'date';

const PAGE_SIZE = 6;
const fmt = (n: number) => 'NT$ ' + n.toLocaleString('en-US');

// Debounce hook
function useDebounced<T>(value: T, delay = 300): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

export default function TourList() {
  const [region, setRegion] = useState('');
  const [days, setDays] = useState('');
  const [maxPrice, setMaxPrice] = useState('999999');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<SortKey>('price_asc');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [destThumbnails, setDestThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('tour-favs') || '[]')); }
    catch { return new Set(); }
  });

  const dKeyword = useDebounced(keyword, 300);
  const dRegion = useDebounced(region, 400);

  // Fetch thumbnails map from Popular Destinations API
  useEffect(() => {
    const query = region ? `Popular destinations in ${region}` : 'Popular travel destinations';
    fetch(`/api/destinations?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, string> = {};
        d.destinations?.forEach((dest: any) => {
          map[dest.name.toLowerCase()] = dest.thumbnail;
        });
        setDestThumbnails(map);
      })
      .catch(err => console.error('Failed to fetch thumbnails:', err));
  }, [dRegion]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      region: dRegion, days, maxPrice, keyword: dKeyword, sort, page: String(page), pageSize: String(PAGE_SIZE),
    });
    fetch(`/api/tours?${params}`)
      .then(r => r.json())
      .then((d: ApiResponse) => setData(d))
      .catch(() => setData({ total: 0, page: 1, pageSize: PAGE_SIZE, items: [] }))
      .finally(() => setLoading(false));
  }, [dRegion, days, maxPrice, dKeyword, sort, page]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [dRegion, days, maxPrice, dKeyword]);

  const toggleFav = (id: string) => {
    setFavs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('tour-favs', JSON.stringify([...next]));
      return next;
    });
  };

  const pages = useMemo(() => data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1, [data]);

  const getThumbnail = (tour: Tour) => {
    if (tour.cover_image) return tour.cover_image;
    const cityKey = tour.arrival_city?.toLowerCase();
    if (cityKey && destThumbnails[cityKey]) return destThumbnails[cityKey];
    
    // Fallback to dynamic vivid scenery photos based on the city/region / city code
    const keyword = encodeURIComponent(tour.arrival_city || tour.city_code || tour.region || 'landscape');
    return `https://loremflickr.com/800/600/${keyword},scenery,travel/all`;
  };

  return (
    <div className="container">
      <div className="header">
        <div className="logo">
          <div className="logo-box">L</div>
          <span>團體旅遊</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          共 {data?.total ?? '—'} 個行程 · 已收藏{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{favs.size}</span>
        </div>
      </div>

      <PopularDestinations region={dRegion} />

      <div className="filter-bar shadow-sm">
        <div className="filter-grid">
          <div>
            <label>目的地</label>
            <input 
              type="text" 
              placeholder="城市, 國家或 3碼代號 (如 TYO)" 
              title="目的地"
              value={region} 
              onChange={e => setRegion(e.target.value)} 
            />
          </div>
          <div>
            <label>天數</label>
            <select title="天數" value={days} onChange={e => setDays(e.target.value)}>
              <option value="">全部</option>
              <option value="4">4 天以下</option>
              <option value="6">5-6 天</option>
              <option value="99">7 天以上</option>
            </select>
          </div>
          <div>
            <label>價格上限</label>
            <select title="價格上限" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}>
              <option value="999999">不限</option>
              <option value="30000">30,000</option>
              <option value="50000">50,000</option>
              <option value="80000">80,000</option>
            </select>
          </div>
          <div>
            <label>關鍵字</label>
            <input type="text" placeholder="櫻花 / 溫泉..." value={keyword} onChange={e => setKeyword(e.target.value)} />
          </div>
        </div>
        <div className="sort-row">
          <div className="sort-group">
            <span className="label">排序</span>
            {([
              ['price_asc', '價格低→高'],
              ['price_desc', '價格高→低'],
              ['date', '出發日期'],
            ] as [SortKey, string][]).map(([k, label]) => (
              <button key={k} className={`btn-sort ${sort === k ? 'active' : ''}`} onClick={() => setSort(k)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tour-grid">
        {loading && <div className="loading">載入中...</div>}
        {!loading && data?.items.length === 0 && <div className="empty">沒有符合條件的行程</div>}
        {!loading && data?.items.map(t => (
          <div key={t.tour_product_no} className="tour-card" onClick={() => alert('開啟行程 ' + t.tour_product_no)}>
            <div className="tour-img">
              <img 
                src={getThumbnail(t)} 
                alt={t.tour_product_name}
                className="tour-card-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800';
                }}
              />
              <div className="tour-img-overlay"></div>
              {t.tag && <div className="tour-badge">{t.tag}</div>}
              <button
                className={`fav-btn ${favs.has(t.tour_product_no) ? 'on' : ''}`}
                onClick={e => { e.stopPropagation(); toggleFav(t.tour_product_no); }}
                aria-label="收藏"
              >♥</button>
              <span className="tour-card-title">{t.tour_product_name}</span>
            </div>
            <div className="tour-body">
              <div className="tour-meta">
                <span>{t.region} · {t.duration_days} 天</span>
                <span>{t.first_departure_date}</span>
              </div>
              <div className="price-original">直售 {fmt(t.direct_price)}</div>
              <div className="price-row">
                <div>
                  <span className="price-label">同業價 </span>
                  <span className="price-agency">{fmt(t.agency_price)}</span>
                </div>
                <span className="rebate-badge">{t.agency_rebate_pct}%</span>
              </div>
              <div className="card-actions">
                <button className="btn-primary" onClick={e => { e.stopPropagation(); alert('報名 ' + t.tour_product_no); }}>
                  立即報名
                </button>
                <button className="btn-ghost" onClick={e => { e.stopPropagation(); alert('快覽 ' + t.tour_product_no); }}>
                  快覽
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data && data.total > 0 && (
        <div className="pager">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button disabled={page === pages} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}
    </div>
  );
}
