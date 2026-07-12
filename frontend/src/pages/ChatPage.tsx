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

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: '您好！我是 TravelPro 旅遊小助手 🌍\n\n我可以協助您：\n• 推薦適合的旅遊行程\n• 查詢票券與門票\n• 了解飯店、機票搜尋\n• 介紹預訂流程',
      time: now(),
      suggestions: ['推薦日本行程', '有什麼票券', '飯店搜尋怎麼用', '怎麼報名']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: text.trim(), time: now() }]);
    setInput('');
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() })
      });
      const d = await r.json();
      setMessages(prev => [...prev, {
        role: 'bot',
        text: d.reply || '抱歉，目前無法回應。',
        time: now(),
        products: d.products,
        suggestions: d.suggestions
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '連線失敗，請稍後再試。', time: now() }]);
    }
    finally { setLoading(false); }
  };

  const handleProductClick = (p: { type: string; id: string }) => {
    if (p.type === 'tour') navigate(`/tours/${p.id}`);
    else if (p.type === 'voucher') navigate(`/vouchers/${p.id}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes chatDot { 0%,80%,100% { transform:scale(.6); opacity:.4 } 40% { transform:scale(1); opacity:1 } }
      `}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a4b8c, #2563eb)', color: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 12px rgba(0,0,0,.1)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🌍</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>TravelPro 旅遊小助手</div>
          <div style={{ fontSize: 12, opacity: .85, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            線上服務中
          </div>
        </div>
        <button
          onClick={() => window.close()}
          style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
        >
          ✕ 關閉
        </button>
      </div>

      {/* Messages */}
      <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, maxWidth: '85%', ...(msg.role === 'user' ? { marginLeft: 'auto', flexDirection: 'row-reverse' as const } : {}) }}>
            {msg.role === 'bot' && (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dbeafe', color: '#1a4b8c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>TP</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
              <div style={{
                padding: '12px 16px', borderRadius: 16, fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word' as const, whiteSpace: 'pre-wrap' as const,
                ...(msg.role === 'user'
                  ? { background: '#1a4b8c', color: '#fff', borderBottomRightRadius: 4 }
                  : { background: '#fff', border: '1px solid #e5e7eb', borderTopLeftRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,.04)' })
              }}>
                {msg.text}
              </div>

              {msg.products && msg.products.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {msg.products.map((p, j) => (
                    <button key={j} onClick={() => handleProductClick(p)}
                      style={{ padding: '10px 14px', fontSize: 13, textAlign: 'left', background: '#fff', color: '#1a4b8c', border: '1px solid #dbeafe', borderRadius: 10, cursor: 'pointer', fontWeight: 500, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 10 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#1a4b8c'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#dbeafe'; }}>
                      <span style={{ fontSize: 18 }}>{p.type === 'tour' ? '✈️' : '🎫'}</span>
                      <span style={{ flex: 1 }}>{p.name}</span>
                      <span style={{ fontSize: 12, opacity: .6 }}>→</span>
                    </button>
                  ))}
                </div>
              )}

              {msg.suggestions && msg.suggestions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {msg.suggestions.map((s, j) => (
                    <button key={j} onClick={() => send(s)}
                      style={{ padding: '7px 16px', fontSize: 13, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, cursor: 'pointer', color: '#1a4b8c', transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#1a4b8c'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: msg.role === 'user' ? 'auto' : 0 }}>{msg.time}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dbeafe', color: '#1a4b8c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>TP</div>
            <div style={{ padding: '16px 20px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', display: 'flex', gap: 5 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1', animation: `chatDot 1.2s infinite ease-in-out ${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: 16, boxShadow: '0 -2px 12px rgba(0,0,0,.04)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 10 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && send(input)}
            placeholder="請輸入您的問題，例如：推薦東京行程"
            style={{ flex: 1, padding: '12px 18px', border: '1px solid #e5e7eb', borderRadius: 24, fontSize: 14, outline: 'none', transition: 'border-color .15s' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#1a4b8c')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            style={{
              padding: '0 24px', borderRadius: 24, border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              background: loading || !input.trim() ? '#e5e7eb' : 'linear-gradient(135deg, #1a4b8c, #2563eb)',
              color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s'
            }}>
            發送
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
