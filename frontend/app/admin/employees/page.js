'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Trash2,
  X, Check, Users, Eye, EyeOff
} from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'

const ROLES = [
  { value:'cutting',   label:'✂️ Cutting',   color:'#D97706', bg:'rgba(245,158,11,0.1)'  },
  { value:'stitching', label:'🧵 Stitching',  color:'#2563EB', bg:'rgba(59,130,246,0.1)'  },
  { value:'finishing', label:'🚩 Finishing',  color:'#9333EA', bg:'rgba(168,85,247,0.1)'  },
  { value:'all',       label:'⭐ All Stages', color:'#059669', bg:'rgba(16,185,129,0.1)'  },
]

const ACCESS_ROLES = [
  { value:'employee',     label:'👷 Employee',     color:'#6B7280', bg:'rgba(107,114,128,0.08)', desc:'Scan only'              },
  { value:'receptionist', label:'🎟️ Receptionist', color:'#4F46E5', bg:'rgba(79,70,229,0.08)',   desc:'Create orders'          },
  { value:'manager',      label:'⭐ Manager',      color:'#D97706', bg:'rgba(245,158,11,0.08)',  desc:'Full admin access'      },
]

const getRoleBadge = (role) => {
  const r = ROLES.find(x => x.value === role) || ROLES[3]
  return (
    <span style={{ fontSize:'0.73rem', fontWeight:600,
      padding:'3px 10px', borderRadius:999,
      background:r.bg, color:r.color }}>
      {r.label}
    </span>
  )
}

export default function EmployeesPage() {
  const router = useRouter()

  const [employees, setEmployees]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [addModal, setAddModal]             = useState(false)
  const [showPass, setShowPass]             = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [togglingAccess, setTogglingAccess] = useState(null)
  const [error, setError]                   = useState('')
  const [settingBonus, setSettingBonus]     = useState(null)
  const [bonusInput, setBonusInput]         = useState(0)
  const [savingBonus, setSavingBonus]       = useState(false)
  const [successMsg, setSuccessMsg]         = useState('')

  const [form, setForm] = useState({
    name:'', username:'', password:'',
    role:'all', accessRole:'employee',
  })

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      router.push('/admin/login'); return
    }
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/api/employees')
      setEmployees(res.data.employees || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const openAdd = () => {
    setForm({ name:'', username:'', password:'', role:'all', accessRole:'employee' })
    setError('')
    setShowPass(false)
    setAddModal(true)
  }

  // ── Add new employee ──────────────────────────────────────
  const handleAdd = async () => {
    if (!form.name.trim())     { setError('Name is required'); return }
    if (!form.username.trim()) { setError('Username is required'); return }
    if (!form.password.trim()) { setError('Password is required'); return }

    setSaving(true)
    setError('')
    try {
      await API.post('/api/employees', {
        name:          form.name.trim(),
        username:      form.username.trim(),
        password:      form.password.trim(),
        role:          form.role,
        accessRole:    form.accessRole,
        hasFullAccess: form.accessRole === 'manager',
      })
      setAddModal(false)
      showSuccess('Employee added!')
      fetchEmployees()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add employee')
    } finally {
      setSaving(false)
    }
  }

  // ── Deactivate ────────────────────────────────────────────
  const handleDeactivate = async (employeeID) => {
    if (!confirm('Deactivate this employee?')) return
    try {
      await API.delete(`/api/employees/${employeeID}`)
      fetchEmployees()
    } catch (e) {
      alert('Failed to deactivate')
    }
  }

  // ── Toggle full access ────────────────────────────────────
  const handleToggleAccess = async (employeeID, currentAccess) => {
    setTogglingAccess(employeeID)
    try {
      await API.patch(`/api/employees/${employeeID}/access`, {
        hasFullAccess: !currentAccess,
      })
      fetchEmployees()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed')
    } finally {
      setTogglingAccess(null)
    }
  }

  // ── Set bonus ─────────────────────────────────────────────
  const handleSetBonus = async (employeeID) => {
    setSavingBonus(true)
    try {
      await API.patch(`/api/employees/${employeeID}/bonus`, {
        bonus: bonusInput,
      })
      fetchEmployees()
      setSettingBonus(null)
      setBonusInput(0)
    } catch (e) {
      alert('Failed to set bonus')
    } finally {
      setSavingBonus(false)
    }
  }

  return (
    <main style={{ minHeight:'100vh', padding:'24px',
      maxWidth:900, margin:'0 auto',
      fontFamily:'Poppins,sans-serif' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'14px 24px',
        marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ background:'none', border:'none',
              cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20}/>
          </button>
          <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>
            Employee Management
          </h1>
        </div>
        <button onClick={openAdd} className="btn-primary"
          style={{ padding:'9px 18px', fontSize:'0.82rem',
            display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={15}/> Add Employee
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div style={{ padding:'12px 16px',
          background:'rgba(16,185,129,0.08)',
          border:'1.5px solid rgba(16,185,129,0.2)',
          borderRadius:10, marginBottom:16,
          color:'#059669', fontSize:'0.87rem', fontWeight:500 }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Access roles info */}
      <div style={{ background:'rgba(79,70,229,0.05)',
        border:'1.5px solid rgba(79,70,229,0.15)',
        borderRadius:12, padding:'12px 18px', marginBottom:20 }}>
        <p style={{ fontSize:'0.78rem', color:'#4338CA',
          fontWeight:600, marginBottom:8 }}>
          🔐 Access Roles
        </p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {ACCESS_ROLES.map(r => (
            <span key={r.value} style={{ fontSize:'0.72rem',
              padding:'3px 10px', borderRadius:999,
              background:r.bg, color:r.color, fontWeight:600 }}>
              {r.label} — {r.desc}
            </span>
          ))}
        </div>
      </div>

      {/* Employee list */}
      <div className="glass" style={{ padding:24 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ width:36, height:36,
              border:'3px solid rgba(79,70,229,0.2)',
              borderTopColor:'#4F46E5', borderRadius:'50%',
              animation:'spin 0.8s linear infinite',
              margin:'0 auto 12px' }}/>
            <p style={{ color:'#9CA3AF' }}>Loading...</p>
          </div>
        ) : employees.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:12 }}>👥</p>
            <p style={{ color:'#6B7280', fontSize:'0.9rem',
              marginBottom:16 }}>No employees yet.</p>
            <button onClick={openAdd} className="btn-primary"
              style={{ padding:'10px 24px', fontSize:'0.85rem' }}>
              + Add First Employee
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gap:12 }}>
            {employees.map(emp => {
              const ar = ACCESS_ROLES.find(
                r => r.value === (emp.accessRole || 'employee')
              ) || ACCESS_ROLES[0]

              return (
                <div key={emp._id} className="glass"
                  style={{ padding:'16px 18px',
                    background: emp.isActive
                      ? 'rgba(255,255,255,0.5)'
                      : 'rgba(239,68,68,0.03)',
                    border: emp.hasFullAccess
                      ? '1.5px solid rgba(245,158,11,0.3)'
                      : '1.5px solid rgba(229,231,235,1)',
                    cursor:'pointer',
                  }}
                  onClick={() =>
                    router.push(`/admin/employees/${emp.employeeID}`)
                  }>

                  {/* Top row */}
                  <div style={{ display:'flex', alignItems:'center',
                    justifyContent:'space-between',
                    flexWrap:'wrap', gap:10, marginBottom:12 }}>

                    {/* Avatar + info */}
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:42, height:42, borderRadius:'50%',
                        background: emp.hasFullAccess
                          ? 'linear-gradient(135deg,#F59E0B,#D97706)'
                          : 'linear-gradient(135deg,#4F46E5,#6366F1)',
                        display:'flex', alignItems:'center',
                        justifyContent:'center', flexShrink:0 }}>
                        <Users size={20} color="white"/>
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center',
                          gap:6, flexWrap:'wrap', marginBottom:3 }}>
                          <p style={{ fontWeight:700, color:'#1E1B4B',
                            fontSize:'0.92rem' }}>
                            {emp.name}
                          </p>
                          {getRoleBadge(emp.role || 'all')}
                          <span style={{ fontSize:'0.7rem', padding:'2px 8px',
                            borderRadius:999,
                            background: ar.bg,
                            color: ar.color, fontWeight:600 }}>
                            {ar.label}
                          </span>
                          <span style={{ fontSize:'0.7rem', padding:'2px 8px',
                            borderRadius:999,
                            background: emp.isActive
                              ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: emp.isActive ? '#059669' : '#DC2626',
                            fontWeight:600 }}>
                            {emp.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p style={{ fontSize:'0.75rem', color:'#4F46E5',
                          fontWeight:600 }}>
                          {emp.employeeID}
                        </p>
                        <p style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>
                          @{emp.username}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}
                      onClick={e => e.stopPropagation()}>

                      {/* Grant/revoke */}
                      <button
                        disabled={togglingAccess === emp.employeeID}
                        onClick={() => handleToggleAccess(
                          emp.employeeID, emp.hasFullAccess
                        )}
                        style={{ display:'flex', alignItems:'center', gap:4,
                          background: emp.hasFullAccess
                            ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                          border: `1px solid ${emp.hasFullAccess
                            ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                          borderRadius:8, padding:'7px 12px',
                          color: emp.hasFullAccess ? '#DC2626' : '#059669',
                          fontSize:'0.78rem', fontWeight:600,
                          cursor: togglingAccess === emp.employeeID
                            ? 'not-allowed' : 'pointer',
                          fontFamily:'Poppins,sans-serif',
                          opacity: togglingAccess === emp.employeeID ? 0.6 : 1 }}>
                        {togglingAccess === emp.employeeID
                          ? '...'
                          : emp.hasFullAccess ? '🔒 Revoke' : '🔓 Grant'}
                      </button>

                      {/* Edit — navigate to edit page */}
                      <button
                        onClick={() =>
                          router.push(`/admin/employees/${emp.employeeID}`)
                        }
                        style={{ display:'flex', alignItems:'center', gap:4,
                          background:'rgba(79,70,229,0.08)',
                          border:'1px solid rgba(79,70,229,0.2)',
                          borderRadius:8, padding:'7px 12px',
                          color:'#4F46E5', fontSize:'0.78rem',
                          fontWeight:600, cursor:'pointer',
                          fontFamily:'Poppins,sans-serif' }}>
                        ✏️ Edit
                      </button>

                      {/* Deactivate */}
                      {emp.isActive && (
                        <button
                          onClick={() => handleDeactivate(emp.employeeID)}
                          style={{ display:'flex', alignItems:'center', gap:4,
                            background:'rgba(239,68,68,0.08)',
                            border:'1px solid rgba(239,68,68,0.2)',
                            borderRadius:8, padding:'7px 12px',
                            color:'#DC2626', fontSize:'0.78rem',
                            fontWeight:600, cursor:'pointer',
                            fontFamily:'Poppins,sans-serif' }}>
                          <Trash2 size={13}/> Deactivate
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bonus row */}
                  <div onClick={e => e.stopPropagation()}
                    style={{ padding:'10px 14px',
                      background:'rgba(245,158,11,0.05)',
                      border:'1px solid rgba(245,158,11,0.2)',
                      borderRadius:10 }}>

                    {settingBonus === emp.employeeID ? (
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:'0.78rem',
                          color:'#D97706', fontWeight:600 }}>
                          Bonus per order:
                        </span>
                        <div style={{ position:'relative', flex:1 }}>
                          <span style={{ position:'absolute', left:8,
                            top:'50%', transform:'translateY(-50%)',
                            color:'#9CA3AF', fontSize:'0.85rem' }}>₹</span>
                          <input
                            type="number" min="0"
                            value={bonusInput}
                            onChange={e =>
                              setBonusInput(parseFloat(e.target.value) || 0)
                            }
                            autoFocus
                            style={{ width:'100%',
                              padding:'7px 10px 7px 22px',
                              border:'1.5px solid rgba(245,158,11,0.3)',
                              borderRadius:8,
                              fontFamily:'Poppins,sans-serif',
                              fontSize:'0.88rem', outline:'none' }}
                          />
                        </div>
                        <button
                          onClick={() => handleSetBonus(emp.employeeID)}
                          disabled={savingBonus}
                          style={{ padding:'7px 14px',
                            background:'linear-gradient(135deg,#F59E0B,#D97706)',
                            color:'white', border:'none', borderRadius:8,
                            cursor:'pointer', fontFamily:'Poppins,sans-serif',
                            fontWeight:600, fontSize:'0.8rem',
                            display:'flex', alignItems:'center', gap:4 }}>
                          {savingBonus ? '...' : <><Check size={12}/> Set</>}
                        </button>
                        <button onClick={() => setSettingBonus(null)}
                          style={{ padding:'7px 10px',
                            background:'rgba(239,68,68,0.08)',
                            border:'1px solid rgba(239,68,68,0.2)',
                            borderRadius:8, color:'#DC2626',
                            cursor:'pointer', display:'flex',
                            alignItems:'center' }}>
                          <X size={13}/>
                        </button>
                      </div>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center',
                        justifyContent:'space-between' }}>
                        <span style={{ fontSize:'0.78rem', color:'#9CA3AF' }}>
                          Bonus per order:{' '}
                          <strong style={{ color: emp.bonus > 0
                            ? '#D97706' : '#9CA3AF' }}>
                            {emp.bonus > 0 ? `₹${emp.bonus}` : 'None'}
                          </strong>
                        </span>
                        <button
                          onClick={() => {
                            setSettingBonus(emp.employeeID)
                            setBonusInput(emp.bonus || 0)
                          }}
                          style={{ padding:'5px 12px',
                            background:'rgba(245,158,11,0.08)',
                            border:'1px solid rgba(245,158,11,0.25)',
                            borderRadius:7, color:'#D97706',
                            fontSize:'0.75rem', fontWeight:600,
                            cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                          🏆 {emp.bonus > 0 ? 'Edit' : 'Set'} Bonus
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ADD Employee Modal — no edit here, edit goes to /employees/[id] */}
      {addModal && (
        <div style={{ position:'fixed', inset:0,
          background:'rgba(30,27,75,0.3)',
          backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center',
          justifyContent:'center', zIndex:1000, padding:20 }}>
          <div className="glass" style={{ width:'100%', maxWidth:500,
            padding:32, maxHeight:'90vh', overflowY:'auto' }}>

            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:24 }}>
              <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1.1rem' }}>
                Add New Employee
              </h2>
              <button onClick={() => setAddModal(false)}
                style={{ background:'none', border:'none',
                  cursor:'pointer', color:'#9CA3AF' }}>
                <X size={20}/>
              </button>
            </div>

            {error && (
              <div style={{ background:'rgba(239,68,68,0.08)',
                border:'1px solid rgba(239,68,68,0.2)',
                borderRadius:8, padding:'10px 14px',
                marginBottom:16, color:'#DC2626', fontSize:'0.83rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display:'grid', gap:14 }}>

              <div>
                <label className="input-label">FULL NAME *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm({...form, name:e.target.value})}
                  placeholder="Employee full name"
                  className="input-field"/>
              </div>

              <div>
                <label className="input-label">USERNAME *</label>
                <input type="text" value={form.username}
                  onChange={e => setForm({...form, username:e.target.value})}
                  placeholder="Login username"
                  className="input-field"/>
              </div>

              <div>
                <label className="input-label">PASSWORD *</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({...form, password:e.target.value})}
                    placeholder="Set a password"
                    className="input-field"
                    style={{ paddingRight:44 }}
                  />
                  <button type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{ position:'absolute', right:12, top:'50%',
                      transform:'translateY(-50%)', background:'none',
                      border:'none', cursor:'pointer', color:'#9CA3AF',
                      display:'flex', padding:0 }}>
                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              <div>
                <label className="input-label">WORK ROLE *</label>
                <div style={{ display:'grid',
                  gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {ROLES.map(r => (
                    <button key={r.value} type="button"
                      onClick={() => setForm({...form, role:r.value})}
                      style={{ padding:'10px 14px', borderRadius:10,
                        fontFamily:'Poppins,sans-serif', fontWeight:600,
                        fontSize:'0.82rem', cursor:'pointer', textAlign:'left',
                        border: form.role === r.value
                          ? `2px solid ${r.color}`
                          : '1.5px solid rgba(79,70,229,0.15)',
                        background: form.role === r.value
                          ? r.bg : 'rgba(255,255,255,0.7)',
                        color: form.role === r.value ? r.color : '#6B7280' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">ACCESS ROLE *</label>
                <div style={{ display:'grid', gap:8 }}>
                  {ACCESS_ROLES.map(r => (
                    <button key={r.value} type="button"
                      onClick={() => setForm({...form, accessRole:r.value})}
                      style={{ padding:'12px 14px', borderRadius:10,
                        textAlign:'left', fontFamily:'Poppins,sans-serif',
                        cursor:'pointer',
                        border: form.accessRole === r.value
                          ? `2px solid ${r.color}`
                          : '1.5px solid rgba(79,70,229,0.15)',
                        background: form.accessRole === r.value
                          ? r.bg : 'rgba(255,255,255,0.7)' }}>
                      <p style={{ fontWeight:700, fontSize:'0.88rem',
                        color: form.accessRole === r.value
                          ? r.color : '#1E1B4B', marginBottom:2 }}>
                        {r.label}
                        {form.accessRole === r.value && ' ✓'}
                      </p>
                      <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                        {r.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div style={{ display:'flex', gap:10, marginTop:24 }}>
              <button onClick={() => setAddModal(false)}
                className="btn-ghost" style={{ flex:1 }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                className="btn-primary"
                style={{ flex:1, display:'flex',
                  alignItems:'center', justifyContent:'center', gap:8 }}>
                {saving
                  ? <><div className="spinner"/>Adding...</>
                  : <><Check size={16}/> Add Employee</>}
              </button>
            </div>

          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}