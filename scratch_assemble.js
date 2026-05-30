const fs = require('fs');
const transcriptPath = '/Users/jetwebpeter/.gemini/antigravity/brain/3d561caf-cd03-4f4e-81ac-5d9948972429/.system_generated/logs/transcript.jsonl';
const basePath = '/Users/jetwebpeter/claude/b2b2c-tour/frontend/src/components/HotelSearch.tsx';

const reconstructedLines = new Array(1076).fill(null);

// 1. Fill base lines 1 to 229 from clean file
const cleanContent = fs.readFileSync(basePath, 'utf8');
const cleanLines = cleanContent.split('\n');
for (let i = 0; i < Math.min(229, cleanLines.length); i++) {
  reconstructedLines[i + 1] = cleanLines[i];
}

// 2. Parse views from transcript before step 1133
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
const parseArg = (val) => {
  if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
    try {
      return JSON.parse(val);
    } catch(e) {
      return val;
    }
  }
  return val;
};

let lastViewedStep = null;
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls && data.step_index < 1133) {
      for (const tc of data.tool_calls) {
        if (tc.name === 'view_file' && parseArg(tc.args.AbsolutePath)?.includes('HotelSearch.tsx')) {
          lastViewedStep = data.step_index;
        }
      }
    }
    if (data.type === 'VIEW_FILE' && lastViewedStep !== null && data.step_index === lastViewedStep + 1) {
      lastViewedStep = null;
      const fileLines = data.content.split('\n');
      for (const fl of fileLines) {
        const match = fl.match(/^(\d+):\s(.*)$/);
        if (match) {
          const lineNum = parseInt(match[1]);
          const lineContent = match[2];
          if (lineNum <= 1075) {
            reconstructedLines[lineNum] = lineContent;
          }
        } else {
          const matchEmpty = fl.match(/^(\d+):$/);
          if (matchEmpty) {
            const lineNum = parseInt(matchEmpty[1]);
            if (lineNum <= 1075) {
              reconstructedLines[lineNum] = '';
            }
          }
        }
      }
    }
  } catch(e) {}
}

// 3. Fill manual lines from reconstruct_from_views.js
reconstructedLines[551] = '                <span style={{fontSize:13,color:\'#666\'}}>年齡:</span>';
reconstructedLines[552] = '                <input value={childAges} onChange={e => setChildAges(e.target.value)} placeholder="10" style={{width:60,padding:\'2px 6px\',borderRadius:4,border:\'1px solid #ddd\',fontSize:13}} />';
reconstructedLines[553] = '              </div>}';
reconstructedLines[554] = '            </div>';
reconstructedLines[555] = '          </div>';
reconstructedLines[556] = '        </div>';
reconstructedLines[557] = '';
reconstructedLines[558] = '        {error && <div style={{background:\'#fee2e2\',color:\'#dc2626\',padding:\'10px 14px\',borderRadius:8,fontSize:13,marginTop:16}}>{error}</div>}';
reconstructedLines[559] = '';
reconstructedLines[560] = '        {(searched || hotels.length > 0 || mapHotels.length > 0) && (';
reconstructedLines[561] = '          <div className="results-section"><div className="results-wrapper">';
reconstructedLines[562] = '            <div className="results-header" style={{display:\'flex\',justifyContent:\'space-between\',alignItems:\'center\',flexWrap:\'wrap\',gap:8}}>';
reconstructedLines[563] = '              <h2>熱門住宿建議</h2>';
reconstructedLines[564] = '              <span className="results-count">找到 {total} 間{view === \'list\' ? \'符合的住宿\' : \'飯店 (地圖)\'}{view === \'list\' ? ` · ${nights} 晚` : \'\'}</span>';
reconstructedLines[565] = '              <div style={{display:\'flex\',gap:4,background:\'#f0f2f5\',borderRadius:8,padding:3}}>';
reconstructedLines[566] = '                {([\'list\',\'map\'] as const).map(v => (';
reconstructedLines[567] = '                  <button key={v} onClick={() => setView(v)} style={{';
reconstructedLines[568] = '                    padding:\'7px 16px\',fontSize:13,border:\'none\',borderRadius:6,cursor:\'pointer\',fontWeight:500,';
reconstructedLines[569] = '                    background:view===v?\'#fff\':\'transparent\',color:view===v?\'#1a4b8c\':\'#666\',';

reconstructedLines[626] = '                          {h.amenities.length > 3 && <span className="amenity-tag-more">+{h.amenities.length - 3}</span>}';
reconstructedLines[627] = '                        </div>';
reconstructedLines[628] = '                      )}';
reconstructedLines[629] = '';

reconstructedLines[741] = '            <div className="hotel-detail-tabs">';
reconstructedLines[742] = '              <button ';
reconstructedLines[743] = '                className={`hotel-detail-tab-btn ${activeTab === \'photos\' ? \'active\' : \'\'}`}';
reconstructedLines[744] = '                onClick={() => setActiveTab(\'photos\')}';
reconstructedLines[745] = '              >';
reconstructedLines[746] = '                📷 酒店相片';
reconstructedLines[747] = '              </button>';
reconstructedLines[748] = '              <button ';
reconstructedLines[749] = '                className={`hotel-detail-tab-btn ${activeTab === \'rooms\' ? \'active\' : \'\'}`}';

reconstructedLines[1056] = '                  </a>';
reconstructedLines[1057] = '                )}';
reconstructedLines[1058] = '              </div>';
reconstructedLines[1059] = '            </div>';
reconstructedLines[1060] = '          </div>';
reconstructedLines[1061] = '        </div>';
reconstructedLines[1062] = '      )}';
reconstructedLines[1063] = '';
reconstructedLines[1064] = '      {/* Lightbox for gallery images zoom preview */}';
reconstructedLines[1065] = '      {lightboxImage && (';
reconstructedLines[1066] = '        <div style={{ position: \'fixed\', inset: 0, background: \'rgba(0,0,0,.85)\', zIndex: 2000, display: \'flex\', alignItems: \'center\', justifyContent: \'center\', padding: \'40px\' }} onClick={() => setLightboxImage(null)}>';
reconstructedLines[1067] = '          <button style={{ position: \'absolute\', top: \'20px\', right: \'20px\', background: \'rgba(255,255,255,.15)\', border: \'none\', color: \'#fff\', borderRadius: \'50%\', width: \'40px\', height: \'40px\', cursor: \'pointer\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\' }} onClick={() => setLightboxImage(null)}>';
reconstructedLines[1068] = '            <X size={24} />';
reconstructedLines[1069] = '          </button>';
reconstructedLines[1070] = '          <img src={cleanImageUrl ? cleanImageUrl(lightboxImage) : lightboxImage} alt="Zoomed preview" style={{ maxWidth: \'100%\', maxHeight: \'100%\', objectFit: \'contain\', borderRadius: \'8px\', boxShadow: \'0 10px 25px rgba(0,0,0,0.5)\' }} />';
reconstructedLines[1071] = '        </div>';
reconstructedLines[1072] = '      )}';
reconstructedLines[1073] = '    </div>';
reconstructedLines[1074] = '  );';
reconstructedLines[1075] = '}';

// Check for any remaining gaps (1 to 1075)
let gaps = [];
for (let i = 1; i <= 1075; i++) {
  if (reconstructedLines[i] === null) {
    gaps.push(i);
  }
}

console.log('Total gaps:', gaps.length);
if (gaps.length > 0) {
  console.log('Gaps:', JSON.stringify(gaps));
} else {
  const finalContent = reconstructedLines.slice(1, 1076).join('\n');
  fs.writeFileSync(basePath, finalContent, 'utf8');
  console.log('File successfully reconstructed and written!');
}
