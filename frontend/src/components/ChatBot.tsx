import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '';

interface Message {
  role: 'user' | 'bot';
  text: string;
  time: string;
  products?: { type: string; id: string; name: string }[];
  suggestions?: string[];
}

const now = () => new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

export default function ChatBot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: '您好！我是 TravelPro 旅遊客服 🌍\n可以幫您推薦行程、查票券、了解預訂流程。', time: now(), suggestions: ['推薦日本行程', '有什麼票券', '怎麼報名'] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(1);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text: text.trim(), time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() })
      });
      const d = await r.json();
      const botMsg: Message = {
        role: 'bot', text: d.reply || '抱歉，目前無法回應。', time: now(),
        products: d.products, suggestions: d.suggestions
      };
      setMessages(prev => [...prev, botMsg]);
      if (!open) setUnread(prev => prev + 1);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '連線失敗，請稍後再試。', time: now() }]);
    }
    finally { setLoading(false); }
  };

  const handleOpen = () => { setOpen(true); setUnread(0); };
  const handleProductClick = (p: { type: string; id: string }) => {
    if (p.type === 'tour') navigate(`/tours/${p.id}`);
    else if (p.type === 'voucher') navigate(`/vouchers/${p.id}`);
    setOpen(false);
  };

  // ===== STYLES =====
  const S = {
    fab: {
      position: 'fixed' as const, bottom: 24, right: 24, zIndex: 9999,
      width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
      background: 'linear-gradient(135deg, #1a4b8c, #2563eb)',
      boxShadow: '0 4px 20px rgba(26,75,140,.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform .15s',
    },
    badge: {
      position: 'absolute' as const, top: -4, right: -4,
      background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 700,
      width: 20, height: 20, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    panel: {
      position: 'fixed' as const, bottom: 92, right: 24, zIndex: 9999,
      width: 380, maxWidth: 'calc(100vw - 32px)',
      height: 'min(560px, calc(100vh - 120px))',
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 8px 40px rgba(0,0,0,.18)',
      display: 'flex', flexDirection: 'column' as const,
      animation: 'chatSlideUp .25s ease-out',
    },
    header: {
      background: 'linear-gradient(135deg, #1a4b8c, #2563eb)',
      color: '#fff', padding: '14px 16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    body: {
      flex: 1, overflowY: 'auto' as const, padding: 16,
      display: 'flex', flexDirection: 'column' as const, gap: 12,
      background: '#f8fafc',
    },
    footer: {
      padding: 12, borderTop: '1px solid #e5e7eb',
      display: 'flex', gap: 8, background: '#fff',
    },
  };

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes chatSlideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes chatDot { 0%,80%,100% { transform:scale(.6); opacity:.4 } 40% { transform:scale(1); opacity:1 } }
      `}</style>

      {/* FAB Button */}
      {!open && (
        <button onClick={handleOpen} style={S.fab}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {unread > 0 && <span style={S.badge}>{unread}</span>}
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div style={S.panel}>
          {/* Header */}
          <div style={S.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌍</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>TravelPro 客服</div>
                <div style={{ fontSize: 11, opacity: .8 }}>線上服務中</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: 20, padding: '0 4px' }}>✕</button>
          </div>

          {/* Messages */}
          <div ref={bodyRef} style={S.body}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, maxWidth: '92%', ...(msg.role === 'user' ? { marginLeft: 'auto', flexDirection: 'row-reverse' as const } : {}) }}>
                {msg.role === 'bot' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dbeafe', color: '#1a4b8c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>TP</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.6, wordBreak: 'break-word' as const, whiteSpace: 'pre-wrap' as const,
                    ...(msg.role === 'user'
                      ? { background: '#1a4b8c', color: '#fff', borderBottomRightRadius: 4 }
                      : { background: '#fff', border: '1px solid #e5e7eb', borderTopLeftRadius: 4 })
                  }}>
                    {msg.text}
                  </div>

                  {/* Product Links */}
                  {msg.products && msg.products.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {msg.products.map((p, j) => (
                        <button key={j} onClick={() => handleProductClick(p)}
                          style={{ padding: '6px 10px', fontSize: 12, textAlign: 'left', background: '#dbeafe', color: '#1a4b8c', border: '1px solid #bfdbfe', borderRadius: 8, cursor: 'pointer' }}>
                          {p.type === 'tour' ? '✈️' : '🎫'} {p.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {msg.suggestions.map((s, j) => (
                        <button key={j} onClick={() => send(s)}
                          style={{ padding: '5px 12px', fontSize: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, cursor: 'pointer', color: '#1a4b8c', transition: 'all .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#1a4b8c'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{msg.time}</span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 16px' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1', animation: `chatDot 1.2s infinite ease-in-out ${i * 0.2}s` }} />
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={S.footer}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && send(input)}
              placeholder="請輸入訊息..."
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 24, fontSize: 13, outline: 'none' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#1a4b8c')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
            <button onClick={() => send(input)} disabled={loading || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: loading || !input.trim() ? '#e5e7eb' : '#1a4b8c',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .15s',
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
