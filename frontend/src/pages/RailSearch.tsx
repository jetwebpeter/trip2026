import { useState } from 'react';

const ZONES: Record<string, {label: string; flag: string; color: string; operators: {id: string; name: string; logo: string}[]; cities: {id: string; name: string; country: string}[]}> = {
  eu: { label:'歐鐵', flag:'🇪🇺', color:'#003399', operators:[{id:'eurostar',name:'Eurostar',logo:'ES'},{id:'tgv',name:'TGV inOui',logo:'TGV'},{id:'ice',name:'ICE/DB',logo:'ICE'},{id:'thalys',name:'Thalys',logo:'TH'},{id:'renfe',name:'Renfe AVE',logo:'AVE'}], cities:[{id:'LON',name:'倫敦',country:'英國'},{id:'PAR',name:'巴黎',country:'法國'},{id:'BRU',name:'布魯塞爾',country:'比利時'},{id:'AMS',name:'阿姆斯特丹',country:'荷蘭'},{id:'FRA',name:'法蘭克福',country:'德國'},{id:'BER',name:'柏林',country:'德國'},{id:'ZUR',name:'蘇黎世',country:'瑞士'},{id:'MIL',name:'米蘭',country:'義大利'},{id:'ROM',name:'羅馬',country:'義大利'},{id:'BAR',name:'巴塞隆納',country:'西班牙'},{id:'MAD',name:'馬德里',country:'西班牙'},{id:'VIE',name:'維也納',country:'奧地利'},{id:'MUC',name:'慕尼黑',country:'德國'},{id:'LYO',name:'里昂',country:'法國'}]},
  jp: { label:'日鐵', flag:'🇯🇵', color:'#BC002D', operators:[{id:'tokaido',name:'JR東海道新幹線',logo:'JR'},{id:'tohoku',name:'JR東北新幹線',logo:'JR'},{id:'kyushu',name:'JR九州新幹線',logo:'JR'}], cities:[{id:'TYO',name:'東京',country:'日本'},{id:'KYO',name:'京都',country:'日本'},{id:'OSA',name:'大阪',country:'日本'},{id:'NAG',name:'名古屋',country:'日本'},{id:'HIR',name:'廣島',country:'日本'},{id:'FUK',name:'福岡',country:'日本'},{id:'SEN',name:'仙台',country:'日本'},{id:'SAP',name:'札幌',country:'日本'}]},
  us: { label:'美鐵', flag:'🇺🇸', color:'#002868', operators:[{id:'acela',name:'Amtrak Acela',logo:'AC'},{id:'northeast',name:'Amtrak Northeast',logo:'AM'},{id:'coast',name:'Coast Starlight',logo:'AM'}], cities:[{id:'NYC',name:'紐約',country:'美國'},{id:'WAS',name:'華盛頓',country:'美國'},{id:'BOS',name:'波士頓',country:'美國'},{id:'CHI',name:'芝加哥',country:'美國'},{id:'LAX',name:'洛杉磯',country:'美國'},{id:'SFO',name:'舊金山',country:'美國'},{id:'SEA',name:'西雅圖',country:'美國'}]},
  cn: { label:'中鐵', flag:'🇨🇳', color:'#DE2910', operators:[{id:'cr400',name:'復興號CR400',logo:'復'},{id:'crh2',name:'和諧號CRH2',logo:'和'},{id:'crh380',name:'和諧號CRH380',logo:'高'}], cities:[{id:'BEI',name:'北京',country:'中國'},{id:'SHA',name:'上海',country:'中國'},{id:'GUA',name:'廣州',country:'中國'},{id:'SHE',name:'深圳',country:'中國'},{id:'CHE',name:'成都',country:'中國'},{id:'WUH',name:'武漢',country:'中國'},{id:'HAN',name:'杭州',country:'中國'}]},
};

const TRAINS = [
  {id:'t1',zone:'eu',operator:'eurostar',from:'LON',to:'PAR',depart:'06:01',arrive:'09:34',duration:'2h 33m',trainNo:'9080',equipment:['Wi-Fi','餐飲服務','靜音車廂'],promo:8200,standard:10456,youth:6800,child:4200,infant:0,notes:'出發自 London St Pancras，抵達 Paris Gare du Nord。需提前 30 分鐘到站。'},
  {id:'t2',zone:'eu',operator:'eurostar',from:'LON',to:'PAR',depart:'07:01',arrive:'10:27',duration:'2h 26m',trainNo:'9004',equipment:['Wi-Fi','餐飲服務','行李架'],promo:8200,standard:10456,youth:6800,child:4200,infant:0,notes:'出發自 London St Pancras，抵達 Paris Gare du Nord。'},
  {id:'t3',zone:'eu',operator:'eurostar',from:'LON',to:'PAR',depart:'08:01',arrive:'11:34',duration:'2h 33m',trainNo:'9008',equipment:['Wi-Fi','行李架'],promo:7200,standard:9800,youth:6000,child:3800,infant:0,notes:'出發自 London St Pancras，抵達 Paris Gare du Nord。'},
  {id:'t4',zone:'eu',operator:'tgv',from:'PAR',to:'LYO',depart:'06:22',arrive:'08:19',duration:'1h 57m',trainNo:'TGV6601',equipment:['Wi-Fi','餐飲車廂','行李架'],promo:2800,standard:5200,youth:2200,child:1500,infant:0,notes:'出發自 Paris Gare de Lyon。'},
  {id:'t5',zone:'eu',operator:'ice',from:'FRA',to:'BER',depart:'05:52',arrive:'09:42',duration:'3h 50m',trainNo:'ICE693',equipment:['Wi-Fi','餐飲車廂','商務艙'],promo:3900,standard:7800,youth:3200,child:2000,infant:0,notes:'每小時一班，座位充裕。'},
  {id:'t6',zone:'jp',operator:'tokaido',from:'TYO',to:'OSA',depart:'06:00',arrive:'08:20',duration:'2h 20m',trainNo:'のぞみ1',equipment:['Wi-Fi','販賣機','指定席','自由席'],promo:10800,standard:14250,youth:8500,child:7125,infant:0,notes:'東海道新幹線 のぞみ 號，最快班次。'},
  {id:'t7',zone:'jp',operator:'tokaido',from:'TYO',to:'KYO',depart:'06:00',arrive:'07:59',duration:'1h 59m',trainNo:'のぞみ1',equipment:['Wi-Fi','指定席'],promo:9280,standard:12710,youth:7200,child:6355,infant:0,notes:'東京 → 京都，中途無停靠。'},
  {id:'t8',zone:'us',operator:'acela',from:'NYC',to:'WAS',depart:'05:35',arrive:'08:40',duration:'3h 05m',trainNo:'Acela2150',equipment:['Wi-Fi','餐車','商務艙'],promo:4500,standard:8900,youth:3800,child:2200,infant:0,notes:'Acela 特快列車，全程設有商務艙服務。'},
  {id:'t9',zone:'us',operator:'acela',from:'NYC',to:'BOS',depart:'06:00',arrive:'09:45',duration:'3h 45m',trainNo:'Acela2100',equipment:['Wi-Fi','餐車','靜音車廂'],promo:3900,standard:7200,youth:3200,child:1800,infant:0,notes:'途經 Providence。'},
  {id:'t10',zone:'cn',operator:'cr400',from:'BEI',to:'SHA',depart:'06:43',arrive:'11:28',duration:'4h 45m',trainNo:'G1',equipment:['Wi-Fi','餐車','商務座','一等座','二等座'],promo:1350,standard:1750,youth:1200,child:875,infant:0,notes:'京滬高鐵全程最快班次。'},
  {id:'t11',zone:'cn',operator:'cr400',from:'GUA',to:'SHE',depart:'07:00',arrive:'07:31',duration:'31m',trainNo:'G6001',equipment:['Wi-Fi','二等座','一等座'],promo:180,standard:240,youth:150,child:120,infant:0,notes:'廣深高鐵，全程僅31分鐘。'},
];

export default function RailSearch() {
  const [zone, setZone] = useState<'eu'|'jp'|'us'|'cn'>('eu');
  const [tripType, setTripType] = useState<'one'|'round'>('one');
  const [pax, setPax] = useState({adult:1,youth:0,child:0,infant:0});
  const [fromCity, setFromCity] = useState('LON');
  const [toCity, setToCity] = useState('PAR');
  const [date, setDate] = useState(new Date(Date.now()+7*86400000).toISOString().slice(0,10));
  const [results, setResults] = useState<typeof TRAINS>([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<string|null>(null);
  const [showPax, setShowPax] = useState(false);

  const zd = ZONES[zone];
  const totalPax = pax.adult+pax.youth+pax.child+pax.infant;

  const handleZone = (z: 'eu'|'jp'|'us'|'cn') => {
    setZone(z); setFromCity(ZONES[z].cities[0].id); setToCity(ZONES[z].cities[1]?.id||ZONES[z].cities[0].id);
    setResults([]); setSearched(false);
  };

  const handleSearch = () => {
    setResults(TRAINS.filter(t => t.zone===zone && t.from===fromCity && t.to===toCity));
    setSearched(true); setSelected(null);
  };

  const calcPrice = (t: typeof TRAINS[0]) =>
    pax.adult*(t.promo||t.standard) + pax.youth*t.youth + pax.child*t.child + pax.infant*t.infant;

  const fc = zd.cities.find(c=>c.id===fromCity);
  const tc = zd.cities.find(c=>c.id===toCity);

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:"'Noto Sans TC','Helvetica Neue',sans-serif"}}>
      <style>{`.rbtn{padding:'8px 20px';border-radius:24px;border:'2px solid #e2e8f0';background:#fff;cursor:pointer;font-size:14px;font-weight:600;transition:'all .2s'} .rbtn.active{background:var(--zc);color:#fff;border-color:var(--zc)} .trow{background:#fff;border-radius:12px;padding:20px 24px;margin-bottom:12px;border:1.5px solid #e2e8f0;cursor:pointer;transition:all .2s} .trow:hover{border-color:#2a9d8f;box-shadow:0 4px 16px rgba(42,157,143,.1)} .trow.sel{border-color:#2a9d8f;background:#f0fdf9}`}</style>

      {/* HERO */}
      <div style={{background:'linear-gradient(135deg,#0f2942 0%,#1a4b8c 60%,#2563eb 100%)',color:'#fff',paddingBottom:0,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,right:0,width:'40%',height:'100%',background:'url(https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80) center/cover',opacity:.2}}/>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'36px 24px 0',position:'relative'}}>
          <h1 style={{fontSize:30,fontWeight:700,margin:'0 0 6px'}}>🚄 搭火車遊世界</h1>
          <p style={{opacity:.85,margin:'0 0 24px',fontSize:15}}>歐鐵・日鐵・美鐵・中鐵，在這裡預訂您的火車票</p>

          {/* Zone tabs */}
          <div style={{display:'flex',gap:10,marginBottom:24,flexWrap:'wrap'}}>
            {(Object.entries(ZONES) as [string,typeof ZONES.eu][]).map(([k,z])=>(
              <button key={k} onClick={()=>handleZone(k as 'eu'|'jp'|'us'|'cn')}
                style={{padding:'8px 20px',borderRadius:24,border:`2px solid ${zone===k?z.color:'rgba(255,255,255,.3)'}`,background:zone===k?z.color:'rgba(255,255,255,.1)',color:'#fff',cursor:'pointer',fontSize:14,fontWeight:600}}>
                {z.flag} {z.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{background:'rgba(255,255,255,.97)',borderRadius:'14px 14px 0 0',padding:'20px 24px 16px'}}>
            <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
              {/* Trip type */}
              <div style={{display:'flex',border:'1.5px solid #e2e8f0',borderRadius:8,overflow:'hidden'}}>
                {[['one','單程'],['round','來回']].map(([v,l])=>(
                  <button key={v} onClick={()=>setTripType(v as 'one'|'round')}
                    style={{padding:'8px 16px',border:'none',background:tripType===v?'#1a4b8c':'#fff',color:tripType===v?'#fff':'#374151',cursor:'pointer',fontSize:14,fontWeight:500}}>{l}</button>
                ))}
              </div>

              {/* Passengers */}
              <div style={{position:'relative'}}>
                <button onClick={()=>setShowPax(!showPax)}
                  style={{padding:'8px 14px',border:'1.5px solid #e2e8f0',borderRadius:8,background:'#fff',cursor:'pointer',fontSize:14}}>
                  👤 {totalPax} 乘客
                </button>
                {showPax && (
                  <div style={{position:'absolute',top:'110%',left:0,background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:12,padding:18,zIndex:200,minWidth:240,boxShadow:'0 8px 24px rgba(0,0,0,.12)'}}>
                    {[['adult','成人','12歲以上'],['youth','青年','12-25歲'],['child','兒童','4-11歲'],['infant','嬰兒','0-3歲']].map(([k,l,s])=>(
                      <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                        <div><div style={{fontSize:14,fontWeight:600}}>{l}</div><div style={{fontSize:12,color:'#94a3b8'}}>{s}</div></div>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <button onClick={()=>setPax(p=>({...p,[k]:Math.max(k==='adult'?1:0,p[k as keyof typeof p]-1)}))}
                            style={{width:28,height:28,borderRadius:'50%',border:'1.5px solid #cbd5e1',background:'#fff',cursor:'pointer',fontSize:16}}>−</button>
                          <span style={{width:24,textAlign:'center',fontWeight:600}}>{pax[k as keyof typeof pax]}</span>
                          <button onClick={()=>setPax(p=>({...p,[k]:p[k as keyof typeof p]+1}))}
                            style={{width:28,height:28,borderRadius:'50%',border:'1.5px solid #cbd5e1',background:'#fff',cursor:'pointer',fontSize:16}}>+</button>
                        </div>
                      </div>
                    ))}
                    <button onClick={()=>setShowPax(false)} style={{width:'100%',padding:10,background:'#1a4b8c',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>確認</button>
                  </div>
                )}
              </div>
            </div>

            {/* From/To/Date/Search */}
            <div style={{display:'flex',gap:10,alignItems:'flex-end',flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:130}}>
                <div style={{fontSize:11,color:'#94a3b8',fontWeight:600,marginBottom:4}}>出發城市</div>
                <select value={fromCity} onChange={e=>setFromCity(e.target.value)}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:14,background:'#fff'}}>
                  {zd.cities.map(c=><option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
                </select>
              </div>
              <button onClick={()=>{const t=fromCity;setFromCity(toCity);setToCity(t);}}
                style={{padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:8,background:'#f8fafc',cursor:'pointer',fontSize:18,marginBottom:0}}>⇄</button>
              <div style={{flex:1,minWidth:130}}>
                <div style={{fontSize:11,color:'#94a3b8',fontWeight:600,marginBottom:4}}>抵達城市</div>
                <select value={toCity} onChange={e=>setToCity(e.target.value)}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:14,background:'#fff'}}>
                  {zd.cities.map(c=><option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
                </select>
              </div>
              <div style={{flex:1,minWidth:130}}>
                <div style={{fontSize:11,color:'#94a3b8',fontWeight:600,marginBottom:4}}>出發日期</div>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:14,boxSizing:'border-box' as const}}/>
              </div>
              <button onClick={handleSearch}
                style={{padding:'10px 28px',background:'linear-gradient(135deg,#e63946,#c1121f)',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:15,fontWeight:700,whiteSpace:'nowrap' as const}}>
                搜索
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{maxWidth:1100,margin:'0 auto',padding:'24px'}}>
        <div style={{display:'flex',gap:24,flexWrap:'wrap' as const,alignItems:'flex-start'}}>

          {/* LEFT */}
          <div style={{width:320,flexShrink:0}}>
            {/* Operators */}
            <div style={{background:'#fff',borderRadius:12,padding:16,border:'1.5px solid #e2e8f0',marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:600,color:'#1e293b',marginBottom:12}}>🚂 合作鐵路業者</div>
              {zd.operators.map(op=>(
                <div key={op.id} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:'1px solid #f1f5f9'}}>
                  <div style={{width:36,height:36,borderRadius:8,background:zd.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700,flexShrink:0}}>{op.logo}</div>
                  <span style={{fontSize:14,color:'#374151'}}>{op.name}</span>
                </div>
              ))}
            </div>
            {/* Cities */}
            <div style={{background:'#fff',borderRadius:12,padding:16,border:'1.5px solid #e2e8f0'}}>
              <div style={{fontSize:14,fontWeight:600,color:'#1e293b',marginBottom:12}}>🏙️ 熱門城市</div>
              <div style={{display:'flex',flexWrap:'wrap' as const,gap:8}}>
                {zd.cities.map(c=>(
                  <button key={c.id} onClick={()=>fromCity===c.id?setToCity(c.id):setFromCity(c.id)}
                    style={{padding:'5px 12px',borderRadius:20,border:`1.5px solid ${fromCity===c.id?'#e63946':toCity===c.id?'#2a9d8f':'#e2e8f0'}`,background:fromCity===c.id?'#fff0f0':toCity===c.id?'#f0fdf9':'#fff',color:fromCity===c.id?'#e63946':toCity===c.id?'#2a9d8f':'#374151',cursor:'pointer',fontSize:13}}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{flex:1,minWidth:300}}>
            {fc&&tc&&<div style={{marginBottom:16}}>
              <h2 style={{margin:'0 0 4px',fontSize:20,color:'#1e293b'}}>選擇去程 <span style={{color:'#e63946'}}>{fc.name}</span> → <span style={{color:'#2a9d8f'}}>{tc.name}</span></h2>
              <p style={{margin:0,fontSize:13,color:'#64748b'}}>{date} ・ {totalPax} 位乘客</p>
            </div>}

            {!searched ? (
              <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:12,border:'1.5px solid #e2e8f0'}}>
                <div style={{fontSize:48,marginBottom:12}}>🚄</div>
                <p style={{color:'#94a3b8',fontSize:15}}>選擇城市和日期，點擊「搜索」查詢班次</p>
              </div>
            ) : results.length===0 ? (
              <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:12,border:'1.5px solid #e2e8f0'}}>
                <div style={{fontSize:48,marginBottom:12}}>😔</div>
                <p style={{color:'#94a3b8',fontSize:15}}>目前沒有符合條件的班次，請嘗試其他城市組合</p>
              </div>
            ) : results.map(train=>{
              const op = zd.operators.find(o=>o.id===train.operator);
              const isSel = selected===train.id;
              const price = calcPrice(train);
              return (
                <div key={train.id} className={`trow${isSel?' sel':''}`} onClick={()=>setSelected(isSel?null:train.id)}>
                  <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12}}>
                    <div style={{width:44,height:44,borderRadius:10,background:zd.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:700,flexShrink:0}}>{op?.logo}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,color:'#94a3b8',marginBottom:2}}>{op?.name} ・ {train.trainNo}</div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:22,fontWeight:700,color:'#1e293b'}}>{train.depart}</span>
                        <span style={{flex:1,textAlign:'center',fontSize:11,color:'#94a3b8'}}>──── {train.duration} ────</span>
                        <span style={{fontSize:22,fontWeight:700,color:'#1e293b'}}>{train.arrive}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#64748b'}}>
                        <span>{fc?.name}</span><span>{tc?.name}</span>
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      {train.promo<train.standard&&<div style={{fontSize:11,color:'#94a3b8',textDecoration:'line-through'}}>NT$ {(pax.adult*train.standard).toLocaleString()}</div>}
                      <div style={{fontSize:20,fontWeight:700,color:'#e63946'}}>NT$ {price.toLocaleString()}</div>
                      <div style={{fontSize:11,color:'#94a3b8'}}>{totalPax}人合計</div>
                    </div>
                  </div>

                  <div style={{display:'flex',gap:6,flexWrap:'wrap' as const}}>
                    {train.equipment.map(eq=><span key={eq} style={{fontSize:11,padding:'3px 10px',background:'#f1f5f9',borderRadius:12,color:'#475569'}}>✓ {eq}</span>)}
                  </div>

                  {isSel&&<div style={{marginTop:16,paddingTop:16,borderTop:'1px solid #e2e8f0'}}>
                    <div style={{background:'#f8fafc',borderRadius:10,padding:14,marginBottom:12}}>
                      <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>票價明細</div>
                      {pax.adult>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span>成人 x{pax.adult}</span><span>NT$ {(pax.adult*(train.promo||train.standard)).toLocaleString()}</span></div>}
                      {pax.youth>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span>青年 x{pax.youth}</span><span>NT$ {(pax.youth*train.youth).toLocaleString()}</span></div>}
                      {pax.child>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span>兒童 x{pax.child}</span><span>NT$ {(pax.child*train.child).toLocaleString()}</span></div>}
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:700,borderTop:'1px solid #e2e8f0',paddingTop:8,marginTop:4,color:'#e63946'}}>
                        <span>合計</span><span>NT$ {price.toLocaleString()}</span>
                      </div>
                    </div>
                    <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#92400e',marginBottom:12}}>
                      ⚠️ 注意事項：{train.notes}
                    </div>
                    <button style={{width:'100%',padding:12,background:'linear-gradient(135deg,#e63946,#c1121f)',color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontSize:15,fontWeight:700}}>乘客詳細資料 →</button>
                  </div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
