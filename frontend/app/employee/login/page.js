'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react'
import { employeeAPI as API } from '../../../lib/api'

export default function EmployeeLogin() {
  const router = useRouter()
  const [form, setForm]       = useState({ username:'', password:'' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    // If already logged in, redirect based on access level
    const token = localStorage.getItem('employeeToken')
    const user  = localStorage.getItem('employeeUser')
    if (token && user) {
      const parsed = JSON.parse(user)
      if (parsed.hasFullAccess === true) {
        router.push('/employee/admin')
      } else {
        router.push('/employee/dashboard')
      }
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await API.post('/api/auth/employee/login', form)

      if (res.data.success) {
        const emp = res.data.employee

        localStorage.setItem('employeeUser', JSON.stringify({
        employeeID:    emp.employeeID,
        name:          emp.name,
        username:      emp.username,
        role:          emp.role,
        employeeRole:  emp.employeeRole  || 'all',
        accessRole:    emp.accessRole    || 'employee',
        hasFullAccess: emp.hasFullAccess === true,
      }))

    // Redirect based on accessRole
    if (emp.accessRole === 'manager' || emp.hasFullAccess === true) {
      router.push('/employee/admin')
    } else if (emp.accessRole === 'receptionist') {
      router.push('/employee/receptionist')
    } else {
      router.push('/employee/dashboard')
    }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:'400px' }}>

        <div className="fade-up" style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ width:64, height:64, borderRadius:'18px',
            background:'linear-gradient(135deg,#F59E0B,#D97706)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px', boxShadow:'0 16px 40px rgba(245,158,11,0.3)',
            fontSize:'1.8rem' }}>
            ✂️
          </div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800, color:'#1E1B4B' }}>
            Employee Portal
          </h1>
          <p style={{ color:'#6B7280', marginTop:6, fontSize:'0.88rem' }}>
            Sign in to your work account
          </p>
        </div>

        <div className="glass fade-up-1" style={{ padding:'36px' }}>
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8,
              background:'rgba(239,68,68,0.08)',
              border:'1.5px solid rgba(239,68,68,0.2)',
              borderRadius:10, padding:'11px 14px', marginBottom:20 }}>
              <AlertCircle size={17} color="#EF4444" />
              <p style={{ color:'#DC2626', fontSize:'0.85rem',
                fontWeight:500 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:16 }}>
              <label className="input-label">USERNAME</label>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:'50%',
                  transform:'translateY(-50%)', color:'#9CA3AF' }}>
                  <User size={17} />
                </div>
                <input type="text" value={form.username}
                  onChange={e => { setForm({...form,username:e.target.value}); setError('') }}
                  placeholder="Enter username" required
                  style={{ width:'100%', padding:'13px 14px 13px 44px',
                    background:'rgba(255,255,255,0.8)',
                    border:'1.5px solid rgba(245,158,11,0.25)',
                    borderRadius:10, fontFamily:'Poppins,sans-serif',
                    fontSize:'0.9rem', color:'#1E1B4B', outline:'none' }}
                  onFocus={e => { e.target.style.borderColor='#F59E0B';
                    e.target.style.boxShadow='0 0 0 4px rgba(245,158,11,0.08)' }}
                  onBlur={e  => { e.target.style.borderColor='rgba(245,158,11,0.25)';
                    e.target.style.boxShadow='none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom:24 }}>
              <label className="input-label">PASSWORD</label>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:'50%',
                  transform:'translateY(-50%)', color:'#9CA3AF' }}>
                  <Lock size={17} />
                </div>
                <input type={showPass?'text':'password'} value={form.password}
                  onChange={e => { setForm({...form,password:e.target.value}); setError('') }}
                  placeholder="Enter password" required
                  style={{ width:'100%', padding:'13px 44px 13px 44px',
                    background:'rgba(255,255,255,0.8)',
                    border:'1.5px solid rgba(245,158,11,0.25)',
                    borderRadius:10, fontFamily:'Poppins,sans-serif',
                    fontSize:'0.9rem', color:'#1E1B4B', outline:'none' }}
                  onFocus={e => { e.target.style.borderColor='#F59E0B';
                    e.target.style.boxShadow='0 0 0 4px rgba(245,158,11,0.08)' }}
                  onBlur={e  => { e.target.style.borderColor='rgba(245,158,11,0.25)';
                    e.target.style.boxShadow='none' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:'absolute', right:14, top:'50%',
                    transform:'translateY(-50%)', background:'none',
                    border:'none', color:'#9CA3AF', cursor:'pointer',
                    display:'flex' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'13px',
                background:'linear-gradient(135deg,#F59E0B,#D97706)',
                color:'white', border:'none', borderRadius:12,
                fontFamily:'Poppins,sans-serif', fontWeight:700,
                fontSize:'0.95rem', cursor:'pointer',
                boxShadow:'0 4px 16px rgba(245,158,11,0.3)',
                display:'flex', alignItems:'center',
                justifyContent:'center', gap:8 }}>
              {loading
                ? <><div className="spinner" />Signing in...</>
                : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="fade-up-2" style={{ textAlign:'center', marginTop:20,
          fontSize:'0.83rem', color:'#9CA3AF' }}>
          <span onClick={() => router.push('/')}
            style={{ color:'#F59E0B', cursor:'pointer', fontWeight:500 }}>
            ← Back to Home
          </span>
        </p>
      </div>
    </main>
  )
}