'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { adminAPI as API } from '../../../lib/api'
import { Eye, EyeOff, Save, ArrowLeft, RefreshCw } from 'lucide-react'

export default function EmployeeEditPage() {
  const router   = useRouter()
  const params   = useParams()
  const pathname = usePathname()

  // Get employeeID from params OR fallback to pathname
  const empID = params?.employeeID || pathname?.split('/').pop()

  const [emp, setEmp]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [msg, setMsg]         = useState({ text:'', err:false })

  const [newPass, setNewPass]         = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [showCurPass, setShowCurPass] = useState(false)
  const [passLoading, setPassLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) { router.push('/admin/login'); return }
    if (!empID || empID === 'undefined') {
      setError('Invalid employee ID')
      setLoading(false)
      return
    }
    fetchEmployee()
  }, [empID])

  const fetchEmployee = async () => {
    setLoading(true)
    setError('')
    try {
      console.log('[EMP EDIT] Fetching:', empID)
      const res = await API.get(`/api/employees/${empID}`)
      console.log('[EMP EDIT] Got:', res.data)
      if (res.data.success) {
        setEmp(res.data.employee)
      } else {
        setError(res.data.message || 'Employee not found')
      }
    } catch (e) {
      console.error('[EMP EDIT] Error:', e.response?.status, e.response?.data)
      const status = e.response?.status
      if (status === 401) {
        router.push('/admin/login')
        return
      }
      setError(
        e.response?.data?.message || `Failed to load employee (${status || 'network error'})`
      )
    } finally {
      setLoading(false) // ← ALWAYS called
    }
  }

  const showMsg = (text, err = false) => {
    setMsg({ text, err })
    setTimeout(() => setMsg({ text:'', err:false }), 3500)
  }

  const handleSave = async () => {
    if (!emp.name?.trim()) { showMsg('Name is required', true); return }
    setSaving(true)
    try {
      await API.put(`/api/employees/${empID}`, {
        name:       emp.name,
        phone:      emp.phone      || '',
        role:       emp.role       || 'all',
        accessRole: emp.accessRole || 'employee',
        bonus:      emp.bonus      || 0,
      })
      showMsg('✅ Employee updated successfully!')
      fetchEmployee()
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed to save', true)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (!newPass.trim()) { showMsg('Enter a new password', true); return }
    if (newPass.trim().length < 4) {
      showMsg('Password must be at least 4 characters', true); return
    }
    setPassLoading(true)
    try {
      await API.patch(`/api/employees/${empID}/password`, {
        password: newPass.trim(),
      })
      setEmp(prev => ({ ...prev, plainPassword: newPass.trim() }))
      setNewPass('')
      showMsg('✅ Password updated!')
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed to update password', true)
    } finally {
      setPassLoading(false)
    }
  }

  // ── Loading state ─────────────────────────────────────────
  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center',
      fontFamily:'Poppins,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40,
          border:'3px solid rgba(79,70,229,0.2)',
          borderTopColor:'#4F46E5', borderRadius:'50%',
          animation:'spin 0.8s linear infinite',
          margin:'0 auto 12px' }}/>
        <p style={{ color:'#6B7280', fontSize:'0.88rem' }}>
          Loading employee...
        </p>
        <p style={{ color:'#C4C9D4', fontSize:'0.75rem', marginTop:4 }}>
          {empID}
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  // ── Error state ───────────────────────────────────────────
  if (error || !emp) return (
    <main style={{ minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center',
      padding:24, fontFamily:'Poppins,sans-serif' }}>
      <div style={{ maxWidth:360, width:'100%', textAlign:'center' }}>
        <p style={{ fontSize:'2rem', marginBottom:12 }}>👤</p>
        <p style={{ fontWeight:700, color:'#1E1B4B', marginBottom:6 }}>
          {error || 'Employee not found'}
        </p>
        <p style={{ fontSize:'0.78rem', color:'#9CA3AF',
          background:'#F8F7FF', padding:'8px 14px',
          borderRadius:8, marginBottom:16 }}>
          ID: {empID}
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={fetchEmployee}
            style={{ padding:'9px 20px',
              background:'linear-gradient(135deg,#4F46E5,#6366F1)',
              color:'white', border:'none', borderRadius:10,
              fontFamily:'Poppins,sans-serif', fontWeight:600,
              cursor:'pointer' }}>
            🔄 Retry
          </button>
          <button onClick={() => router.push('/admin/employees')}
            style={{ padding:'9px 20px',
              background:'rgba(79,70,229,0.08)',
              color:'#4F46E5',
              border:'1.5px solid rgba(79,70,229,0.2)',
              borderRadius:10, fontFamily:'Poppins,sans-serif',
              fontWeight:600, cursor:'pointer' }}>
            ← Back
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  // ── Main page ─────────────────────────────────────────────
  return (
    <main style={{ minHeight:'100vh', padding:'20px',
      maxWidth:600, margin:'0 auto',
      fontFamily:'Poppins,sans-serif' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex',
        alignItems:'center', justifyContent:'space-between',
        padding:'14px 20px', marginBottom:20,
        flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => router.push('/admin/employees')}
            style={{ width:36, height:36, borderRadius:10,
              background:'rgba(79,70,229,0.08)', border:'none',
              cursor:'pointer', display:'flex', alignItems:'center',
              justifyContent:'center', color:'#4F46E5' }}>
            <ArrowLeft size={18}/>
          </button>
          <div>
            <p style={{ fontWeight:800, color:'#1E1B4B', fontSize:'1rem' }}>
              {emp.name}
            </p>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
              {emp.employeeID} · @{emp.username}
            </p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ padding:'9px 20px',
            background:'linear-gradient(135deg,#4F46E5,#6366F1)',
            color:'white', border:'none', borderRadius:10,
            fontFamily:'Poppins,sans-serif', fontWeight:700,
            fontSize:'0.85rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', gap:6,
            opacity: saving ? 0.8 : 1 }}>
          {saving ? '⏳ Saving...' : <><Save size={14}/>Save Changes</>}
        </button>
      </div>

      {/* Flash message */}
      {msg.text && (
        <div style={{ padding:'12px 16px',
          background: msg.err
            ? 'rgba(239,68,68,0.08)'
            : 'rgba(16,185,129,0.08)',
          border: `1.5px solid ${msg.err
            ? 'rgba(239,68,68,0.2)'
            : 'rgba(16,185,129,0.2)'}`,
          borderRadius:10, marginBottom:16,
          color: msg.err ? '#DC2626' : '#059669',
          fontSize:'0.87rem', fontWeight:500 }}>
          {msg.text}
        </div>
      )}

      <div style={{ display:'grid', gap:16 }}>

        {/* Basic Info */}
        <div className="glass" style={{ padding:20 }}>
          <p style={{ fontSize:'0.78rem', fontWeight:700,
            color:'#4F46E5', textTransform:'uppercase',
            letterSpacing:'0.5px', marginBottom:16 }}>
            👤 Basic Info
          </p>
          <div style={{ display:'grid', gap:12 }}>
            <div>
              <label className="input-label">NAME *</label>
              <input
                value={emp.name || ''}
                onChange={e => setEmp({...emp, name:e.target.value})}
                className="input-field"
                placeholder="Employee name"
              />
            </div>
            <div>
              <label className="input-label">PHONE</label>
              <input
                value={emp.phone || ''}
                onChange={e => setEmp({...emp, phone:e.target.value})}
                className="input-field"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="input-label">USERNAME</label>
              <input
                value={emp.username || ''}
                readOnly
                style={{ width:'100%', padding:'12px 14px',
                  background:'rgba(79,70,229,0.03)',
                  border:'1.5px solid rgba(79,70,229,0.1)',
                  borderRadius:10, fontFamily:'Poppins,sans-serif',
                  fontSize:'0.9rem', color:'#9CA3AF', outline:'none' }}
              />
              <p style={{ fontSize:'0.7rem', color:'#9CA3AF', marginTop:3 }}>
                Username cannot be changed
              </p>
            </div>
            <div>
              <label className="input-label">WORK ROLE</label>
              <select
                value={emp.role || 'all'}
                onChange={e => setEmp({...emp, role:e.target.value})}
                className="input-field">
                <option value="cutting">✂️ Cutting</option>
                <option value="stitching">🧵 Stitching</option>
                <option value="finishing">🚩 Finishing</option>
                <option value="all">⭐ All Stages</option>
              </select>
            </div>
            <div>
              <label className="input-label">ACCESS ROLE</label>
              <select
                value={emp.accessRole || 'employee'}
                onChange={e => setEmp({...emp, accessRole:e.target.value})}
                className="input-field">
                <option value="employee">
                  👷 Employee — Scan only
                </option>
                <option value="receptionist">
                  🎟️ Receptionist — Create orders & manage customers
                </option>
                <option value="manager">
                  ⭐ Manager — Full admin access
                </option>
              </select>
              <p style={{ fontSize:'0.7rem', color:'#9CA3AF', marginTop:4 }}>
                {emp.accessRole === 'manager'
                  ? '⭐ Full access to all admin features'
                  : emp.accessRole === 'receptionist'
                    ? '🎟️ Can create orders and manage customers'
                    : '👷 Can only scan QR codes and view assigned work'}
              </p>
            </div>
            <div>
              <label className="input-label">BONUS PER ORDER (₹)</label>
              <input
                type="number"
                min="0"
                value={emp.bonus || 0}
                onChange={e => setEmp({
                  ...emp, bonus:Number(e.target.value) || 0
                })}
                className="input-field"
              />
              <p style={{ fontSize:'0.7rem', color:'#9CA3AF', marginTop:3 }}>
                Added on top of emp rate when a stage is approved
              </p>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="glass" style={{ padding:20 }}>
          <p style={{ fontSize:'0.78rem', fontWeight:700,
            color:'#4F46E5', textTransform:'uppercase',
            letterSpacing:'0.5px', marginBottom:16 }}>
            🔐 Password
          </p>

          <div style={{ marginBottom:16 }}>
            <label className="input-label">CURRENT PASSWORD</label>
            {emp.plainPassword ? (
              <div style={{ position:'relative' }}>
                <input
                  readOnly
                  type={showCurPass ? 'text' : 'password'}
                  value={emp.plainPassword}
                  style={{ width:'100%',
                    padding:'12px 44px 12px 14px',
                    background:'rgba(16,185,129,0.05)',
                    border:'1.5px solid rgba(16,185,129,0.25)',
                    borderRadius:10,
                    fontFamily:'Poppins,sans-serif',
                    fontSize:'0.9rem', color:'#059669',
                    fontWeight:600, outline:'none',
                    letterSpacing: showCurPass ? 'normal' : '0.2em' }}
                />
                <button type="button"
                  onClick={() => setShowCurPass(p => !p)}
                  style={{ position:'absolute', right:12,
                    top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none',
                    cursor:'pointer', color:'#9CA3AF',
                    display:'flex', padding:0 }}>
                  {showCurPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            ) : (
              <div style={{ padding:'12px 14px',
                background:'rgba(245,158,11,0.05)',
                border:'1.5px dashed rgba(245,158,11,0.3)',
                borderRadius:10 }}>
                <p style={{ fontSize:'0.82rem', color:'#D97706' }}>
                  ⚠️ Password not on record — set a new one below.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="input-label">SET NEW PASSWORD</label>
            <div style={{ position:'relative', marginBottom:12 }}>
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Type new password..."
                className="input-field"
                style={{ paddingRight:44 }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handlePasswordUpdate()
                }}
              />
              <button type="button"
                onClick={() => setShowNewPass(p => !p)}
                style={{ position:'absolute', right:12,
                  top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none',
                  cursor:'pointer', color:'#9CA3AF',
                  display:'flex', padding:0 }}>
                {showNewPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            <button
              onClick={handlePasswordUpdate}
              disabled={passLoading || !newPass.trim()}
              style={{ width:'100%', padding:'12px',
                background: newPass.trim()
                  ? 'linear-gradient(135deg,#4F46E5,#6366F1)'
                  : '#E5E7EB',
                color: newPass.trim() ? 'white' : '#9CA3AF',
                border:'none', borderRadius:10,
                fontFamily:'Poppins,sans-serif', fontWeight:700,
                fontSize:'0.9rem',
                cursor: newPass.trim() ? 'pointer' : 'not-allowed',
                display:'flex', alignItems:'center',
                justifyContent:'center', gap:6 }}>
              {passLoading
                ? '⏳ Updating...'
                : <><RefreshCw size={14}/>Update Password</>}
            </button>
          </div>
        </div>

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}