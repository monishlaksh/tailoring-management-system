'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Search, UserPlus, X, Check } from 'lucide-react'
import { adminAPI as API } from '../../../../lib/api'
import NumInput from '../../../../components/NumInput'

const MEASUREMENT_FIELDS = ['shoulder','chest','waist','hip','sleeve','length','neck','custom']
const MEASUREMENT_LABELS = {
  shoulder:'Shoulder', chest:'Chest', waist:'Waist', hip:'Hip',
  sleeve:'Sleeve', length:'Length', neck:'Neck', custom:'Custom',
}

// ── Alteration Section Component ──────────────────────────────
function AlterationSection({ alterationOptions, alteration, onChange, loading }) {
  const toggle = (optName, extraCost) => {
    const current = alteration.selectedOptions || []
    const updated = current.includes(optName)
      ? current.filter(o => o !== optName)
      : [...current, optName]
    const totalExtra = updated.includes(optName)
      ? (alteration.extraCost||0) + extraCost
      : (alteration.extraCost||0) - extraCost
    onChange({
      ...alteration,
      required:        updated.length > 0,
      selectedOptions: updated,
      extraCost:       Math.max(totalExtra, 0),
    })
  }

  return (
    <div className="glass" style={{ padding:24 }}>
      <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:6, fontSize:'0.95rem' }}>
        ⑥ Alteration
      </h2>
      <p style={{ fontSize:'0.8rem', color:'#6B7280', marginBottom:16 }}>
        Select applicable alterations for this cloth type.
      </p>

      {loading ? (
        <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>
          Loading alteration options...
        </p>
      ) : alterationOptions.length === 0 ? (
        <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>
          No alteration options available for this cloth type.
          Add them in the Alterations management page.
        </p>
      ) : (
        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',
          gap:10, marginBottom:16 }}>
          {alterationOptions.map(opt => {
            const isSelected = (alteration.selectedOptions||[]).includes(opt.name)
            return (
              <div key={opt._id}
                onClick={() => toggle(opt.name, opt.extraCost||0)}
                style={{ padding:'12px 14px', borderRadius:10, cursor:'pointer',
                  border:    isSelected?'2px solid #4F46E5':'1.5px solid rgba(79,70,229,0.15)',
                  background:isSelected?'rgba(79,70,229,0.08)':'rgba(255,255,255,0.7)',
                  transition:'all 0.2s' }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'flex-start', marginBottom:4 }}>
                  <span style={{ fontWeight:600, fontSize:'0.85rem',
                    color:isSelected?'#4F46E5':'#1E1B4B' }}>
                    {isSelected && '✓ '}{opt.name}
                  </span>
                  {(opt.extraCost||0) > 0 && (
                    <span style={{ fontSize:'0.72rem', fontWeight:700,
                      color:'#059669' }}>
                      +₹{opt.extraCost}
                    </span>
                  )}
                </div>
                {opt.description && (
                  <p style={{ fontSize:'0.72rem', color:'#9CA3AF',
                    lineHeight:1.4 }}>
                    {opt.description}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {(alteration.selectedOptions||[]).length > 0 && (
        <div style={{ background:'rgba(79,70,229,0.05)', borderRadius:10,
          padding:'12px 16px', marginBottom:14 }}>
          <p style={{ fontSize:'0.82rem', color:'#4F46E5', fontWeight:600,
            marginBottom:4 }}>
            Selected: {(alteration.selectedOptions||[]).join(', ')}
          </p>
          {(alteration.extraCost||0) > 0 && (
            <p style={{ fontSize:'0.82rem', color:'#059669', fontWeight:700 }}>
              Extra cost: ₹{(alteration.extraCost||0).toLocaleString('en-IN')}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="input-label">ADDITIONAL NOTES (OPTIONAL)</label>
        <textarea
          value={alteration.notes||''}
          onChange={e => onChange({ ...alteration, notes:e.target.value })}
          placeholder="Any additional details about the alterations..."
          rows={2}
          style={{ width:'100%', padding:'12px 16px',
            background:'rgba(255,255,255,0.8)',
            border:'1.5px solid rgba(79,70,229,0.2)',
            borderRadius:10, fontFamily:'Poppins,sans-serif',
            fontSize:'0.9rem', color:'#1E1B4B',
            outline:'none', resize:'vertical' }}
        />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function NewOrder() {
  const router = useRouter()

  // Customer state
  const [customers, setCustomers]         = useState([])
  const [custSearch, setCustSearch]       = useState('')
  const [selected, setSelected]           = useState(null)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustForm, setNewCustForm]     = useState({ name:'', phone:'', address:'', notes:'' })
  const [newCustSaving, setNewCustSaving] = useState(false)
  const [newCustError, setNewCustError]   = useState('')

  // Cloth type state (3 levels)
  const [clothTypes, setClothTypes]         = useState([])
  const [selectedClothType, setSelectedClothType] = useState(null)
  const [selectedType, setSelectedType]     = useState(null)
  const [selectedSubtype, setSelectedSubtype] = useState(null)

  // Alteration state
  const [alterationOptions, setAlterationOptions] = useState([])
  const [loadingAlterations, setLoadingAlterations] = useState(false)

  // Delivery
  const [deliveryInfo, setDeliveryInfo] = useState(null)

  // Page state
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [loadingPage, setLoadingPage] = useState(true)

  const [form, setForm] = useState({
    quantity:      1,
    unitCost:      0,
    amountSettled: 0,
    fabricNotes:   '',
    specialInstructions: '',
    deliveryDate:  '',
    measurements:  {
      shoulder:'', chest:'', waist:'',
      hip:'', sleeve:'', length:'', neck:'', custom:'',
    },
    alteration: {
      required:        false,
      selectedOptions: [],
      notes:           '',
      extraCost:       0,
    },
  })

  // ── Load initial data ───────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) { router.push('/admin/login'); return }
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
  try {
    const [custRes, clothRes] = await Promise.all([
      API.get('/api/customers'),
      API.get('/api/cloth-types'), // already returns measurements
    ])
    setCustomers(custRes.data.customers || [])
    setClothTypes(clothRes.data.clothTypes || [])
  } catch (e) {
    console.error('Failed to load:', e)
    if (e.response?.status === 401) {
      localStorage.removeItem('adminToken')
      router.push('/admin/login')
    }
  } finally {
    setLoadingPage(false)
  }
}

  // ── Load alteration options when cloth type changes ─────────
  useEffect(() => {
    if (!selectedClothType) {
      setAlterationOptions([])
      return
    }
    const fetchAlterations = async () => {
      setLoadingAlterations(true)
      try {
        const res = await API.get(
          `/api/alteration-options?clothType=${encodeURIComponent(selectedClothType.name)}`
        )
        setAlterationOptions(res.data.options || [])
      } catch (e) {
        console.error('Failed to load alterations:', e)
        setAlterationOptions([])
      } finally {
        setLoadingAlterations(false)
      }
    }
    fetchAlterations()
    // Reset alteration selections when cloth type changes
    setForm(f => ({
      ...f,
      alteration: { required:false, selectedOptions:[], notes:'', extraCost:0 },
    }))
  }, [selectedClothType])

  // ── Delivery date check ─────────────────────────────────────
  const checkDelivery = async (date) => {
    if (!date) return
    try {
      const res = await API.get(`/api/delivery/date/${date}`)
      setDeliveryInfo(res.data)
    } catch (e) { console.error(e) }
  }

  // ── Create new customer inline ──────────────────────────────
  const handleCreateNewCustomer = async () => {
    if (!newCustForm.name || !newCustForm.phone) {
      setNewCustError('Name and phone required')
      return
    }
    setNewCustSaving(true); setNewCustError('')
    try {
      const res = await API.post('/api/customers', newCustForm)
      setCustomers(prev => [res.data.customer, ...prev])
      setSelected(res.data.customer)
      setShowNewCustomer(false)
      setNewCustForm({ name:'', phone:'', address:'', notes:'' })
    } catch (e) {
      setNewCustError(e.response?.data?.message || 'Failed to create customer')
    } finally { setNewCustSaving(false) }
  }

  // ── Submit order ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selected)         { setError('Please select a customer'); return }
    if (!selectedClothType){ setError('Please select a cloth type'); return }
    if (!selectedType)     { setError('Please select a type'); return }
    if (!selectedSubtype)  { setError('Please select a subtype'); return }
    if (!form.deliveryDate){ setError('Please set a delivery date'); return }

    setSaving(true); setError('')
    try {
      const clothTypeName = `${selectedClothType.name} - ${selectedType.name} - ${selectedSubtype.name}`
      const res = await API.post('/api/orders', {
        ...form,
        customerID: selected.customerID,
        clothType:  clothTypeName,
        unitCost:   form.unitCost,
      })
      router.push(`/admin/allotment/${res.data.order.orderID}`)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create order')
      if (e.response?.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
      }
    } finally { setSaving(false) }
  }

  const filteredCust = customers.filter(c =>
    c.name?.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.customerID?.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone?.includes(custSearch)
  )

  const balance = Math.max((form.unitCost||0) - (form.amountSettled||0), 0)

  if (loadingPage) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center' }}>
      <div style={{ width:36, height:36,
        border:'3px solid rgba(79,70,229,0.2)',
        borderTopColor:'#4F46E5', borderRadius:'50%',
        animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', padding:'24px',
      maxWidth:900, margin:'0 auto' }}>

      {/* Top Bar */}
      <div className="glass" style={{ display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'14px 24px',
        marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.back()}
            style={{ background:'none', border:'none',
              cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>
            Create New Order
          </h1>
        </div>
        <button onClick={handleSubmit} disabled={saving}
          className="btn-primary"
          style={{ padding:'9px 20px', fontSize:'0.85rem',
            display:'flex', alignItems:'center', gap:6 }}>
          {saving
            ? <><div className="spinner"/>Saving...</>
            : <><Save size={15}/>Save Order</>}
        </button>
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)',
          border:'1.5px solid rgba(239,68,68,0.2)',
          borderRadius:10, padding:'12px 16px', marginBottom:20,
          color:'#DC2626', fontSize:'0.87rem' }}>
          {error}
        </div>
      )}

      <div style={{ display:'grid', gap:20 }}>

        {/* ① Customer */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B',
            marginBottom:16, fontSize:'0.95rem' }}>
            ① Select Customer
          </h2>

          {selected ? (
            <div style={{ display:'flex', alignItems:'center',
              justifyContent:'space-between',
              background:'rgba(79,70,229,0.06)',
              border:'1.5px solid rgba(79,70,229,0.2)',
              borderRadius:10, padding:'14px 18px' }}>
              <div>
                <p style={{ fontWeight:700, color:'#1E1B4B' }}>
                  {selected.name}
                </p>
                <p style={{ fontSize:'0.8rem', color:'#4F46E5', fontWeight:600 }}>
                  {selected.customerID} · {selected.phone}
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background:'none', border:'none',
                  cursor:'pointer', color:'#9CA3AF', fontSize:'1.1rem' }}>
                ✕
              </button>
            </div>
          ) : (
            <>
              <div style={{ position:'relative', marginBottom:12 }}>
                <Search size={15} style={{ position:'absolute', left:12,
                  top:'50%', transform:'translateY(-50%)',
                  color:'#9CA3AF' }} />
                <input type="text"
                  placeholder="Search by name, ID or phone..."
                  value={custSearch}
                  onChange={e => setCustSearch(e.target.value)}
                  style={{ padding:'10px 14px 10px 34px',
                    background:'rgba(255,255,255,0.8)',
                    border:'1.5px solid rgba(79,70,229,0.2)',
                    borderRadius:10, fontFamily:'Poppins,sans-serif',
                    fontSize:'0.875rem', outline:'none',
                    width:'100%', color:'#1E1B4B' }} />
              </div>

              <div style={{ maxHeight:220, overflowY:'auto',
                display:'grid', gap:6, marginBottom:12 }}>

                {/* Add New Customer option */}
                <div onClick={() => setShowNewCustomer(!showNewCustomer)}
                  style={{ padding:'11px 16px',
                    background:showNewCustomer?'rgba(16,185,129,0.08)':'rgba(255,255,255,0.6)',
                    border:'1.5px dashed rgba(16,185,129,0.4)',
                    borderRadius:8, cursor:'pointer',
                    display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%',
                    background:'linear-gradient(135deg,#10B981,#059669)',
                    display:'flex', alignItems:'center',
                    justifyContent:'center', flexShrink:0 }}>
                    <UserPlus size={16} color="white" />
                  </div>
                  <div>
                    <p style={{ fontWeight:700, fontSize:'0.88rem',
                      color:'#059669' }}>+ Add New Customer</p>
                    <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                      Create and select in one step
                    </p>
                  </div>
                </div>

                {filteredCust.map(c => (
                  <div key={c._id}
                    onClick={() => {
                      setSelected(c)
                      setCustSearch('')
                      setShowNewCustomer(false)
                    }}
                    style={{ padding:'11px 16px',
                      background:'rgba(255,255,255,0.6)',
                      border:'1px solid rgba(79,70,229,0.1)',
                      borderRadius:8, cursor:'pointer',
                      transition:'all 0.2s' }}
                    onMouseEnter={e =>
                      e.currentTarget.style.background='rgba(79,70,229,0.06)'}
                    onMouseLeave={e =>
                      e.currentTarget.style.background='rgba(255,255,255,0.6)'}>
                    <p style={{ fontWeight:600, fontSize:'0.88rem',
                      color:'#1E1B4B' }}>{c.name}</p>
                    <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>
                      {c.customerID} · {c.phone}
                    </p>
                  </div>
                ))}

                {filteredCust.length === 0 && custSearch && (
                  <p style={{ textAlign:'center', color:'#9CA3AF',
                    fontSize:'0.85rem', padding:'12px 0' }}>
                    No customers found. Use "+ Add New Customer" above.
                  </p>
                )}
              </div>

              {/* Inline new customer form */}
              {showNewCustomer && (
                <div style={{ border:'1.5px solid rgba(16,185,129,0.25)',
                  borderRadius:12, padding:'20px',
                  background:'rgba(16,185,129,0.03)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:14 }}>
                    <p style={{ fontWeight:700, color:'#059669',
                      fontSize:'0.9rem' }}>👤 New Customer</p>
                    <button onClick={() => {
                      setShowNewCustomer(false); setNewCustError('')
                    }}
                      style={{ background:'none', border:'none',
                        cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
                      <X size={16}/>
                    </button>
                  </div>
                  {newCustError && (
                    <p style={{ color:'#DC2626', fontSize:'0.82rem',
                      marginBottom:12 }}>{newCustError}</p>
                  )}
                  <div style={{ display:'grid',
                    gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    {[
                      { key:'name',    label:'NAME *',    placeholder:'Full name'    },
                      { key:'phone',   label:'PHONE *',   placeholder:'Phone number' },
                      { key:'address', label:'ADDRESS',   placeholder:'Address'      },
                      { key:'notes',   label:'NOTES',     placeholder:'Notes'        },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="input-label">{f.label}</label>
                        <input type="text" value={newCustForm[f.key]}
                          onChange={e => {
                            setNewCustForm({...newCustForm,[f.key]:e.target.value})
                            setNewCustError('')
                          }}
                          placeholder={f.placeholder}
                          className="input-field"
                          style={{ border:'1.5px solid rgba(16,185,129,0.25)' }}
                        />
                      </div>
                    ))}
                  </div>
                  <button onClick={handleCreateNewCustomer}
                    disabled={newCustSaving}
                    style={{ display:'flex', alignItems:'center', gap:6,
                      padding:'10px 20px',
                      background:'linear-gradient(135deg,#10B981,#059669)',
                      color:'white', border:'none', borderRadius:10,
                      fontFamily:'Poppins,sans-serif', fontWeight:600,
                      fontSize:'0.85rem', cursor:'pointer' }}>
                    {newCustSaving
                      ? <><div className="spinner"/>Creating...</>
                      : <><Check size={15}/>Create & Select</>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
          
        
        {/* ② Cloth Type → Type → Subtype → Alteration (all in one card) */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B',
            marginBottom:6, fontSize:'0.95rem' }}>
            ② Cloth Type & Alteration
          </h2>
          <p style={{ fontSize:'0.78rem', color:'#6B7280', marginBottom:16 }}>
            Select cloth type → type → subtype → alteration in order
          </p>

          {/* Step 1 — Cloth Type */}
          <div style={{ marginBottom:16 }}>
            <label className="input-label">STEP 1 — CLOTH TYPE</label>
            {clothTypes.length === 0 ? (
              <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>
                No cloth types found. Add them in Cloth Type Management.
              </p>
            ) : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {clothTypes.filter(ct => ct.isActive).map(ct => (
                  <button key={ct._id}
                    // In the cloth type click handler:
                    onClick={() => {
                      setSelectedClothType(ct)
                      setSelectedType(null)
                      setSelectedSubtype(null)
                      // Reset measurements to empty object
                      // New fields will show based on cloth type's measurement config
                      setForm(f => ({
                        ...f,
                        unitCost:     0,
                        measurements: {}, // clear previous measurements
                        alteration:   { required:false, selectedOptions:[], notes:'', extraCost:0 },
                      }))
                    }}
                    style={{ padding:'8px 16px', borderRadius:999,
                      cursor:'pointer', fontFamily:'Poppins,sans-serif',
                      fontWeight:600, fontSize:'0.82rem',
                      transition:'all 0.2s',
                      border:   selectedClothType?._id===ct._id
                        ? '2px solid #4F46E5'
                        : '1.5px solid rgba(79,70,229,0.2)',
                      background: selectedClothType?._id===ct._id
                        ? 'rgba(79,70,229,0.1)'
                        : 'rgba(255,255,255,0.7)',
                      color: selectedClothType?._id===ct._id
                        ? '#4F46E5' : '#6B7280' }}>
                    {ct.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2 — Type */}
          {selectedClothType && (
            <>
              <div style={{ height:1, background:'rgba(79,70,229,0.08)',
                margin:'16px 0' }} />
              <div style={{ marginBottom:16 }}>
                <label className="input-label">
                  STEP 2 — TYPE ({selectedClothType.name})
                </label>
                {(selectedClothType.types||[]).filter(t=>t.isActive).length === 0 ? (
                  <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>
                    No types added. Go to Cloth Type Management.
                  </p>
                ) : (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {(selectedClothType.types||[])
                      .filter(t => t.isActive)
                      .map(type => (
                      <button key={type._id}
                        onClick={() => {
                          setSelectedType(type)
                          setSelectedSubtype(null)
                          setForm(f => ({ ...f, unitCost:0 }))
                        }}
                        style={{ padding:'8px 16px', borderRadius:999,
                          cursor:'pointer', fontFamily:'Poppins,sans-serif',
                          fontWeight:600, fontSize:'0.82rem',
                          transition:'all 0.2s',
                          border:   selectedType?._id===type._id
                            ? '2px solid #D97706'
                            : '1.5px solid rgba(245,158,11,0.25)',
                          background: selectedType?._id===type._id
                            ? 'rgba(245,158,11,0.1)'
                            : 'rgba(255,255,255,0.7)',
                          color: selectedType?._id===type._id
                            ? '#D97706' : '#6B7280' }}>
                        {type.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step 3 — Subtype */}
          {selectedClothType && selectedType && (
            <>
              <div style={{ height:1, background:'rgba(79,70,229,0.08)',
                margin:'16px 0' }} />
              <div style={{ marginBottom:16 }}>
                <label className="input-label">
                  STEP 3 — SUBTYPE ({selectedType.name})
                </label>
                {(selectedType.subtypes||[]).filter(s=>s.isActive).length === 0 ? (
                  <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>
                    No subtypes added yet.
                  </p>
                ) : (
                  <div style={{ display:'grid',
                    gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',
                    gap:10 }}>
                    {(selectedType.subtypes||[])
                      .filter(s => s.isActive)
                      .map(sub => (
                      <div key={sub._id}
                        onClick={() => {
                          setSelectedSubtype(sub)
                          setForm(f => ({ ...f, unitCost: sub.cost || 0 }))
                        }}
                        style={{ padding:'14px 16px', borderRadius:12,
                          cursor:'pointer', transition:'all 0.2s',
                          border:   selectedSubtype?._id===sub._id
                            ? '2px solid #10B981'
                            : '1.5px solid rgba(79,70,229,0.15)',
                          background: selectedSubtype?._id===sub._id
                            ? 'rgba(16,185,129,0.08)'
                            : 'rgba(255,255,255,0.7)' }}>
                        <p style={{ fontWeight:700, fontSize:'0.9rem',
                          color: selectedSubtype?._id===sub._id
                            ? '#059669' : '#1E1B4B' }}>
                          {sub.name}
                        </p>
                        <p style={{ fontWeight:700, fontSize:'0.88rem',
                          color:'#059669', marginTop:4 }}>
                          ₹{(sub.cost||0).toLocaleString('en-IN')}
                        </p>
                        {selectedSubtype?._id===sub._id && (
                          <p style={{ fontSize:'0.7rem', color:'#059669',
                            marginTop:2 }}>✓ Selected</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Summary bar */}
          {selectedClothType && selectedType && selectedSubtype && (
            <div style={{ padding:'10px 14px',
              background:'rgba(79,70,229,0.06)',
              border:'1.5px solid rgba(79,70,229,0.15)',
              borderRadius:10, marginBottom:16 }}>
              <p style={{ fontSize:'0.82rem', color:'#4F46E5', fontWeight:600 }}>
                ✓ {selectedClothType.name} → {selectedType.name} → {selectedSubtype.name}
                <span style={{ marginLeft:8, color:'#059669', fontWeight:700 }}>
                  ₹{(selectedSubtype.cost||0).toLocaleString('en-IN')}
                </span>
              </p>
            </div>
          )}

          {/* Step 4 — Alteration (shows only after subtype selected) */}
          {selectedClothType && selectedType && selectedSubtype && (
            <>
              <div style={{ height:1, background:'rgba(79,70,229,0.08)',
                margin:'4px 0 16px' }} />

              <label className="input-label">
                STEP 4 — ALTERATION ({selectedClothType.name})
              </label>
              <p style={{ fontSize:'0.75rem', color:'#6B7280', marginBottom:14 }}>
                Select applicable alterations. Extra costs are added automatically.
              </p>

              {loadingAlterations ? (
                <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>
                  Loading alterations...
                </p>
              ) : alterationOptions.length === 0 ? (
                <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>
                  No alteration options for {selectedClothType.name}.
                  Add them in Alteration Management.
                </p>
              ) : (
                <div style={{ display:'grid',
                  gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',
                  gap:10, marginBottom:16 }}>
                  {alterationOptions.map(opt => {
                    const isSelected = (form.alteration.selectedOptions||[])
                      .includes(opt.name)
                    return (
                      <div key={opt._id}
                        onClick={() => {
                          const current = form.alteration.selectedOptions || []
                          const updated = isSelected
                            ? current.filter(o => o !== opt.name)
                            : [...current, opt.name]
                          const totalExtra = alterationOptions
                            .filter(o => updated.includes(o.name))
                            .reduce((sum,o) => sum+(o.extraCost||0), 0)
                          setForm(f => ({
                            ...f,
                            alteration: {
                              ...f.alteration,
                              required:        updated.length > 0,
                              selectedOptions: updated,
                              extraCost:       totalExtra,
                            },
                          }))
                        }}
                        style={{ padding:'12px 14px', borderRadius:10,
                          cursor:'pointer', transition:'all 0.2s',
                          border:    isSelected
                            ? '2px solid #4F46E5'
                            : '1.5px solid rgba(79,70,229,0.15)',
                          background: isSelected
                            ? 'rgba(79,70,229,0.08)'
                            : 'rgba(255,255,255,0.7)' }}>
                        <div style={{ display:'flex',
                          justifyContent:'space-between',
                          alignItems:'flex-start', marginBottom:4 }}>
                          <span style={{ fontWeight:600, fontSize:'0.85rem',
                            color:isSelected?'#4F46E5':'#1E1B4B' }}>
                            {isSelected && '✓ '}{opt.name}
                          </span>
                          {(opt.extraCost||0) > 0 && (
                            <span style={{ fontSize:'0.72rem', fontWeight:700,
                              color:'#059669', flexShrink:0, marginLeft:4 }}>
                              +₹{opt.extraCost}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p style={{ fontSize:'0.72rem', color:'#9CA3AF',
                            lineHeight:1.4 }}>
                            {opt.description}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Selected summary */}
              {(form.alteration.selectedOptions||[]).length > 0 && (
                <div style={{ background:'rgba(79,70,229,0.05)',
                  borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
                  <p style={{ fontSize:'0.8rem', color:'#4F46E5',
                    fontWeight:600, marginBottom:2 }}>
                    Selected: {form.alteration.selectedOptions.join(', ')}
                  </p>
                  {(form.alteration.extraCost||0) > 0 && (
                    <p style={{ fontSize:'0.8rem', color:'#059669', fontWeight:700 }}>
                      Extra: ₹{(form.alteration.extraCost||0).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              )}

              {/* Additional notes */}
              <div>
                <label className="input-label">ADDITIONAL NOTES (OPTIONAL)</label>
                <textarea
                  value={form.alteration.notes||''}
                  onChange={e => setForm(f => ({
                    ...f,
                    alteration: { ...f.alteration, notes:e.target.value }
                  }))}
                  placeholder="Any additional alteration details..."
                  rows={2}
                  style={{ width:'100%', padding:'11px 14px',
                    background:'rgba(255,255,255,0.8)',
                    border:'1.5px solid rgba(79,70,229,0.2)',
                    borderRadius:10, fontFamily:'Poppins,sans-serif',
                    fontSize:'0.88rem', color:'#1E1B4B',
                    outline:'none', resize:'vertical' }}
                />
                {/* Step 5 — Delivery Date (always visible after cloth type selected) */}
                {selectedClothType && selectedType && selectedSubtype && (
                  <>
                    <div style={{ height:1, background:'rgba(79,70,229,0.08)', margin:'16px 0' }} />
                    <div>
                      <label className="input-label">STEP 5 — DELIVERY DATE *</label>
                      <input
                        type="date"
                        value={form.deliveryDate}
                        onChange={e => {
                          setForm({...form, deliveryDate:e.target.value})
                          checkDelivery(e.target.value)
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        style={{
                          width:'100%', padding:'13px 16px',
                          background:'rgba(255,255,255,0.8)',
                          border: form.deliveryDate
                            ? '1.5px solid rgba(16,185,129,0.4)'
                            : '1.5px solid rgba(239,68,68,0.3)',
                          borderRadius:10, fontFamily:'Poppins,sans-serif',
                          fontSize:'0.9rem', color:'#1E1B4B', outline:'none',
                        }}
                      />
                      {!form.deliveryDate && (
                        <p style={{ fontSize:'0.72rem', color:'#DC2626',
                          marginTop:4, fontWeight:500 }}>
                          ⚠️ Delivery date is required to save the order
                        </p>
                      )}
                      {form.deliveryDate && (
                        <p style={{ fontSize:'0.72rem', color:'#059669',
                          marginTop:4, fontWeight:500 }}>
                          ✅ {new Date(form.deliveryDate).toLocaleDateString('en-IN', {
                            weekday:'long', day:'numeric', month:'long', year:'numeric'
                          })}
                        </p>
                      )}
                    </div>

                    {deliveryInfo && (
                      <div style={{ marginTop:10, padding:'10px 14px',
                        background:deliveryInfo.isOverloaded
                          ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
                        border:`1px solid ${deliveryInfo.isOverloaded
                          ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                        borderRadius:10 }}>
                        <p style={{ fontSize:'0.82rem', fontWeight:600,
                          color:deliveryInfo.isOverloaded?'#DC2626':'#059669' }}>
                          {deliveryInfo.isOverloaded
                            ? '⚠️ High delivery load on this date'
                            : '✅ Date available'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* ⑤ Measurements — cloth-type specific */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B',
            marginBottom:6, fontSize:'0.95rem' }}>
            ③ Measurements
            <span style={{ fontSize:'0.75rem', color:'#9CA3AF',
              fontWeight:400, marginLeft:6 }}>(inches)</span>
          </h2>

          {!selectedClothType ? (
            <div style={{ padding:'20px', background:'rgba(79,70,229,0.04)',
              borderRadius:10, textAlign:'center' }}>
              <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>
                Select a cloth type first to see measurement fields
              </p>
            </div>
          ) : !selectedClothType.measurements || selectedClothType.measurements.length === 0 ? (
            <div style={{ padding:'20px', background:'rgba(245,158,11,0.05)',
              borderRadius:10, border:'1.5px dashed rgba(245,158,11,0.3)' }}>
              <p style={{ color:'#D97706', fontSize:'0.85rem', fontWeight:500 }}>
                ⚠️ No measurement fields set for {selectedClothType.name}.
                Go to <strong>Cloth Types</strong> → Manage → Edit measurement fields.
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontSize:'0.78rem', color:'#6B7280', marginBottom:16 }}>
                Measurements for <strong>{selectedClothType.name}</strong>
                {selectedClothType.nameTa && (
                  <span style={{ marginLeft:6, color:'#9CA3AF' }}>
                    ({selectedClothType.nameTa})
                  </span>
                )}
              </p>
              <div style={{ display:'grid',
                gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
                gap:14 }}>
                {selectedClothType.measurements.map(field => (
                  <div key={field.key}>
                    <label className="input-label">
                      {field.label.toUpperCase()}
                      {field.required && (
                        <span style={{ color:'#DC2626', marginLeft:2 }}>*</span>
                      )}
                    </label>
                    {field.labelTa && (
                      <p style={{ fontSize:'0.68rem', color:'#9CA3AF',
                        marginBottom:4, marginTop:-2 }}>
                        {field.labelTa}
                      </p>
                    )}
                    <input
                      type="text"
                      value={form.measurements[field.key] || ''}
                      onChange={e => setForm({
                        ...form,
                        measurements: {
                          ...form.measurements,
                          [field.key]: e.target.value,
                        },
                      })}
                      placeholder="e.g. 36"
                      className="input-field"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ⑥ Alteration */}
        <AlterationSection
          alterationOptions={alterationOptions}
          alteration={form.alteration}
          onChange={val => setForm({...form, alteration:val})}
          loading={loadingAlterations}
        />

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}