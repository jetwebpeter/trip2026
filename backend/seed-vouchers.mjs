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
  {
    name: '日本網卡 5GB/5天 每日高速上網',
    city: 'TYO', cat: '票券', spot: '日本全境',
    features: '插卡即用，無須設定\n使用 Softbank 4G 高速網路\n支援熱點分享',
    notice: '開卡後需連續 5 日使用\n不支援通話及簡訊功能\n三合一 SIM 卡適用所有手機',
    id: '成人', dp: 350, ap: 310, dep: 0,
    img: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=600'
  },
  {
    name: '關西樂享周遊券 3景點任選',
    city: 'OSA', cat: '票券', spot: '關西地區',
    features: '大阪/京都/神戶人氣景點任選 3 個免費入場\n含阿倍野展望台、觀光船等',
    notice: '自購買日起 90 日內需開立使用\n開票後需於 7 日內使用完畢\n每景點限入場一次',
    id: '成人', dp: 650, ap: 585, dep: 0,
    img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600'
  },
  {
    name: '日本關西機場 HARUKA 特快車單程票',
    city: 'OSA', cat: '交通', spot: '關西機場',
    features: '關西機場直達天王寺、新大阪、京都\n舒適自由席，乘車時間短\n免排隊實體機台掃碼換票',
    notice: '限非日本籍旅客購買\n需於指定乘車區間內使用\n有效期限為購買日起 90 天',
    id: '成人', dp: 480, ap: 430, dep: 0,
    img: 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=600'
  },
  {
    name: 'SHIBUYA SKY 澀谷天空展望台門票',
    city: 'TYO', cat: '門票', spot: '澀谷',
    features: '229米高空俯瞰澀谷十字路口及富士山\n360度露天展望台，拍照效果絕佳\n含室內觀景廊展覽',
    notice: '需指定日期與入場時段\n逾時恕無法入場且不予退票\n若天候不佳露天區域可能關閉',
    id: '成人', dp: 550, ap: 495, dep: 0,
    img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600'
  },
  {
    name: '富士山三島 Skywalk 大吊橋門票',
    city: 'TYO', cat: '門票', spot: '靜岡三島',
    features: '日本最長人行吊橋（400米）\n遠眺富士山與駿河灣壯麗美景\n含森林冒險園區門票',
    notice: '每日 09:00~17:00 開放\n雨天仍可通行，但強風時可能暫停\n禁止使用自拍棒及傘',
    id: '成人', dp: 320, ap: 288, dep: 0,
    img: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600'
  },
  {
    name: '首爾塔 N Seoul Tower 門票',
    city: 'SEL', cat: '門票', spot: '首爾塔',
    features: '360度俯瞰首爾市景與漢江\n愛情鎖牆聖地，情侶必訪\n含高空洗手間新奇體驗',
    notice: '開放時間 10:00~23:00\n最後入場時間 22:30\n不含纜車票，需另行購買',
    id: '成人', dp: 290, ap: 260, dep: 0,
    img: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600'
  },
  {
    name: '韓國 T-money 交通卡 (空卡)',
    city: 'SEL', cat: '交通', spot: '韓國全境',
    features: '韓國地鐵、巴士、計程車皆可付款\n超商、部分商店亦支援消費\n搭乘交通轉乘有優惠',
    notice: '此為空卡，需自行至地鐵站或超商加值\n卡片無使用期限\n售出後恕無法退卡換錢',
    id: '成人', dp: 150, ap: 135, dep: 0,
    img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600'
  },
  {
    name: '首爾樂天世界一日通票',
    city: 'SEL', cat: '門票', spot: '樂天世界',
    features: '全日暢玩室內「探險世界」與室外「魔幻島」\n含民俗博物館參觀\n掃碼直接入場免排隊',
    notice: '指定日期使用，不可改期\n部分特殊設施需現場另行付費\n營業時間 10:00~21:00',
    id: '成人', dp: 1200, ap: 1080, dep: 200,
    img: 'https://images.unsplash.com/photo-1505164294036-5ffd96be345a?w=600'
  },
  {
    name: '曼谷 Safari World 野生動物園一日門票',
    city: 'BKK', cat: '門票', spot: '野生動物園',
    features: '含野生動物園及海洋公園雙園區\n與長頸鹿近距離接觸餵食\n好萊塢牛仔特技與海豚表演',
    notice: '需指定使用日期\n接送服務需另外預訂\n園區內禁止攜帶外食與飲料\n營業時間 09:00~17:00',
    id: '成人', dp: 980, ap: 882, dep: 0,
    img: 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=600'
  },
  {
    name: '新加坡濱海灣花園門票 (雙溫室)',
    city: 'SIN', cat: '門票', spot: '濱海灣花園',
    features: '含花穹 (Flower Dome) 與雲霧林 (Cloud Forest) 門票\n觀賞全球最大玻璃溫室與 35 米室內瀑布\n欣賞擎天樹光雕秀',
    notice: '需於指定日期使用\n溫室每月有固定維護日休館\n不含空中步道門票',
    id: '成人', dp: 750, ap: 675, dep: 0,
    img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600'
  },
  {
    name: '泰國 AIS 10天 50GB 高速上網卡',
    city: 'BKK', cat: '票券', spot: '泰國全境',
    features: 'AIS 5G/4G 高速網路上網，50GB 後降速吃到飽\n包含 15 泰銖通話費\n插卡即用',
    notice: '開卡後可連續使用 10 天\n支援熱點分享功能\n附有繁體中文說明書',
    id: '成人', dp: 180, ap: 160, dep: 0,
    img: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=600'
  },
  {
    name: '越南峴港巴拿山一日門票含來回纜車',
    city: 'DAD', cat: '門票', spot: '巴拿山',
    features: '含巴拿山來回纜車體驗（金氏紀錄最長單軌纜車）\n必訪黃金佛手橋、百年酒窖與法國村\n暢玩幻想樂園室內遊樂設施',
    notice: '不含園區蠟像館門票與午餐\n開放時間 08:00~17:00\n雨天山區溫度較低建議帶外套',
    id: '成人', dp: 1150, ap: 1030, dep: 0,
    img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600'
  },
  {
    name: '峇里島佩尼達島一日包車浮潛體驗',
    city: 'DPS', cat: '地接行程', spot: '佩尼達島',
    features: '峇里島碼頭來回快艇船票\n私人島上包車導覽（精靈沙灘、破碎灘）\n含 3 個浮潛點（有機會與曼波魚共游）\n含午餐',
    notice: '最少 2 人起訂\n行程約 10 小時\n暈船者請提前半小時服用暈船藥\n需提前 2 天預訂',
    id: '成人', dp: 2500, ap: 2250, dep: 500,
    img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600'
  },
  {
    name: '台北 101 觀景台快速通關門票',
    city: 'TPE', cat: '門票', spot: '台北101',
    features: '免排隊尊榮快速通關禮遇\n直達 89 樓觀景台與 91 樓戶外平台\n俯瞰台北盆地景觀\n含阻尼器近距離參觀',
    notice: '需依指定場次時段入場\n91樓戶外平台若遇下雨將不開放\n最後入場時間 21:15',
    id: '成人', dp: 1200, ap: 1080, dep: 0,
    img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600'
  },
  {
    name: '香港迪士尼樂園一日門票',
    city: 'HKG', cat: '門票', spot: '香港迪士尼',
    features: '全日通行 7 大主題園區\n包含全新冰雪奇緣魔雪奇緣世界\n欣賞城堡煙火光雕匯演',
    notice: '需提前於官方網頁進行預約入園\n門票不含特快通行證\n開放時間 10:00~20:30',
    id: '成人', dp: 2500, ap: 2250, dep: 500,
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600'
  },
  {
    name: '澳門威尼斯人貢多拉船票',
    city: 'MFM', cat: '票券', spot: '威尼斯人酒店',
    features: '運河遊船體驗 (約 15 分鐘)\n外籍船夫現場悠揚高歌吟唱\n免排隊憑證掃碼直接乘船',
    notice: '需至大運河禮賓部兌換登記\n每船最多乘坐 4 位成人\n開放時間 12:00~20:00',
    id: '成人', dp: 450, ap: 400, dep: 0,
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600'
  },
  {
    name: '巴黎羅浮宮免排隊電子門票 (含導覽)',
    city: 'PAR', cat: '門票', spot: '羅浮宮',
    features: '免排隊指定快速通關入口\n觀賞蒙娜麗莎、維納斯等珍貴館藏\n包含中文語音導覽器租借',
    notice: '每週二休館\n需預訂指定入場時間\n安全檢查仍需排隊，請提前半小時抵達',
    id: '成人', dp: 750, ap: 675, dep: 0,
    img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600'
  },
  {
    name: '紐約帝國大廈 86 樓觀景台門票',
    city: 'NYC', cat: '門票', spot: '帝國大廈',
    features: '86 樓露天觀景台 360 度俯瞰紐約曼哈頓\n參觀 2 樓互動歷史展覽\n免費提供手持多媒體導覽設備',
    notice: '營業時間 10:00~22:00\n需預約日期與時間\n天氣不良時不退票',
    id: '成人', dp: 1400, ap: 1260, dep: 0,
    img: 'https://images.unsplash.com/photo-1522083165195-3427502977a1?w=600'
  },
  {
    name: '倫敦眼 (The London Eye) 摩天輪門票',
    city: 'LON', cat: '門票', spot: '泰晤士河畔',
    features: '乘坐舒適恆溫座艙 (一圈約 30 分鐘)\n360 度俯瞰大笨鐘、國會大廈與聖保羅大教堂\n含 4D 電影體驗',
    notice: '需指定日期與場次時段\n建議提早 15 分鐘抵達安全檢查\n15歲以下需成人陪同',
    id: '成人', dp: 1250, ap: 1125, dep: 0,
    img: 'https://images.unsplash.com/photo-1513635269975-59663e0ca1ad?w=600'
  },
  {
    name: '澳洲墨爾本大洋路經典一日遊',
    city: 'MEL', cat: '地接行程', spot: '大洋路',
    features: '墨爾本市區出發中文導遊專車接送\n拜訪十二門徒石、洛克阿德峽谷與阿波羅灣\n野生無尾熊觀賞點',
    notice: '行程時間約 11 小時\n費用不含午餐與個人消費\n需提前 3 天預訂',
    id: '成人', dp: 2200, ap: 1980, dep: 500,
    img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600'
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
