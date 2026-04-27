import Database from 'better-sqlite3';
const db = new Database('tours.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS tour_products (
  tour_product_no     TEXT PRIMARY KEY,
  tour_product_name   TEXT NOT NULL,
  arrival_city        TEXT,
  region              TEXT,
  departure_pax       INTEGER,
  duration_days       INTEGER,
  first_departure_date TEXT,
  direct_price        REAL,
  agency_price        REAL,
  agency_rebate_pct   REAL,
  deposit             REAL,
  fee_note            TEXT,
  transportation      TEXT,
  visa_requirement    TEXT,
  product_description TEXT,
  reference_tour_code TEXT,
  fee_description     TEXT,
  booking_notice      TEXT,
  tag                 TEXT,
  cover_color         TEXT,
  keywords            TEXT,
  created_at          TEXT DEFAULT (datetime('now')),
  updated_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tour_flights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tour_product_no TEXT NOT NULL,
  airline TEXT, flight_no TEXT,
  outbound_aircraft TEXT, return_aircraft TEXT,
  departure_terminal TEXT, arrival_terminal TEXT,
  departure_datetime TEXT, arrival_datetime TEXT,
  departure_airport TEXT, arrival_airport TEXT,
  ticket_cost REAL,
  FOREIGN KEY (tour_product_no) REFERENCES tour_products(tour_product_no) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tour_daily_itinerary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tour_product_no TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  title TEXT, content TEXT,
  breakfast TEXT, lunch TEXT, dinner TEXT,
  reference_hotels TEXT, reference_image_ids TEXT,
  FOREIGN KEY (tour_product_no) REFERENCES tour_products(tour_product_no) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tour_scenery_images (
  image_id TEXT PRIMARY KEY,
  city_code TEXT CHECK(length(city_code) = 3),
  spot_code TEXT, storage_url TEXT, description TEXT
);

CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tax_id TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK(role IN ('admin','agency','user')) DEFAULT 'agency',
  permissions TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_flights_tour ON tour_flights(tour_product_no);
CREATE INDEX IF NOT EXISTS idx_daily_tour ON tour_daily_itinerary(tour_product_no);
`);

// Seed tour products
const seed = [
  ['GFG001','東京賞櫻五日','東京','日本',16,5,'2026-03-28',42900,38600,10,'熱銷','#B5D4F4','櫻花'],
  ['GFG002','北海道溫泉六日','札幌','日本',20,6,'2026-04-10',56800,51200,12,'','#85B7EB','溫泉'],
  ['GFG003','首爾自由行四日','首爾','韓國',12,4,'2026-05-02',22500,19800,8,'早鳥','#378ADD','自由行'],
  ['GFG004','義大利經典十日','羅馬','歐洲',24,10,'2026-06-15',128000,118000,9,'','#7F77DD','古蹟'],
  ['GFG005','釜山賞櫻五日','釜山','韓國',16,5,'2026-03-30',28900,25600,11,'熱銷','#F0997B','櫻花'],
  ['GFG006','峇里島渡假五日','峇里島','東南亞',18,5,'2026-07-20',32500,28900,10,'','#5DCAA5','海島'],
  ['GFG007','京都奈良六日','京都','日本',20,6,'2026-11-15',48500,43200,10,'早鳥','#1D9E75','古蹟 楓葉'],
  ['GFG008','瑞士雙峰八日','蘇黎世','歐洲',22,8,'2026-08-05',158000,145000,8,'','#378ADD','雪山'],
];
const ins = db.prepare(`INSERT OR REPLACE INTO tour_products
  (tour_product_no, tour_product_name, arrival_city, region, departure_pax, duration_days, first_departure_date, direct_price, agency_price, agency_rebate_pct, tag, cover_color, keywords)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
seed.forEach(r => ins.run(...r));

// Set tax_id 95495431 as admin
db.prepare(`INSERT INTO organizations (tax_id, name, role, permissions)
  VALUES (?, ?, 'admin', ?)
  ON CONFLICT(tax_id) DO UPDATE SET role='admin', permissions=excluded.permissions`)
  .run('95495431', 'Admin Agency', '{"manage_products":true,"view_all_orders":true,"manage_users":true}');

console.log('✓ Database initialized with', seed.length, 'tours and admin org 95495431');
db.close();
