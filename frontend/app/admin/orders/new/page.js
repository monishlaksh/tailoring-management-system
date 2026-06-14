'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Search, UserPlus, X, Check } from 'lucide-react'
import { adminAPI as API } from '../../../../lib/api'
import NumInput from '../../../../components/NumInput'

const MEASUREMENT_FIELDS = ['shoulder','chest','waist','hip','sleeve','length','neck','custom']
function AlterationSection({ alterationOptions, alteration, onChange }) {
  const toggle = (optName) => {
    const current = alteration.selectedOptions || []
    const updated = current.includes(optName)
      ? current.filter(o => o !== optName)
      : [...current, optName]

    // Recalculate extra cost
    const totalExtra = alterationOptions
      .filter(o => updated.includes(o.name))
      .reduce((sum, o) => sum + (o.extraCost||0), 0)

    onChange({
      ...alteration,
      required:        updated.length > 0,
      selectedOptions: updated,
      extraCost:       totalExtra,
    })
  }

  return (
    <div className="glass" style={{ padding:24 }}>
      <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:6, fontSize:'0.95rem' }}>⑥ Alteration</h2>
      <p style={{ fontSize:'0.8rem', color:'#6B7280', marginBottom:16 }}>
        Select all applicable alterations. Extra costs are added automatically.
      </p>

      {/* Options grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10, marginBottom:16 }}>
        {alterationOptions.map(opt => {
          const isSelected = (alteration.selectedOptions||[]).includes(opt.name)
          return (
            <div key={opt._id}
              onClick={() => toggle(opt.name)}
              style={{
                padding:'12px 14px', borderRadius:10, cursor:'pointer',
                border:    isSelected?'2px solid #4F46E5':'1.5px solid rgba(79,70,229,0.15)',
                background: isSelected?'rgba(79,70,229,0.08)':'rgba(255,255,255,0.7)',
                transition:'all 0.2s',
              }}
              onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background='rgba(79,70,229,0.04)' }}
              onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background='rgba(255,255,255,0.7)' }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                <span style={{ fontWeight:600, fontSize:'0.85rem', color:isSelected?'#4F46E5':'#1E1B4B' }}>
                  {isSelected && '✓ '}{opt.name}
                </span>
                {(opt.extraCost||0) > 0 && (
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#059669' }}>
                    +₹{opt.extraCost}
                  </span>
                )}
              </div>
              {opt.description && (
                <p style={{ fontSize:'0.72rem', color:'#9CA3AF', lineHeight:1.4 }}>{opt.description}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Extra cost total */}
      {(alteration.selectedOptions||[]).length > 0 && (
        <div style={{ background:'rgba(79,70,229,0.05)', borderRadius:10, padding:'12px 16px', marginBottom:14 }}>
          <p style={{ fontSize:'0.82rem', color:'#4F46E5', fontWeight:600, marginBottom:4 }}>
            Selected: {(alteration.selectedOptions||[]).join(', ')}
          </p>
          <p style={{ fontSize:'0.82rem', color:'#059669', fontWeight:700 }}>
            Total alteration extra cost: ₹{(alteration.extraCost||0).toLocaleString('en-IN')}
          </p>
        </div>
      )}

      {/* Free notes */}
      <div>
        <label className="input-label">ADDITIONAL NOTES (OPTIONAL)</label>
        <textarea
          value={alteration.notes||''}
          onChange={e => onChange({...alteration, notes:e.target.value})}
          placeholder="Any additional details about the alterations..."
          rows={2}
          style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none', resize:'vertical' }}
        />
      </div>
    </div>
  )
}

export default function NewOrder() {
  const router = useRouter()
  const [customers, setCustomers]       = useState([])
  const [clothTypes, setClothTypes]     = useState([])
  const [custSearch, setCustSearch]     = useState('')
  const [selected, setSelected]         = useState(null)
  const [deliveryInfo, setDeliveryInfo] = useState(null)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [selectedType, setSelectedType] = useState(null)
  const [alterationOptions, setAlterationOptions] = useState([])

  // Cloth type + subtype selection
  const [selectedClothType, setSelectedClothType]   = useState(null)
  const [selectedSubtype, setSelectedSubtype]       = useState(null)

  // New customer inline
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustForm, setNewCustForm]         = useState({ name:'', phone:'', address:'', notes:'' })
  const [newCustSaving, setNewCustSaving]     = useState(false)
  const [newCustError, setNewCustError]       = useState('')

  const [form, setForm] = useState({
    quantity:1, unitCost:0, amountSettled:0,
    fabricNotes:'', specialInstructions:'',
    deliveryDate:'', referenceImage:'',
    measurements:{ shoulder:'',chest:'',waist:'',hip:'',sleeve:'',length:'',neck:'',custom:'' },
    alteration:{ required:false, notes:'' },
  })

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    const [custRes, clothRes, altRes] = await Promise.all([
      API.get('/api/customers'),
      API.get('/api/cloth-types'),
      API.get('/api/alteration-options'),
    ])
    setCustomers(custRes.data.customers)
    setClothTypes(clothRes.data.clothTypes)
    setAlterationOptions(altRes.data.options)
  }
  

  const checkDelivery = async (date) => {
    if (!date) return
    try {
      const res = await API.get(`/api/delivery/date/${date}`)
      setDeliveryInfo(res.data)
    } catch (e) { console.error(e) }
  }

  // When subtype selected, auto-fill unit cost
  const handleSubtypeSelect = (subtype) => {
    setSelectedSubtype(subtype)
    setForm(f => ({ ...f, unitCost: subtype.cost || 0 }))
  }

  const handleSubmit = async () => {
  if (!selected)          { setError('Please select a customer'); return }
  if (!selectedClothType) { setError('Please select a cloth type'); return }
  if (!selectedSubtype)   { setError('Please select a subtype'); return }
  if (!form.deliveryDate) { setError('Please set a delivery date'); return }
  if (!selectedType)    { setError('Please select a type'); return }

  setSaving(true); setError('')
  try {
    const res = await API.post('/api/orders', {
      ...form,
      customerID: selected.customerID,
      clothType: `${selectedClothType.name} - ${selectedType.name} - ${selectedSubtype.name}`,
      unitCost:   form.unitCost,
    })
    // Redirect to allotment page after saving
    router.push(`/admin/allotment/${res.data.order.orderID}`)
  } catch (e) {
    setError(e.response?.data?.message || 'Failed to create order')
  } finally { setSaving(false) }
}

  const handleCreateNewCustomer = async () => {
    if (!newCustForm.name || !newCustForm.phone) { setNewCustError('Name and phone required'); return }
    setNewCustSaving(true); setNewCustError('')
    try {
      const res = await API.post('/api/customers', newCustForm)
      setCustomers(prev => [res.data.customer, ...prev])
      setSelected(res.data.customer)
      setShowNewCustomer(false)
      setNewCustForm({ name:'', phone:'', address:'', notes:'' })
    } catch (e) { setNewCustError(e.response?.data?.message || 'Failed') }
    finally { setNewCustSaving(false) }
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

        {/* ① Customer */}
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
              <div style={{ position:'relative', marginBottom:12 }}>
                <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
                <input type="text" placeholder="Search by name, ID or phone..."
                  value={custSearch} onChange={e => setCustSearch(e.target.value)}
                  style={{ padding:'10px 14px 10px 34px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.875rem', outline:'none', width:'100%', color:'#1E1B4B' }} />
              </div>
              <div style={{ maxHeight:200, overflowY:'auto', display:'grid', gap:6, marginBottom:12 }}>
                <div onClick={() => setShowNewCustomer(!showNewCustomer)}
                  style={{ padding:'11px 16px', background:showNewCustomer?'rgba(16,185,129,0.08)':'rgba(255,255,255,0.6)', border:'1.5px dashed rgba(16,185,129,0.4)', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#10B981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <UserPlus size={16} color="white" />
                  </div>
                  <div>
                    <p style={{ fontWeight:700, fontSize:'0.88rem', color:'#059669' }}>+ Add New Customer</p>
                    <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>Create and select in one step</p>
                  </div>
                </div>
                {filteredCust.map(c => (
                  <div key={c._id} onClick={() => { setSelected(c); setCustSearch(''); setShowNewCustomer(false) }}
                    style={{ padding:'11px 16px', background:'rgba(255,255,255,0.6)', border:'1px solid rgba(79,70,229,0.1)', borderRadius:8, cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(79,70,229,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.6)'}>
                    <p style={{ fontWeight:600, fontSize:'0.88rem', color:'#1E1B4B' }}>{c.name}</p>
                    <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>{c.customerID} · {c.phone}</p>
                  </div>
                ))}
              </div>
              {showNewCustomer && (
                <div style={{ border:'1.5px solid rgba(16,185,129,0.25)', borderRadius:12, padding:'20px', background:'rgba(16,185,129,0.03)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <p style={{ fontWeight:700, color:'#059669', fontSize:'0.9rem' }}>👤 New Customer</p>
                    <button onClick={() => setShowNewCustomer(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={16} /></button>
                  </div>
                  {newCustError && <p style={{ color:'#DC2626', fontSize:'0.82rem', marginBottom:12 }}>{newCustError}</p>}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    {[
                      { key:'name',    label:'NAME *',    placeholder:'Full name'    },
                      { key:'phone',   label:'PHONE *',   placeholder:'Phone number' },
                      { key:'address', label:'ADDRESS',   placeholder:'Address'      },
                      { key:'notes',   label:'NOTES',     placeholder:'Notes'        },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="input-label">{f.label}</label>
                        <input type="text" value={newCustForm[f.key]}
                          onChange={e => { setNewCustForm({...newCustForm,[f.key]:e.target.value}); setNewCustError('') }}
                          placeholder={f.placeholder} className="input-field"
                          style={{ border:'1.5px solid rgba(16,185,129,0.25)' }} />
                      </div>
                    ))}
                  </div>
                  <button onClick={handleCreateNewCustomer} disabled={newCustSaving}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', background:'linear-gradient(135deg,#10B981,#059669)', color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' }}>
                    {newCustSaving ? <><div className="spinner" />Creating...</> : <><Check size={15} />Create & Select</>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ② Cloth Type → Type → Subtype */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>② Cloth Type</h2>

          {/* Step 1 — Cloth Type */}
          <div style={{ marginBottom:16 }}>
            <label className="input-label">STEP 1 — SELECT CLOTH TYPE</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {clothTypes.map(ct => (
                <button key={ct._id}
                  onClick={() => {
                    setSelectedClothType(ct)
                    setSelectedType(null)
                    setSelectedSubtype(null)
                  }}
                  style={{ padding:'8px 16px', borderRadius:999, cursor:'pointer',
                    fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.82rem',
                    border:   selectedClothType?._id===ct._id?'2px solid #4F46E5':'1.5px solid rgba(79,70,229,0.2)',
                    background: selectedClothType?._id===ct._id?'rgba(79,70,229,0.1)':'rgba(255,255,255,0.7)',
                    color:    selectedClothType?._id===ct._id?'#4F46E5':'#6B7280',
                    transition:'all 0.2s' }}>
                  {ct.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Type (Half Sleeve, Backless, etc) */}
          {selectedClothType && (
            <div style={{ marginBottom:16 }}>
              <label className="input-label">
                STEP 2 — SELECT TYPE ({selectedClothType.name})
              </label>
              {(selectedClothType.types||[]).filter(t=>t.isActive).length === 0 ? (
                <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>
                  No types added yet. Go to Cloth Type Management to add types.
                </p>
              ) : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {(selectedClothType.types||[]).filter(t=>t.isActive).map(type => (
                    <button key={type._id}
                      onClick={() => {
                        setSelectedType(type)
                        setSelectedSubtype(null)
                      }}
                      style={{ padding:'8px 16px', borderRadius:999, cursor:'pointer',
                        fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.82rem',
                        border:   selectedType?._id===type._id?'2px solid #D97706':'1.5px solid rgba(245,158,11,0.25)',
                        background: selectedType?._id===type._id?'rgba(245,158,11,0.1)':'rgba(255,255,255,0.7)',
                        color:    selectedType?._id===type._id?'#D97706':'#6B7280',
                        transition:'all 0.2s' }}>
                      {type.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

  {/* Step 3 — Subtype (Normal, Lining, etc) */}
  {selectedClothType && selectedType && (
    <div style={{ marginBottom:16 }}>
      <label className="input-label">
        STEP 3 — SELECT SUBTYPE ({selectedType.name})
      </label>
      {(selectedType.subtypes||[]).filter(s=>s.isActive).length === 0 ? (
        <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>
          No subtypes added yet.
        </p>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10 }}>
          {(selectedType.subtypes||[]).filter(s=>s.isActive).map(sub => (
            <div key={sub._id}
              onClick={() => {
                setSelectedSubtype(sub)
                setForm(f => ({ ...f, unitCost: sub.cost || 0 }))
              }}
              style={{ padding:'14px 16px', borderRadius:12, cursor:'pointer',
                border:   selectedSubtype?._id===sub._id?'2px solid #10B981':'1.5px solid rgba(79,70,229,0.15)',
                background: selectedSubtype?._id===sub._id?'rgba(16,185,129,0.08)':'rgba(255,255,255,0.7)',
                transition:'all 0.2s' }}>
              <p style={{ fontWeight:700, fontSize:'0.9rem',
                color:selectedSubtype?._id===sub._id?'#059669':'#1E1B4B' }}>
                {sub.name}
              </p>
              <p style={{ fontWeight:700, fontSize:'0.88rem', color:'#059669', marginTop:4 }}>
                ₹{(sub.cost||0).toLocaleString('en-IN')}
              </p>
              {selectedSubtype?._id===sub._id && (
                <p style={{ fontSize:'0.7rem', color:'#059669', marginTop:2 }}>✓ Selected</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )}

  {/* Summary */}
  {selectedClothType && selectedType && selectedSubtype && (
    <div style={{ padding:'12px 16px', background:'rgba(79,70,229,0.06)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10 }}>
      <p style={{ fontSize:'0.82rem', color:'#4F46E5', fontWeight:600 }}>
        ✓ {selectedClothType.name} → {selectedType.name} → {selectedSubtype.name}
        <span style={{ marginLeft:8, color:'#059669' }}>
          ₹{(selectedSubtype.cost||0).toLocaleString('en-IN')}
        </span>
      </p>
    </div>
  )}
</div>

        {/* ③ Payment */}
        <div className="glass" style={{ padding:24, background:'rgba(16,185,129,0.02)', border:'1.5px solid rgba(16,185,129,0.15)' }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>③ Payment</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
            <div>
              <label className="input-label">ORDER COST (₹)</label>
              <NumInput prefix="₹" value={form.unitCost} onChange={val => setForm({...form,unitCost:val})} placeholder="0" style={{ border:'1.5px solid rgba(16,185,129,0.25)' }} />
              <p style={{ fontSize:'0.7rem', color:'#9CA3AF', marginTop:4 }}>Auto-filled from subtype cost</p>
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

        {/* ④ Order Details */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>④ Order Details</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
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

          {deliveryInfo && (
            <div style={{ marginTop:14, padding:'12px 16px', background:deliveryInfo.isOverloaded?'rgba(239,68,68,0.06)':'rgba(16,185,129,0.06)', border:`1.5px solid ${deliveryInfo.isOverloaded?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}`, borderRadius:10 }}>
              <p style={{ fontWeight:600, fontSize:'0.85rem', marginBottom:6, color:deliveryInfo.isOverloaded?'#DC2626':'#059669' }}>
                {deliveryInfo.isOverloaded ? '⚠️ High delivery load.' : '✅ Date available'}
              </p>
              <div style={{ background:'rgba(255,255,255,0.5)', borderRadius:6, height:8, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min(deliveryInfo.percentUsed,100)}%`, background:deliveryInfo.isOverloaded?'#EF4444':'#10B981', borderRadius:6 }} />
              </div>
              <p style={{ fontSize:'0.75rem', color:'#6B7280', marginTop:6 }}>{deliveryInfo.totalPieces}/{deliveryInfo.capacity} pieces</p>
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

        {/* ⑤ Measurements */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>⑤ Measurements <span style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:400 }}>(inches)</span></h2>
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

        {/* ⑥ Alteration */}
        <AlterationSection
          alterationOptions={alterationOptions}
          alteration={form.alteration}
          onChange={val => setForm({...form, alteration:val})}
        />

      </div>
    </main>
  )
}