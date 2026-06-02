'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react'
import API from '../../../../lib/api'

export default function EmployeeLogin() {
  const router = useRouter()
  const [form, setForm]         = useState({ username:'', password:'' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (localStorage.getItem('employeeToken')) router.push('/employee/dashboard')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await API.post('/api/auth/employee/login', form)
      if (res.data.success) {
        localStorage.setItem('employeeToken', res.data.token)
        localStorage.setItem('employeeUser',  JSON.stringify(res.data.employee))
        router.push('/employee/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width:'100%', padding:'13px 14px 13px 44px',
    background:'rgba(255,255,255,0.8)',
    border:'1.5px solid rgba(245,158,11,0.25)',
    borderRadius:10, fontFamily:'Poppins,sans-serif',
    fontSize:'0.9rem', color:'#1E1B4B', outline:'none', transition:'all 0.3s ease',
  }

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>

        <div className="fade-up" style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ width:68, height:68, borderRadius:'20px', background:'linear-gradient(135deg,#F59E0B,#D97706)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 16px 40px rgba(245,158,11,0.35)' }}>
            <Users size={34} color="white" strokeWidth={1.8} />
          </div>
          <h1 style={{ fontSize:'1.7rem', fontWeight:800, color:'#1E1B4B' }}>Employee Login</h1>
          <p style={{ color:'#6B7280', marginTop:6, fontSize:'0.88rem' }}>Sign in with your employee credentials</p>
        </div>

        <div className="glass fade-up-1" style={{ padding:'36px' }}>
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'11px 14px', marginBottom:20 }}>
              <AlertCircle size={17} color="#EF4444" />
              <p style={{ color:'#DC2626', fontSize:'0.85rem', fontWeight:500 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:18 }}>
              <label className="input-label">USERNAME</label>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}><User size={17} /></div>
                <input type="text" value={form.username}
                  onChange={e => { setForm({...form, username:e.target.value}); setError('') }}
                  placeholder="Enter your username" required style={inputStyle}
                  onFocus={e => { e.target.style.borderColor='#F59E0B'; e.target.style.boxShadow='0 0 0 4px rgba(245,158,11,0.08)' }}
                  onBlur={e => { e.target.style.borderColor='rgba(245,158,11,0.25)'; e.target.style.boxShadow='none' }} />
              </div>
            </div>

            <div style={{ marginBottom:26 }}>
              <label className="input-label">PASSWORD</label>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}><Lock size={17} /></div>
                <input type={showPass?'text':'password'} value={form.password}
                  onChange={e => { setForm({...form, password:e.target.value}); setError('') }}
                  placeholder="Enter your password" required style={{ ...inputStyle, paddingRight:44 }}
                  onFocus={e => { e.target.style.borderColor='#F59E0B'; e.target.style.boxShadow='0 0 0 4px rgba(245,158,11,0.08)' }}
                  onBlur={e => { e.target.style.borderColor='rgba(245,158,11,0.25)'; e.target.style.boxShadow='none' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#9CA3AF', cursor:'pointer', display:'flex' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.95rem', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 15px rgba(245,158,11,0.35)' }}>
              {loading ? <><div className="spinner" />Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="fade-up-2" style={{ textAlign:'center', marginTop:20, fontSize:'0.83rem', color:'#9CA3AF' }}>
          <span onClick={() => router.push('/login')} style={{ color:'#D97706', cursor:'pointer', fontWeight:500 }}>← Back to Login</span>
        </p>
      </div>
    </main>
  )
}