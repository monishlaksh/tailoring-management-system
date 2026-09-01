'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, MessageSquare, Tag, AlertCircle, Check } from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'
import NumInput from '../../../components/NumInput'

export default function OffersPage() {
  const router = useRouter()

  const [activeTab, setActiveTab]     = useState('offer')
  const [customerCount, setCustomerCount] = useState(0)

  // Offer state
  const [offerName, setOfferName]     = useState('')
  const [percentage, setPercentage]   = useState(0)
  const [sendingOffer, setSendingOffer] = useState(false)

  // Message state
  const [message, setMessage]         = useState('')
  const [sendingMsg, setSendingMsg]   = useState(false)

  // Feedback
  const [result, setResult]           = useState(null) // { success, message, sent, failed }
  const [error, setError]             = useState('')

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    API.get('/api/customers')
      .then(res => setCustomerCount(res.data.customers?.length || 0))
      .catch(console.error)
  }, [])

  const showResult = (data, isErr = false) => {
    if (isErr) { setError(data); setResult(null) }
    else       { setResult(data); setError('') }
    setTimeout(() => { setResult(null); setError('') }, 6000)
  }

  const handleSendOffer = async () => {
    if (!offerName.trim()) { setError('Offer name is required'); return }
    if (!percentage || percentage < 1) { setError('Enter valid percentage'); return }
    if (!confirm(`Send offer WhatsApp to ${customerCount} customers?`)) return

    setSendingOffer(true); setError(''); setResult(null)
    try {
      const res = await API.post('/api/whatsapp/offer', {
        offerName: offerName.trim(),
        percentage: parseFloat(percentage),
      })
      showResult(res.data)
      if (res.data.success) { setOfferName(''); setPercentage(0) }
    } catch (e) {
      showResult(e.response?.data?.message || 'Failed to send', true)
    } finally { setSendingOffer(false) }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) { setError('Message is required'); return }
    if (!confirm(`Send this message to ${customerCount} customers?`)) return

    setSendingMsg(true); setError(''); setResult(null)
    try {
      const res = await API.post('/api/whatsapp/broadcast', {
        message: message.trim(),
      })
      showResult(res.data)
      if (res.data.success) setMessage('')
    } catch (e) {
      showResult(e.response?.data?.message || 'Failed to send', true)
    } finally { setSendingMsg(false) }
  }

  const tabs = [
    { key:'offer',   label:'🏷️ Send Offer'   },
    { key:'message', label:'💬 Send Message'  },
  ]

  return (
    <main style={{ minHeight:'100vh', padding:'24px',
      maxWidth:700, margin:'0 auto' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'14px 24px',
        marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ background:'none', border:'none',
              cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>
              Offers & Messages
            </h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
              Send WhatsApp messages to all customers
            </p>
          </div>
        </div>

        {/* Customer count */}
        <div style={{ background:'rgba(79,70,229,0.08)',
          border:'1.5px solid rgba(79,70,229,0.2)',
          borderRadius:10, padding:'8px 16px', textAlign:'center' }}>
          <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600 }}>
            TOTAL CUSTOMERS
          </p>
          <p style={{ fontSize:'1.3rem', fontWeight:800,
            color:'#4F46E5', lineHeight:1 }}>
            {customerCount}
          </p>
        </div>
      </div>

      {/* WhatsApp info banner */}
      <div style={{ background:'rgba(37,211,102,0.06)',
        border:'1.5px solid rgba(37,211,102,0.25)',
        borderRadius:12, padding:'12px 18px', marginBottom:20,
        display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:'1.3rem' }}>💬</span>
        <div>
          <p style={{ fontSize:'0.82rem', fontWeight:600,
            color:'#059669', marginBottom:2 }}>
            Powered by WhatsApp Business API
          </p>
          <p style={{ fontSize:'0.74rem', color:'#6B7280' }}>
            Messages sent directly to customer WhatsApp numbers.
            Free tier: 1,000 conversations/month.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:8,
          background:'rgba(239,68,68,0.08)',
          border:'1.5px solid rgba(239,68,68,0.2)',
          borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
          <AlertCircle size={16} color="#DC2626" />
          <p style={{ color:'#DC2626', fontSize:'0.87rem' }}>{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ background:'rgba(16,185,129,0.08)',
          border:'1.5px solid rgba(16,185,129,0.2)',
          borderRadius:10, padding:'16px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8,
            marginBottom:8 }}>
            <Check size={18} color="#059669" />
            <p style={{ color:'#059669', fontWeight:700, fontSize:'0.9rem' }}>
              {result.message}
            </p>
          </div>
          {(result.sent !== undefined) && (
            <div style={{ display:'flex', gap:12 }}>
              <span style={{ fontSize:'0.8rem', fontWeight:600,
                color:'#059669' }}>
                ✅ {result.sent} sent
              </span>
              {result.failed > 0 && (
                <span style={{ fontSize:'0.8rem', fontWeight:600,
                  color:'#DC2626' }}>
                  ❌ {result.failed} failed
                </span>
              )}
            </div>
          )}
          {result.errors?.length > 0 && (
            <details style={{ marginTop:8 }}>
              <summary style={{ fontSize:'0.75rem', color:'#9CA3AF',
                cursor:'pointer' }}>
                View errors
              </summary>
              <div style={{ marginTop:6 }}>
                {result.errors.map((e,i) => (
                  <p key={i} style={{ fontSize:'0.72rem',
                    color:'#DC2626' }}>{e}</p>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20,
        background:'rgba(255,255,255,0.5)', padding:6,
        borderRadius:12, border:'1.5px solid rgba(79,70,229,0.1)' }}>
        {tabs.map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{ flex:1, padding:'10px 14px', borderRadius:8,
              border:'none', cursor:'pointer',
              fontFamily:'Poppins,sans-serif', fontWeight:600,
              fontSize:'0.82rem', transition:'all 0.2s',
              background: activeTab===tab.key ? 'white' : 'transparent',
              color:      activeTab===tab.key ? '#4F46E5' : '#6B7280',
              boxShadow:  activeTab===tab.key
                ? '0 2px 8px rgba(79,70,229,0.15)' : 'none' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OFFER TAB ── */}
      {activeTab === 'offer' && (
        <div className="glass" style={{ padding:28 }}>
          <div style={{ display:'flex', alignItems:'center',
            gap:12, marginBottom:24 }}>
            <div style={{ width:44, height:44, borderRadius:12,
              background:'linear-gradient(135deg,#F59E0B,#D97706)',
              display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'1.3rem' }}>
              🏷️
            </div>
            <div>
              <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1rem' }}>
                Send Offer via WhatsApp
              </h2>
              <p style={{ fontSize:'0.78rem', color:'#6B7280' }}>
                Broadcast a discount offer to all {customerCount} customers
              </p>
            </div>
          </div>

          <div style={{ display:'grid', gap:16 }}>
            <div>
              <label className="input-label">OFFER NAME *</label>
              <input type="text" value={offerName}
                onChange={e => setOfferName(e.target.value)}
                placeholder="e.g. Eid Special, Diwali Offer, Summer Sale..."
                className="input-field" />
            </div>

            <div style={{ maxWidth:220 }}>
              <label className="input-label">DISCOUNT PERCENTAGE *</label>
              <div style={{ position:'relative' }}>
                <NumInput
                  value={percentage}
                  onChange={val => setPercentage(Math.min(100,Math.max(0,val)))}
                  placeholder="10"
                  min={0}
                  style={{ border:'1.5px solid rgba(245,158,11,0.3)',
                    paddingRight:36 }}
                />
                <span style={{ position:'absolute', right:12, top:'50%',
                  transform:'translateY(-50%)', color:'#D97706',
                  fontWeight:700, fontSize:'1rem',
                  pointerEvents:'none' }}>%</span>
              </div>
            </div>

            {/* WhatsApp Preview */}
            {offerName && percentage > 0 && (
              <div style={{ background:'#DCF8C6', borderRadius:12,
                padding:'16px', border:'1px solid #c8e6c9',
                maxWidth:360 }}>
                <p style={{ fontSize:'0.7rem', color:'#075E54',
                  fontWeight:600, marginBottom:8 }}>
                  WHATSAPP PREVIEW
                </p>
                <p style={{ fontSize:'0.88rem', color:'#1a1a1a',
                  lineHeight:1.7, whiteSpace:'pre-line' }}>
                  {`🏷️ *Al-Ameen Tailors — Special Offer!*\n\n*${offerName}*\nGet *${percentage}% OFF* on your next order!\n\nLimited time offer. Visit us today! ✂️`}
                </p>
              </div>
            )}

            <button onClick={handleSendOffer}
              disabled={sendingOffer || customerCount === 0}
              style={{ display:'flex', alignItems:'center',
                justifyContent:'center', gap:8, padding:'14px',
                background:'linear-gradient(135deg,#25D366,#128C7E)',
                color:'white', border:'none', borderRadius:12,
                fontFamily:'Poppins,sans-serif', fontWeight:600,
                fontSize:'0.9rem', cursor:'pointer',
                boxShadow:'0 4px 16px rgba(37,211,102,0.3)',
                opacity:customerCount===0||sendingOffer?0.6:1 }}>
              {sendingOffer
                ? <><div className="spinner"/>Sending to {customerCount} customers...</>
                : <><span style={{ fontSize:'1.1rem' }}>💬</span>
                    Send Offer to {customerCount} Customers</>}
            </button>
          </div>
        </div>
      )}

      {/* ── MESSAGE TAB ── */}
      {activeTab === 'message' && (
        <div className="glass" style={{ padding:28 }}>
          <div style={{ display:'flex', alignItems:'center',
            gap:12, marginBottom:24 }}>
            <div style={{ width:44, height:44, borderRadius:12,
              background:'linear-gradient(135deg,#4F46E5,#6366F1)',
              display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'1.3rem' }}>
              💬
            </div>
            <div>
              <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1rem' }}>
                Send Message via WhatsApp
              </h2>
              <p style={{ fontSize:'0.78rem', color:'#6B7280' }}>
                Send any message to all {customerCount} customers
              </p>
            </div>
          </div>

          <div style={{ display:'grid', gap:16 }}>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:4 }}>
                <label className="input-label" style={{ margin:0 }}>
                  MESSAGE *
                </label>
                <span style={{ fontSize:'0.7rem',
                  color:message.length > 900 ? '#DC2626' : '#9CA3AF' }}>
                  {message.length}/1000 chars
                </span>
              </div>
              <textarea value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={5} maxLength={1000}
                style={{ width:'100%', padding:'12px 16px',
                  background:'rgba(255,255,255,0.8)',
                  border:'1.5px solid rgba(79,70,229,0.2)',
                  borderRadius:10, fontFamily:'Poppins,sans-serif',
                  fontSize:'0.9rem', color:'#1E1B4B',
                  outline:'none', resize:'vertical' }} />
            </div>

            {/* WhatsApp Preview */}
            {message && (
              <div style={{ background:'#DCF8C6', borderRadius:12,
                padding:'16px', border:'1px solid #c8e6c9',
                maxWidth:360 }}>
                <p style={{ fontSize:'0.7rem', color:'#075E54',
                  fontWeight:600, marginBottom:8 }}>
                  WHATSAPP PREVIEW
                </p>
                <p style={{ fontSize:'0.88rem', color:'#1a1a1a',
                  lineHeight:1.7, whiteSpace:'pre-line' }}>
                  {`✂️ *Al-Ameen Tailors*\n\n${message}`}
                </p>
              </div>
            )}

            <button onClick={handleSendMessage}
              disabled={sendingMsg || customerCount === 0}
              style={{ display:'flex', alignItems:'center',
                justifyContent:'center', gap:8, padding:'14px',
                background:'linear-gradient(135deg,#25D366,#128C7E)',
                color:'white', border:'none', borderRadius:12,
                fontFamily:'Poppins,sans-serif', fontWeight:600,
                fontSize:'0.9rem', cursor:'pointer',
                boxShadow:'0 4px 16px rgba(37,211,102,0.3)',
                opacity:customerCount===0||sendingMsg?0.6:1 }}>
              {sendingMsg
                ? <><div className="spinner"/>Sending...</>
                : <><span style={{ fontSize:'1.1rem' }}>💬</span>
                    Send to {customerCount} Customers</>}
            </button>
          </div>
        </div>
      )}

      {/* Limitations note */}
      <div style={{ marginTop:20, padding:'14px 18px',
        background:'rgba(245,158,11,0.04)',
        border:'1.5px solid rgba(245,158,11,0.15)',
        borderRadius:12 }}>
        <p style={{ fontSize:'0.78rem', color:'#D97706',
          fontWeight:600, marginBottom:4 }}>
          ℹ️ WhatsApp Notes
        </p>
        <p style={{ fontSize:'0.74rem', color:'#6B7280', lineHeight:1.6 }}>
          • Free tier: 1,000 conversations/month from Meta<br/>
          • Numbers must be registered WhatsApp users<br/>
          • For bulk sending to all customers, submit your app for Meta Business Verification<br/>
          • Test numbers can be added in Meta Developer Console
        </p>
      </div>

    </main>
  )
}