// ============================================
// B2B2C Travel — 完整 API Server (port 3002)
// 包含: Hotel / Flight / Map / Chat / Voucher CRUD / Tour Admin
//
// 用法: cd backend && node hotel-server.mjs
// ============================================

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// DB
let db;
try { db = new Database('tours.db'); } catch { db = null; }

const SERPAPI_KEY = '8c166a1ca434eb4d5db17e55dad3ac385488f2d23579e25c7b7ed29a5e6ce77e';
const nodeFetch = globalThis.fetch || (await import('node-fetch').then(m => m.default));

// ================================================================
// 1. HOTEL SEARCH (google_hotels)
// ================================================================
app.get('/api/hotels/search', async (req, res) => {
  const { q, check_in_date, check_out_date, adults = 2, children, children_ages,
    gl = 'tw', hl = 'zh-tw', currency = 'TWD', sort_by, min_price, max_price, hotel_class } = req.query;
  if (!q || !check_in_date || !check_out_date)
    return res.status(400).json({ error: 'q, check_in_date, check_out_date required' });
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
    let data; try { data = JSON.parse(text); } catch { return res.status(502).json({ error: 'Non-JSON' }); }
    if (data.error) return res.status(502).json({ error: data.error });
    console.log('[Hotel] Found', (data.properties || []).length);
    res.json({ properties: data.properties || [], brands: data.brands || [], total: (data.properties || []).length });
  } catch (err) { res.status(502).json({ error: err.message }); }
});

// ================================================================
// 2. HOTEL MAP (google_maps)
// ================================================================
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

// ================================================================
// 3. FLIGHTS (google_flights)
// ================================================================
app.get('/api/flights/search', async (req, res) => {
  const { departure_id, arrival_id, outbound_date, return_date, type = 1, travel_class = 1,
    adults = 1, children = 0, infants_in_seat = 0, infants_on_lap = 0,
    currency = 'TWD', hl = 'zh-tw', gl = 'tw', stops, sort_by } = req.query;
  if (!departure_id || !arrival_id || !outbound_date)
    return res.status(400).json({ error: 'departure_id, arrival_id, outbound_date required' });
  const params = new URLSearchParams({
    engine: 'google_flights', api_key: SERPAPI_KEY, departure_id, arrival_id, outbound_date,
    type: String(type), travel_class: String(travel_class), adults: String(adults), children: String(children),
    infants_in_seat: String(infants_in_seat), infants_on_lap: String(infants_on_lap), currency, hl, gl
  });
  if (return_date) params.set('return_date', return_date);
  if (stops) params.set('stops', stops);
  if (sort_by) params.set('sort_by', sort_by);
  console.log('[Flights]', departure_id, '→', arrival_id, outbound_date);
  try {
    const resp = await nodeFetch('https://serpapi.com/search.json?' + params);
    const d = await resp.json();
    if (d.error) return res.status(502).json({ error: d.error });
    res.json({ best_flights: d.best_flights || [], other_flights: d.other_flights || [], price_insights: d.price_insights || {} });
  } catch (err) { res.status(502).json({ error: err.message }); }
});

// ================================================================
// 4. CHATBOT
// ================================================================
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
    } else reply = '推薦功能需資料庫';
    suggestions = ['有沒有票券', '怎麼報名'];
  } else if (/票券|門票/.test(m)) {
    if (db) {
      const vs = db.prepare("SELECT voucher_uuid,voucher_name,category,agency_price FROM land_services WHERE audit_status='approved' AND publish_status='published' LIMIT 6").all();
      reply = '可購買的票券：\n'; vs.forEach(v => { reply += '• ' + v.voucher_name + '（' + v.category + '）｜NT$ ' + (v.agency_price || 0).toLocaleString() + '\n'; });
      products = vs.map(v => ({ type: 'voucher', id: v.voucher_uuid, name: v.voucher_name }));
    } else reply = '票券功能需資料庫';
    suggestions = ['推薦行程', '怎麼預訂'];
  } else {
    reply = '我是旅遊客服，可以幫您推薦行程、查價格、看票券。';
    suggestions = ['推薦行程', '有什麼票券', '怎麼報名'];
  }
  res.json({ reply, suggestions, products, timestamp: new Date().toISOString() });
});

// ================================================================
// 5. VOUCHER / LAND SERVICE — 票券系統
// ================================================================

// ---- Create table + Seed ----
if (db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS land_services (
      voucher_uuid TEXT PRIMARY KEY, voucher_code TEXT UNIQUE NOT NULL, voucher_name TEXT NOT NULL,
      city_code TEXT, category TEXT, valid_from TEXT, valid_to TEXT,
      spot_relation TEXT, features TEXT, notice TEXT, identity_type TEXT,
      direct_price REAL DEFAULT 0, agency_price REAL DEFAULT 0, deposit REAL DEFAULT 0,
      status TEXT DEFAULT 'draft', audit_status TEXT DEFAULT 'pending', publish_status TEXT DEFAULT 'unpublished',
      provider_tax_id TEXT, image_url TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
      audited_at TEXT, published_at TEXT, withdrawn_at TEXT
    );
  `);
  const cnt = db.prepare('SELECT COUNT(*) as c FROM land_services').get();
  if (cnt.c === 0) {
    console.log('[Voucher] Seeding...');
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
      'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600',
    ];
    const seeds = [
      ['新加坡環球影城單次快捷票','SIN','票券','環球影城','免排隊快速通關，含全日設施','請於入園時出示電子票券','成人',2400,2100,0],
      ['東京迪士尼樂園一日護照','TYO','門票','東京迪士尼樂園','全日無限次搭乘所有設施','需提前3日預訂，不可退票','成人',3200,2880,500],
      ['首爾仁川機場快線 AREX 單程票','SEL','交通','仁川國際機場','直達首爾站僅需43分鐘','需於購買後30日內使用','成人',280,250,0],
      ['京都嵐山小火車＋保津川遊船一日遊','KYO','地接行程','嵐山・保津川','含中文司導，酒店來回接送','含過路費不含午餐，最少2人成行','成人',8500,7600,2000],
      ['曼谷大皇宮＋玉佛寺門票','BKK','門票','大皇宮','含玉佛寺參觀及中文語音導覽','請著有袖上衣及過膝長褲','成人',520,460,0],
      ['香港海洋公園一日門票','HKG','門票','海洋公園','全日無限搭乘機動遊戲','兒童票適用3~11歲','成人',1800,1600,0],
      ['大阪周遊卡一日券','OSA','票券','大阪市區','含40+景點免費入場及交通','限當日使用不可延期','成人',950,850,0],
      ['峇里島烏布 SPA 按摩療程','DPS','票券','烏布','90分鐘精油按摩含花瓣浴','需提前24小時預訂','成人',1200,1050,0],
      ['沖繩美麗海水族館門票','OKA','門票','美麗海水族館','含黑潮之海巨型水槽觀賞','6歲以下免費，停車免費','成人',650,580,0],
      ['澳門旅遊塔笨豬跳','MFM','票券','澳門旅遊塔','全球最高商業笨豬跳233米','體重40~120kg，12歲以上','成人',5800,5200,1000],
      ['越南胡志明市古芝地道半日遊','SGN','地接行程','古芝地道','含酒店來回接送及中文導遊','行程約5~6小時，每日08:00出發','成人',980,860,0],
      ['富士山河口湖＋忍野八海一日遊','TYO','地接行程','富士山・河口湖','新宿出發含來回巴士及午餐','冬季不上五合目，最少4人成行','成人',3500,3100,500],
    ];
    const ins = db.prepare(`INSERT INTO land_services (voucher_uuid,voucher_code,voucher_name,city_code,category,spot_relation,features,notice,identity_type,direct_price,agency_price,deposit,audit_status,publish_status,image_url,audited_at,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'approved','published',?,datetime('now'),datetime('now'))`);
    seeds.forEach((s, i) => ins.run(crypto.randomUUID(), 'TCKT' + String(i + 1).padStart(8, '0'), ...s, IMGS[i]));
    console.log('[Voucher] Seeded', seeds.length, 'items');
  } else {
    console.log('[Voucher] Already has', cnt.c, 'items');
  }
}

// ---- PUBLIC: List published vouchers ----
app.get('/api/vouchers', (req, res) => {
  if (!db) return res.json({ items: [], total: 0 });
  const { city, category, keyword, sort = 'price_asc', page = 1, pageSize = 20 } = req.query;
  const w = ["audit_status='approved'", "publish_status='published'"], p = {};
  if (city) { w.push('city_code=@city'); p.city = city; }
  if (category) { w.push('category=@category'); p.category = category; }
  if (keyword) { w.push('(voucher_name LIKE @kw OR features LIKE @kw OR spot_relation LIKE @kw)'); p.kw = '%' + keyword + '%'; }
  const sm = { price_asc: 'agency_price ASC', price_desc: 'agency_price DESC', newest: 'created_at DESC' };
  const ws = 'WHERE ' + w.join(' AND '), ob = sm[sort] || sm.price_asc;
  const total = db.prepare('SELECT COUNT(*) c FROM land_services ' + ws).get(p).c;
  const items = db.prepare('SELECT * FROM land_services ' + ws + ' ORDER BY ' + ob + ' LIMIT @l OFFSET @o')
    .all({ ...p, l: +pageSize, o: (+page - 1) * (+pageSize) });
  res.json({ total, page: +page, pageSize: +pageSize, items });
});

// ---- PUBLIC: Single voucher ----
app.get('/api/vouchers/:id', (req, res) => {
  if (!db) return res.status(404).json({ error: 'No DB' });
  const v = db.prepare('SELECT * FROM land_services WHERE voucher_uuid=?').get(req.params.id);
  v ? res.json(v) : res.status(404).json({ error: 'Not found' });
});

// ---- ADMIN: List all vouchers ----
app.get('/api/admin/vouchers', (req, res) => {
  if (!db) return res.json({ items: [] });
  res.json({ items: db.prepare('SELECT * FROM land_services ORDER BY created_at DESC').all() });
});

// ---- ADMIN: Create voucher ----
app.post('/api/admin/vouchers', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  const b = req.body, uuid = crypto.randomUUID();
  const last = db.prepare('SELECT voucher_code FROM land_services ORDER BY voucher_code DESC LIMIT 1').get();
  const code = 'TCKT' + String(last ? parseInt(last.voucher_code.replace('TCKT', ''), 10) + 1 : 1).padStart(8, '0');
  const img = b.image_url || 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600';
  db.prepare(`INSERT INTO land_services (voucher_uuid,voucher_code,voucher_name,city_code,category,valid_from,valid_to,spot_relation,features,notice,identity_type,direct_price,agency_price,deposit,image_url,audit_status,publish_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending','unpublished')`)
    .run(uuid, code, b.voucher_name || '', b.city_code || 'SIN', b.category || '票券', b.valid_from || null, b.valid_to || null, b.spot_relation || '', b.features || '', b.notice || '', b.identity_type || '成人', b.direct_price || 0, b.agency_price || 0, b.deposit || 0, img);
  console.log('[Voucher] Created', code);
  res.json({ ok: true, voucher_uuid: uuid, voucher_code: code });
});

// ---- ADMIN: Update voucher ----
app.put('/api/admin/vouchers/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  const b = req.body;
  db.prepare(`UPDATE land_services SET voucher_name=?,city_code=?,category=?,valid_from=?,valid_to=?,spot_relation=?,features=?,notice=?,identity_type=?,direct_price=?,agency_price=?,deposit=?,image_url=COALESCE(NULLIF(?,''),image_url),updated_at=datetime('now') WHERE voucher_uuid=?`)
    .run(b.voucher_name, b.city_code, b.category, b.valid_from || null, b.valid_to || null, b.spot_relation, b.features, b.notice, b.identity_type, b.direct_price, b.agency_price, b.deposit, b.image_url || '', req.params.id);
  res.json({ ok: true });
});

// ---- ADMIN: Audit ----
app.post('/api/admin/vouchers/:id/audit', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  const { decision } = req.body;
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ error: 'Bad decision' });
  db.prepare("UPDATE land_services SET audit_status=?,audited_at=datetime('now'),updated_at=datetime('now') WHERE voucher_uuid=?").run(decision, req.params.id);
  res.json({ ok: true });
});

// ---- ADMIN: Publish ----
app.post('/api/admin/vouchers/:id/publish', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  db.prepare("UPDATE land_services SET publish_status='published',published_at=datetime('now'),updated_at=datetime('now') WHERE voucher_uuid=?").run(req.params.id);
  res.json({ ok: true });
});

// ---- ADMIN: Withdraw ----
app.post('/api/admin/vouchers/:id/withdraw', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  db.prepare("UPDATE land_services SET publish_status='withdrawn',withdrawn_at=datetime('now'),updated_at=datetime('now') WHERE voucher_uuid=?").run(req.params.id);
  res.json({ ok: true });
});

// ---- ADMIN: Delete voucher ----
app.delete('/api/admin/vouchers/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  db.prepare('DELETE FROM land_services WHERE voucher_uuid=?').run(req.params.id);
  res.json({ ok: true });
});

// ================================================================
// 6. ADMIN TOUR CRUD
// ================================================================
app.get('/api/admin/tours', (req, res) => {
  if (!db) return res.json({ items: [] });
  res.json({ items: db.prepare('SELECT * FROM tour_products ORDER BY created_at DESC').all() });
});

app.post('/api/admin/tours', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  const b = req.body;
  db.prepare(`INSERT INTO tour_products (tour_product_no,tour_product_name,arrival_city,region,duration_days,direct_price,agency_price,agency_rebate_pct,deposit,product_description,booking_notice,transportation,city_code,tag) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(b.tour_product_no, b.tour_product_name || '', b.arrival_city || '', b.region || '亞洲', b.duration_days || 5, b.direct_price || 0, b.agency_price || 0, b.agency_rebate_pct || 0, b.deposit || 0, b.product_description || '', b.booking_notice || '', b.transportation || '飛機', b.city_code || '', b.tag || '');
  res.json({ ok: true });
});

app.put('/api/admin/tours/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  const b = req.body;
  db.prepare(`UPDATE tour_products SET tour_product_name=?,arrival_city=?,region=?,duration_days=?,direct_price=?,agency_price=?,agency_rebate_pct=?,deposit=?,product_description=?,booking_notice=?,transportation=?,city_code=?,tag=?,updated_at=datetime('now') WHERE tour_product_no=?`)
    .run(b.tour_product_name, b.arrival_city, b.region, b.duration_days, b.direct_price, b.agency_price, b.agency_rebate_pct, b.deposit, b.product_description, b.booking_notice, b.transportation, b.city_code, b.tag, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/tours/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'No DB' });
  db.prepare('DELETE FROM tour_products WHERE tour_product_no=?').run(req.params.id);
  res.json({ ok: true });
});

// ================================================================
// START SERVER
// ================================================================
const PORT = 3002;
app.listen(PORT, () => {
  const vCnt = db ? db.prepare('SELECT COUNT(*) as c FROM land_services').get().c : 0;
  const tCnt = db ? db.prepare('SELECT COUNT(*) as c FROM tour_products').get().c : 0;
  console.log('');
  console.log('🏨 B2B2C Travel API running on http://localhost:' + PORT);
  console.log('   DB:', db ? '✅ connected' : '⚠️ not found');
  console.log('   Tours:', tCnt, '| Vouchers:', vCnt);
  console.log('');
  console.log('   APIs:');
  console.log('   GET  /api/hotels/search    — google_hotels');
  console.log('   GET  /api/hotels/map       — google_maps');
  console.log('   GET  /api/flights/search   — google_flights');
  console.log('   POST /api/chat             — chatbot');
  console.log('   GET  /api/vouchers         — public voucher list');
  console.log('   GET  /api/vouchers/:id     — voucher detail');
  console.log('   GET  /api/admin/vouchers   — admin voucher list');
  console.log('   POST /api/admin/vouchers   — create voucher');
  console.log('   PUT  /api/admin/vouchers/:id — update voucher');
  console.log('   GET  /api/admin/tours      — admin tour list');
  console.log('');
});
