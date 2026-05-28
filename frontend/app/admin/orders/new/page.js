'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Search } from 'lucide-react'
import API from '../../../../lib/api'

const CLOTH_TYPES = ['Blouse','Chudi','Saree Blouse','Shirt','Pant','Lehenga','Kids Dress','Custom Dress']
const MEASUREMENT_FIELDS = ['shoulder','chest','waist','hip','sleeve','length','neck','custom']

export default function NewOrder() {
  const router = useRouter()
  const [customers, setCustomers]   = useState([])
  const [custSearch, setCustSearch] = useState('')
  const [selected, setSelected]     = useState(null)
  const [deliveryInfo, setDeliveryInfo] = useState(null)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm] = useState({
    clothType:'Blouse', quantity:1,
    fabricNotes:'', specialInstructions:'',
    deliveryDate:'', referenceImage:'',
    measurements:{ shoulder:'',chest:'',waist:'',hip:'',sleeve:'',length:'',neck:'',custom:'' },
    alteration:{ required:false, notes:'' },
  })

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const res = await API.get('/api/customers')
    setCustomers(res.data.customers)
  }

  const checkDelivery = async (date) => {
    if (!date) return
    try {
      const res = await API.get(`/api/delivery/date/${date}`)
      setDeliveryInfo(res.data)
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async () => {
    if (!selected) { setError('Please select a customer'); return }
    if (!form.deliveryDate) { setError('Please set a delivery date'); return }
    setSaving(true); setError('')
    try {
      await API.post('/api/orders', { ...form, customerID: selected.customerID })
      router.push('/admin/dashboard')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create order')
    } finally { setSaving(false) }
  }

  const filteredCust = customers.filter(c =>
    c.name?.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.customerID?.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone?.includes(custSearch)
  )

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:900, margin:'0 auto' }}>
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.back()} style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Create New Order</h1>
        </div>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary" style={{ padding:'9px 20px', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:6 }}>
          {saving ? <><div className="spinner" />Saving...</> : <><Save size={15} />Save Order</>}
        </button>
      </div>

      {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:20, color:'#DC2626', fontSize:'0.87rem' }}>{error}</div>}

      <div style={{ display:'grid', gap:20 }}>

        {/* Customer Selection */}
        <div className="glass fade-up" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>① Select Customer</h2>
          {selected ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(79,70,229,0.06)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, padding:'14px 18px' }}>
              <div>
                <p style={{ fontWeight:700, color:'#1E1B4B' }}>{selected.name}</p>
                <p style={{ fontSize:'0.8rem', color:'#4F46E5', fontWeight:600 }}>{selected.customerID} · {selected.phone}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>✕</button>
            </div>
          ) : (
            <>
              <div style={{ position:'relative', marginBottom:14 }}>
                <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
                <input type="text" placeholder="Search by name, ID or phone..." value={custSearch} onChange={e => setCustSearch(e.target.value)}
                  style={{ padding:'10px 14px 10px 34px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.875rem', outline:'none', width:'100%', color:'#1E1B4B' }} />
              </div>
              <div style={{ maxHeight:200, overflowY:'auto', display:'grid', gap:6 }}>
                {filteredCust.map(c => (
                  <div key={c._id} onClick={() => { setSelected(c); setCustSearch('') }}
                    style={{ padding:'11px 16px', background:'rgba(255,255,255,0.6)', border:'1px solid rgba(79,70,229,0.1)', borderRadius:8, cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(79,70,229,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.6)'}>
                    <p style={{ fontWeight:600, fontSize:'0.88rem', color:'#1E1B4B' }}>{c.name}</p>
                    <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>{c.customerID} · {c.phone}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Order Details */}
        <div className="glass fade-up-1" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>② Order Details</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
            <div>
              <label className="input-label">CLOTH TYPE</label>
              <select value={form.clothType} onChange={e => setForm({...form, clothType:e.target.value})}
                style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none' }}>
                {CLOTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">QUANTITY</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity:parseInt(e.target.value)||1})} className="input-field" />
            </div>
            <div>
              <label className="input-label">DELIVERY DATE</label>
              <input type="date" value={form.deliveryDate}
                onChange={e => { setForm({...form, deliveryDate:e.target.value}); checkDelivery(e.target.value) }}
                className="input-field" min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          {/* Delivery capacity indicator */}
          {deliveryInfo && (
            <div style={{ marginTop:14, padding:'12px 16px', background: deliveryInfo.isOverloaded ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)', border:`1.5px solid ${deliveryInfo.isOverloaded ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, borderRadius:10 }}>
              <p style={{ fontWeight:600, fontSize:'0.85rem', marginBottom:8, color: deliveryInfo.isOverloaded ? '#DC2626' : '#059669' }}>
                {deliveryInfo.isOverloaded ? '⚠️ Delivery load is high. Consider another date.' : '✅ Date available'}
              </p>
              <div style={{ background:'rgba(255,255,255,0.5)', borderRadius:6, height:8, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min(deliveryInfo.percentUsed,100)}%`, background: deliveryInfo.isOverloaded ? '#EF4444' : '#10B981', borderRadius:6, transition:'width 0.5s ease' }} />
              </div>
              <p style={{ fontSize:'0.75rem', color:'#6B7280', marginTop:6 }}>{deliveryInfo.totalPieces} / {deliveryInfo.capacity} pieces booked for this date</p>
              {deliveryInfo.entries.map(e => (
                <p key={e.clothType} style={{ fontSize:'0.73rem', color:'#6B7280' }}>· {e.clothType}: {e.pieceCount} pcs</p>
              ))}
            </div>
          )}

          <div style={{ marginTop:14, display:'grid', gap:14 }}>
            <div>
              <label className="input-label">FABRIC NOTES</label>
              <input type="text" value={form.fabricNotes} onChange={e => setForm({...form, fabricNotes:e.target.value})} placeholder="e.g. Pure cotton, pre-washed" className="input-field" />
            </div>
            <div>
              <label className="input-label">SPECIAL INSTRUCTIONS</label>
              <textarea value={form.specialInstructions} onChange={e => setForm({...form, specialInstructions:e.target.value})} placeholder="Any special instructions..." rows={3}
                style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none', resize:'vertical' }} />
            </div>
          </div>
        </div>

        {/* Measurements */}
        <div className="glass fade-up-2" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>③ Measurements <span style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:400 }}>(in inches)</span></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
            {MEASUREMENT_FIELDS.map(field => (
              <div key={field}>
                <label className="input-label">{field.toUpperCase()}</label>
                <input type="text" value={form.measurements[field]} onChange={e => setForm({...form, measurements:{...form.measurements,[field]:e.target.value}})}
                  placeholder={field === 'custom' ? 'Any other' : 'e.g. 36'} className="input-field" />
              </div>
            ))}
          </div>
        </div>

        {/* Alteration */}
        <div className="glass fade-up-3" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>④ Alteration</h2>
          <div style={{ display:'flex', gap:12, marginBottom:14 }}>
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => setForm({...form, alteration:{...form.alteration, required:v}})}
                style={{ padding:'10px 24px', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.85rem', cursor:'pointer', border: form.alteration.required === v ? '2px solid #4F46E5' : '1.5px solid rgba(79,70,229,0.2)', background: form.alteration.required === v ? 'rgba(79,70,229,0.1)' : 'rgba(255,255,255,0.7)', color: form.alteration.required === v ? '#4F46E5' : '#6B7280', transition:'all 0.2s' }}>
                {v ? '✅ Yes' : '❌ No'}
              </button>
            ))}
          </div>
          {form.alteration.required && (
            <div>
              <label className="input-label">ALTERATION NOTES</label>
              <textarea value={form.alteration.notes} onChange={e => setForm({...form, alteration:{...form.alteration, notes:e.target.value}})}
                placeholder="e.g. Tight fitting near waist, reduce sleeve by 1 inch" rows={3}
                style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none', resize:'vertical' }} />
            </div>
          )}
        </div>

      </div>
    </main>
  )
}