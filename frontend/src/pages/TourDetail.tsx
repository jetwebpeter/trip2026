import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Heart,
  Hotel,
  MapPin,
  Plane,
  Share2,
  Utensils,
  Users,
} from 'lucide-react';
import { getTourVisual } from '../tourVisuals';

interface TourDetailData {
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
  deposit?: number;
  product_description?: string;
  booking_notice?: string;
  transportation?: string;
  tag?: string;
  cover_color?: string;
  cover_image?: string;
  daily?: Array<{
    day_number: number;
    title?: string;
    content?: string;
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    reference_hotels?: string;
  }>;
  flights?: Array<{
    airline?: string;
    flight_no?: string;
    departure_airport?: string;
    arrival_airport?: string;
    departure_datetime?: string;
    arrival_datetime?: string;
  }>;
}

type TabKey = 'features' | 'daily' | 'notice';

const fmt = (n = 0) => 'NT$ ' + n.toLocaleString('en-US');

const fallbackDaily = (tour: TourDetailData) => {
  const visual = getTourVisual(tour);
  return Array.from({ length: tour.duration_days }, (_, i) => ({
    day_number: i + 1,
    title: i === 0 ? `${tour.arrival_city} 抵達與城市巡禮` : `${visual.highlights[i % visual.highlights.length]} 深度體驗`,
    content: i === tour.duration_days - 1
      ? '整理行李並依航班時間前往機場，結束充實的團體旅遊。'
      : `安排 ${tour.arrival_city} 代表景點、在地餐食與團體動線，保留適度自由活動時間。`,
    breakfast: i === 0 ? '敬請自理' : '飯店早餐',
    lunch: '當地特色料理',
    dinner: i === tour.duration_days - 1 ? '機上或自理' : '精選餐廳',
    reference_hotels: i === tour.duration_days - 1 ? '溫暖的家' : `${tour.arrival_city} 精選飯店或同級`,
  }));
};

export default function TourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState<TourDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabKey>('features');
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/tours/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('行程不存在');
        return r.json();
      })
      .then(setTour)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    try {
      const favs = new Set(JSON.parse(localStorage.getItem('tour-favs') || '[]'));
      setFav(!!id && favs.has(id));
    } catch { setFav(false); }
  }, [id]);

  const visual = useMemo(() => tour ? getTourVisual(tour) : null, [tour]);
  const daily = useMemo(() => tour ? (tour.daily?.length ? tour.daily : fallbackDaily(tour)) : [], [tour]);

  const toggleFav = () => {
    if (!id) return;
    const favs = new Set(JSON.parse(localStorage.getItem('tour-favs') || '[]'));
    favs.has(id) ? favs.delete(id) : favs.add(id);
    localStorage.setItem('tour-favs', JSON.stringify([...favs]));
    setFav(favs.has(id));
  };

  if (loading) return <div className="tour-detail-state">載入行程中...</div>;
  if (error || !tour || !visual) return <div className="tour-detail-state">{error || '找不到行程'}</div>;

  return (
    <div className="tour-detail-page">
      <section className="tour-detail-hero" style={{ '--tour-tone': visual.tone } as CSSProperties}>
        <img src={visual.image} alt={tour.tour_product_name} />
        <div className="tour-detail-hero-shade" />
        <div className="container tour-detail-hero-content">
          <button className="tour-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={18} /> 返回列表
          </button>
          <span className="tour-eyebrow">{tour.tour_product_no} · {tour.region}</span>
          <h1>{tour.tour_product_name}</h1>
          <div className="tour-detail-facts">
            <span><MapPin size={16} />{tour.arrival_city}</span>
            <span><Clock3 size={16} />{tour.duration_days} 天</span>
            <span><CalendarDays size={16} />{tour.first_departure_date}</span>
            <span><Users size={16} />{tour.departure_pax || 16} 人成團</span>
          </div>
        </div>
      </section>

      <div className="container tour-detail-layout">
        <main className="tour-detail-main">
          <div className="tour-detail-tabs">
            {([
              ['features', '行程特色'],
              ['daily', '每日行程'],
              ['notice', '注意事項'],
            ] as [TabKey, string][]).map(([k, label]) => (
              <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{label}</button>
            ))}
          </div>

          {tab === 'features' && (
            <section className="tour-detail-section">
              <h2>Features & Highlights</h2>
              <p>{tour.product_description || `${tour.arrival_city} 精選團體旅遊，結合經典景點、特色餐食與適合銷售的明確價格資訊。`}</p>
              <div className="tour-feature-grid">
                {visual.highlights.map(item => (
                  <div key={item}><CheckCircle2 size={20} /><strong>{item}</strong><span>團體旅遊精選安排</span></div>
                ))}
              </div>
            </section>
          )}

          {tab === 'daily' && (
            <section className="tour-detail-section">
              <h2>Daily Schedule</h2>
              <div className="daily-timeline">
                {daily.map(day => (
                  <article key={day.day_number}>
                    <div className="day-badge">Day {day.day_number}</div>
                    <div className="day-card">
                      <h3>{day.title}</h3>
                      <p>{day.content}</p>
                      <div className="day-meta">
                        <span><Utensils size={15} />早 {day.breakfast} / 午 {day.lunch} / 晚 {day.dinner}</span>
                        <span><Hotel size={15} />{day.reference_hotels}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tab === 'notice' && (
            <section className="tour-detail-section">
              <h2>通知及可選旅遊</h2>
              <div className="notice-box">
                <p>{tour.booking_notice || '實際航班、飯店與景點安排以行前說明資料為準。團體行程需達最低成團人數，報名後請依業務通知完成訂金與尾款。'}</p>
                <p>建議旅客攜帶護照、個人常備藥品與符合目的地氣候的衣物。可選旅遊與自費活動將於行前資料中列明。</p>
              </div>
            </section>
          )}
        </main>

        <aside className="tour-booking-sidebar">
          <div className="booking-price">
            <span>同業價 / 人</span>
            <strong>{fmt(tour.agency_price)}</strong>
            <small>直售 {fmt(tour.direct_price)} · 回饋 {tour.agency_rebate_pct}%</small>
          </div>
          <div className="booking-info-list">
            <span><Plane size={16} />{tour.transportation || '團體機位'}</span>
            <span><CalendarDays size={16} />{tour.first_departure_date}</span>
            <span><Users size={16} />訂金 {fmt(tour.deposit || Math.round(tour.agency_price * 0.2))}</span>
          </div>
          <button className="btn-primary booking-cta">立即預訂</button>
          <div className="booking-actions">
            <button onClick={toggleFav}><Heart size={16} fill={fav ? 'currentColor' : 'none'} />{fav ? '已收藏' : '收藏'}</button>
            <button><Share2 size={16} />分享</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
