// ============================================
// B2B2C Travel — Full Server
// APIs: Hotels / Flights / Map / Chat / Vouchers / Tour Admin
// + Serves frontend static files from ../frontend/dist
// Run: node hotel-server-v6.mjs
// ============================================

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

let db;
try { db = new Database('tours.db'); } catch { db = null; }

const SERPAPI_KEY = '8c166a1ca434eb4d5db17e55dad3ac385488f2d23579e25c7b7ed29a5e6ce77e';
const nodeFetch = globalThis.fetch;

// ================================================================
// HOTEL APIs
// ================================================================
app.get('/api/hotels/search', async (req, res) => {
  const { q, check_in_date, check_out_date, adults = 2, children, children_ages,
    gl = 'tw', hl = 'zh-tw', currency = 'TWD' } = req.query;
  if (!q || !check_in_date || !check_out_date)
    return res.status(400).json({ error: 'q, check_in_date, check_out_date required' });
  const params = new URLSearchParams({
    engine: 'google_hotels', api_key: SERPAPI_KEY,
    q, check_in_date, check_out_date, adults: String(adults), gl, hl, currency
  });
  if (children) params.set('children', String(children));
  if (children_ages) params.set('children_ages', children_ages);
  console.log('[Hotel]', q);
  try {
    const resp = await nodeFetch('https://serpapi.com/search.json?' + params);
    const data = await resp.json();
    if (data.error) return res.status(502).json({ error: data.error });
    res.json({ properties: data.properties || [], total: (data.properties || []).length });
  } catch (err) { res.status(502).json({ error: err.message }); }
});

app.get('/api/hotels', async (req, res) => {
  const { q, adults = 2, children, children_ages } = req.query;
  if (!q) return res.status(400).json({ error: 'q required' });
  const cin = req.query.check_in_date || new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const cout = req.query.check_out_date || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    engine: 'google_hotels', api_key: SERPAPI_KEY,
    q, check_in_date: cin, check_out_date: cout, adults: String(adults), gl: 'tw', hl: 'zh-tw', currency: 'TWD'
  });
  if (children) params.set('children', String(children));
  if (children_ages) params.set('children_ages', children_ages);
  try {
    const resp = await nodeFetch('https://serpapi.com/search.json?' + params);
    const data = await resp.json();
    if (data.error) return res.status(502).json({ error: data.error });
    res.json({ properties: data.properties || [], brands: data.brands || [], total: (data.properties || []).length });
  } catch (err) { res.status(502).json({ error: err.message }); }
});

app.get('/api/hotels/details', async (req, res) => {
  const { property_token, check_in_date, check_out_date, adults = 2, children, children_ages,
    gl = 'tw', hl = 'zh-tw', currency = 'TWD' } = req.query;
  if (!property_token || !check_in_date || !check_out_date)
    return res.status(400).json({ error: 'property_token, check_in_date, check_out_date required' });
  
  const params = new URLSearchParams({
    engine: 'google_hotels', api_key: SERPAPI_KEY,
    property_token, check_in_date, check_out_date, adults: String(adults), gl, hl, currency
  });
  if (children) params.set('children', String(children));
  if (children_ages) params.set('children_ages', children_ages);
  
  console.log('[Hotel Details] token:', property_token);
  try {
    const resp = await nodeFetch('https://serpapi.com/search.json?' + params);
    const data = await resp.json();
    if (data.error) return res.status(502).json({ error: data.error });
    res.json(data);
  } catch (err) { res.status(502).json({ error: err.message }); }
});

app.get('/api/hotels/photos', async (req, res) => {
  const { property_token } = req.query;
  if (!property_token)
    return res.status(400).json({ error: 'property_token required' });
  
  const params = new URLSearchParams({
    engine: 'google_hotels_photos',
    api_key: SERPAPI_KEY,
    property_token
  });
  
  console.log('[Hotel Photos] token:', property_token);
  try {
    const resp = await nodeFetch('https://serpapi.com/search.json?' + params);
    const data = await resp.json();
    if (data.error) return res.status(502).json({ error: data.error });
    res.json(data);
  } catch (err) { res.status(502).json({ error: err.message }); }
});

app.get('/api/hotels/map', async (req, res) => {
  const { q = 'Hotels', ll, gl = 'tw', hl = 'zh-tw' } = req.query;
  if (!ll) return res.status(400).json({ error: 'll required' });
  const params = new URLSearchParams({ engine: 'google_maps', api_key: SERPAPI_KEY, q, ll, type: 'search', gl, hl });
  try {
    const resp = await nodeFetch('https://serpapi.com/search.json?' + params);
    const d = await resp.json();
    if (d.error) return res.status(502).json({ error: d.error });
    const items = (d.local_results || []).map(r => ({
      title: r.title || '', rating: r.rating || null, reviews: r.reviews || 0,
      price: r.price || '', address: r.address || '', thumbnail: r.thumbnail || '',
      lat: r.gps_coordinates?.latitude || null, lng: r.gps_coordinates?.longitude || null,
      place_id: r.place_id || '', website: r.website || ''
    }));
    res.json({ results: items, total: items.length });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

// ================================================================
// FLIGHTS
// ================================================================
app.get(['/api/flights/search', '/api/flights'], async (req, res) => {
  const { departure_id, arrival_id, outbound_date, return_date, type = 1, travel_class = 1,
    adults = 1, children = 0, currency = 'TWD', hl = 'zh-tw', gl = 'tw', stops, sort_by } = req.query;
  if (!departure_id || !arrival_id || !outbound_date)
    return res.status(400).json({ error: 'missing required params' });
  const params = new URLSearchParams({
    engine: 'google_flights', api_key: SERPAPI_KEY, departure_id, arrival_id, outbound_date,
    type: String(type), travel_class: String(travel_class), adults: String(adults), children: String(children), currency, hl, gl
  });
  if (return_date) params.set('return_date', return_date);
  if (stops) params.set('stops', stops);
  if (sort_by) params.set('sort_by', sort_by);
  try {
    const resp = await nodeFetch('https://serpapi.com/search.json?' + params);
    const d = await resp.json();
    if (d.error) return res.status(502).json({ error: d.error });
    res.json({ best_flights: d.best_flights || [], other_flights: d.other_flights || [], price_insights: d.price_insights || {} });
  } catch (err) { res.status(502).json({ error: err.message }); }
});

const localTranslations = {
  '/m/01nfpd': { zh: '臺灣桃園國際機場', en: 'Taiwan Taoyuan International Airport', code: 'TPE' },
  '/m/06t82': { zh: '新加坡樟宜機場', en: 'Singapore Changi Airport', code: 'SIN' },
  '/m/01lk6h': { zh: '成田國際機場', en: 'Narita International Airport', code: 'NRT' },
  '/m/07dfk': { zh: '東京', en: 'Tokyo', code: 'TYO' },
  '/m/03s24': { zh: '香港國際機場', en: 'Hong Kong International Airport', code: 'HKG' },
  '/m/03h64': { zh: '香港', en: 'Hong Kong', code: 'HKG' },
  '/m/06d_q': { zh: '仁川國際機場', en: 'Incheon International Airport', code: 'ICN' },
  '/m/0_v5z': { zh: '素萬那普機場', en: 'Suvarnabhumi Airport', code: 'BKK' },
  '/m/04y5w': { zh: '關西國際機場', en: 'Kansai International Airport', code: 'KIX' },
  '/m/0qk79': { zh: '巴黎夏爾·戴高樂機場', en: 'Paris Charles de Gaulle Airport', code: 'CDG' },
  '/m/0cdh': { zh: '巴黎', en: 'Paris', code: 'PAR' },
  '/m/04jpl': { zh: '倫敦', en: 'London', code: 'LON' },
  '/m/043r0': { zh: '倫敦希斯洛機場', en: 'London Heathrow Airport', code: 'LHR' },
  '/m/02_286': { zh: '紐約', en: 'New York', code: 'NYC' },
  '/m/0f3vy': { zh: '洛杉磯', en: 'Los Angeles', code: 'LAX' },
  '/m/0cdh9': { zh: '舊金山', en: 'San Francisco', code: 'SFO' },
  '/m/01cx_': { zh: '西雅圖', en: 'Seattle', code: 'SEA' },
  '/m/09f07': { zh: '雪梨', en: 'Sydney', code: 'SYD' },
  '/m/02kcd': { zh: '溫哥華', en: 'Vancouver', code: 'YVR' },
  '/m/05qtj': { zh: '那霸機場', en: 'Naha Airport', code: 'OKA' },
  '/m/02vtb': { zh: '澳門國際機場', en: 'Macau International Airport', code: 'MFM' },
  '/m/0h7h7': { zh: '胡志明市', en: 'Ho Chi Minh City', code: 'SGN' },
  '/m/06v81': { zh: '新山一國際機場', en: 'Tan Son Nhat International Airport', code: 'SGN' },
  '/m/0d6lp': { zh: '吉隆坡國際機場', en: 'Kuala Lumpur International Airport', code: 'KUL' },
  '/m/03_d_': { zh: '北京', en: 'Beijing', code: 'BJS' },
  '/m/01_8d': { zh: '北京首都國際機場', en: 'Beijing Capital International Airport', code: 'PEK' },
  '/m/011y4_s': { zh: '北京大興國際機場', en: 'Beijing Daxing International Airport', code: 'PKX' },
  '/m/06wxg': { zh: '上海', en: 'Shanghai', code: 'SHA' },
  '/m/034x78': { zh: '上海浦東國際機場', en: 'Shanghai Pudong International Airport', code: 'PVG' },
  '/m/034x6y': { zh: '上海虹橋國際機場', en: 'Shanghai Hongqiao International Airport', code: 'SHA' },

  // IATA direct code mappings
  'TPE': { zh: '桃園機場', en: 'Taoyuan Airport' },
  'TSA': { zh: '松山機場', en: 'Songshan Airport' },
  'PVG': { zh: '上海浦東機場', en: 'Pudong Airport' },
  'SHA': { zh: '上海虹橋機場', en: 'Hongqiao Airport' },
  'SIN': { zh: '新加坡樟宜機場', en: 'Changi Airport' },
  'NRT': { zh: '成田機場', en: 'Narita Airport' },
  'HND': { zh: '羽田機場', en: 'Haneda Airport' },
  'HKG': { zh: '香港機場', en: 'Hong Kong Airport' },
  'ICN': { zh: '仁川機場', en: 'Incheon Airport' },
  'BKK': { zh: '素萬那普機場', en: 'Suvarnabhumi Airport' },
  'KIX': { zh: '關西機場', en: 'Kansai Airport' },
  'CDG': { zh: '戴高樂機場', en: 'Charles de Gaulle Airport' }
};

const wordTranslations = {
  '日本': 'Japan',
  '台灣': 'Taiwan',
  '臺灣': 'Taiwan',
  '中國': 'China',
  '韓國': 'Korea',
  '泰國': 'Thailand',
  '法國': 'France',
  '英國': 'United Kingdom',
  '美國': 'United States',
  '澳洲': 'Australia',
  '加拿大': 'Canada',
  '首都': ' Capital',
  '國際機場': ' International Airport',
  '機場': ' Airport',
  '位於': 'Located in ',
  '的機場': ' Airport'
};

function getEnglishTranslation(zhName, id) {
  if (id && localTranslations[id]) return localTranslations[id].en;
  for (const val of Object.values(localTranslations)) {
    if (zhName.includes(val.zh)) return val.en;
  }
  let enName = zhName;
  for (const [zhWord, enWord] of Object.entries(wordTranslations)) {
    enName = enName.replaceAll(zhWord, enWord);
  }
  return enName !== zhName ? enName : null;
}

function getChineseTranslation(enName, id) {
  if (id && localTranslations[id]) return localTranslations[id].zh;
  for (const val of Object.values(localTranslations)) {
    if (enName.toLowerCase().includes(val.en.toLowerCase())) return val.zh;
  }
  return null;
}

function processSuggestions(list, targetHl) {
  const result = [];
  list.forEach(s => {
    // 1. Process the main suggestion (city or airport)
    const processedS = { ...s };
    const engName = getEnglishTranslation(s.name, s.id);
    const zhName = getChineseTranslation(s.name, s.id);
    
    if (targetHl === 'zh-tw' || !targetHl) {
      if (engName && !s.name.toLowerCase().includes(engName.toLowerCase())) {
        processedS.name = `${s.name} (${engName})`;
      }
    } else {
      if (zhName && !s.name.includes(zhName)) {
        processedS.name = `${zhName} (${s.name})`;
      }
    }
    
    if (s.description) {
      const engDesc = getEnglishTranslation(s.description, null);
      if (engDesc && !s.description.toLowerCase().includes(engDesc.toLowerCase())) {
        processedS.description = `${s.description} (${engDesc})`;
      }
    }
    
    if (s.type === 'airport' && s.id && s.id.length === 3) {
      processedS.code = s.id.toUpperCase();
    }
    
    result.push(processedS);
    
    // 2. If it's a city and has child airports, flatten them
    if (s.type === 'city' && Array.isArray(s.airports)) {
      s.airports.forEach(airport => {
        const airportId = airport.id;
        const airportCode = airportId.toUpperCase();
        
        let zhApName = airport.name;
        let enApName = airport.enName || '';
        
        if (localTranslations[airportId]) {
          zhApName = localTranslations[airportId].zh;
          enApName = localTranslations[airportId].en;
        } else if (localTranslations[airportCode]) {
          zhApName = localTranslations[airportCode].zh;
          enApName = localTranslations[airportCode].en;
        } else if (!enApName) {
          const trans = getEnglishTranslation(airport.name, airportId);
          if (trans) enApName = trans;
        }
        
        let displayApName = zhApName;
        if (enApName && !zhApName.toLowerCase().includes(enApName.toLowerCase())) {
          displayApName = `${zhApName} (${enApName})`;
        }
        
        let desc = `${s.name.split(' (')[0]}`;
        if (airport.distance) {
          desc += ` · ${airport.distance}`;
        }
        
        result.push({
          position: s.position,
          id: airportId,
          code: airportCode,
          name: displayApName,
          type: 'airport',
          description: desc
        });
      });
    }
  });
  return result;
}

app.get('/api/flights/autocomplete', async (req, res) => {
  const { q, hl, gl = 'tw' } = req.query;
  if (!q) return res.status(400).json({ error: 'missing query q' });

  if (hl) {
    const params = new URLSearchParams({
      engine: 'google_flights_autocomplete', api_key: SERPAPI_KEY, q, hl, gl, exclude_regions: 'true'
    });
    try {
      const resp = await nodeFetch('https://serpapi.com/search.json?' + params);
      const d = await resp.json();
      if (d.error) return res.status(502).json({ error: d.error });
      return res.json({ suggestions: processSuggestions(d.suggestions || [], hl) });
    } catch (err) { return res.status(502).json({ error: err.message }); }
  }

  const hasChinese = /[\u4e00-\u9fa5]/.test(q);

  if (hasChinese) {
    const params = new URLSearchParams({
      engine: 'google_flights_autocomplete', api_key: SERPAPI_KEY, q, hl: 'zh-tw', gl, exclude_regions: 'true'
    });
    try {
      const resp = await nodeFetch('https://serpapi.com/search.json?' + params);
      const d = await resp.json();
      if (d.error) return res.status(502).json({ error: d.error });
      return res.json({ suggestions: processSuggestions(d.suggestions || [], 'zh-tw') });
    } catch (err) { return res.status(502).json({ error: err.message }); }
  } else {
    try {
      const paramsTw = new URLSearchParams({
        engine: 'google_flights_autocomplete', api_key: SERPAPI_KEY, q, hl: 'zh-tw', gl, exclude_regions: 'true'
      });
      const paramsEn = new URLSearchParams({
        engine: 'google_flights_autocomplete', api_key: SERPAPI_KEY, q, hl: 'en', gl, exclude_regions: 'true'
      });

      const [respTw, respEn] = await Promise.all([
        nodeFetch('https://serpapi.com/search.json?' + paramsTw).then(r => r.json()).catch(() => ({})),
        nodeFetch('https://serpapi.com/search.json?' + paramsEn).then(r => r.json()).catch(() => ({}))
      ]);

      const listTw = respTw.suggestions || [];
      const listEn = respEn.suggestions || [];
      const suggestions = [];
      const usedIds = new Set();

      listTw.forEach(sTw => {
        const sEn = listEn.find(e => e.id === sTw.id);
        const merged = { ...sTw };
        if (sEn) {
          if (sTw.name !== sEn.name) {
            merged.name = `${sTw.name} (${sEn.name})`;
          }
          if (sTw.description && sEn.description && sTw.description !== sEn.description) {
            merged.description = `${sTw.description} (${sEn.description})`;
          }
          if (Array.isArray(sTw.airports)) {
            merged.airports = sTw.airports.map(ap => {
              const apEn = sEn.airports ? sEn.airports.find(e => e.id === ap.id) : null;
              return {
                ...ap,
                enName: apEn ? apEn.name : null
              };
            });
          }
        } else {
          const engName = getEnglishTranslation(sTw.name, sTw.id);
          if (engName && !sTw.name.toLowerCase().includes(engName.toLowerCase())) {
            merged.name = `${sTw.name} (${engName})`;
          }
        }
        suggestions.push(merged);
        if (sTw.id) usedIds.add(sTw.id);
      });

      listEn.forEach(sEn => {
        if (sEn.id && usedIds.has(sEn.id)) return;
        const merged = { ...sEn };
        const zhName = getChineseTranslation(sEn.name, sEn.id);
        if (zhName && !sEn.name.includes(zhName)) {
          merged.name = `${zhName} (${sEn.name})`;
        }
        suggestions.push(merged);
      });

      return res.json({ suggestions: processSuggestions(suggestions, 'zh-tw') });
    } catch (err) {
      return res.status(502).json({ error: err.message });
    }
  }
});

// ================================================================
// CHATBOT
// ================================================================
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'no message' });
  const m = message.toLowerCase();
  let reply = '', suggestions = [], products = [];
  if (/你好|嗨|hello|hi/.test(m)) {
    reply = '您好！歡迎使用旅遊客服。';
    suggestions = ['推薦行程', '有什麼票券', '怎麼報名'];
  } else if (/推薦|建議|去哪|日本|韓國/.test(m)) {
    if (db) {
      const ts = db.prepare('SELECT tour_product_no,tour_product_name,duration_days,agency_price FROM tour_products ORDER BY agency_price LIMIT 5').all();
      reply = '為您推薦：\n';
      ts.forEach(t => { reply += '• ' + t.tour_product_name + '｜' + t.duration_days + '天｜NT$ ' + (t.agency_price || 0).toLocaleString() + '\n'; });
      products = ts.map(t => ({ type: 'tour', id: t.tour_product_no, name: t.tour_product_name }));
    }
    suggestions = ['有沒有票券', '怎麼報名'];
  } else if (/票券|門票/.test(m)) {
    if (db) {
      const vs = db.prepare("SELECT voucher_uuid,voucher_name,category,agency_price FROM land_services WHERE audit_status='approved' AND publish_status='published' LIMIT 6").all();
      reply = '可購買的票券：\n';
      vs.forEach(v => { reply += '• ' + v.voucher_name + '（' + v.category + '）｜NT$ ' + (v.agency_price || 0).toLocaleString() + '\n'; });
      products = vs.map(v => ({ type: 'voucher', id: v.voucher_uuid, name: v.voucher_name }));
    }
    suggestions = ['推薦行程', '怎麼預訂'];
  } else {
    reply = '我是旅遊客服，可以幫您推薦行程、查價格、看票券。';
    suggestions = ['推薦行程', '有什麼票券', '怎麼報名'];
  }
  res.json({ reply, suggestions, products, timestamp: new Date().toISOString() });
});

// ================================================================
// VOUCHER TABLE + SEED
// ================================================================
if (db) {
  db.exec(`CREATE TABLE IF NOT EXISTS land_services (
    voucher_uuid TEXT PRIMARY KEY, voucher_code TEXT UNIQUE NOT NULL, voucher_name TEXT NOT NULL,
    city_code TEXT, category TEXT, valid_from TEXT, valid_to TEXT,
    spot_relation TEXT, features TEXT, notice TEXT, identity_type TEXT,
    direct_price REAL DEFAULT 0, agency_price REAL DEFAULT 0, deposit REAL DEFAULT 0,
    status TEXT DEFAULT 'draft', audit_status TEXT DEFAULT 'pending', publish_status TEXT DEFAULT 'unpublished',
    provider_tax_id TEXT, image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
    audited_at TEXT, published_at TEXT, withdrawn_at TEXT
  )`);

  const cnt = db.prepare('SELECT COUNT(*) as c FROM land_services').get();
  if (cnt.c === 0) {
    const IMGS = [
      'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600',
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600',
      'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600',
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600',
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600',
      'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600',
      'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600'
    ];
    const seeds = [
      ['新加坡環球影城快捷票', 'SIN', '票券', '環球影城', '免排隊快速通關', '出示電子票券', '成人', 2400, 2100, 0],
      ['東京迪士尼一日護照', 'TYO', '門票', '東京迪士尼', '全日無限搭乘', '需提前3日預訂', '成人', 3200, 2880, 500],
      ['首爾機場快線 AREX', 'SEL', '交通', '仁川機場', '直達首爾站43分', '30日內使用', '成人', 280, 250, 0],
      ['京都嵐山保津川一日遊', 'KYO', '地接行程', '嵐山', '含中文司導', '不含午餐', '成人', 8500, 7600, 2000],
      ['曼谷大皇宮門票', 'BKK', '門票', '大皇宮', '含玉佛寺', '著有袖上衣', '成人', 520, 460, 0],
      ['香港海洋公園門票', 'HKG', '門票', '海洋公園', '全日無限', '兒童需3歲', '成人', 1800, 1600, 0],
      ['大阪周遊卡一日券', 'OSA', '票券', '大阪市區', '40+景點免費', '限當日使用', '成人', 950, 850, 0],
      ['峇里島 SPA 療程', 'DPS', '票券', '烏布', '90分鐘按摩', '提前24hr預訂', '成人', 1200, 1050, 0],
      ['沖繩美麗海水族館', 'OKA', '門票', '美麗海水族館', '黑潮之海觀賞', '6歲以下免費', '成人', 650, 580, 0],
      ['澳門旅遊塔笨豬跳', 'MFM', '票券', '澳門旅遊塔', '全球最高233m', '40-120kg', '成人', 5800, 5200, 1000],
      ['越南古芝地道半日遊', 'SGN', '地接行程', '古芝地道', '含酒店接送', '約5-6小時', '成人', 980, 860, 0],
      ['富士山河口湖一日遊', 'TYO', '地接行程', '富士山', '新宿出發', '冬季不上五合目', '成人', 3500, 3100, 500]
    ];
    const ins = db.prepare(`INSERT INTO land_services (voucher_uuid,voucher_code,voucher_name,city_code,category,spot_relation,features,notice,identity_type,direct_price,agency_price,deposit,audit_status,publish_status,image_url,audited_at,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'approved','published',?,datetime('now'),datetime('now'))`);
    seeds.forEach((s, i) => ins.run(crypto.randomUUID(), 'TCKT' + String(i + 1).padStart(8, '0'), ...s, IMGS[i]));
    console.log('[Voucher] Seeded', seeds.length);
  }
}

// ================================================================
// VOUCHER APIs
// ================================================================
app.get('/api/vouchers', (req, res) => {
  if (!db) return res.json({ items: [], total: 0 });
  const { city, category, keyword, sort = 'price_asc', page = 1, pageSize = 20 } = req.query;
  const w = ["audit_status='approved'", "publish_status='published'"], p = {};
  if (city) { w.push('city_code=@city'); p.city = city; }
  if (category) { w.push('category=@category'); p.category = category; }
  if (keyword) { w.push('(voucher_name LIKE @kw OR features LIKE @kw)'); p.kw = '%' + keyword + '%'; }
  const sm = { price_asc: 'agency_price ASC', price_desc: 'agency_price DESC', newest: 'created_at DESC' };
  const ws = 'WHERE ' + w.join(' AND '), ob = sm[sort] || sm.price_asc;
  const total = db.prepare('SELECT COUNT(*) c FROM land_services ' + ws).get(p).c;
  const items = db.prepare('SELECT * FROM land_services ' + ws + ' ORDER BY ' + ob + ' LIMIT @l OFFSET @o').all({ ...p, l: +pageSize, o: (+page - 1) * (+pageSize) });
  res.json({ total, page: +page, pageSize: +pageSize, items });
});

app.get('/api/vouchers/:id', (req, res) => {
  if (!db) return res.status(404).json({ error: 'No DB' });
  const v = db.prepare('SELECT * FROM land_services WHERE voucher_uuid=?').get(req.params.id);
  v ? res.json(v) : res.status(404).json({ error: 'Not found' });
});

app.get('/api/admin/vouchers', (req, res) => {
  if (!db) return res.json({ items: [] });
  res.json({ items: db.prepare('SELECT * FROM land_services ORDER BY created_at DESC').all() });
});

app.post('/api/admin/vouchers', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  const b = req.body, uuid = crypto.randomUUID();
  const last = db.prepare('SELECT voucher_code FROM land_services ORDER BY voucher_code DESC LIMIT 1').get();
  const code = 'TCKT' + String(last ? parseInt(last.voucher_code.replace('TCKT', ''), 10) + 1 : 1).padStart(8, '0');
  const img = b.image_url || 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600';
  db.prepare(`INSERT INTO land_services (voucher_uuid,voucher_code,voucher_name,city_code,category,valid_from,valid_to,spot_relation,features,notice,identity_type,direct_price,agency_price,deposit,image_url,audit_status,publish_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending','unpublished')`)
    .run(uuid, code, b.voucher_name || '', b.city_code || 'SIN', b.category || '票券', b.valid_from || null, b.valid_to || null,
      b.spot_relation || '', b.features || '', b.notice || '', b.identity_type || '成人',
      b.direct_price || 0, b.agency_price || 0, b.deposit || 0, img);
  res.json({ ok: true, voucher_uuid: uuid, voucher_code: code });
});

app.put('/api/admin/vouchers/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  const b = req.body;
  db.prepare(`UPDATE land_services SET voucher_name=?,city_code=?,category=?,valid_from=?,valid_to=?,spot_relation=?,features=?,notice=?,identity_type=?,direct_price=?,agency_price=?,deposit=?,image_url=COALESCE(NULLIF(?,''),image_url),updated_at=datetime('now') WHERE voucher_uuid=?`)
    .run(b.voucher_name, b.city_code, b.category, b.valid_from || null, b.valid_to || null,
      b.spot_relation, b.features, b.notice, b.identity_type,
      b.direct_price, b.agency_price, b.deposit, b.image_url || '', req.params.id);
  res.json({ ok: true });
});

app.post('/api/admin/vouchers/:id/audit', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  const { decision } = req.body;
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ error: 'Bad' });
  db.prepare("UPDATE land_services SET audit_status=?,audited_at=datetime('now'),updated_at=datetime('now') WHERE voucher_uuid=?").run(decision, req.params.id);
  res.json({ ok: true });
});

app.post('/api/admin/vouchers/:id/publish', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  db.prepare("UPDATE land_services SET publish_status='published',published_at=datetime('now'),updated_at=datetime('now') WHERE voucher_uuid=?").run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/admin/vouchers/:id/withdraw', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  db.prepare("UPDATE land_services SET publish_status='withdrawn',withdrawn_at=datetime('now'),updated_at=datetime('now') WHERE voucher_uuid=?").run(req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/vouchers/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  db.prepare('DELETE FROM land_services WHERE voucher_uuid=?').run(req.params.id);
  res.json({ ok: true });
});

// ================================================================
// TOUR ADMIN
// ================================================================
app.get('/api/admin/tours', (req, res) => {
  if (!db) return res.json({ items: [] });
  res.json({ items: db.prepare('SELECT * FROM tour_products ORDER BY created_at DESC').all() });
});

// TOURS - Full DB Queries
app.get('/api/tours', (req, res) => {
  if (!db) return res.json({ items: [], total: 0 });
  const { region, days, maxPrice, keyword, sort = 'price_asc', page = 1, pageSize = 6 } = req.query;
  const where = [];
  const params = {};
  if (region) { 
    where.push('(region LIKE @region OR arrival_city LIKE @region OR city_code = @regionOrCode)'); 
    params.region = `%${region}%`; 
    params.regionOrCode = region.toUpperCase();
  }
  if (days === '4') where.push('duration_days <= 4');
  else if (days === '6') where.push('duration_days BETWEEN 5 AND 6');
  else if (days === '99') where.push('duration_days >= 7');
  if (maxPrice) { where.push('agency_price <= @maxPrice'); params.maxPrice = Number(maxPrice); }
  if (keyword) { where.push('(tour_product_name LIKE @kw OR keywords LIKE @kw)'); params.kw = `%${keyword}%`; }

  const sortMap = {
    price_asc:  'agency_price ASC',
    price_desc: 'agency_price DESC',
    date:       'first_departure_date ASC',
  };
  const orderBy = sortMap[sort] || sortMap.price_asc;
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as c FROM tour_products ${whereSql}`).get(params).c;
  const offset = (Number(page) - 1) * Number(pageSize);
  const rows = db.prepare(
    `SELECT * FROM tour_products ${whereSql} ORDER BY ${orderBy} LIMIT @limit OFFSET @offset`
  ).all({ ...params, limit: Number(pageSize), offset });

  res.json({ total, page: Number(page), pageSize: Number(pageSize), items: rows });
});

app.get('/api/tours/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  const tour = db.prepare('SELECT * FROM tour_products WHERE tour_product_no = ?').get(req.params.id);
  if (!tour) return res.status(404).json({ error: 'Not found' });
  try { tour.flights = db.prepare('SELECT * FROM tour_flights WHERE tour_product_no = ?').all(req.params.id); } catch(e) {}
  try { tour.daily = db.prepare('SELECT * FROM tour_daily_itinerary WHERE tour_product_no = ? ORDER BY day_number').all(req.params.id); } catch(e) {}
  res.json(tour);
});

app.post('/api/tours', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  const b = req.body;
  try {
    db.prepare(`INSERT INTO tour_products
      (tour_product_no, tour_product_name, arrival_city, region, city_code, duration_days, first_departure_date, direct_price, agency_price, agency_rebate_pct, tag, cover_color, keywords, product_description)
      VALUES (@tour_product_no, @tour_product_name, @arrival_city, @region, @city_code, @duration_days, @first_departure_date, @direct_price, @agency_price, @agency_rebate_pct, @tag, @cover_color, @keywords, @product_description)`
    ).run({ ...b, product_description: b.product_description || null });
    res.json({ ok: true });
  } catch (err) {
    if (err.message.includes('NO COLUMN')) {
      // Fallback if product_description doesn't exist
      db.prepare(`INSERT INTO tour_products
        (tour_product_no, tour_product_name, arrival_city, region, city_code, duration_days, first_departure_date, direct_price, agency_price, agency_rebate_pct, tag, cover_color, keywords)
        VALUES (@tour_product_no, @tour_product_name, @arrival_city, @region, @city_code, @duration_days, @first_departure_date, @direct_price, @agency_price, @agency_rebate_pct, @tag, @cover_color, @keywords)`
      ).run(b);
      res.json({ ok: true });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.put('/api/tours/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  const b = req.body;
  try {
    db.prepare(`UPDATE tour_products SET
      tour_product_name=@tour_product_name, arrival_city=@arrival_city, region=@region, city_code=@city_code,
      duration_days=@duration_days, first_departure_date=@first_departure_date,
      direct_price=@direct_price, agency_price=@agency_price, agency_rebate_pct=@agency_rebate_pct,
      product_description=@product_description,
      updated_at=datetime('now')
      WHERE tour_product_no=@id`).run({ ...b, id: req.params.id, product_description: b.product_description || null });
    res.json({ ok: true });
  } catch (err) {
    if (err.message.includes('NO COLUMN')) {
      db.prepare(`UPDATE tour_products SET
        tour_product_name=@tour_product_name, arrival_city=@arrival_city, region=@region, city_code=@city_code,
        duration_days=@duration_days, first_departure_date=@first_departure_date,
        direct_price=@direct_price, agency_price=@agency_price, agency_rebate_pct=@agency_rebate_pct,
        updated_at=datetime('now')
        WHERE tour_product_no=@id`).run({ ...b, id: req.params.id });
      res.json({ ok: true });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.delete('/api/tours/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  db.prepare('DELETE FROM tour_products WHERE tour_product_no = ?').run(req.params.id);
  res.json({ ok: true });
});

// ================================================================
// SERVE FRONTEND (MUST BE LAST!)
// ================================================================
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ================================================================
// START
// ================================================================
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  const vCnt = db ? db.prepare('SELECT COUNT(*) as c FROM land_services').get().c : 0;
  const tCnt = db ? db.prepare('SELECT COUNT(*) as c FROM tour_products').get().c : 0;
  console.log('');
  console.log('🏨 B2B2C Travel — Full Server on http://localhost:' + PORT);
  console.log('   DB:', db ? '✅' : '⚠️', '| Tours:', tCnt, '| Vouchers:', vCnt);
  console.log('   Frontend:', distPath);
  console.log('');
});
