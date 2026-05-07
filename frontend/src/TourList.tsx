import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  GitCompare,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { getTourVisual } from './tourVisuals';

interface Tour {
  tour_product_no: string;
  tour_product_name: string;
  arrival_city: string;
  region: string;
  city_code?: string;
  departure_pax?: number;
  duration_days: number;
  first_departure_date: string;
  direct_price: number;
  agency_price: number;
  agency_rebate_pct: number;
  tag: string;
  cover_color?: string;
  cover_image?: string;
  keywords?: string;
  product_description?: string;
}

interface ApiResponse {
  total: number;
  page: number;
  pageSize: number;
  items: Tour[];
}

type SortKey = 'price_asc' | 'price_desc' | 'date';

const PAGE_SIZE = 6;
const fmt = (n = 0) => 'NT$ ' + n.toLocaleString('en-US');

function useDebounced<T>(value: T, delay = 300): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setD(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return d;
}

export default function TourList() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('');
  const [days, setDays] = useState('');
  const [maxPrice, setMaxPrice] = useState('999999');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<SortKey>('price_asc');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickView, setQuickView] = useState<Tour | null>(null);
  const [favs, setFavs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('tour-favs') || '[]')); }
    catch { return new Set(); }
  });
  const [compares, setCompares] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('tour-compares') || '[]')); }
    catch { return new Set(); }
  });

  const dKeyword = useDebounced(keyword, 300);
  const dRegion = useDebounced(region, 400);
  const pages = useMemo(() => data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1, [data]);
  const comparedTours = useMemo(
    () => data?.items.filter(t => compares.has(t.tour_product_no)) || [],
    [data, compares],
  );

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      region: dRegion,
      days,
      maxPrice,
      keyword: dKeyword,
      sort,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });

    fetch(`/api/tours?${params}`)
      .then(r => r.json())
      .then((d: ApiResponse) => setData(d))
      .catch(() => setData({ total: 0, page: 1, pageSize: PAGE_SIZE, items: [] }))
      .finally(() => setLoading(false));
  }, [dRegion, days, maxPrice, dKeyword, sort, page]);

  useEffect(() => { setPage(1); }, [dRegion, days, maxPrice, dKeyword]);

  const persistSet = (key: string, next: Set<string>) => localStorage.setItem(key, JSON.stringify([...next]));

  const toggleFav = (id: string) => {
    setFavs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      persistSet('tour-favs', next);
      return next;
    });
  };

  const toggleCompare = (id: string) => {
    setCompares(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      persistSet('tour-compares', next);
      return next;
    });
  };

  const resetFilters = () => {
    setRegion('');
    setDays('');
    setMaxPrice('999999');
    setKeyword('');
    setSort('price_asc');
  };

  return (
    <div className="tour-page container">
      <section className="tour-list-hero">
        <div>
          <span className="tour-eyebrow">B2B2C Group Tour</span>
          <h1>團體旅遊行程</h1>
          <p>以價格、天數、出發日期和同業利潤為核心，快速篩選可銷售的精選團體旅遊產品。</p>
        </div>
        <div className="tour-hero-stats" aria-label="行程統計">
          <div><strong>{data?.total ?? 0}</strong><span>可售行程</span></div>
          <div><strong>{favs.size}</strong><span>收藏</span></div>
          <div><strong>{compares.size}</strong><span>比較</span></div>
        </div>
      </section>

      <section className="tour-search-panel shadow-sm">
        <div className="tour-search-title">
          <SlidersHorizontal size={18} />
          <span>搜尋與篩選</span>
        </div>
        <div className="tour-filter-grid">
          <label>
            <span>目的地 / 國家</span>
            <div className="tour-input-icon">
              <Search size={16} />
              <input value={region} onChange={e => setRegion(e.target.value)} placeholder="東京、日本、TYO..." />
            </div>
          </label>
          <label>
            <span>天數</span>
            <select value={days} onChange={e => setDays(e.target.value)}>
              <option value="">全部天數</option>
              <option value="4">4 天以下</option>
              <option value="6">5-6 天</option>
              <option value="99">7 天以上</option>
            </select>
          </label>
          <label>
            <span>價格上限</span>
            <select value={maxPrice} onChange={e => setMaxPrice(e.target.value)}>
              <option value="999999">不限</option>
              <option value="30000">30,000</option>
              <option value="50000">50,000</option>
              <option value="80000">80,000</option>
            </select>
          </label>
          <label>
            <span>關鍵字</span>
            <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="櫻花、溫泉、古蹟..." />
          </label>
        </div>
        <div className="tour-toolbar">
          <div className="tour-sort-tabs">
            {([
              ['price_asc', '價格低到高'],
              ['price_desc', '價格高到低'],
              ['date', '出發日期'],
            ] as [SortKey, string][]).map(([k, label]) => (
              <button key={k} className={sort === k ? 'active' : ''} onClick={() => setSort(k)}>
                {label}
              </button>
            ))}
          </div>
          <button className="tour-reset-btn" onClick={resetFilters}>清除條件</button>
        </div>
      </section>

      <div className="tour-results-head">
        <div>
          <h2>符合條件的行程</h2>
          <span>{loading ? '搜尋中...' : `共 ${data?.total ?? 0} 筆，顯示第 ${page} / ${pages} 頁`}</span>
        </div>
        {compares.size > 0 && <span className="compare-hint">已加入比較 {compares.size}/3</span>}
      </div>

      <section className="tour-grid-pro">
        {loading && <div className="loading">載入中...</div>}
        {!loading && data?.items.length === 0 && <div className="empty">沒有符合條件的行程</div>}
        {!loading && data?.items.map(t => {
          const visual = getTourVisual(t);
          const highlighted = (t.keywords || '').split(/\s+/).filter(Boolean).slice(0, 2);

          return (
            <article key={t.tour_product_no} className="tour-card-pro">
              <div className="tour-card-media" style={{ '--tour-tone': visual.tone } as CSSProperties}>
                <img src={visual.image} alt={`${t.arrival_city} ${visual.spot}`} loading="lazy" />
                <div className="tour-card-gradient" />
                <div className="tour-media-top">
                  <span className="tour-code-pill">{t.tour_product_no}</span>
                  {t.tag && <span className="tour-badge">{t.tag}</span>}
                </div>
                <button
                  className={`tour-icon-btn fav ${favs.has(t.tour_product_no) ? 'on' : ''}`}
                  onClick={() => toggleFav(t.tour_product_no)}
                  aria-label="收藏"
                  title="收藏"
                >
                  <Heart size={18} fill={favs.has(t.tour_product_no) ? 'currentColor' : 'none'} />
                </button>
                <div className="tour-media-title">
                  <span>{visual.spot}</span>
                  <strong>{t.arrival_city}</strong>
                </div>
              </div>

              <div className="tour-card-content">
                <div className="tour-title-row">
                  <h3>{t.tour_product_name}</h3>
                  <button
                    className={`tour-compare-btn ${compares.has(t.tour_product_no) ? 'on' : ''}`}
                    onClick={() => toggleCompare(t.tour_product_no)}
                    disabled={!compares.has(t.tour_product_no) && compares.size >= 3}
                  >
                    <GitCompare size={15} />
                    {compares.has(t.tour_product_no) ? '比較中' : '比較'}
                  </button>
                </div>

                <div className="tour-info-strip">
                  <span><MapPin size={15} />{t.region}</span>
                  <span><Clock3 size={15} />{t.duration_days} 天</span>
                  <span><CalendarDays size={15} />{t.first_departure_date}</span>
                  <span><Users size={15} />{t.departure_pax || 16} 人成團</span>
                </div>

                <div className="tour-highlights">
                  {[...visual.highlights.slice(0, 3), ...highlighted].slice(0, 4).map(item => (
                    <span key={item}><CheckCircle2 size={14} />{item}</span>
                  ))}
                </div>

                <div className="tour-card-footer">
                  <div className="tour-price-block">
                    <span className="price-original">直售 {fmt(t.direct_price)}</span>
                    <div><span>同業價</span><strong>{fmt(t.agency_price)}</strong></div>
                    <small>回饋 {t.agency_rebate_pct}%</small>
                  </div>
                  <div className="tour-actions">
                    <button className="btn-ghost" onClick={() => setQuickView(t)}>
                      <Eye size={16} /> 快速檢視
                    </button>
                    <button className="btn-primary" onClick={() => navigate(`/tour/${t.tour_product_no}`)}>
                      立即報名
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {data && data.total > 0 && (
        <nav className="pager" aria-label="行程分頁">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button disabled={page === pages} onClick={() => setPage(p => p + 1)}>›</button>
        </nav>
      )}

      {comparedTours.length > 0 && (
        <aside className="compare-tray">
          <div>
            <strong>比較清單</strong>
            <span>{comparedTours.map(t => t.tour_product_name).join('、')}</span>
          </div>
          <button onClick={() => { setCompares(new Set()); localStorage.removeItem('tour-compares'); }}>清空</button>
        </aside>
      )}

      {quickView && (
        <div className="tour-modal-backdrop" role="dialog" aria-modal="true">
          <div className="tour-modal">
            <button className="tour-modal-close" onClick={() => setQuickView(null)} aria-label="關閉">
              <X size={20} />
            </button>
            <img src={getTourVisual(quickView).image} alt={quickView.tour_product_name} />
            <div className="tour-modal-body">
              <span className="tour-eyebrow">{quickView.tour_product_no}</span>
              <h2>{quickView.tour_product_name}</h2>
              <p>{quickView.product_description || `${quickView.arrival_city} ${quickView.duration_days} 天精選團體行程，適合快速上架銷售。`}</p>
              <div className="tour-modal-grid">
                <span>目的地<strong>{quickView.arrival_city}</strong></span>
                <span>出發日<strong>{quickView.first_departure_date}</strong></span>
                <span>天數<strong>{quickView.duration_days} 天</strong></span>
                <span>同業價<strong>{fmt(quickView.agency_price)}</strong></span>
              </div>
              <button className="btn-primary" onClick={() => navigate(`/tour/${quickView.tour_product_no}`)}>
                查看完整行程
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
