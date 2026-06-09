'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Search, UserPlus, X, Check } from 'lucide-react'
import { adminAPI as API } from '../../../../lib/api'
import NumInput from '../../../../components/NumInput'

const CLOTH_TYPES        = ['Blouse','Chudi','Saree Blouse','Shirt','Pant','Lehenga','Kids Dress','Custom Dress']
const MEASUREMENT_FIELDS = ['shoulder','chest','waist','hip','sleeve','length','neck','custom']

export default function NewOrder() {
  const router = useRouter()
  const [customers, setCustomers]       = useState([])
  const [custSearch, setCustSearch]     = useState('')
  const [selected, setSelected]         = useState(null)
  const [deliveryInfo, setDeliveryInfo] = useState(null)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  // New customer inline state
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustForm, setNewCustForm]         = useState({ name:'', phone:'', address:'', notes:'' })
  const [newCustSaving, setNewCustSaving]     = useState(false)
  const [newCustError, setNewCustError]       = useState('')

  const [form, setForm] = useState({
    clothType:'Blouse', quantity:1,
    unitCost:0, amountSettled:0,
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
    try {
      const res = await API.get('/api/customers')
      setCustomers(res.data.customers)
    } catch (e) { console.error(e) }
  }

  const checkDelivery = async (date) => {
    if (!date) return
    try {
      const res = await API.get(`/api/delivery/date/${date}`)
      setDeliveryInfo(res.data)
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async () => {
    if (!selected)          { setError('Please select a customer'); return }
    if (!form.deliveryDate) { setError('Please set a delivery date'); return }
    setSaving(true); setError('')
    try {
      await API.post('/api/orders', { ...form, customerID: selected.customerID })
      router.push('/admin/dashboard')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create order')
    } finally { setSaving(false) }
  }

  // Create new customer inline and auto-select them
  const handleCreateNewCustomer = async () => {
    if (!newCustForm.name || !newCustForm.phone) {
      setNewCustError('Name and phone are required')
      return
    }
    setNewCustSaving(true); setNewCustError('')
    try {
      const res = await API.post('/api/customers', newCustForm)
      const newCustomer = res.data.customer
      // Add to list and auto-select
      setCustomers(prev => [newCustomer, ...prev])
      setSelected(newCustomer)
      setShowNewCustomer(false)
      setNewCustForm({ name:'', phone:'', address:'', notes:'' })
    } catch (e) {
      setNewCustError(e.response?.data?.message || 'Failed to create customer')
    } finally { setNewCustSaving(false) }
  }

  const filteredCust = customers.filter(c =>
    c.name?.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.customerID?.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone?.includes(custSearch)
  )

  const balance = Math.max((form.unitCost||0) - (form.amountSettled||0), 0)

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:900, margin:'0 auto' }}>

      {/* Top Bar */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.back()} style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Create New Order</h1>
        </div>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary"
          style={{ padding:'9px 20px', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:6 }}>
          {saving ? <><div className="spinner" />Saving...</> : <><Save size={15} />Save Order</>}
        </button>
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:20, color:'#DC2626', fontSize:'0.87rem' }}>
          {error}
        </div>
      )}

      <div style={{ display:'grid', gap:20 }}>

        {/* ── Customer Selection ── */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>① Select Customer</h2>

          {selected ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(79,70,229,0.06)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, padding:'14px 18px' }}>
              <div>
                <p style={{ fontWeight:700, color:'#1E1B4B' }}>{selected.name}</p>
                <p style={{ fontSize:'0.8rem', color:'#4F46E5', fontWeight:600 }}>{selected.customerID} · {selected.phone}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'1.1rem' }}>✕</button>
            </div>
          ) : (
            <>
              {/* Search existing */}
              <div style={{ position:'relative', marginBottom:12 }}>
                <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
                <input type="text" placeholder="Search existing customers by name, ID or phone..."
                  value={custSearch} onChange={e => setCustSearch(e.target.value)}
                  style={{ padding:'10px 14px 10px 34px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.875rem', outline:'none', width:'100%', color:'#1E1B4B' }} />
              </div>

              {/* Customer list */}
              <div style={{ maxHeight:200, overflowY:'auto', display:'grid', gap:6, marginBottom:12 }}>

                {/* ── Add New Customer option at top ── */}
                <div
                  onClick={() => setShowNewCustomer(!showNewCustomer)}
                  style={{
                    padding:'11px 16px',
                    background: showNewCustomer ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.6)',
                    border: showNewCustomer ? '1.5px solid rgba(16,185,129,0.3)' : '1.5px dashed rgba(16,185,129,0.4)',
                    borderRadius:8, cursor:'pointer', transition:'all 0.2s',
                    display:'flex', alignItems:'center', gap:10,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background=showNewCustomer?'rgba(16,185,129,0.08)':'rgba(255,255,255,0.6)'}
                >
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#10B981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <UserPlus size={16} color="white" />
                  </div>
                  <div>
                    <p style={{ fontWeight:700, fontSize:'0.88rem', color:'#059669' }}>+ Add New Customer</p>
                    <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>Create and select in one step</p>
                  </div>
                  {showNewCustomer && <span style={{ marginLeft:'auto', color:'#059669', fontSize:'0.75rem', fontWeight:600 }}>▲ Close</span>}
                </div>

                {filteredCust.map(c => (
                  <div key={c._id}
                    onClick={() => { setSelected(c); setCustSearch(''); setShowNewCustomer(false) }}
                    style={{ padding:'11px 16px', background:'rgba(255,255,255,0.6)', border:'1px solid rgba(79,70,229,0.1)', borderRadius:8, cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(79,70,229,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.6)'}
                  >
                    <p style={{ fontWeight:600, fontSize:'0.88rem', color:'#1E1B4B' }}>{c.name}</p>
                    <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>{c.customerID} · {c.phone}</p>
                  </div>
                ))}

                {filteredCust.length === 0 && custSearch && (
                  <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:'0.85rem', padding:'12px 0' }}>
                    No customers found. Use "+ Add New Customer" above.
                  </p>
                )}
              </div>

              {/* Inline New Customer Form */}
              {showNewCustomer && (
                <div style={{ border:'1.5px solid rgba(16,185,129,0.25)', borderRadius:12, padding:'20px', background:'rgba(16,185,129,0.03)', marginTop:4 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <p style={{ fontWeight:700, color:'#059669', fontSize:'0.9rem' }}>👤 New Customer Details</p>
                    <button onClick={() => { setShowNewCustomer(false); setNewCustError('') }}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
                      <X size={16} />
                    </button>
                  </div>

                  {newCustError && (
                    <p style={{ color:'#DC2626', fontSize:'0.82rem', marginBottom:12, background:'rgba(239,68,68,0.06)', padding:'8px 12px', borderRadius:8 }}>
                      {newCustError}
                    </p>
                  )}

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div>
                      <label className="input-label">NAME *</label>
                      <input type="text" value={newCustForm.name}
                        onChange={e => { setNewCustForm({...newCustForm,name:e.target.value}); setNewCustError('') }}
                        placeholder="Full name" className="input-field"
                        style={{ border:'1.5px solid rgba(16,185,129,0.25)' }}
                      />
                    </div>
                    <div>
                      <label className="input-label">PHONE *</label>
                      <input type="text" value={newCustForm.phone}
                        onChange={e => { setNewCustForm({...newCustForm,phone:e.target.value}); setNewCustError('') }}
                        placeholder="10-digit number" className="input-field"
                        style={{ border:'1.5px solid rgba(16,185,129,0.25)' }}
                      />
                    </div>
                    <div>
                      <label className="input-label">ADDRESS</label>
                      <input type="text" value={newCustForm.address}
                        onChange={e => setNewCustForm({...newCustForm,address:e.target.value})}
                        placeholder="Address (optional)" className="input-field"
                        style={{ border:'1.5px solid rgba(16,185,129,0.25)' }}
                      />
                    </div>
                    <div>
                      <label className="input-label">NOTES</label>
                      <input type="text" value={newCustForm.notes}
                        onChange={e => setNewCustForm({...newCustForm,notes:e.target.value})}
                        placeholder="Notes (optional)" className="input-field"
                        style={{ border:'1.5px solid rgba(16,185,129,0.25)' }}
                      />
                    </div>
                  </div>

                  <button onClick={handleCreateNewCustomer} disabled={newCustSaving}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', background:'linear-gradient(135deg,#10B981,#059669)', color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.85rem', cursor:newCustSaving?'not-allowed':'pointer', opacity:newCustSaving?0.7:1 }}>
                    {newCustSaving
                      ? <><div className="spinner" />Creating...</>
                      : <><Check size={15} />Create & Select Customer</>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Order Payment ── */}
        <div className="glass" style={{ padding:24, background:'rgba(16,185,129,0.02)', border:'1.5px solid rgba(16,185,129,0.15)' }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>② Payment</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
            <div>
              <label className="input-label">ORDER COST (₹)</label>
              <NumInput prefix="₹" value={form.unitCost} onChange={val => setForm({...form,unitCost:val})} placeholder="0" style={{ border:'1.5px solid rgba(16,185,129,0.25)' }} />
            </div>
            <div>
              <label className="input-label">AMOUNT SETTLED (₹)</label>
              <NumInput prefix="₹" value={form.amountSettled} onChange={val => setForm({...form,amountSettled:val})} placeholder="0" style={{ border:'1.5px solid rgba(16,185,129,0.25)' }} />
            </div>
            <div>
              <label className="input-label">BALANCE (AUTO)</label>
              <div style={{ padding:'13px 16px', background:balance>0?'rgba(239,68,68,0.06)':form.unitCost>0?'rgba(16,185,129,0.08)':'rgba(255,255,255,0.5)', border:`1.5px solid ${balance>0?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.15)'}`, borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ color:'#9CA3AF' }}>₹</span>
                <span style={{ fontSize:'1.1rem', fontWeight:700, color:balance>0?'#DC2626':form.unitCost>0?'#059669':'#9CA3AF' }}>
                  {form.unitCost>0 ? (balance===0?'0 ✅':balance.toLocaleString('en-IN')) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Order Details ── */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>③ Order Details</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
            <div>
              <label className="input-label">CLOTH TYPE</label>
              <select value={form.clothType} onChange={e => setForm({...form,clothType:e.target.value})}
                style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none' }}>
                {CLOTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">QUANTITY</label>
              <NumInput value={form.quantity} onChange={val => setForm({...form,quantity:Math.max(1,Math.round(val))})} placeholder="1" min={1} />
            </div>
            <div>
              <label className="input-label">DELIVERY DATE</label>
              <input type="date" value={form.deliveryDate}
                onChange={e => { setForm({...form,deliveryDate:e.target.value}); checkDelivery(e.target.value) }}
                className="input-field" min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          {/* Delivery capacity */}
          {deliveryInfo && (
            <div style={{ marginTop:14, padding:'12px 16px', background:deliveryInfo.isOverloaded?'rgba(239,68,68,0.06)':'rgba(16,185,129,0.06)', border:`1.5px solid ${deliveryInfo.isOverloaded?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}`, borderRadius:10 }}>
              <p style={{ fontWeight:600, fontSize:'0.85rem', marginBottom:8, color:deliveryInfo.isOverloaded?'#DC2626':'#059669' }}>
                {deliveryInfo.isOverloaded ? '⚠️ High delivery load. Consider another date.' : '✅ Date available'}
              </p>
              <div style={{ background:'rgba(255,255,255,0.5)', borderRadius:6, height:8, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min(deliveryInfo.percentUsed,100)}%`, background:deliveryInfo.isOverloaded?'#EF4444':'#10B981', borderRadius:6 }} />
              </div>
              <p style={{ fontSize:'0.75rem', color:'#6B7280', marginTop:6 }}>{deliveryInfo.totalPieces} / {deliveryInfo.capacity} pieces booked</p>
            </div>
          )}

          <div style={{ marginTop:14, display:'grid', gap:14 }}>
            <div>
              <label className="input-label">FABRIC NOTES</label>
              <input type="text" value={form.fabricNotes} onChange={e => setForm({...form,fabricNotes:e.target.value})} placeholder="e.g. Pure cotton, pre-washed" className="input-field" />
            </div>
            <div>
              <label className="input-label">SPECIAL INSTRUCTIONS</label>
              <textarea value={form.specialInstructions} onChange={e => setForm({...form,specialInstructions:e.target.value})} placeholder="Any special instructions..." rows={3}
                style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none', resize:'vertical' }} />
            </div>
          </div>
        </div>

        {/* ── Measurements ── */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>④ Measurements <span style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:400 }}>(inches)</span></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
            {MEASUREMENT_FIELDS.map(field => (
              <div key={field}>
                <label className="input-label">{field.toUpperCase()}</label>
                <input type="text" value={form.measurements[field]} onChange={e => setForm({...form,measurements:{...form.measurements,[field]:e.target.value}})}
                  placeholder={field==='custom'?'Any other':'e.g. 36'} className="input-field" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Alteration ── */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>⑤ Alteration</h2>
          <div style={{ display:'flex', gap:12, marginBottom:14 }}>
            {[true,false].map(v => (
              <button key={String(v)} onClick={() => setForm({...form,alteration:{...form.alteration,required:v}})}
                style={{ padding:'10px 24px', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.85rem', cursor:'pointer',
                  border:form.alteration.required===v?'2px solid #4F46E5':'1.5px solid rgba(79,70,229,0.2)',
                  background:form.alteration.required===v?'rgba(79,70,229,0.1)':'rgba(255,255,255,0.7)',
                  color:form.alteration.required===v?'#4F46E5':'#6B7280', transition:'all 0.2s' }}>
                {v?'✅ Yes':'❌ No'}
              </button>
            ))}
          </div>
          {form.alteration.required && (
            <textarea value={form.alteration.notes} onChange={e => setForm({...form,alteration:{...form.alteration,notes:e.target.value}})}
              placeholder="e.g. Tight near waist, reduce sleeve by 1 inch" rows={3}
              style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none', resize:'vertical' }} />
          )}
        </div>

      </div>
    </main>
  )
}