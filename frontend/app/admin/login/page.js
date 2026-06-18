'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Scissors, Eye, EyeOff, Lock, User, AlertCircle, Mail, ArrowLeft } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { adminAPI as API } from '../../../lib/api'

export default function AdminLogin() {
  const router = useRouter()
  const [form, setForm]         = useState({ username:'', password:'' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [showManual, setShowManual]   = useState(false)
  const [showForgot, setShowForgot]   = useState(false)
  const [forgotStep, setForgotStep]   = useState(1) // 1=email, 2=code+newpass
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetCode, setResetCode]     = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)

 // useEffect(() => {
//    if (localStorage.getItem('adminToken')) router.push('/admin/dashboard')
//    
//  }, [])
useEffect(() => {
  // Clear old tokens on login page load to force fresh login
  const token = localStorage.getItem('adminToken')
  if (token) {
    // Verify token is still valid
    API.get('/api/auth/admin/verify')
      .then(() => router.push('/admin/dashboard'))
      .catch(() => {
        // Token invalid — clear and show login
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
      })
  }
}, [])

  const saveAndRedirect = (token, admin) => {
    localStorage.setItem('adminToken', token)
    localStorage.setItem('adminUser', JSON.stringify(admin))
    router.push('/admin/dashboard')
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true); setError('')
    try {
      const res = await API.post('/api/auth/admin/google', { credential: credentialResponse.credential })
      if (res.data.success) saveAndRedirect(res.data.token, res.data.admin)
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed')
    } finally { setLoading(false) }
  }

  const handleManualLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await API.post('/api/auth/admin/login', form)
      if (res.data.success) saveAndRedirect(res.data.token, res.data.admin)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  const handleSendCode = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await API.post('/api/auth/admin/forgot-password', { email: forgotEmail })
      if (res.data.success) {
        setSuccess('Code sent! Check your email.')
        setForgotStep(2)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code')
    } finally { setLoading(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await API.post('/api/auth/admin/reset-password', {
        email: forgotEmail, code: resetCode, newPassword,
      })
      if (res.data.success) {
        setSuccess('Password reset! You can now login with your new password.')
        setTimeout(() => {
          setShowForgot(false)
          setForgotStep(1)
          setForgotEmail(''); setResetCode(''); setNewPassword('')
          setSuccess('')
        }, 2500)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed')
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width:'100%', padding:'13px 14px 13px 44px',
    background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)',
    borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem',
    color:'#1E1B4B', outline:'none', transition:'all 0.3s ease',
  }

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>

        {/* Header */}
        <div className="fade-up" style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ width:68, height:68, borderRadius:'20px', background:'linear-gradient(135deg,#4F46E5,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 16px 40px rgba(79,70,229,0.35)' }}>
            <Scissors size={34} color="white" strokeWidth={1.8} />
          </div>
          <h1 style={{ fontSize:'1.7rem', fontWeight:800, color:'#1E1B4B' }}>Admin Portal</h1>
          <p style={{ color:'#6B7280', marginTop:6, fontSize:'0.88rem' }}>Sign in to manage your tailoring shop</p>
        </div>

        <div className="glass fade-up-1" style={{ padding:'36px' }}>

          {/* Error / Success */}
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'11px 14px', marginBottom:18 }}>
              <AlertCircle size={17} color="#EF4444" />
              <p style={{ color:'#DC2626', fontSize:'0.85rem', fontWeight:500 }}>{error}</p>
            </div>
          )}
          {success && (
            <div style={{ background:'rgba(16,185,129,0.08)', border:'1.5px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'11px 14px', marginBottom:18, color:'#059669', fontSize:'0.85rem', fontWeight:500 }}>
              ✅ {success}
            </div>
          )}

          {/* ── FORGOT PASSWORD FLOW ── */}
          {showForgot ? (
            <div>
              <button onClick={() => { setShowForgot(false); setForgotStep(1); setError(''); setSuccess('') }}
                style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'#6B7280', fontFamily:'Poppins,sans-serif', fontSize:'0.82rem', marginBottom:20 }}>
                <ArrowLeft size={15} /> Back to login
              </button>

              <h3 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:6, fontSize:'1rem' }}>
                {forgotStep===1 ? '🔐 Reset Password' : '📧 Enter Reset Code'}
              </h3>
              <p style={{ fontSize:'0.82rem', color:'#6B7280', marginBottom:20 }}>
                {forgotStep===1
                  ? 'Enter your admin email. We\'ll send a 6-digit reset code.'
                  : `Code sent to ${forgotEmail}. Enter it below with your new password.`}
              </p>

              {forgotStep === 1 ? (
                <form onSubmit={handleSendCode}>
                  <div style={{ marginBottom:18 }}>
                    <label className="input-label">ADMIN EMAIL</label>
                    <div style={{ position:'relative' }}>
                      <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}><Mail size={17} /></div>
                      <input type="email" value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setError('') }}
                        placeholder="your@gmail.com" required style={inputStyle}
                        onFocus={e => { e.target.style.borderColor='#4F46E5'; e.target.style.boxShadow='0 0 0 4px rgba(79,70,229,0.08)' }}
                        onBlur={e  => { e.target.style.borderColor='rgba(79,70,229,0.2)'; e.target.style.boxShadow='none' }}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%', padding:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    {loading ? <><div className="spinner" />Sending...</> : 'Send Reset Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div style={{ marginBottom:16 }}>
                    <label className="input-label">6-DIGIT CODE</label>
                    <input type="text" value={resetCode} onChange={e => { setResetCode(e.target.value); setError('') }}
                      placeholder="123456" maxLength={6} required
                      style={{ ...inputStyle, paddingLeft:16, letterSpacing:6, fontSize:'1.2rem', fontWeight:700, textAlign:'center' }}
                      onFocus={e => { e.target.style.borderColor='#4F46E5'; e.target.style.boxShadow='0 0 0 4px rgba(79,70,229,0.08)' }}
                      onBlur={e  => { e.target.style.borderColor='rgba(79,70,229,0.2)'; e.target.style.boxShadow='none' }}
                    />
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <label className="input-label">NEW PASSWORD</label>
                    <div style={{ position:'relative' }}>
                      <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}><Lock size={17} /></div>
                      <input type={showNewPass?'text':'password'} value={newPassword} onChange={e => { setNewPassword(e.target.value); setError('') }}
                        placeholder="Min 6 characters" required
                        style={{ ...inputStyle, paddingRight:44 }}
                        onFocus={e => { e.target.style.borderColor='#4F46E5'; e.target.style.boxShadow='0 0 0 4px rgba(79,70,229,0.08)' }}
                        onBlur={e  => { e.target.style.borderColor='rgba(79,70,229,0.2)'; e.target.style.boxShadow='none' }}
                      />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                        style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
                        {showNewPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%', padding:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:10 }}>
                    {loading ? <><div className="spinner" />Resetting...</> : 'Reset Password'}
                  </button>
                  <button type="button" onClick={() => { setForgotStep(1); setError('') }}
                    style={{ width:'100%', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'0.82rem', fontFamily:'Poppins,sans-serif' }}>
                    Didn't get the code? Send again
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Google Login */}
              <p style={{ fontSize:'0.8rem', color:'#6B7280', textAlign:'center', marginBottom:14, fontWeight:500 }}>
                Sign in with your authorized Google account
              </p>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed. Please try again.')}
                  useOneTap
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  width="340"
                />
              </div>

              {/* Divider */}
              <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
                <div style={{ flex:1, height:1, background:'rgba(79,70,229,0.1)' }} />
                <span style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:500 }}>or</span>
                <div style={{ flex:1, height:1, background:'rgba(79,70,229,0.1)' }} />
              </div>

              {/* Manual Login */}
              {!showManual ? (
                <button onClick={() => setShowManual(true)} className="btn-ghost" style={{ width:'100%', padding:'11px', fontSize:'0.85rem' }}>
                  Use username & password instead
                </button>
              ) : (
                <form onSubmit={handleManualLogin}>
                  <div style={{ marginBottom:16 }}>
                    <label className="input-label">USERNAME</label>
                    <div style={{ position:'relative' }}>
                      <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}><User size={17} /></div>
                      <input type="text" value={form.username} onChange={e => { setForm({...form,username:e.target.value}); setError('') }}
                        placeholder="Enter username" required style={inputStyle}
                        onFocus={e => { e.target.style.borderColor='#4F46E5'; e.target.style.boxShadow='0 0 0 4px rgba(79,70,229,0.08)' }}
                        onBlur={e  => { e.target.style.borderColor='rgba(79,70,229,0.2)'; e.target.style.boxShadow='none' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom:6 }}>
                    <label className="input-label">PASSWORD</label>
                    <div style={{ position:'relative' }}>
                      <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}><Lock size={17} /></div>
                      <input type={showPass?'text':'password'} value={form.password} onChange={e => { setForm({...form,password:e.target.value}); setError('') }}
                        placeholder="Enter password" required style={{ ...inputStyle, paddingRight:44 }}
                        onFocus={e => { e.target.style.borderColor='#4F46E5'; e.target.style.boxShadow='0 0 0 4px rgba(79,70,229,0.08)' }}
                        onBlur={e  => { e.target.style.borderColor='rgba(79,70,229,0.2)'; e.target.style.boxShadow='none' }}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
                        {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password link */}
                  <div style={{ textAlign:'right', marginBottom:20 }}>
                    <button type="button" onClick={() => { setShowForgot(true); setError(''); setSuccess('') }}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', fontSize:'0.8rem', fontWeight:500, fontFamily:'Poppins,sans-serif' }}>
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%', padding:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    {loading ? <><div className="spinner" />Signing in...</> : 'Sign In'}
                  </button>
                  <button type="button" onClick={() => setShowManual(false)}
                    style={{ width:'100%', marginTop:10, background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'0.82rem', fontFamily:'Poppins,sans-serif' }}>
                    ← Back to Google login
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="fade-up-2" style={{ textAlign:'center', marginTop:20, fontSize:'0.83rem', color:'#9CA3AF' }}>
          <span onClick={() => router.push('/')} style={{ color:'#4F46E5', cursor:'pointer', fontWeight:500 }}>← Back to Home</span>
        </p>
      </div>
    </main>
  )
}