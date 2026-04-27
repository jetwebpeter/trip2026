// ============================================
// B2B2C Travel — Hotel / Flight / Chat API
// 獨立服務，跑在 port 3002
// 不需要修改你的 server.js
//
// 使用方式:
//   cd backend
//   npm install node-fetch
//   node hotel-server.mjs
// ============================================

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
app.use(cors());
app.use(express.json());

// DB (read-only, shared with main server)
let db;
try { db = new Database('tours.db', { readonly: true }); } catch { db = null; }

const SERPAPI_KEY = '8c166a1ca434eb4d5db17e55dad3ac385488f2d23579e25c7b7ed29a5e6ce77e';
const nodeFetch = globalThis.fetch || (await import('node-fetch').then(m => m.default));

// ---- HOTEL SEARCH (google_hotels) ----
app.get('/api/hotels/search', async (req, res) => {
  const { q, check_in_date, check_out_date, adults = 2, children, children_ages,
    gl = 'tw', hl = 'zh-tw', currency = 'TWD', sort_by, min_price, max_price, hotel_class } = req.query;
  if (!q || !check_in_date || !check_out_date) {
    return res.status(400).json({ error: 'q, check_in_date, check_out_date required' });
  }
  const params = new URLSearchParams({
    engine: 'google_hotels', api_key: SERPAPI_KEY,
    q, check_in_date, check_out_date, adults: String(adults), gl, hl, currency
  });
  if (children) params.set('children', String(children));
  if (children_ages) params.set('children_ages', children_ages);
  if (sort_by) params.set('sort_by', sort_by);
  if (min_price) params.set('min_price', min_price);
  if (max_price) params.set('max_price', max_price);
  if (hotel_class) params.set('hotel_class', hotel_class);

  console.log('[Hotel]', q, check_in_date, '→', check_out_date);
  try {
    const resp = await nodeFetch('https://serpapi.com/search.json?' + params);
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch {
      console.error('[Hotel] Non-JSON:', text.slice(0, 300));
      return res.status(502).json({ error: 'Non-JSON response' });
    }
    if (data.error) { console.error('[Hotel] Error:', data.error); return res.status(502).json({ error: data.error }); }
    console.log('[Hotel] Found', (data.properties || []).length, 'properties');
    res.json({
      properties: data.properties || [],
      brands: data.brands || [],
      search_information: data.search_information || {},
      total: (data.properties || []).length
    });
  } catch (err) { console.error('[Hotel]', err.message); res.status(502).json({ error: err.message }); }
});

// ---- HOTEL MAP (google_maps) ----
app.get('/api/hotels/map', async (req, res) => {
  const { q = 'Hotels', ll, gl = 'tw', hl = 'zh-tw' } = req.query;
  if (!ll) return res.status(400).json({ error: 'll required' });
  const params = new URLSearchParams({ engine: 'google_maps', api_key: SERPAPI_KEY, q, ll, type: 'search', gl, hl });
  console.log('[Map]', q, ll);
  try {
    const resp = await nodeFetch('https://serpapi.com/search.json?' + params);
    const d = await resp.json();
    if (d.error) return res.status(502).json({ error: d.error });
    const items = (d.local_results || []).map(r => ({
      title: r.title || '', rating: r.rating || null, reviews: r.reviews || 0,
      price: r.price || '', address: r.address || '', thumbnail: r.thumbnail || '',
      lat: r.gps_coordinates?.latitude || null, lng: r.gps_coordinates?.longitude || null,
      place_id: r.place_id || '', website: r.website || '',
    }));
    res.json({ results: items, total: items.length });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

// ---- FLIGHTS (google_flights) ----
app.get('/api/flights/search', async (req, res) => {
  const { departure_id, arrival_id, outbound_date, return_date, type = 1, travel_class = 1,
    adults = 1, children = 0, infants_in_seat = 0, infants_on_lap = 0,
    currency = 'TWD', hl = 'zh-tw', gl = 'tw', stops, sort_by, max_price,
    include_airlines, exclude_airlines } = req.query;
  if (!departure_id || !arrival_id || !outbound_date)
    return res.status(400).json({ error: 'departure_id, arrival_id, outbound_date required' });
  const params = new URLSearchParams({
    engine: 'google_flights', api_key: SERPAPI_KEY,
    departure_id, arrival_id, outbound_date,
    type: String(type), travel_class: String(travel_class),
    adults: String(adults), children: String(children),
    infants_in_seat: String(infants_in_seat), infants_on_lap: String(infants_on_lap),
    currency, hl, gl
  });
  if (return_date) params.set('return_date', return_date);
  if (stops) params.set('stops', stops);
  if (sort_by) params.set('sort_by', sort_by);
  if (max_price) params.set('max_price', max_price);
  if (include_airlines) params.set('include_airlines', include_airlines);
  if (exclude_airlines) params.set('exclude_airlines', exclude_airlines);
  console.log('[Flights]', departure_id, '→', arrival_id, outbound_date, return_date || '(one-way)');
  try {
    const resp = await nodeFetch('https://serpapi.com/search.json?' + params);
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { return res.status(502).json({ error: 'Non-JSON' }); }
    if (data.error) { console.error('[Flights]', data.error); return res.status(502).json({ error: data.error }); }
    console.log('[Flights] best:', (data.best_flights || []).length, 'other:', (data.other_flights || []).length);
    res.json({
      best_flights: data.best_flights || [],
      other_flights: data.other_flights || [],
      price_insights: data.price_insights || {},
      airports: data.airports || [],
    });
  } catch (err) { console.error('[Flights]', err.message); res.status(502).json({ error: err.message }); }
});

// ---- CHATBOT ----
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });
  const m = message.toLowerCase();
  let reply = '', suggestions = [], products = [];
  if (/你好|嗨|hello|hi/.test(m)) {
    reply = '您好！歡迎使用旅遊客服。我可以幫您推薦行程、查價格、了解預訂流程。';
    suggestions = ['推薦日本行程', '有什麼票券', '怎麼報名'];
  } else if (/推薦|建議|去哪|日本|東京|韓國/.test(m)) {
    if (db) {
      const tours = db.prepare('SELECT tour_product_no,tour_product_name,duration_days,agency_price FROM tour_products ORDER BY agency_price LIMIT 5').all();
      reply = '為您推薦：\n'; tours.forEach(t => { reply += '• ' + t.tour_product_name + '｜' + t.duration_days + '天｜NT$ ' + (t.agency_price || 0).toLocaleString() + '\n'; });
      products = tours.map(t => ({ type: 'tour', id: t.tour_product_no, name: t.tour_product_name }));
    } else { reply = '推薦功能需要資料庫連線。'; }
    suggestions = ['有沒有票券', '怎麼報名'];
  } else if (/票券|門票/.test(m)) {
    if (db) {
      const vs = db.prepare("SELECT voucher_uuid,voucher_name,category,agency_price FROM land_services WHERE audit_status='approved' AND publish_status='published' LIMIT 6").all();
      reply = '可購買的票券：\n'; vs.forEach(v => { reply += '• ' + v.voucher_name + '（' + v.category + '）｜NT$ ' + (v.agency_price || 0).toLocaleString() + '\n'; });
      products = vs.map(v => ({ type: 'voucher', id: v.voucher_uuid, name: v.voucher_name }));
    } else { reply = '票券功能需要資料庫連線。'; }
    suggestions = ['推薦行程', '怎麼預訂'];
  } else if (/飯店|住宿|酒店/.test(m)) {
    reply = '已整合 Google Hotels 搜尋！點選導航列「飯店」，支援列表與地圖雙模式。';
    suggestions = ['推薦行程', '怎麼報名'];
  } else if (/訂|報名|預[訂定]/.test(m)) {
    reply = '預訂流程：\n1. 選擇行程或票券\n2. 填寫旅客資料\n3. 支付訂金\n4. 確認成團\n5. 出發前寄送行前通知';
    suggestions = ['推薦行程', '看票券'];
  } else {
    reply = '我是旅遊客服，可以幫您推薦行程、查價格、看票券。';
    suggestions = ['推薦行程', '有什麼票券', '怎麼報名'];
  }
  res.json({ reply, suggestions, products, timestamp: new Date().toISOString() });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log('');
  console.log('🏨 Hotel/Flight/Chat API running on http://localhost:' + PORT);
  console.log('   DB:', db ? '✅ connected' : '⚠️  not found (chat recommendations disabled)');
  console.log('');
  console.log('   Test URLs:');
  console.log('   http://localhost:3002/api/hotels/search?q=HKG&check_in_date=2025-11-14&check_out_date=2025-11-15');
  console.log('   http://localhost:3002/api/flights/search?departure_id=SIN&arrival_id=HKG&outbound_date=2025-03-26');
  console.log('');
});
