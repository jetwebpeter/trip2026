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
  ['GFG009','東京迪士尼雙樂園五日','東京','日本',25,5,'2026-07-05',39900,35900,10,'熱銷','#B5D4F4','迪士尼 樂園'],
  ['GFG010','京阪神奈環球影城五日','大阪','日本',22,5,'2026-07-12',41900,37700,10,'熱銷','#85B7EB','環球影城 關西'],
  ['GFG011','沖繩海風輕鬆玩四日','那霸','日本',18,4,'2026-07-18',23900,21500,10,'早鳥','#5DCAA5','海島 浮潛'],
  ['GFG012','九州溫泉豪斯登堡五日','福岡','日本',20,5,'2026-08-02',38900,35000,10,'','#1D9E75','溫泉 樂園'],
  ['GFG013','四國大步危秘境五日','高松','日本',16,5,'2026-09-10',37500,33750,10,'','#378ADD','秘境 溫泉'],
  ['GFG014','立山黑部阿爾卑斯五日','富山','日本',22,5,'2026-04-20',52900,47600,10,'熱銷','#7F77DD','雪牆 登山'],
  ['GFG015','東北藏王樹冰雪怪五日','仙台','日本',20,5,'2026-01-15',49900,44900,10,'','#85B7EB','樹冰 溫泉'],
  ['GFG016','濟州島夢幻海景四日','濟州','韓國',15,4,'2026-08-10',18900,17000,10,'','#378ADD','海景 度假'],
  ['GFG017','首爾愛寶樂園繽紛五日','首爾','韓國',20,5,'2026-07-22',24500,22000,10,'早鳥','#F0997B','樂園 首爾'],
  ['GFG018','大邱慶州世界遺產五日','大邱','韓國',16,5,'2026-09-05',21900,19700,10,'','#1D9E75','文化 遺產'],
  ['GFG019','江南烏鎮水鄉奢華五日','上海','大陸港澳',20,5,'2026-05-18',29900,26900,10,'','#7F77DD','水鄉 奢華'],
  ['GFG020','張家界天門山奇景六日','長沙','大陸港澳',18,6,'2026-06-12',39900,35900,10,'熱銷','#F0997B','奇景 爬山'],
  ['GFG021','九寨溝人間仙境八日','成都','大陸港澳',24,8,'2026-10-15',58900,53000,10,'早鳥','#5DCAA5','仙境 彩池'],
  ['GFG022','北京萬里長城精選五日','北京','大陸港澳',20,5,'2026-04-05',28900,26000,10,'','#B5D4F4','古蹟 長城'],
  ['GFG023','泰國曼谷芭達雅奢華五日','曼谷','東南亞',25,5,'2026-07-08',25900,23300,10,'熱銷','#5DCAA5','泰國 渡假'],
  ['GFG024','越南北越下龍灣奇景五日','河內','東南亞',20,5,'2026-08-15',27900,25100,10,'','#378ADD','下龍灣 奇景'],
  ['GFG025','越南中越峴港巴拿山五日','峴港','東南亞',22,5,'2026-08-20',29800,26800,10,'熱銷','#85B7EB','巴拿山 避暑'],
  ['GFG026','新加坡雙樂園豪華四日','新加坡','東南亞',18,4,'2026-07-10',32900,29600,10,'','#7F77DD','樂園 環球'],
  ['GFG027','馬來西亞沙巴美人魚島五日','亞庇','東南亞',16,5,'2026-09-02',26900,24200,10,'早鳥','#1D9E75','浮潛 海島'],
  ['GFG028','菲律賓長灘島白沙灘五日','卡利博','東南亞',16,5,'2026-10-10',22900,20600,10,'','#5DCAA5','沙灘 水上活動'],
  ['GFG029','法國巴黎羅浮宮時尚八日','巴黎','歐洲',22,8,'2026-09-18',89900,80900,10,'熱銷','#7F77DD','巴黎 博物館'],
  ['GFG030','英國倫敦溫莎雙古堡八日','倫敦','歐洲',20,8,'2026-09-25',92900,83600,10,'','#85B7EB','大笨鐘 古堡'],
  ['GFG031','西班牙葡萄牙經典十二日','馬德里','歐洲',24,12,'2026-10-02',149000,134000,10,'早鳥','#1D9E75','雙國 經典'],
  ['GFG032','奧捷雙帝國音樂波西米亞十日','布拉格','歐洲',22,10,'2026-09-12',109000,98100,10,'','#378ADD','音樂 水晶'],
  ['GFG033','土耳其熱氣球奇岩十一日','伊斯坦堡','中東非洲',25,11,'2026-08-18',69900,62900,10,'熱銷','#F0997B','熱氣球 洞穴'],
  ['GFG034','美西三大國家公園十日','洛杉磯','美洲',24,10,'2026-09-08',119000,107000,10,'熱銷','#85B7EB','大峽谷 羚羊谷'],
  ['GFG035','美東紐約波士頓深度九日','紐約','美洲',20,9,'2026-10-05',129000,116000,10,'早鳥','#7F77DD','時代廣場 常春藤'],
  ['GFG036','澳洲雪梨歌劇院精緻六日','雪梨','紐澳',18,6,'2026-11-20',59900,53900,10,'','#5DCAA5','歌劇院 無尾熊'],
  ['GFG037','紐西蘭南島冰河大自然極致十日','基督城','紐澳',20,10,'2026-11-02',139000,125000,10,'早鳥','#1D9E75','冰河 峽灣'],
  ['GFG038','埃及金字塔尼羅河遊輪十一日','開羅','中東非洲',22,11,'2026-12-05',89900,80900,10,'','#7F77DD','神殿 遊輪 金字塔'],
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
