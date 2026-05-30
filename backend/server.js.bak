import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { getJson } from "serpapi";

const db = new Database('tours.db');
db.pragma('foreign_keys = ON');

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/tours — list with filter/sort/pagination
app.get('/api/tours', (req, res) => {
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

// GET /api/tours/:id — full detail with sub-tables
app.get('/api/tours/:id', (req, res) => {
  const tour = db.prepare('SELECT * FROM tour_products WHERE tour_product_no = ?').get(req.params.id);
  if (!tour) return res.status(404).json({ error: 'Not found' });
  tour.flights = db.prepare('SELECT * FROM tour_flights WHERE tour_product_no = ?').all(req.params.id);
  tour.daily = db.prepare('SELECT * FROM tour_daily_itinerary WHERE tour_product_no = ? ORDER BY day_number').all(req.params.id);
  res.json(tour);
});

// POST /api/tours — create
app.post('/api/tours', (req, res) => {
  const b = req.body;
  db.prepare(`INSERT INTO tour_products
    (tour_product_no, tour_product_name, arrival_city, region, city_code, duration_days, first_departure_date, direct_price, agency_price, agency_rebate_pct, tag, cover_color, keywords)
    VALUES (@tour_product_no, @tour_product_name, @arrival_city, @region, @city_code, @duration_days, @first_departure_date, @direct_price, @agency_price, @agency_rebate_pct, @tag, @cover_color, @keywords)`
  ).run(b);
  res.json({ ok: true });
});

// PUT /api/tours/:id — update
app.put('/api/tours/:id', (req, res) => {
  const b = req.body;
  db.prepare(`UPDATE tour_products SET
    tour_product_name=@tour_product_name, arrival_city=@arrival_city, region=@region, city_code=@city_code,
    duration_days=@duration_days, first_departure_date=@first_departure_date,
    direct_price=@direct_price, agency_price=@agency_price, agency_rebate_pct=@agency_rebate_pct,
    updated_at=datetime('now')
    WHERE tour_product_no=@id`).run({ ...b, id: req.params.id });
  res.json({ ok: true });
});

// DELETE /api/tours/:id
app.delete('/api/tours/:id', (req, res) => {
  db.prepare('DELETE FROM tour_products WHERE tour_product_no = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/flights — Google Flights via SerpAPI
const SERPAPI_KEY = "8c166a1ca434eb4d5db17e55dad3ac385488f2d23579e25c7b7ed29a5e6ce77e";
app.get('/api/flights', async (req, res) => {
  try {
    const { 
      departure_id, arrival_id, outbound_date, return_date, 
      currency = 'TWD', adults = '1', children = '0', infants_in_seat = '0', infants_on_lap = '0',
      travel_class = '1', stops = '', type
    } = req.query;

    if (!departure_id || !arrival_id || !outbound_date) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Determine the type: if "type" is explicitly provided, use it; otherwise infer from return_date
    // Google Flights API: type="1" is Round trip, type="2" is One way
    const flightType = type ? type : (return_date ? "1" : "2");

    const searchParams = {
      api_key: SERPAPI_KEY,
      engine: "google_flights",
      hl: "zh-tw",
      gl: "tw",
      departure_id,
      arrival_id,
      outbound_date,
      currency,
      adults,
      children,
      infants_in_seat,
      infants_on_lap,
      type: flightType,
      travel_class
    };

    if (flightType === "1" && return_date) {
      searchParams.return_date = return_date;
    }

    if (stops !== '') {
      searchParams.stops = stops;
    }

    const results = await getJson(searchParams);
    res.json(results);
  } catch (error) {
    console.error('SerpAPI error:', error);
    res.status(500).json({ error: 'Failed to fetch flight data' });
  }
});

// GET /api/hotels — Google Hotels via SerpAPI
app.get('/api/hotels', async (req, res) => {
  try {
    const { 
      q, check_in_date, check_out_date, adults = '2', 
      currency = 'TWD', gl = 'tw', hl = 'zh-tw' 
    } = req.query;

    if (!q || !check_in_date || !check_out_date) {
      return res.status(400).json({ error: 'Missing required parameters (q, check_in_date, check_out_date)' });
    }

    const results = await getJson({
      api_key: SERPAPI_KEY,
      engine: "google_hotels",
      q,
      check_in_date,
      check_out_date,
      adults,
      currency,
      gl,
      hl
    });

    // Map fields to match frontend expectations
    const mapProperty = p => ({
      ...p,
      rating: p.overall_rating || 0,
      thumbnail: p.images?.[0]?.thumbnail || '',
      description: p.description || p.essential_info?.join(', ') || ''
    });

    if (results.properties) {
      results.properties = results.properties.map(mapProperty);
    }
    if (results.vacation_rentals) {
      results.vacation_rentals = results.vacation_rentals.map(mapProperty);
    }

    res.json(results);
  } catch (error) {
    console.error('SerpAPI Hotel error:', error);
    res.status(500).json({ error: 'Failed to fetch hotel data' });
  }
});

// GET /api/destinations — Google Travel Explore via SerpAPI
app.get('/api/destinations', async (req, res) => {
  try {
    const { q = '', departure_id = 'TPE' } = req.query;

    const results = await getJson({
      api_key: SERPAPI_KEY,
      engine: "google_travel_explore",
      departure_id,
      q: q || undefined,
      gl: "tw",
      hl: "zh-tw"
    });

    res.json({ destinations: results.destinations || [] });
  } catch (error) {
    console.error('SerpAPI Destination error:', error);
    res.status(500).json({ error: 'Failed to fetch destination data' });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
