'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import API from '../../../../lib/api'

export default function EmployeeAddCustomer() {
  const router = useRouter()
  const [form, setForm]     = useState({ name:'', phone:'', address:'', notes:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('employeeToken')) router.push('/employee/login')
  }, [])

  const handleSave = async () => {
    if (!form.name || !form.phone) { setError('Name and phone are required'); return }
    setSaving(true); setError('')
    try {
      const res = await API.post('/api/customers', form)
      setSuccess(res.data.customer)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save customer')
    } finally { setSaving(false) }
  }

  if (success) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div className="glass" style={{ padding:40, textAlign:'center', maxWidth:420 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(16,185,129,0.1)', border:'2px solid #10B981', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <Check size={32} color="#059669" />
        </div>
        <h2 style={{ fontWeight:800, color:'#1E1B4B', marginBottom:8 }}>Customer Created!</h2>
        <p style={{ color:'#6B7280', fontSize:'0.88rem', marginBottom:20 }}>Share this ID with the customer for login.</p>
        <div style={{ background:'rgba(79,70,229,0.06)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:12, padding:'16px 24px', marginBottom:24 }}>
          <p style={{ fontSize:'0.75rem', color:'#9CA3AF', marginBottom:4 }}>CUSTOMER ID</p>
          <p style={{ fontSize:'1.6rem', fontWeight:800, color:'#4F46E5', letterSpacing:2 }}>{success.customerID}</p>
          <p style={{ fontSize:'0.8rem', color:'#6B7280', marginTop:4 }}>{success.name} · {success.phone}</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => { setSuccess(null); setForm({ name:'',phone:'',address:'',notes:'' }) }}
            className="btn-ghost" style={{ flex:1 }}>Add Another</button>
          <button onClick={() => router.push('/employee/orders/new')}
            style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.88rem', cursor:'pointer' }}>
            Create Order →
          </button>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:600, margin:'0 auto' }}>
      <div className="glass" style={{ display:'flex', alignItems:'center', padding:'14px 24px', marginBottom:24, gap:12, borderTop:'3px solid #F59E0B' }}>
        <button onClick={() => router.back()} style={{ background:'none', border:'none', cursor:'pointer', color:'#D97706', display:'flex' }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Add New Customer</h1>
      </div>

      <div className="glass" style={{ padding:32 }}>
        {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:20, color:'#DC2626', fontSize:'0.85rem' }}>{error}</div>}

        <div style={{ display:'grid', gap:16 }}>
          {[
            { label:'CUSTOMER NAME *', key:'name',    placeholder:'Full name',       type:'text' },
            { label:'PHONE NUMBER *',  key:'phone',   placeholder:'10-digit number', type:'text' },
            { label:'ADDRESS',         key:'address', placeholder:'Full address',    type:'text' },
            { label:'NOTES',           key:'notes',   placeholder:'Any notes',       type:'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="input-label">{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => { setForm({...form,[f.key]:e.target.value}); setError('') }}
                placeholder={f.placeholder} className="input-field" />
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button onClick={() => router.back()} className="btn-ghost" style={{ flex:1 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex:1, padding:'13px', background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.9rem', cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:saving?0.7:1 }}>
            {saving ? <><div className="spinner" />Saving...</> : <><Check size={16} />Save Customer</>}
          </button>
        </div>
      </div>
    </main>
  )
}