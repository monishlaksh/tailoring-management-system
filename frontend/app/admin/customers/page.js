'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Search, Edit2, Trash2, X, Check, User } from 'lucide-react'
import API from '../../../lib/api'

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [editData, setEditData]   = useState(null)
  const [form, setForm]           = useState({ name:'', phone:'', address:'', notes:'' })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await API.get('/api/customers')
      setCustomers(res.data.customers)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openAdd = () => {
    setEditData(null)
    setForm({ name:'', phone:'', address:'', notes:'' })
    setError('')
    setModal(true)
  }

  const openEdit = (c) => {
    setEditData(c)
    setForm({ name:c.name, phone:c.phone, address:c.address||'', notes:c.notes||'' })
    setError('')
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.phone) { setError('Name and phone are required'); return }
    setSaving(true); setError('')
    try {
      if (editData) {
        await API.put(`/api/customers/${editData.customerID}`, form)
      } else {
        await API.post('/api/customers', form)
      }
      setModal(false)
      fetchCustomers()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (customerID) => {
    if (!confirm('Delete this customer?')) return
    try {
      await API.delete(`/api/customers/${customerID}`)
      fetchCustomers()
    } catch (e) { alert('Failed to delete') }
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.customerID?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:1000, margin:'0 auto' }}>
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')} style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Customer Management</h1>
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ padding:'9px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={15} /> Add Customer
        </button>
      </div>

      <div className="glass fade-up" style={{ padding:'24px' }}>
        <div style={{ position:'relative', marginBottom:20, maxWidth:300 }}>
          <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
          <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding:'9px 14px 9px 34px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.85rem', outline:'none', width:'100%', color:'#1E1B4B' }} />
        </div>

        {loading ? <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>Loading...</p>
        : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:12 }}>👤</p>
            <p style={{ color:'#6B7280', fontSize:'0.9rem' }}>No customers yet.</p>
            <button onClick={openAdd} className="btn-primary" style={{ marginTop:16, padding:'10px 24px', fontSize:'0.85rem' }}>+ Add First Customer</button>
          </div>
        ) : (
          <div style={{ display:'grid', gap:10 }}>
            {filtered.map(c => (
              <div key={c._id} className="glass" style={{ padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, background:'rgba(255,255,255,0.5)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#4F46E5,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <User size={20} color="white" />
                  </div>
                  <div>
                    <p style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.95rem' }}>{c.name}</p>
                    <p style={{ fontSize:'0.78rem', color:'#4F46E5', fontWeight:600 }}>{c.customerID}</p>
                    <p style={{ fontSize:'0.78rem', color:'#6B7280' }}>📞 {c.phone}</p>
                    {c.address && <p style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>📍 {c.address}</p>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => openEdit(c)} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:8, padding:'7px 14px', color:'#4F46E5', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDelete(c.customerID)} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'7px 14px', color:'#DC2626', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                    <Trash2 size={13} /> Delete
                  </button>
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
              <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1.1rem' }}>{editData ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={20} /></button>
            </div>
            {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'#DC2626', fontSize:'0.83rem' }}>{error}</div>}
            <div style={{ display:'grid', gap:14 }}>
              {[
                { label:'CUSTOMER NAME *', key:'name', placeholder:'Full name', type:'text' },
                { label:'PHONE NUMBER *',  key:'phone', placeholder:'10-digit phone', type:'text' },
                { label:'ADDRESS',         key:'address', placeholder:'Full address', type:'text' },
                { label:'NOTES',           key:'notes', placeholder:'Any notes', type:'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="input-label">{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm({...form, [f.key]:e.target.value})}
                    placeholder={f.placeholder} className="input-field" />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24 }}>
              <button onClick={() => setModal(false)} className="btn-ghost" style={{ flex:1 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {saving ? <><div className="spinner" />Saving...</> : <><Check size={16} />{editData ? 'Update' : 'Save Customer'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}