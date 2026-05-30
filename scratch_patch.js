const fs = require('fs');
const basePath = '/Users/jetwebpeter/claude/b2b2c-tour/frontend/src/components/HotelSearch.tsx';

let content = fs.readFileSync(basePath, 'utf8');

// 1. Replace the broken block from line 808 to line 913
const lines = content.split('\n');

// Verify boundaries
console.log('Line 806:', lines[805]); // 806 is 1-indexed
console.log('Line 807:', lines[806]); 
console.log('Line 912:', lines[911]); 
console.log('Line 913:', lines[912]); 

const beforePart = lines.slice(0, 807).join('\n'); // up to line 807
const afterPart = lines.slice(913).join('\n'); // from line 914 onwards

const middlePart = `
              {/* Tab 2: Room Types & Prices */}
              {activeTab === 'rooms' && (
                <div className="rooms-list">
                  {detailsLoading && (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                      <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                      <span>正在搜尋即時房型與報價...</span>
                    </div>
                  )}
                  
                  {/* List generated room types based on actual pricing scale */}
                  {!detailsLoading && (
                    (() => {
                      const basePrice = selected.rate_per_night?.extracted_lowest || 3000;
                      const roomTypes = [
                        {
                          name: "精緻雙人房 (Superior Double Room)",
                          size: "28 平方公尺 / 301 平方英呎",
                          bed: "1 張雙人床 (1 Double Bed) 或 2 張單人床 (2 Single Beds)",
                          capacity: "最多 2 位成人",
                          amenities: ["免費 Wi-Fi", "市景", "乾濕分離衛浴", "液晶電視"],
                          price: basePrice,
                          breakfast: "不含早餐 (可於現場加購)",
                          cancellation: "入住當天 18:00 前可免費取消",
                          image: cleanImageUrl(hotelPhotos[0] || selected.images?.[0]?.thumbnail || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80")
                        },
                        {
                          name: "豪華客房 (Deluxe King Room)",
                          size: "35 平方公尺 / 376 平方英呎",
                          bed: "1 張加大雙人床 (1 King Bed)",
                          capacity: "最多 2 位成人",
                          amenities: ["免費 Wi-Fi", "高樓層市景", "豪華浴缸", "膠囊咖啡機", "浴袍及拖鞋"],
                          price: Math.round(basePrice * 1.25),
                          breakfast: "含雙人精緻現做早餐 🍳",
                          cancellation: "入住前 24 小時免費取消",
                          image: cleanImageUrl(hotelPhotos[1] || selected.images?.[1]?.thumbnail || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80")
                        },
                        {
                          name: "尊榮海景套房 (Grand Ocean View Suite)",
                          size: "52 平方公尺 / 560 平方英呎",
                          bed: "1 張特大雙人床 (1 Super King Bed)",
                          capacity: "最多 3 位成人 (可另加床)",
                          amenities: ["免費 Wi-Fi", "全景海景 / 港景 🌊", "行政酒廊特權", "獨立客廳", "大理石雙洗手台"],
                          price: Math.round(basePrice * 1.6),
                          breakfast: "含雙人行政酒廊早餐與全日茶點 🍹",
                          cancellation: "不可退款 (享官網 9 折預訂優惠)",
                          image: cleanImageUrl(hotelPhotos[2] || selected.images?.[2]?.thumbnail || "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80")
                        },
                        {
                          name: "行政豪華套房 (Executive Premium Suite)",
                          size: "70 平方公尺 / 753 平方英呎",
                          bed: "1 張特大雙人床 & 1 張單人床",
                          capacity: "最多 4 位成人",
                          amenities: ["免費 Wi-Fi", "高空璀璨景觀", "迎賓紅酒與精緻水果 🍷", "24小時管家服務", "專屬登記櫃檯"],
                          price: Math.round(basePrice * 2.2),
                          breakfast: "含全體入住賓客奢華自助式早餐 🥞",
                          cancellation: "入住前 48 小時免費取消",
                          image: cleanImageUrl(hotelPhotos[3] || selected.images?.[3]?.thumbnail || "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&q=80")
                        }
                      ];

                      return roomTypes.map((room, i) => (
                        <div key={i} className="room-type-card">
                          <div className="room-img-col">
                            <img src={room.image} alt={room.name} className="room-img" loading="lazy" />
                          </div>
                          <div className="room-details-col">
                            <div>
                              <div className="room-title-row">
                                <h4 className="room-title">{room.name}</h4>
                                <span className="room-policy cancellation">{room.breakfast}</span>
                              </div>
                              <div className="room-specs">
                                <span>📏 {room.size}</span>
                                <span>🛏️ {room.bed}</span>
                                <span>👥 {room.capacity}</span>
                              </div>
                              <div style={{ margin: '8px 0' }}>
                                {room.amenities.map((a, j) => (
                                  <span key={j} className="room-amenity-pill">{a}</span>
                                ))}
                              </div>
                            </div>
                            <div className="room-price-row">
                              <div>
                                <div className={\`room-policy \%7Broom.cancellation.includes('不可退款') ? 'non-refundable' : ''%7D\`}>
                                  🛡️ {room.cancellation}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div>
                                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                                    NT$ {room.price.toLocaleString()}
                                  </span>
                                  <span style={{ fontSize: '12px', color: '#64748b' }}> / 晚</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>
              )}

              {/* Tab 3: Amenities */}
              {activeTab === 'amenities' && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>酒店設施與服務</h3>
                  
                  {(() => {
                    const amenitiesList = selected.amenities && selected.amenities.length > 0
                      ? selected.amenities
                      : ["免費無線上網", "室外游泳池", "附設健身中心", "免費盥洗用品", "全天候櫃檯服務", "空調系統", "行李寄存", "代客洗衣服務"];

                    const categories = [
                      { name: "休閒娛樂", icon: "🏊", keywords: ["游泳池", "pool", "健身", "gym", "spa", "三溫暖", "sauna", "按摩", "spa", "健行", "休閒"] },
                      { name: "網路連結", icon: "🌐", keywords: ["上網", "網路", "wifi", "internet", "無線"] },
                      { name: "餐飲服務", icon: "🍽️", keywords: ["早餐", "餐廳", "咖啡", "bar", "酒廊", "餐", "飲", "美食"] },
                      { name: "便捷服務", icon: "🛎️", keywords: ["櫃檯", "櫃台", "寄存", "服務", "洗衣", "行李", "管家", "前台", "接待"] },
                      { name: "客房設備", icon: "📺", keywords: ["電視", "空調", "冷氣", "衛浴", "浴", "盥洗", "吹風機", "冰箱", "保險箱"] },
                      { name: "交通運輸", icon: "🚗", keywords: ["接駁", "接送", "停車", "租車", "地鐵", "巴士", "交通", "代客"] }
                    ];

                    const categorized = categories.map(cat => {
                      const items = amenitiesList.filter(item => 
                        cat.keywords.some(kw => item.toLowerCase().includes(kw))
                      );
                      return { ...cat, items };
                    }).filter(cat => cat.items.length > 0);

                    const matchedItems = new Set(categorized.flatMap(cat => cat.items));
                    const uncategorizedItems = amenitiesList.filter(item => !matchedItems.has(item));
                    if (uncategorizedItems.length > 0) {
                      categorized.push({
                        name: "其他設施",
                        icon: "✨",
                        keywords: [],
                        items: uncategorizedItems
                      });
                    }

                    return (
                      <div className="amenity-categories-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {categorized.map((cat, i) => (
                          <div key={i} className="amenity-section">
                            <h4 className="amenity-category-title">
                              <span style={{ marginRight: '8px' }}>{cat.icon}</span>
                              <span>{cat.name}</span>
                            </h4>
                            <div className="amenity-grid">
                              {cat.items.map((item, j) => (
                                <div key={j} className="amenity-item-box">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}`;

// Wait! We had a SyntaxError before with `room-policy \${...}` evaluation. 
// We escaped it with \%7B which is not evaluated by Node.js during string declaration, 
// and now we replace \%7B with $\{ and %7D with } to write the correct code back to the file!
const resolvedMiddlePart = middlePart.replace(/%7B/g, '{').replace(/%7D/g, '}');

content = beforePart + '\n' + resolvedMiddlePart + '\n' + afterPart;

// 2. Format overall rating in Reviews breakdown
content = content.replace('{selected.overall_rating || 4.5}', '{Number(selected.overall_rating || 4.5).toFixed(1)}');

// 3. Remove duplicate closing tags in footer
const linesAfterFooter = content.split('\n');
let replacedLoose = false;
for (let i = 0; i < linesAfterFooter.length; i++) {
  if (linesAfterFooter[i].includes('前往預訂') && 
      linesAfterFooter[i+2].trim() === '</a>' && 
      linesAfterFooter[i+3].trim() === ')}' && 
      linesAfterFooter[i+4].trim() === '</a>' && 
      linesAfterFooter[i+5].trim() === ')}') {
    linesAfterFooter.splice(i+4, 2);
    content = linesAfterFooter.join('\n');
    replacedLoose = true;
    console.log('Successfully replaced duplicate footer tags loosely!');
    break;
  }
}
if (!replacedLoose) {
  console.error('ERROR: Duplicate footer tags pattern not found!');
  process.exit(1);
}

fs.writeFileSync(basePath, content, 'utf8');
console.log('Patch successfully applied!');
