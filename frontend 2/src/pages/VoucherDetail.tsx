import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API = '';

interface Voucher {
  voucher_uuid: string; voucher_code: string; voucher_name: string;
  city_code: string; category: string; identity_type: string;
  direct_price: number; agency_price: number; deposit: number;
  features: string; notice: string; spot_relation: string;
  image_url: string; valid_from?: string; valid_to?: string;
}

export default function VoucherDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [v, setV] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'features' | 'notice' | 'spot'>('features');

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/vouchers/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('找不到此票券')))
      .then(setV)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="main-content"><div className="container" style={{textAlign:'center',padding:60,color:'#888'}}>載入中...</div></div>;
  if (error || !v) return (
    <div className="main-content"><div className="container" style={{textAlign:'center',padding:60}}>
      <p style={{color:'#dc2626'}}>{error || '找不到此票券'}</p>
      <button onClick={() => navigate('/vouchers')} style={{marginTop:16,padding:'8px 20px',border:'1px solid #ddd',borderRadius:8,background:'#fff',cursor:'pointer'}}>
        ← 回票券列表
      </button>
    </div></div>
  );

  return (
    <div className="main-content">
      <div className="container" style={{maxWidth:1100}}>
        {/* Breadcrumb */}
        <div style={{fontSize:13,color:'#888',marginBottom:16}}>
          <span style={{color:'#1a4b8c',cursor:'pointer'}} onClick={() => navigate('/vouchers')}>← 票券列表</span>
          {' / '}{v.voucher_name}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:24,alignItems:'start'}}>
          {/* Main Content */}
          <div>
            {/* Hero Image */}
            <div style={{borderRadius:12,overflow:'hidden',marginBottom:20}}>
              <img src={v.image_url || 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800'}
                alt={v.voucher_name} style={{width:'100%',height:360,objectFit:'cover',display:'block'}} />
            </div>

            {/* Title Area */}
            <div style={{marginBottom:20}}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                <span style={{background:'#1a4b8c',color:'#fff',padding:'3px 10px',borderRadius:4,fontSize:12,fontWeight:500}}>{v.category}</span>
                <span style={{fontSize:12,color:'#888',fontFamily:'monospace'}}>{v.voucher_code} · {v.city_code}</span>
              </div>
              <h1 style={{fontSize:24,fontWeight:600,margin:'0 0 8px',color:'#1a1a1a'}}>{v.voucher_name}</h1>
              <div style={{fontSize:14,color:'#666'}}>
                {v.spot_relation && <span>📍 {v.spot_relation}</span>}
                {v.identity_type && <span style={{marginLeft:12}}>👤 {v.identity_type}</span>}
              </div>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',borderBottom:'2px solid #e5e7eb',marginBottom:16}}>
              {([
                ['features', '產品特色'],
                ['notice', '注意事項'],
                ['spot', '景點關聯'],
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  style={{
                    padding:'12px 20px',fontSize:14,border:'none',background:'none',cursor:'pointer',
                    borderBottom: tab === key ? '2px solid #1a4b8c' : '2px solid transparent',
                    color: tab === key ? '#1a4b8c' : '#888',
                    fontWeight: tab === key ? 600 : 400,
                    marginBottom: -2, transition: 'all .15s'
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{minHeight:200,fontSize:14,lineHeight:1.8,color:'#333'}}>
              {tab === 'features' && (
                <div>
                  <h3 style={{fontSize:16,fontWeight:600,marginBottom:12,color:'#1a1a1a'}}>產品特色</h3>
                  <p style={{whiteSpace:'pre-wrap'}}>{v.features || '無'}</p>
                </div>
              )}
              {tab === 'notice' && (
                <div>
                  <h3 style={{fontSize:16,fontWeight:600,marginBottom:12,color:'#1a1a1a'}}>注意事項</h3>
                  <p style={{whiteSpace:'pre-wrap'}}>{v.notice || '無'}</p>
                  {v.valid_from && <p style={{marginTop:12}}>有效期間：{v.valid_from} ~ {v.valid_to || '無限期'}</p>}
                </div>
              )}
              {tab === 'spot' && (
                <div>
                  <h3 style={{fontSize:16,fontWeight:600,marginBottom:12,color:'#1a1a1a'}}>景點關聯</h3>
                  <p>{v.spot_relation || '無'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — Sticky Booking Card */}
          <div style={{position:'sticky',top:80}}>
            <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:20,boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
              {/* Price */}
              {v.direct_price > v.agency_price && (
                <div style={{fontSize:13,color:'#888',textDecoration:'line-through'}}>直售價 NT$ {v.direct_price.toLocaleString()}</div>
              )}
              <div style={{marginTop:4}}>
                <span style={{fontSize:12,color:'#1a4b8c'}}>同業價</span>
                <div style={{fontSize:28,fontWeight:700,color:'#1a4b8c',lineHeight:1.2}}>NT$ {v.agency_price.toLocaleString()}</div>
                <div style={{fontSize:12,color:'#888'}}>起 / {v.identity_type}</div>
              </div>

              {/* Info */}
              <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid #e5e7eb',display:'flex',flexDirection:'column',gap:10}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                  <span style={{color:'#888'}}>類別</span>
                  <span style={{fontWeight:500}}>{v.category}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                  <span style={{color:'#888'}}>城市</span>
                  <span style={{fontWeight:500}}>{v.city_code}</span>
                </div>
                {v.deposit > 0 && (
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                    <span style={{color:'#888'}}>訂金</span>
                    <span style={{fontWeight:500}}>NT$ {v.deposit.toLocaleString()}</span>
                  </div>
                )}

                {/* Quantity */}
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,alignItems:'center'}}>
                  <span style={{color:'#888'}}>數量</span>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}
                      style={{width:28,height:28,border:'1px solid #ddd',borderRadius:4,background:'#fff',cursor:'pointer',fontSize:16}}>−</button>
                    <span style={{minWidth:24,textAlign:'center',fontWeight:500}}>{qty}</span>
                    <button onClick={() => setQty(q => q + 1)}
                      style={{width:28,height:28,border:'1px solid #ddd',borderRadius:4,background:'#fff',cursor:'pointer',fontSize:16}}>+</button>
                  </div>
                </div>

                {/* Subtotal */}
                <div style={{display:'flex',justifyContent:'space-between',fontSize:14,paddingTop:10,borderTop:'1px solid #e5e7eb'}}>
                  <span style={{color:'#888'}}>小計</span>
                  <span style={{color:'#1a4b8c',fontWeight:700,fontSize:18}}>NT$ {(v.agency_price * qty).toLocaleString()}</span>
                </div>
              </div>

              {/* Book Button */}
              <button onClick={() => alert(`已加入訂購 ${qty} 張 ${v.voucher_name}（結帳流程下一輪實作）`)}
                style={{width:'100%',marginTop:16,padding:'12px',background:'#1a4b8c',color:'#fff',border:'none',
                  borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer',transition:'background .15s'}}
                onMouseEnter={e => (e.currentTarget.style.background = '#143d73')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1a4b8c')}>
                我要預訂
              </button>

              {/* Share */}
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('連結已複製'); }}
                  style={{flex:1,padding:'8px',border:'1px solid #ddd',borderRadius:6,background:'#fff',cursor:'pointer',fontSize:13}}>
                  📋 分享
                </button>
                <button style={{flex:1,padding:'8px',border:'1px solid #ddd',borderRadius:6,background:'#fff',cursor:'pointer',fontSize:13}}>
                  ♡ 收藏
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
