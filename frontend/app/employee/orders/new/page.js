'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Search, UserPlus, X, Check } from 'lucide-react'
import { employeeAPI as API } from '../../../../lib/api'
import VoiceRecorder from '../../../../components/VoiceRecorder'

const MEASUREMENT_LABELS = {
  shoulder:'Shoulder', chest:'Chest', waist:'Waist', hip:'Hip',
  sleeve:'Sleeve', length:'Length', neck:'Neck', custom:'Custom',
}

function AlterationSection({ alterationOptions, alteration, onChange, loading }) {
  const toggle = (optName, extraCost) => {
    const current = alteration.selectedOptions || []
    const updated = current.includes(optName)
      ? current.filter(o => o !== optName)
      : [...current, optName]
    const totalExtra = alterationOptions
      .filter(o => updated.includes(o.name))
      .reduce((s,o) => s+(o.extraCost||0), 0)
    onChange({ ...alteration, required:updated.length>0, selectedOptions:updated, extraCost:totalExtra })
  }

  return (
    <div className="glass" style={{ padding:24 }}>
      <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:6, fontSize:'0.95rem' }}>
        ⑥ Alteration
      </h2>
      {loading ? (
        <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>Loading...</p>
      ) : alterationOptions.length === 0 ? (
        <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>No alteration options for this cloth type.</p>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:10, marginBottom:14 }}>
          {alterationOptions.map(opt => {
            const isSel = (alteration.selectedOptions||[]).includes(opt.name)
            return (
              <div key={opt._id} onClick={() => toggle(opt.name, opt.extraCost||0)}
                style={{ padding:'11px 13px', borderRadius:10, cursor:'pointer',
                  border: isSel ? '2px solid #4F46E5' : '1.5px solid rgba(79,70,229,0.15)',
                  background: isSel ? 'rgba(79,70,229,0.08)' : 'rgba(255,255,255,0.7)',
                  transition:'all 0.2s' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontWeight:600, fontSize:'0.85rem', color:isSel?'#4F46E5':'#1E1B4B' }}>
                    {isSel && '✓ '}{opt.name}
                  </span>
                  {(opt.extraCost||0) > 0 && (
                    <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#059669' }}>+₹{opt.extraCost}</span>
                  )}
                </div>
                {opt.description && <p style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>{opt.description}</p>}
              </div>
            )
          })}
        </div>
      )}
      <div>
        <label className="input-label">ADDITIONAL NOTES (OPTIONAL)</label>
        <textarea value={alteration.notes||''} onChange={e=>onChange({...alteration,notes:e.target.value})}
          placeholder="Any additional alteration details..." rows={2}
          style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.88rem', color:'#1E1B4B', outline:'none', resize:'vertical' }} />
      </div>
    </div>
  )
}

export default function EmployeeNewOrder() {
  const router = useRouter()

  const [customers, setCustomers]       = useState([])
  const [clothTypes, setClothTypes]     = useState([])
  const [selected, setSelected]         = useState(null)
  const [custSearch, setCustSearch]     = useState('')
  const [showNewCust, setShowNewCust]   = useState(false)
  const [newCustForm, setNewCustForm]   = useState({ name:'', phone:'', address:'', notes:'' })
  const [newCustSaving, setNewCustSaving] = useState(false)
  const [newCustError, setNewCustError]   = useState('')

  const [selectedClothType, setSelectedClothType] = useState(null)
  const [selectedType, setSelectedType]     = useState(null)
  const [selectedSubtype, setSelectedSubtype] = useState(null)
  const [alterationOptions, setAlterationOptions] = useState([])
  const [loadingAlterations, setLoadingAlterations] = useState(false)

  const [voiceNote, setVoiceNote] = useState({ data:'', mimeType:'audio/webm', duration:0 })
  const [savedMeasurements, setSavedMeasurements] = useState(null)
  const [loadingPrev, setLoadingPrev] = useState(false)
  const [measError, setMeasError]     = useState('')

  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [loadingPage, setLoadingPage] = useState(true)

  const [form, setForm] = useState({
    quantity: 1, unitCost: 0, amountSettled: 0,
    fabricNotes:'', specialInstructions:'', deliveryDate:'',
    measurements:{},
    alteration:{ required:false, selectedOptions:[], notes:'', extraCost:0 },
  })

  useEffect(() => {
    const token = localStorage.getItem('employeeToken')
    const user  = localStorage.getItem('employeeUser')
    if (!token) { router.push('/employee/login'); return }
    if (user) {
      const emp = JSON.parse(user)
      const role = emp.accessRole || 'employee'
      if (role !== 'manager' && role !== 'receptionist' && !emp.hasFullAccess) {
        router.push('/employee/dashboard'); return
      }
    }
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [custRes, clothRes] = await Promise.all([
        API.get('/api/customers'),
        API.get('/api/cloth-types'),
      ])
      setCustomers(custRes.data.customers || [])
      setClothTypes(clothRes.data.clothTypes || [])
    } catch (e) {
      console.error(e)
      if (e.response?.status === 401) router.push('/employee/login')
    } finally {
      setLoadingPage(false)
    }
  }

  useEffect(() => {
    if (!selectedClothType) { setAlterationOptions([]); return }
    const fetch = async () => {
      setLoadingAlterations(true)
      try {
        const res = await API.get(`/api/alteration-options?clothType=${encodeURIComponent(selectedClothType.name)}`)
        setAlterationOptions(res.data.options || [])
      } catch (e) { console.error(e) }
      finally { setLoadingAlterations(false) }
    }
    fetch()
    setForm(f => ({ ...f, alteration:{ required:false, selectedOptions:[], notes:'', extraCost:0 } }))
  }, [selectedClothType])

  const handleCreateCustomer = async () => {
    if (!newCustForm.name || !newCustForm.phone) { setNewCustError('Name and phone required'); return }
    setNewCustSaving(true); setNewCustError('')
    try {
      const res = await API.post('/api/customers', newCustForm)
      setCustomers(p => [res.data.customer, ...p])
      setSelected(res.data.customer)
      setShowNewCust(false)
      setNewCustForm({ name:'', phone:'', address:'', notes:'' })
    } catch (e) { setNewCustError(e.response?.data?.message || 'Failed') }
    finally { setNewCustSaving(false) }
  }

  const handleSubmit = async () => {
    if (!selected)          { setError('Select a customer'); return }
    if (!selectedClothType) { setError('Select a cloth type'); return }
    if (!selectedType)      { setError('Select a type'); return }
    if (!selectedSubtype)   { setError('Select a subtype'); return }
    if (!form.deliveryDate) { setError('Set a delivery date'); return }
    setSaving(true); setError('')
    try {
      const clothTypeName = `${selectedClothType.name} - ${selectedType.name} - ${selectedSubtype.name}`
      const res = await API.post('/api/orders', {
        ...form,
        customerID: selected.customerID,
        clothType:  clothTypeName,
        voiceNote,
      })
      router.push(`/employee/allotment/${res.data.order.orderID}`)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create order')
    } finally { setSaving(false) }
  }

  const filteredCust = customers.filter(c =>
    c.name?.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.customerID?.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone?.includes(custSearch)
  )

  if (loadingPage) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(79,70,229,0.2)', borderTopColor:'#4F46E5', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:900, margin:'0 auto' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.back()}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20}/>
          </button>
          <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Create New Order</h1>
        </div>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary"
          style={{ padding:'9px 20px', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:6 }}>
          {saving ? <><div className="spinner"/>Saving...</> : <><Save size={15}/>Save Order</>}
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
              <button onClick={() => { setSelected(null); setSavedMeasurements(null); setForm(f=>({...f,measurements:{}})) }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'1.1rem' }}>✕</button>
            </div>
          ) : (
            <>
              <div style={{ position:'relative', marginBottom:10 }}>
                <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
                <input type="text" placeholder="Search by name, ID or phone..." value={custSearch}
                  onChange={e=>setCustSearch(e.target.value)}
                  style={{ padding:'10px 14px 10px 34px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.875rem', outline:'none', width:'100%', color:'#1E1B4B' }} />
              </div>
              <div style={{ maxHeight:200, overflowY:'auto', display:'grid', gap:6, marginBottom:10 }}>
                <div onClick={() => setShowNewCust(!showNewCust)}
                  style={{ padding:'10px 14px', background:'rgba(255,255,255,0.6)', border:'1.5px dashed rgba(16,185,129,0.4)', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#10B981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <UserPlus size={14} color="white"/>
                  </div>
                  <p style={{ fontWeight:700, fontSize:'0.88rem', color:'#059669' }}>+ Add New Customer</p>
                </div>
                {filteredCust.map(c => (
                  <div key={c._id} onClick={() => { setSelected(c); setCustSearch(''); setSavedMeasurements(null); setForm(f=>({...f,measurements:{}})) }}
                    style={{ padding:'10px 14px', background:'rgba(255,255,255,0.6)', border:'1px solid rgba(79,70,229,0.1)', borderRadius:8, cursor:'pointer' }}>
                    <p style={{ fontWeight:600, fontSize:'0.88rem', color:'#1E1B4B' }}>{c.name}</p>
                    <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>{c.customerID} · {c.phone}</p>
                  </div>
                ))}
              </div>
              {showNewCust && (
                <div style={{ border:'1.5px solid rgba(16,185,129,0.25)', borderRadius:12, padding:'18px', background:'rgba(16,185,129,0.03)' }}>
                  {newCustError && <p style={{ color:'#DC2626', fontSize:'0.82rem', marginBottom:10 }}>{newCustError}</p>}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                    {[{k:'name',l:'NAME *',p:'Full name'},{k:'phone',l:'PHONE *',p:'Phone'},{k:'address',l:'ADDRESS',p:'Address'},{k:'notes',l:'NOTES',p:'Notes'}].map(f=>(
                      <div key={f.k}>
                        <label className="input-label">{f.l}</label>
                        <input value={newCustForm[f.k]} onChange={e=>setNewCustForm({...newCustForm,[f.k]:e.target.value})}
                          placeholder={f.p} className="input-field" style={{ border:'1.5px solid rgba(16,185,129,0.25)' }}/>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleCreateCustomer} disabled={newCustSaving}
                    style={{ padding:'9px 18px', background:'linear-gradient(135deg,#10B981,#059669)', color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.85rem', cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                    {newCustSaving ? '...' : <><Check size={14}/>Create & Select</>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ② Cloth Type */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>② Cloth Type & Alteration</h2>
          <div style={{ marginBottom:14 }}>
            <label className="input-label">STEP 1 — CLOTH TYPE</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {clothTypes.filter(ct=>ct.isActive).map(ct=>(
                <button key={ct._id} onClick={()=>{ setSelectedClothType(ct); setSelectedType(null); setSelectedSubtype(null); setForm(f=>({...f,unitCost:0,alteration:{required:false,selectedOptions:[],notes:'',extraCost:0}})) }}
                  style={{ padding:'8px 16px', borderRadius:999, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.82rem', border:selectedClothType?._id===ct._id?'2px solid #4F46E5':'1.5px solid rgba(79,70,229,0.2)', background:selectedClothType?._id===ct._id?'rgba(79,70,229,0.1)':'rgba(255,255,255,0.7)', color:selectedClothType?._id===ct._id?'#4F46E5':'#6B7280' }}>
                  {ct.name}
                </button>
              ))}
            </div>
          </div>
          {selectedClothType && (
            <div style={{ marginBottom:14 }}>
              <label className="input-label">STEP 2 — TYPE</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {(selectedClothType.types||[]).filter(t=>t.isActive).map(type=>(
                  <button key={type._id} onClick={()=>{ setSelectedType(type); setSelectedSubtype(null); setForm(f=>({...f,unitCost:0})) }}
                    style={{ padding:'8px 16px', borderRadius:999, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.82rem', border:selectedType?._id===type._id?'2px solid #D97706':'1.5px solid rgba(245,158,11,0.25)', background:selectedType?._id===type._id?'rgba(245,158,11,0.1)':'rgba(255,255,255,0.7)', color:selectedType?._id===type._id?'#D97706':'#6B7280' }}>
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedClothType && selectedType && (
            <div style={{ marginBottom:14 }}>
              <label className="input-label">STEP 3 — SUBTYPE</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
                {(selectedType.subtypes||[]).filter(s=>s.isActive).map(sub=>(
                  <div key={sub._id} onClick={()=>{ setSelectedSubtype(sub); setForm(f=>({...f,unitCost:sub.cost||0})) }}
                    style={{ padding:'12px 14px', borderRadius:12, cursor:'pointer', border:selectedSubtype?._id===sub._id?'2px solid #10B981':'1.5px solid rgba(79,70,229,0.15)', background:selectedSubtype?._id===sub._id?'rgba(16,185,129,0.08)':'rgba(255,255,255,0.7)' }}>
                    <p style={{ fontWeight:700, fontSize:'0.9rem', color:selectedSubtype?._id===sub._id?'#059669':'#1E1B4B' }}>{sub.name}</p>
                    <p style={{ fontWeight:700, fontSize:'0.88rem', color:'#059669', marginTop:4 }}>₹{(sub.cost||0).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedClothType && selectedType && selectedSubtype && (
            <>
              <div style={{ padding:'10px 14px', background:'rgba(79,70,229,0.06)', border:'1.5px solid rgba(79,70,229,0.15)', borderRadius:10, marginBottom:14 }}>
                <p style={{ fontSize:'0.82rem', color:'#4F46E5', fontWeight:600 }}>
                  ✓ {selectedClothType.name} → {selectedType.name} → {selectedSubtype.name}
                  <span style={{ marginLeft:8, color:'#059669' }}>₹{(selectedSubtype.cost||0).toLocaleString('en-IN')}</span>
                </p>
              </div>
              {/* STEP 4 — Alteration */}
              <div style={{ height:1, background:'rgba(79,70,229,0.08)', margin:'4px 0 16px' }}/>
              <label className="input-label">STEP 4 — ALTERATION</label>
              <AlterationSection alterationOptions={alterationOptions} alteration={form.alteration}
                onChange={val=>setForm({...form,alteration:val})} loading={loadingAlterations}/>

              {/* STEP 5 — Delivery Date */}
              <div style={{ height:1, background:'rgba(79,70,229,0.08)', margin:'16px 0' }}/>
              <label className="input-label">STEP 5 — DELIVERY DATE *</label>
              <input type="date" value={form.deliveryDate}
                onChange={e=>setForm({...form,deliveryDate:e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.8)', border:form.deliveryDate?'1.5px solid rgba(16,185,129,0.4)':'1.5px solid rgba(239,68,68,0.3)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none' }}/>
              {!form.deliveryDate && <p style={{ fontSize:'0.72rem', color:'#DC2626', marginTop:4 }}>⚠️ Required</p>}
            </>
          )}
        </div>

        {/* ③ Order Details */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>③ Order Details</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14 }}>
            <div>
              <label className="input-label">QUANTITY *</label>
              <input type="number" min="1" value={form.quantity}
                onChange={e=>setForm({...form,quantity:Math.max(1,parseInt(e.target.value)||1)})}
                style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'1rem', color:'#1E1B4B', outline:'none', fontWeight:600 }}/>
            </div>
            <div>
              <label className="input-label">FABRIC NOTES</label>
              <input type="text" value={form.fabricNotes} onChange={e=>setForm({...form,fabricNotes:e.target.value})}
                placeholder="e.g. Pure cotton" className="input-field"/>
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <label className="input-label">SPECIAL INSTRUCTIONS</label>
            <textarea value={form.specialInstructions} onChange={e=>setForm({...form,specialInstructions:e.target.value})}
              placeholder="Any special instructions..." rows={2}
              style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none', resize:'vertical' }}/>
          </div>
        </div>

        {/* ④ Measurements */}
        <div className="glass" style={{ padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
            <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.95rem' }}>
              ④ Measurements <span style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:400 }}>(inches)</span>
            </h2>
            {selected && (
              <button type="button" disabled={loadingPrev}
                onClick={async () => {
                  if (savedMeasurements) { setForm(f=>({...f,measurements:{...f.measurements,...savedMeasurements}})); return }
                  setLoadingPrev(true); setMeasError('')
                  try {
                    const res = await API.get(`/api/customers/${selected.customerID}/measurements`)
                    if (res.data.hasMeasurements) {
                      setSavedMeasurements(res.data.measurements)
                      setForm(f=>({...f,measurements:{...f.measurements,...res.data.measurements}}))
                    } else { setMeasError('No previous measurements found.') }
                  } catch(e) { setMeasError('Failed to fetch.') }
                  finally { setLoadingPrev(false) }
                }}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', background:savedMeasurements?'rgba(16,185,129,0.1)':'rgba(79,70,229,0.08)', border:`1.5px solid ${savedMeasurements?'rgba(16,185,129,0.3)':'rgba(79,70,229,0.2)'}`, borderRadius:9, cursor:loadingPrev?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.78rem', color:savedMeasurements?'#059669':'#4F46E5', opacity:loadingPrev?0.7:1 }}>
                {loadingPrev ? '⏳ Loading...' : savedMeasurements ? '✓ Previous Applied' : '📐 Use Previous Measurement'}
              </button>
            )}
          </div>
          {measError && <p style={{ fontSize:'0.78rem', color:'#DC2626', marginBottom:10 }}>⚠️ {measError}</p>}
          {!selectedClothType ? (
            <p style={{ color:'#9CA3AF', fontSize:'0.85rem', padding:'16px', background:'rgba(79,70,229,0.03)', borderRadius:10, textAlign:'center' }}>Select a cloth type first</p>
          ) : !selectedClothType.measurements?.length ? (
            <p style={{ color:'#D97706', fontSize:'0.85rem' }}>⚠️ No measurement fields for {selectedClothType.name}.</p>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
              {selectedClothType.measurements.map(field=>(
                <div key={field.key}>
                  <label className="input-label">{field.label.toUpperCase()}{field.required&&<span style={{color:'#DC2626',marginLeft:2}}>*</span>}</label>
                  {field.labelTa && <p style={{ fontSize:'0.68rem', color:'#9CA3AF', marginBottom:4, marginTop:-2 }}>{field.labelTa}</p>}
                  <input type="text" value={form.measurements[field.key]||''} onChange={e=>setForm({...form,measurements:{...form.measurements,[field.key]:e.target.value}})}
                    placeholder="e.g. 36" className="input-field"/>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ⑤ Voice Note */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:6, fontSize:'0.95rem' }}>
            ⑤ Voice Note <span style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:400 }}>(visible to employees)</span>
          </h2>
          <VoiceRecorder value={voiceNote} onChange={setVoiceNote}/>
        </div>

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}