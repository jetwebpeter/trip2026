import { useState, useEffect, useCallback } from 'react';

const API = '';

// ===== TYPES =====
interface Tour {
  tour_product_no: string; tour_product_name: string; arrival_city: string; region: string;
  duration_days: number; direct_price: number; agency_price: number; agency_rebate_pct: number;
  deposit: number; product_description: string; booking_notice: string; transportation: string;
  city_code: string; tag: string; created_at: string; updated_at: string;
}
interface Voucher {
  voucher_uuid: string; voucher_code: string; voucher_name: string; city_code: string;
  category: string; identity_type: string; direct_price: number; agency_price: number;
  deposit: number; features: string; notice: string; spot_relation: string; image_url: string;
  valid_from: string; valid_to: string; audit_status: string; publish_status: string;
  created_at: string; updated_at: string;
}

const auditBadge: Record<string,{t:string;bg:string;c:string}> = {
  pending:{t:'待審核',bg:'#fef3c7',c:'#92400e'},approved:{t:'已通過',bg:'#d1fae5',c:'#065f46'},rejected:{t:'未通過',bg:'#fee2e2',c:'#991b1b'}
};
const pubBadge: Record<string,{t:string;bg:string;c:string}> = {
  unpublished:{t:'未發佈',bg:'#f3f4f6',c:'#4b5563'},published:{t:'已發佈',bg:'#dbeafe',c:'#1e40af'},withdrawn:{t:'已撤銷',bg:'#fde68a',c:'#92400e'}
};

const Badge = ({m,s}:{m:Record<string,any>;s:string}) => {
  const v = m[s]||{t:s,bg:'#f3f4f6',c:'#333'};
  return <span style={{background:v.bg,color:v.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600}}>{v.t}</span>;
};

const Btn = ({color,children,onClick}:{color:string;children:React.ReactNode;onClick:()=>void}) =>
  <button onClick={onClick} style={{padding:'3px 10px',fontSize:11,border:`1px solid ${color}33`,borderRadius:4,background:color+'10',color,cursor:'pointer',fontWeight:500}}>{children}</button>;

// ===== MAIN COMPONENT =====
export default function AdminProducts() {
  const [tab, setTab] = useState<'tours'|'vouchers'>('tours');

  return (
    <div className="main-content">
      <div className="container" style={{maxWidth:1200}}>
        <h1 style={{fontSize:22,fontWeight:600,margin:'0 0 20px'}}>產品管理</h1>

        {/* TAB BAR */}
        <div style={{display:'flex',borderBottom:'2px solid #e5e7eb',marginBottom:20}}>
          {([['tours','✈️ 團體旅遊'],['vouchers','🎫 票券管理']] as const).map(([k,label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding:'12px 24px',fontSize:15,border:'none',background:'none',cursor:'pointer',
              borderBottom: tab===k ? '3px solid #1a4b8c' : '3px solid transparent',
              color: tab===k ? '#1a4b8c' : '#888', fontWeight: tab===k ? 600 : 400, marginBottom: -2
            }}>{label}</button>
          ))}
        </div>

        {tab === 'tours' && <TourAdmin />}
        {tab === 'vouchers' && <VoucherAdmin />}
      </div>
    </div>
  );
}

// =============================================
// TOUR ADMIN TAB
// =============================================
function TourAdmin() {
  const [items, setItems] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Tour>|null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Try port 3002 first, fallback to 3001
      let r = await fetch(`${API}/api/admin/tours`).catch(() => null);
      if (!r || !r.ok) r = await fetch('/api/tours');
      const d = await r.json();
      setItems(d.items || []);
    } catch { setMsg('載入失敗'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    const last = items[0]?.tour_product_no || 'GFG000';
    const num = parseInt(last.replace(/\D/g, ''), 10) + 1;
    setEditing({
      tour_product_no: 'GFG' + String(num).padStart(3, '0'),
      tour_product_name: '', arrival_city: '', region: '亞洲', duration_days: 5,
      direct_price: 0, agency_price: 0, agency_rebate_pct: 0, deposit: 0,
      product_description: '', booking_notice: '', transportation: '飛機', city_code: '', tag: ''
    });
    setIsNew(true); setMsg('');
  };

  const save = async () => {
    if (!editing?.tour_product_name) { setMsg('請填入產品名稱'); return; }
    setMsg('');
    try {
      const url = isNew ? `${API}/api/admin/tours` : `${API}/api/admin/tours/${editing.tour_product_no}`;
      const r = await fetch(url, { method: isNew?'POST':'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(editing) });
      const d = await r.json();
      if (d.ok) { setMsg('✅ 已儲存'); setEditing(null); setIsNew(false); load(); }
      else { setMsg('❌ ' + (d.error||'失敗')); }
    } catch (e) { setMsg('❌ ' + (e as Error).message); }
  };

  const del = async (id: string) => {
    if (!confirm('確定刪除此行程？')) return;
    await fetch(`${API}/api/admin/tours/${id}`, { method: 'DELETE' });
    load();
  };

  const set = (k: string, v: any) => setEditing(p => p ? { ...p, [k]: v } : p);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <span style={{fontSize:14,color:'#888'}}>共 {items.length} 個行程</span>
        <button onClick={openNew} style={{padding:'8px 20px',background:'#1a4b8c',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14}}>＋ 新增行程</button>
      </div>
      {msg && <div style={{background:msg.startsWith('✅')?'#d1fae5':'#fee2e2',color:msg.startsWith('✅')?'#065f46':'#991b1b',padding:'10px 14px',borderRadius:8,fontSize:13,marginBottom:12}}>{msg}</div>}

      <Table>
        <thead><tr style={{background:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
          {['產品代號','名稱','城市','天數','同業價','操作'].map(h=><Th key={h}>{h}</Th>)}
        </tr></thead>
        <tbody>
          {loading && <tr><td colSpan={6} style={{padding:30,textAlign:'center',color:'#888'}}>載入中...</td></tr>}
          {items.map(t => (
            <tr key={t.tour_product_no} style={{borderBottom:'1px solid #f3f4f6'}}>
              <Td mono>{t.tour_product_no}</Td>
              <Td bold maxW={220}>{t.tour_product_name}</Td>
              <Td>{t.arrival_city || t.city_code}</Td>
              <Td>{t.duration_days} 天</Td>
              <Td price>NT$ {(t.agency_price||0).toLocaleString()}</Td>
              <Td>
                <div style={{display:'flex',gap:4}}>
                  <Btn color="#1a4b8c" onClick={() => { setEditing({...t}); setIsNew(false); setMsg(''); }}>編輯</Btn>
                  <Btn color="#991b1b" onClick={() => del(t.tour_product_no)}>刪除</Btn>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* EDIT MODAL */}
      {editing && (
        <Modal onClose={() => { setEditing(null); setIsNew(false); }}>
          <h2 style={{fontSize:18,fontWeight:600,margin:'0 0 16px'}}>{isNew ? '＋ 新增行程' : '✏️ 編輯行程'}</h2>
          <Grid>
            <F label="產品代號" span={1}><input value={editing.tour_product_no||''} disabled style={{background:'#f3f4f6'}} /></F>
            <F label="產品名稱 *" span={1}><input value={editing.tour_product_name||''} onChange={e => set('tour_product_name', e.target.value)} /></F>
            <F label="目的地城市"><input value={editing.arrival_city||''} onChange={e => set('arrival_city', e.target.value)} /></F>
            <F label="區域"><select value={editing.region||'亞洲'} onChange={e => set('region',e.target.value)}>{['亞洲','歐洲','美洲','大洋洲','非洲'].map(r=><option key={r}>{r}</option>)}</select></F>
            <F label="天數"><input type="number" value={editing.duration_days||5} onChange={e => set('duration_days',+e.target.value)} /></F>
            <F label="交通"><select value={editing.transportation||'飛機'} onChange={e => set('transportation',e.target.value)}>{['飛機','巴士','火車','郵輪'].map(r=><option key={r}>{r}</option>)}</select></F>
            <F label="直售價"><input type="number" value={editing.direct_price||0} onChange={e => set('direct_price',+e.target.value)} /></F>
            <F label="同業價"><input type="number" value={editing.agency_price||0} onChange={e => set('agency_price',+e.target.value)} /></F>
            <F label="回扣%"><input type="number" value={editing.agency_rebate_pct||0} onChange={e => set('agency_rebate_pct',+e.target.value)} /></F>
            <F label="訂金"><input type="number" value={editing.deposit||0} onChange={e => set('deposit',+e.target.value)} /></F>
            <F label="產品說明" span={2}><textarea value={editing.product_description||''} onChange={e => set('product_description',e.target.value)} rows={3} /></F>
            <F label="預訂須知" span={2}><textarea value={editing.booking_notice||''} onChange={e => set('booking_notice',e.target.value)} rows={2} /></F>
          </Grid>
          <ModalFooter onSave={save} onCancel={() => { setEditing(null); setIsNew(false); }} isNew={isNew} />
        </Modal>
      )}
    </div>
  );
}

// =============================================
// VOUCHER ADMIN TAB
// =============================================
function VoucherAdmin() {
  const [items, setItems] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Voucher>|null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/vouchers`);
      const d = await r.json();
      setItems(d.items || []);
    } catch { setMsg('載入失敗，請確認 hotel-server (port 3002)'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing({ voucher_name:'', city_code:'SIN', category:'票券', identity_type:'成人',
      direct_price:0, agency_price:0, deposit:0, features:'', notice:'', spot_relation:'', image_url:'',
      valid_from:'', valid_to:'' });
    setIsNew(true); setMsg('');
  };

  const save = async () => {
    if (!editing?.voucher_name) { setMsg('請填入票券名稱'); return; }
    setMsg('');
    try {
      const url = isNew ? `${API}/api/admin/vouchers` : `${API}/api/admin/vouchers/${editing.voucher_uuid}`;
      const r = await fetch(url, { method:isNew?'POST':'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editing) });
      const d = await r.json();
      if (d.ok) { setMsg(isNew ? '✅ 已新增 '+d.voucher_code : '✅ 已更新'); setEditing(null); setIsNew(false); load(); }
      else { setMsg('❌ '+(d.error||'失敗')); }
    } catch (e) { setMsg('❌ '+(e as Error).message); }
  };

  const audit = async (id: string, decision: string) => {
    await fetch(`${API}/api/admin/vouchers/${id}/audit`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision})});
    load();
  };
  const publish = async (id: string) => { await fetch(`${API}/api/admin/vouchers/${id}/publish`,{method:'POST'}); load(); };
  const withdraw = async (id: string) => { await fetch(`${API}/api/admin/vouchers/${id}/withdraw`,{method:'POST'}); load(); };
  const del = async (id: string) => { if(!confirm('確定刪除？')) return; await fetch(`${API}/api/admin/vouchers/${id}`,{method:'DELETE'}); load(); };

  const set = (k: string, v: any) => setEditing(p => p ? { ...p, [k]: v } : p);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <span style={{fontSize:14,color:'#888'}}>共 {items.length} 個票券</span>
        <button onClick={openNew} style={{padding:'8px 20px',background:'#1a4b8c',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14}}>＋ 新增票券</button>
      </div>
      {msg && <div style={{background:msg.startsWith('✅')?'#d1fae5':'#fee2e2',color:msg.startsWith('✅')?'#065f46':'#991b1b',padding:'10px 14px',borderRadius:8,fontSize:13,marginBottom:12}}>{msg}</div>}

      <Table>
        <thead><tr style={{background:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
          {['代號','名稱','城市','類別','同業價','審核','發佈','操作'].map(h=><Th key={h}>{h}</Th>)}
        </tr></thead>
        <tbody>
          {loading && <tr><td colSpan={8} style={{padding:30,textAlign:'center',color:'#888'}}>載入中...</td></tr>}
          {items.map(v => (
            <tr key={v.voucher_uuid} style={{borderBottom:'1px solid #f3f4f6'}}>
              <Td mono>{v.voucher_code}</Td>
              <Td bold maxW={180}>{v.voucher_name}</Td>
              <Td>{v.city_code}</Td>
              <Td>{v.category}</Td>
              <Td price>NT$ {(v.agency_price||0).toLocaleString()}</Td>
              <Td><Badge m={auditBadge} s={v.audit_status} /></Td>
              <Td><Badge m={pubBadge} s={v.publish_status} /></Td>
              <Td>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  <Btn color="#1a4b8c" onClick={() => { setEditing({...v}); setIsNew(false); setMsg(''); }}>編輯</Btn>
                  {v.audit_status==='pending' && <>
                    <Btn color="#16a34a" onClick={() => audit(v.voucher_uuid,'approved')}>通過</Btn>
                    <Btn color="#dc2626" onClick={() => audit(v.voucher_uuid,'rejected')}>拒絕</Btn>
                  </>}
                  {v.audit_status==='approved' && v.publish_status!=='published' && <Btn color="#2563eb" onClick={() => publish(v.voucher_uuid)}>發佈</Btn>}
                  {v.publish_status==='published' && <Btn color="#d97706" onClick={() => withdraw(v.voucher_uuid)}>撤銷</Btn>}
                  <Btn color="#991b1b" onClick={() => del(v.voucher_uuid)}>刪除</Btn>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* EDIT MODAL */}
      {editing && (
        <Modal onClose={() => { setEditing(null); setIsNew(false); }}>
          <h2 style={{fontSize:18,fontWeight:600,margin:'0 0 16px'}}>{isNew ? '＋ 新增票券' : '✏️ 編輯票券'}</h2>
          {!isNew && <div style={{fontSize:12,color:'#888',marginBottom:12,fontFamily:'monospace'}}>{editing.voucher_code}</div>}
          <Grid>
            <F label="票券名稱 *" span={2}><input value={editing.voucher_name||''} onChange={e => set('voucher_name',e.target.value)} /></F>
            <F label="城市"><select value={editing.city_code||'SIN'} onChange={e => set('city_code',e.target.value)}>{['SIN','TYO','SEL','KYO','BKK','HKG','OSA','DPS','TPE'].map(c=><option key={c}>{c}</option>)}</select></F>
            <F label="類別"><select value={editing.category||'票券'} onChange={e => set('category',e.target.value)}>{['交通','票券','地接行程','門票'].map(c=><option key={c}>{c}</option>)}</select></F>
            <F label="身份別"><select value={editing.identity_type||'成人'} onChange={e => set('identity_type',e.target.value)}>{['成人','兒童','老人'].map(c=><option key={c}>{c}</option>)}</select></F>
            <F label="景點關聯"><input value={editing.spot_relation||''} onChange={e => set('spot_relation',e.target.value)} /></F>
            <F label="直售價 NT$"><input type="number" value={editing.direct_price||0} onChange={e => set('direct_price',+e.target.value)} /></F>
            <F label="同業價 NT$"><input type="number" value={editing.agency_price||0} onChange={e => set('agency_price',+e.target.value)} /></F>
            <F label="訂金 NT$"><input type="number" value={editing.deposit||0} onChange={e => set('deposit',+e.target.value)} /></F>
            <F label="有效起日"><input type="date" value={editing.valid_from||''} onChange={e => set('valid_from',e.target.value)} /></F>
            <F label="有效迄日"><input type="date" value={editing.valid_to||''} onChange={e => set('valid_to',e.target.value)} /></F>
            <F label="圖片 URL" span={2}><input value={editing.image_url||''} onChange={e => set('image_url',e.target.value)} placeholder="留空自動帶入免費圖庫" /></F>
            {editing.image_url && <div style={{gridColumn:'span 2'}}><img src={editing.image_url} alt="" style={{width:'100%',maxHeight:140,objectFit:'cover',borderRadius:8}} /></div>}
            <F label="產品特色" span={2}><textarea value={editing.features||''} onChange={e => set('features',e.target.value)} rows={3} /></F>
            <F label="注意事項" span={2}><textarea value={editing.notice||''} onChange={e => set('notice',e.target.value)} rows={2} /></F>
          </Grid>
          <ModalFooter onSave={save} onCancel={() => { setEditing(null); setIsNew(false); }} isNew={isNew} />
        </Modal>
      )}
    </div>
  );
}

// =============================================
// SHARED SUB-COMPONENTS
// =============================================
function Table({children}:{children:React.ReactNode}) {
  return <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>{children}</table></div></div>;
}
function Th({children}:{children:React.ReactNode}) {
  return <th style={{padding:'10px 12px',textAlign:'left',fontWeight:600,color:'#555',whiteSpace:'nowrap'}}>{children}</th>;
}
function Td({children,mono,bold,price,maxW}:{children:React.ReactNode;mono?:boolean;bold?:boolean;price?:boolean;maxW?:number}) {
  return <td style={{padding:'10px 12px',fontFamily:mono?'monospace':undefined,fontSize:mono?11:undefined,color:mono?'#888':price?'#1a4b8c':undefined,fontWeight:bold||price?600:undefined,maxWidth:maxW,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{children}</td>;
}
function Modal({children,onClose}:{children:React.ReactNode;onClose:()=>void}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,maxWidth:720,width:'100%',maxHeight:'90vh',overflowY:'auto',padding:'24px 28px'}} onClick={e=>e.stopPropagation()}>{children}</div>
    </div>
  );
}
function Grid({children}:{children:React.ReactNode}) {
  return <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{children}</div>;
}
function F({label,span=1,children}:{label:string;span?:number;children:React.ReactNode}) {
  return (
    <div style={{gridColumn:span>1?'span 2':undefined}}>
      <label style={{display:'block',fontSize:12,fontWeight:500,color:'#555',marginBottom:4}}>{label}</label>
      <div style={{width:'100%'}}>
        {typeof children==='object'&&children!==null&&'type' in (children as any) ?
          {...(children as React.ReactElement),props:{...(children as React.ReactElement).props,style:{width:'100%',padding:'8px 10px',border:'1px solid #ddd',borderRadius:6,fontSize:13,boxSizing:'border-box' as any,...(children as React.ReactElement).props.style}}}
          : children}
      </div>
    </div>
  );
}
function ModalFooter({onSave,onCancel,isNew}:{onSave:()=>void;onCancel:()=>void;isNew:boolean}) {
  return (
    <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20}}>
      <button onClick={onCancel} style={{padding:'8px 20px',border:'1px solid #ddd',borderRadius:8,background:'#fff',cursor:'pointer',fontSize:14}}>取消</button>
      <button onClick={onSave} style={{padding:'8px 24px',background:'#1a4b8c',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:500}}>{isNew?'新增':'儲存'}</button>
    </div>
  );
}
