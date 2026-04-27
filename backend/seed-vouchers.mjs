#!/usr/bin/env node
/**
 * 票券種子資料 — 直接寫入 SQLite
 * 用法: cd backend && node seed-vouchers.mjs
 */
import Database from 'better-sqlite3';
import crypto from 'crypto';

const db = new Database('tours.db');

// ---- Create table ----
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
console.log('✅ land_services 資料表已建立');

// ---- Clear & Seed ----
db.exec('DELETE FROM land_services');

const vouchers = [
  {
    name: '新加坡環球影城單次快捷票',
    city: 'SIN', cat: '票券', spot: '環球影城',
    features: '免排隊快速通關，含全日所有設施\n適用於所有遊樂設施及表演\n電子票券，掃碼即可入場',
    notice: '請於入園時出示電子票券\n每張票限一人使用\n不可與其他優惠併用\n有效期限內任一天皆可使用',
    id: '成人', dp: 2400, ap: 2100, dep: 0,
    img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600'
  },
  {
    name: '東京迪士尼樂園一日護照',
    city: 'TYO', cat: '門票', spot: '東京迪士尼樂園',
    features: '全日無限次搭乘所有遊樂設施\n含觀賞夜間遊行及煙火表演\n含園區內接駁交通',
    notice: '需提前 3 日預訂，指定日期入園\n不可退票或改期\n入園需出示護照正本\n兒童票適用 4~11 歲',
    id: '成人', dp: 3200, ap: 2880, dep: 500,
    img: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600'
  },
  {
    name: '首爾仁川機場快線 AREX 單程票',
    city: 'SEL', cat: '交通', spot: '仁川國際機場',
    features: '直達首爾站僅需 43 分鐘\n寬敞座位附免費 Wi-Fi\n行李存放空間充足',
    notice: '需於購買後 30 日內使用\n兒童票適用 4~12 歲\n嬰兒免費（需由成人陪同）',
    id: '成人', dp: 280, ap: 250, dep: 0,
    img: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600'
  },
  {
    name: '京都嵐山小火車＋保津川遊船一日遊',
    city: 'KYO', cat: '地接行程', spot: '嵐山・保津川',
    features: '含中文司機導遊，酒店來回接送\n嵐山小火車指定座位\n保津川遊船體驗（約 2 小時）\n竹林小徑自由散策',
    notice: '含過路費、船票，不含午餐\n最少 2 人成行，最多 8 人\n遇大雨或河川水位過高時改為替代行程\n需提前 5 日預訂',
    id: '成人', dp: 8500, ap: 7600, dep: 2000,
    img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600'
  },
  {
    name: '曼谷大皇宮＋玉佛寺門票',
    city: 'BKK', cat: '門票', spot: '大皇宮',
    features: '含大皇宮及玉佛寺參觀\n免費中文語音導覽 APP\n含皇家御船博物館參觀',
    notice: '請著有袖上衣及過膝長褲\n不可穿拖鞋入場\n開放時間 08:30~15:30\n國定假日可能休館',
    id: '成人', dp: 520, ap: 460, dep: 0,
    img: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600'
  },
  {
    name: '香港海洋公園一日門票',
    city: 'HKG', cat: '門票', spot: '海洋公園',
    features: '全日無限搭乘機動遊戲\n含海洋劇場表演\n含登山纜車來回\n免費園內地圖及 APP 導覽',
    notice: '兒童票適用 3~11 歲\n3 歲以下免費入園\n開放時間 10:00~19:00\n部分設施可能因維護暫停',
    id: '成人', dp: 1800, ap: 1600, dep: 0,
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600'
  },
  {
    name: '大阪周遊卡一日券',
    city: 'OSA', cat: '票券', spot: '大阪市區',
    features: '含 40+ 景點免費入場（大阪城、通天閣等）\n市營地鐵、巴士一日無限搭乘\n含觀光船搭乘券',
    notice: '限當日使用，不可延期\n部分景點需預約\n不含 JR 及私鐵路線\n售出後不可退換',
    id: '成人', dp: 950, ap: 850, dep: 0,
    img: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600'
  },
  {
    name: '峇里島烏布 SPA 按摩療程',
    city: 'DPS', cat: '票券', spot: '烏布',
    features: '90 分鐘精油全身按摩\n含花瓣浴 + 薑茶迎賓飲品\n使用天然有機精油\n含烏布市區酒店來回接送',
    notice: '需提前 24 小時預訂\n孕婦不適用\n請提前 15 分鐘報到\n可選男/女按摩師',
    id: '成人', dp: 1200, ap: 1050, dep: 0,
    img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600'
  },
  {
    name: '沖繩美麗海水族館門票',
    city: 'OKA', cat: '門票', spot: '美麗海水族館',
    features: '含黑潮之海巨型水槽觀賞\n海豚表演免費觀賞\n含海龜館及海牛館\n附贈紀念明信片',
    notice: '開放時間 08:30~18:30（夏季延長至 20:00）\n最後入館時間為閉館前 1 小時\n6 歲以下免費\n停車免費',
    id: '成人', dp: 650, ap: 580, dep: 0,
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'
  },
  {
    name: '澳門旅遊塔笨豬跳 Bungy Jump',
    city: 'MFM', cat: '票券', spot: '澳門旅遊塔',
    features: '全球最高商業笨豬跳（233 米）\n含觀景台門票\n附贈跳躍影片及照片\n含證書及 T-shirt',
    notice: '體重限制 40~120 公斤\n年齡限制 12 歲以上\n心臟病、高血壓者不適用\n需簽署免責聲明\n建議穿著運動服裝',
    id: '成人', dp: 5800, ap: 5200, dep: 1000,
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600'
  },
  {
    name: '越南胡志明市古芝地道半日遊',
    city: 'SGN', cat: '地接行程', spot: '古芝地道',
    features: '含酒店來回接送（胡志明市區）\n中文導遊全程解說\n含地道探險體驗\n含當地特色點心及飲料',
    notice: '行程約 5~6 小時\n建議穿長褲及包鞋\n幽閉恐懼症者請斟酌\n每日 08:00 出發',
    id: '成人', dp: 980, ap: 860, dep: 0,
    img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600'
  },
  {
    name: '富士山河口湖＋忍野八海一日遊',
    city: 'TYO', cat: '地接行程', spot: '富士山・河口湖',
    features: '新宿出發含來回巴士\n河口湖遊船體驗\n忍野八海散策\n富士山五合目（天氣許可時）\n含午餐便當',
    notice: '全程約 10 小時\n冬季（11~3 月）不上五合目\n最少 4 人成行\n需提前 3 日預訂',
    id: '成人', dp: 3500, ap: 3100, dep: 500,
    img: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600'
  },
];

const ins = db.prepare(`INSERT INTO land_services
  (voucher_uuid, voucher_code, voucher_name, city_code, category, spot_relation,
   features, notice, identity_type, direct_price, agency_price, deposit,
   audit_status, publish_status, image_url, audited_at, published_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'approved','published',?,datetime('now'),datetime('now'))`);

const insertMany = db.transaction((list) => {
  list.forEach((v, i) => {
    const uuid = crypto.randomUUID();
    const code = 'TCKT' + String(i + 1).padStart(8, '0');
    ins.run(uuid, code, v.name, v.city, v.cat, v.spot, v.features, v.notice,
            v.id, v.dp, v.ap, v.dep, v.img);
    console.log(`  ${code} ${v.name} — NT$${v.ap}`);
  });
});

insertMany(vouchers);

console.log('');
console.log(`🎉 已新增 ${vouchers.length} 個票券商品！`);
console.log('');
console.log('   城市涵蓋: SIN TYO SEL KYO BKK HKG OSA DPS OKA MFM SGN');
console.log('   類別涵蓋: 票券 門票 交通 地接行程');
console.log('');

// Verify
const total = db.prepare('SELECT COUNT(*) as c FROM land_services').get();
console.log(`   資料庫中共有 ${total.c} 個票券`);

db.close();
