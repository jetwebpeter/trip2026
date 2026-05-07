import { useMemo, useState } from 'react';
import { Anchor, CalendarDays, Clock3, Database, MapPin, Search, Ship, Sparkles } from 'lucide-react';
import cruiseSample from '../data/cruises.sample.json';

interface CruiseItem {
  id: string;
  shipName: string;
  cruiseLine: string;
  title: string;
  departurePort: string;
  arrivalPort: string;
  registry: string;
  nights: number;
  departureDate: string;
  cabinType: string;
  currency: keyof typeof cruiseSample.exchangeRatesToTwd;
  priceFrom: number;
  taxesAndFees: number;
  imageUrl: string;
  badge: string;
  theme: string;
  features: string[];
}

const data = cruiseSample.items as CruiseItem[];
const rates = cruiseSample.exchangeRatesToTwd;
const fmtTwd = (value: number) => 'NT$ ' + Math.round(value).toLocaleString('en-US');

export default function CruiseList() {
  const [keyword, setKeyword] = useState('');
  const [nights, setNights] = useState('');
  const [sort, setSort] = useState<'price_asc' | 'date'>('price_asc');

  const items = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return data
      .filter(item => !kw || `${item.title} ${item.shipName} ${item.cabinType} ${item.theme}`.toLowerCase().includes(kw))
      .filter(item => !nights || item.nights === Number(nights))
      .sort((a, b) => {
        if (sort === 'date') return a.departureDate.localeCompare(b.departureDate);
        return (a.priceFrom * rates[a.currency]) - (b.priceFrom * rates[b.currency]);
      });
  }, [keyword, nights, sort]);

  return (
    <div className="container cruise-page">
      <section className="cruise-hero">
        <div>
          <span className="tour-eyebrow">Cruise Product</span>
          <h1>郵輪</h1>
          <p>API key 尚未串接前，暫以本地 JSON 作為資料來源；價格會依 JSON 匯率自動換算為新台幣。</p>
          <div className="cruise-source-pill">
            <Database size={15} />
            <span>{cruiseSample.source} · 匯率更新 {cruiseSample.updatedAt}</span>
          </div>
        </div>
      </section>

      <section className="cruise-filter">
        <label>
          <span>搜尋郵輪</span>
          <div className="tour-input-icon">
            <Search size={16} />
            <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Disney Adventure、陽台艙..." />
          </div>
        </label>
        <label>
          <span>航程天數</span>
          <select value={nights} onChange={e => setNights(e.target.value)}>
            <option value="">全部</option>
            <option value="3">3 晚</option>
            <option value="4">4 晚</option>
          </select>
        </label>
        <label>
          <span>排序</span>
          <select value={sort} onChange={e => setSort(e.target.value as 'price_asc' | 'date')}>
            <option value="price_asc">NTD 價格低到高</option>
            <option value="date">出發日期</option>
          </select>
        </label>
      </section>

      <div className="cruise-grid">
        {items.map(item => {
          const baseTwd = item.priceFrom * rates[item.currency];
          const totalTwd = (item.priceFrom + item.taxesAndFees) * rates[item.currency];

          return (
            <article className="cruise-card" key={item.id}>
              <div className="cruise-media">
                <img
                  src={item.imageUrl}
                  alt={`${item.shipName} ${item.title}`}
                  loading="lazy"
                  onError={e => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548574505-5e239809ee19?q=80&w=1200&auto=format&fit=crop';
                  }}
                />
                <span>{item.badge}</span>
              </div>
              <div className="cruise-body">
                <div className="cruise-title-row">
                  <div>
                    <small>{item.cruiseLine}</small>
                    <h2>{item.title}</h2>
                  </div>
                  <Ship size={28} />
                </div>

                <div className="cruise-facts">
                  <span><Anchor size={15} />{item.shipName}</span>
                  <span><MapPin size={15} />{item.departurePort}</span>
                  <span><Clock3 size={15} />{item.nights} 晚</span>
                  <span><CalendarDays size={15} />{item.departureDate}</span>
                </div>

                <div className="cruise-features">
                  {item.features.map(feature => <span key={feature}><Sparkles size={14} />{feature}</span>)}
                </div>

                <div className="cruise-footer">
                  <div>
                    <span className="cruise-currency">{item.currency} {item.priceFrom.toLocaleString()} 起 · 匯率 {rates[item.currency]}</span>
                    <strong>{fmtTwd(baseTwd)}</strong>
                    <small>含稅費估算 {fmtTwd(totalTwd)} / 人</small>
                  </div>
                  <button className="btn-primary">詢問艙房</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
