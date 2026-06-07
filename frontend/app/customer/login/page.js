'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Scissors, Phone, CreditCard, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { customerAPI as API } from '../../../lib/api'

export default function CustomerLogin() {
  const router = useRouter()
  const [form, setForm]           = useState({ customerID:'', phone:'' })
  const [showPhone, setShowPhone] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    if (localStorage.getItem('customerToken')) router.push('/customer/dashboard')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await API.post('/api/auth/customer/login', {
        customerID: form.customerID.toUpperCase(),
        phone: form.phone,
      })
      if (res.data.success) {
        localStorage.setItem('customerToken', res.data.token)
        localStorage.setItem('customerUser', JSON.stringify(res.data.customer))
        router.push('/customer/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Customer ID or Phone')
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width:'100%', padding:'13px 14px 13px 44px',
    background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(0,212,255,0.25)',
    borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem',
    color:'#1E1B4B', outline:'none', transition:'all 0.3s ease',
  }

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>
        <div className="fade-up" style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ width:68, height:68, borderRadius:'20px', background:'linear-gradient(135deg,#00D4FF,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 16px 40px rgba(0,212,255,0.35)' }}>
            <img src="/logo.png" alt="Logo"
            style={{ width:40, height:40, borderRadius:10, objectFit:'cover' }}
            onError={e => { e.target.style.display='none' }}
            />
          </div>
          <h1 style={{ fontSize:'1.7rem', fontWeight:800, color:'#1E1B4B' }}>Customer Portal</h1>
          <p style={{ color:'#6B7280', marginTop:6, fontSize:'0.88rem' }}>Track your orders and measurements</p>
        </div>

        <div className="glass fade-up-1" style={{ padding:'36px' }}>
          <div style={{ background:'rgba(0,212,255,0.06)', border:'1.5px solid rgba(0,212,255,0.2)', borderRadius:10, padding:'11px 14px', marginBottom:22 }}>
            <p style={{ fontSize:'0.79rem', color:'#0369A1', lineHeight:1.6 }}>ℹ️ Use the <strong>Customer ID</strong> and <strong>Phone Number</strong> given by the shop. No registration needed.</p>
          </div>

          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'11px 14px', marginBottom:18 }}>
              <AlertCircle size={17} color="#EF4444" />
              <p style={{ color:'#DC2626', fontSize:'0.85rem', fontWeight:500 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:18 }}>
              <label className="input-label">CUSTOMER ID</label>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}><CreditCard size={17} /></div>
                <input type="text" value={form.customerID} onChange={e => { setForm({...form, customerID:e.target.value}); setError('') }}
                  placeholder="e.g. CUST000001" required style={{ ...inputStyle, textTransform:'uppercase', letterSpacing:'0.5px' }}
                  onFocus={e => { e.target.style.borderColor='#00D4FF'; e.target.style.boxShadow='0 0 0 4px rgba(0,212,255,0.08)' }}
                  onBlur={e => { e.target.style.borderColor='rgba(0,212,255,0.25)'; e.target.style.boxShadow='none' }} />
              </div>
            </div>
            <div style={{ marginBottom:26 }}>
              <label className="input-label">PHONE NUMBER</label>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}><Phone size={17} /></div>
                <input type={showPhone?'text':'password'} value={form.phone} onChange={e => { setForm({...form, phone:e.target.value}); setError('') }}
                  placeholder="Enter phone number" required style={{ ...inputStyle, paddingRight:44 }}
                  onFocus={e => { e.target.style.borderColor='#00D4FF'; e.target.style.boxShadow='0 0 0 4px rgba(0,212,255,0.08)' }}
                  onBlur={e => { e.target.style.borderColor='rgba(0,212,255,0.25)'; e.target.style.boxShadow='none' }} />
                <button type="button" onClick={() => setShowPhone(!showPhone)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#9CA3AF', cursor:'pointer', display:'flex' }}>
                  {showPhone ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#00D4FF,#0EA5E9)', color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.95rem', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 15px rgba(0,212,255,0.35)' }}>
              {loading ? <><div className="spinner" />Verifying...</> : 'View My Orders'}
            </button>
          </form>
        </div>

        <p className="fade-up-2" style={{ textAlign:'center', marginTop:20, fontSize:'0.83rem', color:'#9CA3AF' }}>
          <span onClick={() => router.push('/')} style={{ color:'#0EA5E9', cursor:'pointer', fontWeight:500 }}>← Back to Home</span>
        </p>
      </div>
    </main>
  )
}