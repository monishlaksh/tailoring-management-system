'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, Users, Eye, EyeOff } from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'

const ROLES = [
  { value:'cutting',   label:'✂️ Cutting',   color:'#D97706', bg:'rgba(245,158,11,0.1)'  },
  { value:'stitching', label:'🧵 Stitching',  color:'#2563EB', bg:'rgba(59,130,246,0.1)'  },
  { value:'finishing', label:'🚩 Finishing',  color:'#9333EA', bg:'rgba(168,85,247,0.1)'  },
  { value:'all',       label:'⭐ All Stages', color:'#059669', bg:'rgba(16,185,129,0.1)'  },
]

const getRoleBadge = (role) => {
  const r = ROLES.find(x => x.value === role) || ROLES[3]
  return (
    <span style={{ fontSize:'0.73rem', fontWeight:600, padding:'3px 10px', borderRadius:999, background:r.bg, color:r.color }}>
      {r.label}
    </span>
  )
}

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(false)
  const [editData, setEditData]     = useState(null)
  const [showPass, setShowPass]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm] = useState({ name:'', username:'', password:'', role:'all', isActive:true })

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/api/employees')
      setEmployees(res.data.employees)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openAdd = () => {
    setEditData(null)
    setForm({ name:'', username:'', password:'', role:'all', isActive:true })
    setError(''); setShowPass(false); setModal(true)
  }

  const openEdit = (emp) => {
    setEditData(emp)
    setForm({ name:emp.name, username:emp.username, password:'', role:emp.role||'all', isActive:emp.isActive })
    setError(''); setShowPass(false); setModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.username) { setError('Name and username required'); return }
    if (!editData && !form.password)  { setError('Password required for new employee'); return }
    setSaving(true); setError('')
    try {
      const payload = { name:form.name, username:form.username, role:form.role, isActive:form.isActive }
      if (form.password) payload.password = form.password
      if (editData) {
        await API.put(`/api/employees/${editData.employeeID}`, payload)
      } else {
        await API.post('/api/employees', { ...payload, password:form.password })
      }
      setModal(false)
      fetchEmployees()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (employeeID) => {
    if (!confirm('Deactivate this employee?')) return
    try {
      await API.delete(`/api/employees/${employeeID}`)
      fetchEmployees()
    } catch (e) { alert('Failed') }
  }

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:900, margin:'0 auto' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')} style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Employee Management</h1>
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ padding:'9px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {/* Role info banner */}
      <div style={{ background:'rgba(79,70,229,0.05)', border:'1.5px solid rgba(79,70,229,0.15)', borderRadius:12, padding:'12px 18px', marginBottom:20 }}>
        <p style={{ fontSize:'0.82rem', color:'#4338CA', fontWeight:500, marginBottom:8 }}>
          🔐 Employee Permissions by Role
        </p>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {ROLES.map(r => (
            <span key={r.value} style={{ fontSize:'0.75rem', padding:'3px 10px', borderRadius:999, background:r.bg, color:r.color, fontWeight:600 }}>
              {r.label}
            </span>
          ))}
        </div>
        <p style={{ fontSize:'0.76rem', color:'#6B7280', marginTop:8 }}>
          Employees can only update order status for their assigned stage. They cannot create, edit or delete orders or customers.
        </p>
      </div>

      <div className="glass" style={{ padding:24 }}>
        {loading ? (
          <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>Loading...</p>
        ) : employees.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:12 }}>👥</p>
            <p style={{ color:'#6B7280', fontSize:'0.9rem', marginBottom:16 }}>No employees yet.</p>
            <button onClick={openAdd} className="btn-primary" style={{ padding:'10px 24px', fontSize:'0.85rem' }}>+ Add First Employee</button>
          </div>
        ) : (
          <div style={{ display:'grid', gap:10 }}>
            {employees.map(emp => (
              <div key={emp._id} className="glass"
                style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, background:emp.isActive?'rgba(255,255,255,0.5)':'rgba(239,68,68,0.03)', cursor:'pointer' }}
                onClick={() => router.push(`/admin/employees/${emp.employeeID}`)}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#F59E0B,#D97706)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Users size={20} color="white" />
                  </div>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <p style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.95rem' }}>{emp.name}</p>
                      {getRoleBadge(emp.role || 'all')}
                      <span style={{ fontSize:'0.7rem', padding:'2px 8px', borderRadius:999, background:emp.isActive?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color:emp.isActive?'#059669':'#DC2626', fontWeight:600 }}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p style={{ fontSize:'0.78rem', color:'#4F46E5', fontWeight:600 }}>{emp.employeeID}</p>
                    <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>@{emp.username}</p>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(emp)}
                    style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:8, padding:'7px 14px', color:'#4F46E5', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  {emp.isActive && (
                    <button onClick={() => handleDelete(emp.employeeID)}
                      style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'7px 14px', color:'#DC2626', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                      <Trash2 size={13} /> Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(30,27,75,0.3)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div className="glass" style={{ width:'100%', maxWidth:480, padding:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1.1rem' }}>
                {editData ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={20} /></button>
            </div>

            {error && (
              <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'#DC2626', fontSize:'0.83rem' }}>
                {error}
              </div>
            )}

            <div style={{ display:'grid', gap:14 }}>
              <div>
                <label className="input-label">FULL NAME *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form,name:e.target.value})}
                  placeholder="Employee full name" className="input-field" />
              </div>
              <div>
                <label className="input-label">USERNAME *</label>
                <input type="text" value={form.username} onChange={e => setForm({...form,username:e.target.value})}
                  placeholder="Login username" className="input-field" />
              </div>
              <div>
                <label className="input-label">{editData ? 'NEW PASSWORD (leave blank to keep)' : 'PASSWORD *'}</label>
                <div style={{ position:'relative' }}>
                  <input type={showPass?'text':'password'} value={form.password} onChange={e => setForm({...form,password:e.target.value})}
                    placeholder={editData?'Leave blank to keep current':'Set a password'}
                    className="input-field" style={{ paddingRight:44 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="input-label">EMPLOYEE ROLE *</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {ROLES.map(r => (
                    <button key={r.value} type="button"
                      onClick={() => setForm({...form, role:r.value})}
                      style={{
                        padding:'10px 14px', borderRadius:10,
                        fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.82rem',
                        cursor:'pointer', textAlign:'left',
                        border:   form.role===r.value ? `2px solid ${r.color}` : '1.5px solid rgba(79,70,229,0.15)',
                        background: form.role===r.value ? r.bg : 'rgba(255,255,255,0.7)',
                        color:    form.role===r.value ? r.color : '#6B7280',
                        transition:'all 0.2s',
                      }}>
                      {r.label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize:'0.72rem', color:'#9CA3AF', marginTop:6 }}>
                  {form.role === 'all'       && 'Can work on all stages'}
                  {form.role === 'cutting'   && 'Can only work on cutting stage'}
                  {form.role === 'stitching' && 'Can only work on stitching stage'}
                  {form.role === 'finishing' && 'Can only work on finishing stage'}
                </p>
              </div>

              {editData && (
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <label className="input-label" style={{ margin:0 }}>STATUS</label>
                  <button type="button" onClick={() => setForm({...form,isActive:!form.isActive})}
                    style={{ padding:'6px 16px', borderRadius:999, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.8rem', cursor:'pointer', border:form.isActive?'2px solid #10B981':'2px solid #EF4444', background:form.isActive?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color:form.isActive?'#059669':'#DC2626' }}>
                    {form.isActive ? '✅ Active' : '❌ Inactive'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:10, marginTop:24 }}>
              <button onClick={() => setModal(false)} className="btn-ghost" style={{ flex:1 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary"
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {saving ? <><div className="spinner" />Saving...</> : <><Check size={16} />{editData?'Update':'Add Employee'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}