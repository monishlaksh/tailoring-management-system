'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'
import NumInput from '../../../components/NumInput'

const COMMON_MEASUREMENTS = [
  { key:'length',   label:'Length',   labelTa:'நீளம்'      },
  { key:'chest',    label:'Chest',    labelTa:'மார்பு'     },
  { key:'waist',    label:'Waist',    labelTa:'இடுப்பு'    },
  { key:'hip',      label:'Hip',      labelTa:'இடுப்பகல்'  },
  { key:'shoulder', label:'Shoulder', labelTa:'தோள்'       },
  { key:'sleeve',   label:'Sleeve',   labelTa:'கை நீளம்'   },
  { key:'neck',     label:'Neck',     labelTa:'கழுத்து'    },
  { key:'inseam',   label:'Inseam',   labelTa:'உள் தையல்'  },
  { key:'thigh',    label:'Thigh',    labelTa:'தொடை'       },
  { key:'custom',   label:'Custom',   labelTa:'தனிப்பயன்'  },
]

export default function ClothTypesPage() {
  const router = useRouter()
  const [clothTypes, setClothTypes] = useState([])
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState(null)
  const [expandedType, setExpandedType] = useState(null)
  const [msg, setMsg]               = useState({ text:'', err:false })

  // New cloth type
  const [showNew, setShowNew]       = useState(false)
  const [newName, setNewName]       = useState('')
  const [newNameTa, setNewNameTa]   = useState('')
  const [newMeasurements, setNewMeasurements] = useState([])
  const [savingCT, setSavingCT]     = useState(false)

  // Edit cloth type
  const [editingCT, setEditingCT]   = useState(null)
  const [editCT, setEditCT]         = useState({ name:'', nameTa:'' })

  // New type
  const [newType, setNewType]       = useState({})
  const [savingType, setSavingType] = useState(null)

  // Edit type
  const [editingType, setEditingType] = useState(null)
  const [editType, setEditType]       = useState({ name:'', nameTa:'', cost:0, empCost:0 })

  // New subtype
  const [newSub, setNewSub]         = useState({})
  const [savingSub, setSavingSub]   = useState(null)

  // Edit subtype
  const [editingSub, setEditingSub] = useState(null)
  const [editSub, setEditSub]       = useState({ name:'', nameTa:'', cost:0 })

  const [copied, setCopied] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await API.get('/api/cloth-types/all')
      setClothTypes(res.data.clothTypes)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const showMsg = (text, err=false) => {
    setMsg({ text, err })
    setTimeout(() => setMsg({ text:'', err:false }), 3000)
  }

  const toggleMeasurement = (key, label, labelTa) => {
    setNewMeasurements(prev => {
      const exists = prev.find(m => m.key === key)
      if (exists) return prev.filter(m => m.key !== key)
      return [...prev, { key, label, labelTa, required:false }]
    })
  }

  {/* Add this BEFORE the measurement toggles */}
const MEASUREMENT_PRESETS = {
  'Blouse / Saree Blouse': ['length','chest','shoulder','sleeve','neck'],
  'Chudi / Kurti':         ['length','chest','waist','hip','shoulder','sleeve'],
  'Pant / Trouser':        ['length','waist','hip','inseam','thigh'],
  'Shirt':                 ['length','chest','shoulder','sleeve','neck'],
  'Lehenga / Skirt':       ['length','waist','hip'],
  'Kids Dress':            ['length','chest','waist'],
}

  const toggleRequired = (key) => {
    setNewMeasurements(prev =>
      prev.map(m => m.key === key ? { ...m, required:!m.required } : m)
    )
  }

  // ── ClothType CRUD ───────────────────────────────────────────
  const createCT = async () => {
    if (!newName.trim()) { showMsg('Name required', true); return }
    setSavingCT(true)
    try {
      await API.post('/api/cloth-types', {
        name: newName.trim(), nameTa: newNameTa.trim(),
        measurements: newMeasurements,
      })
      setNewName(''); setNewNameTa(''); setNewMeasurements([])
      setShowNew(false); fetchData(); showMsg('Cloth type created!')
    } catch (e) { showMsg(e.response?.data?.message||'Failed', true) }
    finally { setSavingCT(false) }
  }

  const updateCT = async (ct) => {
    try {
      await API.put(`/api/cloth-types/${ct._id}`, editCT)
      setEditingCT(null); fetchData(); showMsg('Updated!')
    } catch (e) { showMsg('Failed', true) }
  }

  const toggleCT = async (ct) => {
    try {
      await API.put(`/api/cloth-types/${ct._id}`, { isActive:!ct.isActive })
      fetchData(); showMsg(`${ct.name} ${ct.isActive?'deactivated':'activated'}!`)
    } catch (e) { showMsg('Failed', true) }
  }

  // ── Type CRUD ────────────────────────────────────────────────
  const addType = async (ctId) => {
    const t = newType[ctId] || {}
    if (!t.name?.trim()) { showMsg('Type name required', true); return }
    setSavingType(ctId)
    try {
      await API.post(`/api/cloth-types/${ctId}/types`, t)
      setNewType(p => ({ ...p, [ctId]:{ name:'', nameTa:'', cost:0, empCost:0 } }))
      fetchData(); showMsg('Type added!')
    } catch (e) { showMsg(e.response?.data?.message||'Failed', true) }
    finally { setSavingType(null) }
  }

  const updateType = async (ctId, typeId) => {
    try {
      await API.put(`/api/cloth-types/${ctId}/types/${typeId}`, editType)
      setEditingType(null); fetchData(); showMsg('Type updated!')
    } catch (e) { showMsg('Failed', true) }
  }

  const deleteType = async (ctId, typeId, name) => {
    if (!confirm(`Remove type "${name}"?`)) return
    try {
      await API.delete(`/api/cloth-types/${ctId}/types/${typeId}`)
      fetchData(); showMsg('Type removed!')
    } catch (e) { showMsg('Failed', true) }
  }

  // ── Subtype CRUD ─────────────────────────────────────────────
  const addSub = async (ctId, typeId) => {
    const key = `${ctId}_${typeId}`
    const s   = newSub[key] || {}
    if (!s.name?.trim()) { showMsg('Subtype name required', true); return }
    setSavingSub(key)
    try {
      await API.post(`/api/cloth-types/${ctId}/types/${typeId}/subtypes`, s)
      setNewSub(p => ({ ...p, [key]:{ name:'', nameTa:'', cost:0 } }))
      fetchData(); showMsg('Subtype added!')
    } catch (e) { showMsg(e.response?.data?.message||'Failed', true) }
    finally { setSavingSub(null) }
  }

  const updateSub = async (ctId, typeId, subId) => {
    try {
      await API.put(`/api/cloth-types/${ctId}/types/${typeId}/subtypes/${subId}`, editSub)
      setEditingSub(null); fetchData(); showMsg('Subtype updated!')
    } catch (e) { showMsg('Failed', true) }
  }

  const deleteSub = async (ctId, typeId, subId, name) => {
    if (!confirm(`Remove "${name}"?`)) return
    try {
      await API.delete(`/api/cloth-types/${ctId}/types/${typeId}/subtypes/${subId}`)
      fetchData(); showMsg('Removed!')
    } catch (e) { showMsg('Failed', true) }
  }

  const input = (extra={}) => ({
    padding:'10px 14px', background:'rgba(255,255,255,0.9)',
    border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10,
    fontFamily:'Poppins,sans-serif', fontSize:'0.88rem',
    color:'#1E1B4B', outline:'none', ...extra,
  })

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:960, margin:'0 auto' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Cloth Type Management</h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
              Cloth Type → Types (with cost & emp rate) → Subtypes → Measurements
            </p>
          </div>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary"
          style={{ padding:'9px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={15}/> Add Cloth Type
        </button>
      </div>

      {msg.text && (
        <div style={{ padding:'11px 16px', marginBottom:16, borderRadius:10,
          background:msg.err?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)',
          border:`1.5px solid ${msg.err?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}`,
          color:msg.err?'#DC2626':'#059669', fontSize:'0.87rem' }}>
          {msg.err ? msg.text : `✅ ${msg.text}`}
        </div>
      )}

      {/* New Cloth Type Form */}
      {showNew && (
        <div className="glass" style={{ padding:24, marginBottom:20, border:'1.5px solid rgba(79,70,229,0.2)' }}>
          <p style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>
            New Cloth Type
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <div>
              <label className="input-label">NAME (English) *</label>
              <input style={input({ width:'100%' })} value={newName}
                onChange={e => setNewName(e.target.value)} placeholder="e.g. Blouse" />
            </div>
            <div>
              <label className="input-label">பெயர் (Tamil)</label>
              <input style={input({ width:'100%' })} value={newNameTa}
                onChange={e => setNewNameTa(e.target.value)} placeholder="e.g. ரவிக்கை" />
            </div>
          </div>

          {/* Measurement Presets — copy from existing cloth types */}
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:'0.75rem', color:'#6B7280',
              fontWeight:600, marginBottom:8 }}>
              📋 QUICK COPY FROM PRESET
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {Object.entries(MEASUREMENT_PRESETS).map(([label, keys]) => (
                <button key={label} type="button"
                  onClick={() => {
                    const fields = keys.map(k => {
                      const m = COMMON_MEASUREMENTS.find(x => x.key === k)
                      return m ? { key:m.key, label:m.label, labelTa:m.labelTa, required:false } : null
                    }).filter(Boolean)
                    setNewMeasurements(fields)
                    setCopied(label)
                    setTimeout(() => setCopied(null), 2000)
                  }}
                  style={{ padding:'6px 14px', borderRadius:999, cursor:'pointer',
                    fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.78rem',
                    border:'1.5px solid rgba(79,70,229,0.2)',
                    background: copied===label
                      ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.8)',
                    color: copied===label ? '#059669' : '#4F46E5',
                    transition:'all 0.2s' }}>
                  {copied===label ? '✅ Copied!' : `📋 ${label}`}
                </button>
              ))}
            </div>
            <p style={{ fontSize:'0.7rem', color:'#9CA3AF', marginTop:6 }}>
              Click a preset to auto-fill measurement fields, then customize as needed
            </p>
          </div>

          {/* Measurement fields selector */}
          <div style={{ marginBottom:16 }}>
            <label className="input-label">SELECT MEASUREMENT FIELDS FOR THIS CLOTH TYPE</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
              {COMMON_MEASUREMENTS.map(m => {
                const selected = newMeasurements.find(x => x.key === m.key)
                return (
                  
                  <button key={m.key} type="button"
                    onClick={() => toggleMeasurement(m.key, m.label, m.labelTa)}
                    style={{ padding:'6px 14px', borderRadius:999, cursor:'pointer',
                      fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.8rem',
                      border:   selected?'2px solid #4F46E5':'1.5px solid rgba(79,70,229,0.2)',
                      background:selected?'rgba(79,70,229,0.1)':'rgba(255,255,255,0.7)',
                      color:    selected?'#4F46E5':'#6B7280' }}>
                    {selected?'✓ ':''}{m.label} / {m.labelTa}
                  </button>
                )
              })}
            </div>
            {newMeasurements.length > 0 && (
              <div style={{ background:'rgba(79,70,229,0.04)', borderRadius:10, padding:'12px 14px' }}>
                <p style={{ fontSize:'0.75rem', color:'#4F46E5', fontWeight:600, marginBottom:8 }}>
                  Mark as Required:
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {newMeasurements.map(m => (
                    <button key={m.key} type="button"
                      onClick={() => toggleRequired(m.key)}
                      style={{ padding:'4px 12px', borderRadius:999, cursor:'pointer',
                        fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.75rem',
                        border:   m.required?'2px solid #DC2626':'1.5px solid rgba(156,163,175,0.4)',
                        background:m.required?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.7)',
                        color:    m.required?'#DC2626':'#6B7280' }}>
                      {m.label} {m.required?'(Required)':'(Optional)'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={createCT} disabled={savingCT} className="btn-primary"
              style={{ padding:'11px 24px', display:'flex', alignItems:'center', gap:6 }}>
              {savingCT?<><div className="spinner"/>Adding...</>:<><Check size={14}/>Add</>}
            </button>
            <button onClick={() => { setShowNew(false); setNewName(''); setNewNameTa(''); setNewMeasurements([]) }}
              className="btn-ghost" style={{ padding:'11px 18px' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>Loading...</p>
      ) : (
        <div style={{ display:'grid', gap:14 }}>
          {clothTypes.map(ct => (
            <div key={ct._id} className="glass" style={{ overflow:'hidden',
              border:ct.isActive?'1.5px solid rgba(255,255,255,0.8)':'1.5px solid rgba(239,68,68,0.15)' }}>

              {/* Cloth type header */}
              <div style={{ padding:'16px 20px', display:'flex', alignItems:'center',
                justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                {editingCT === ct._id ? (
                  <div style={{ display:'flex', gap:8, alignItems:'center', flex:1, flexWrap:'wrap' }}>
                    <input value={editCT.name} onChange={e=>setEditCT(p=>({...p,name:e.target.value}))}
                      style={input({ width:160 })} placeholder="English" />
                    <input value={editCT.nameTa} onChange={e=>setEditCT(p=>({...p,nameTa:e.target.value}))}
                      style={input({ width:160 })} placeholder="Tamil" />
                    <button onClick={()=>updateCT(ct)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#059669' }}>
                      <Check size={18}/>
                    </button>
                    <button onClick={()=>setEditingCT(null)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>
                      <X size={18}/>
                    </button>
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontWeight:700, fontSize:'1rem',
                      color:ct.isActive?'#1E1B4B':'#9CA3AF' }}>
                      {ct.name}
                    </span>
                    {ct.nameTa && (
                      <span style={{ fontSize:'0.82rem', color:'#6B7280' }}>
                        {ct.nameTa}
                      </span>
                    )}
                    <span style={{ fontSize:'0.68rem', padding:'2px 8px', borderRadius:999,
                      background:ct.isActive?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)',
                      color:ct.isActive?'#059669':'#DC2626', fontWeight:600 }}>
                      {ct.isActive?'Active':'Inactive'}
                    </span>
                    <span style={{ fontSize:'0.68rem', color:'#9CA3AF' }}>
                      {ct.measurements?.length||0} measurements · {ct.types?.length||0} types
                    </span>
                  </div>
                )}
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>{ setEditingCT(ct._id); setEditCT({ name:ct.name, nameTa:ct.nameTa||'' }) }}
                    style={{ padding:'5px 10px', background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:7, color:'#4F46E5', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:3 }}>
                    <Edit2 size={11}/> Edit
                  </button>
                  <button onClick={()=>toggleCT(ct)}
                    style={{ padding:'5px 10px', background:ct.isActive?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)', border:`1px solid ${ct.isActive?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}`, borderRadius:7, color:ct.isActive?'#DC2626':'#059669', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                    {ct.isActive?'Deactivate':'Activate'}
                  </button>
                  <button onClick={()=>setExpanded(expanded===ct._id?null:ct._id)}
                    style={{ padding:'5px 10px', background:'rgba(79,70,229,0.06)', border:'1px solid rgba(79,70,229,0.15)', borderRadius:7, color:'#4F46E5', cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.75rem', display:'flex', alignItems:'center', gap:4 }}>
                    Manage {expanded===ct._id?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
                  </button>
                </div>
              </div>

              {/* Expanded panel */}
              {expanded === ct._id && (
                <div style={{ borderTop:'1px solid rgba(79,70,229,0.1)', padding:'20px', background:'rgba(79,70,229,0.01)' }}>

                  {/* Measurements */}
                  <div style={{ marginBottom:20 }}>
                    <p style={{ fontSize:'0.8rem', fontWeight:700, color:'#4F46E5', marginBottom:10 }}>
                      📏 Measurement Fields
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                      {(ct.measurements||[]).map(m => (
                        <span key={m.key} style={{ padding:'4px 10px', borderRadius:999, fontSize:'0.75rem', fontWeight:600,
                          background:m.required?'rgba(239,68,68,0.08)':'rgba(79,70,229,0.08)',
                          color:m.required?'#DC2626':'#4F46E5',
                          border:`1px solid ${m.required?'rgba(239,68,68,0.2)':'rgba(79,70,229,0.15)'}` }}>
                          {m.label} / {m.labelTa} {m.required?'*':''}
                        </span>
                      ))}
                      {(!ct.measurements||ct.measurements.length===0) && (
                        <span style={{ fontSize:'0.78rem', color:'#9CA3AF' }}>No measurement fields set.</span>
                      )}
                    </div>
                    {/* Edit measurements inline */}
                    <details>
                      <summary style={{ fontSize:'0.78rem', color:'#4F46E5',
                        cursor:'pointer', fontWeight:600 }}>
                        Edit measurement fields
                      </summary>
                      <div style={{ marginTop:10 }}>

                        {/* Copy from preset */}
                        <p style={{ fontSize:'0.72rem', color:'#6B7280',
                          fontWeight:600, marginBottom:8 }}>
                          📋 Copy from preset:
                        </p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                          {Object.entries(MEASUREMENT_PRESETS).map(([label, keys]) => (
                            <button key={label} type="button"
                              onClick={async () => {
                                const fields = keys.map(k => {
                                  const m = COMMON_MEASUREMENTS.find(x => x.key === k)
                                  return m ? { key:m.key, label:m.label, labelTa:m.labelTa, required:false } : null
                                }).filter(Boolean)
                                try {
                                  await API.put(`/api/cloth-types/${ct._id}`, { measurements:fields })
                                  fetchData()
                                  showMsg(`Copied ${label} measurements!`)
                                } catch(e) { showMsg('Failed', true) }
                              }}
                              style={{ padding:'5px 12px', borderRadius:999, cursor:'pointer',
                                fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.75rem',
                                border:'1.5px solid rgba(79,70,229,0.2)',
                                background:'rgba(255,255,255,0.8)', color:'#4F46E5' }}>
                              📋 {label}
                            </button>
                          ))}
                        </div>
                        <p style={{ fontSize:'0.68rem', color:'#9CA3AF', marginBottom:10 }}>
                          Or manually toggle individual fields:
                        </p>

                        
                        {/* Toggle required */}
                        {(ct.measurements||[]).length > 0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                            {(ct.measurements||[]).map(m => (
                              <button key={m.key} type="button"
                                onClick={async () => {
                                  const updated = (ct.measurements||[]).map(x =>
                                    x.key===m.key ? { ...x, required:!x.required } : x
                                  )
                                  try {
                                    await API.put(`/api/cloth-types/${ct._id}`, { measurements:updated })
                                    fetchData()
                                  } catch(e) { showMsg('Failed',true) }
                                }}
                                style={{ padding:'4px 10px', borderRadius:999, cursor:'pointer',
                                  fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.72rem',
                                  border:   m.required?'2px solid #DC2626':'1.5px solid rgba(156,163,175,0.4)',
                                  background:m.required?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.7)',
                                  color:    m.required?'#DC2626':'#6B7280' }}>
                                {m.label} {m.required?'✓ Required':'→ Optional'}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  </div>

                  {/* Types */}
                  <p style={{ fontSize:'0.8rem', fontWeight:700, color:'#1E1B4B', marginBottom:12 }}>
                    Types (with cost & employee rate)
                  </p>

                  {(ct.types||[]).map(type => (
                    <div key={type._id} style={{ marginBottom:12, background:'rgba(255,255,255,0.7)', borderRadius:12, overflow:'hidden', border:'1px solid rgba(79,70,229,0.1)' }}>

                      {/* Type header */}
                      <div style={{ padding:'10px 14px', background:'rgba(79,70,229,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                        {editingType?.id === type._id ? (
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 100px 100px auto', gap:8, alignItems:'center', flex:1 }}>
                            <input value={editType.name} onChange={e=>setEditType(p=>({...p,name:e.target.value}))}
                              style={input({ padding:'7px 10px', fontSize:'0.82rem' })} placeholder="English" />
                            <input value={editType.nameTa} onChange={e=>setEditType(p=>({...p,nameTa:e.target.value}))}
                              style={input({ padding:'7px 10px', fontSize:'0.82rem' })} placeholder="Tamil" />
                            <div style={{ position:'relative' }}>
                              <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF', fontSize:'0.8rem' }}>₹</span>
                              <input type="number" value={editType.cost} onChange={e=>setEditType(p=>({...p,cost:parseFloat(e.target.value)||0}))}
                                style={input({ padding:'7px 10px 7px 20px', fontSize:'0.82rem' })} placeholder="Cost" />
                            </div>
                            <div style={{ position:'relative' }}>
                              <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF', fontSize:'0.8rem' }}>₹</span>
                              <input type="number" value={editType.empCost} onChange={e=>setEditType(p=>({...p,empCost:parseFloat(e.target.value)||0}))}
                                style={input({ padding:'7px 10px 7px 20px', fontSize:'0.82rem' })} placeholder="Emp Rate" />
                            </div>
                            <div style={{ display:'flex', gap:6 }}>
                              <button onClick={()=>updateType(ct._id, type._id)}
                                style={{ background:'none', border:'none', cursor:'pointer', color:'#059669' }}><Check size={16}/></button>
                              <button onClick={()=>setEditingType(null)}
                                style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={16}/></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                              <span style={{ fontWeight:600, color:'#4F46E5', fontSize:'0.88rem' }}>
                                📌 {type.name}
                              </span>
                              {type.nameTa && (
                                <span style={{ fontSize:'0.78rem', color:'#6B7280' }}>{type.nameTa}</span>
                              )}
                              <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:999, background:'rgba(79,70,229,0.08)', color:'#4F46E5', fontWeight:600 }}>
                                ₹{type.cost||0} cost
                              </span>
                              <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:999, background:'rgba(16,185,129,0.08)', color:'#059669', fontWeight:600 }}>
                                ₹{type.empCost||0} emp rate
                              </span>
                            </div>
                            <div style={{ display:'flex', gap:5 }}>
                              <button onClick={()=>{ setEditingType({ id:type._id }); setEditType({ name:type.name, nameTa:type.nameTa||'', cost:type.cost||0, empCost:type.empCost||0 }) }}
                                style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
                                <Edit2 size={14}/>
                              </button>
                              <button onClick={()=>deleteType(ct._id, type._id, type.name)}
                                style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', display:'flex' }}>
                                <Trash2 size={14}/>
                              </button>
                              <button onClick={()=>setExpandedType(expandedType===type._id?null:type._id)}
                                style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280', display:'flex' }}>
                                {expandedType===type._id?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Subtypes */}
                      {expandedType === type._id && (
                        <div style={{ padding:'12px 14px' }}>
                          {(type.subtypes||[]).map(sub => (
                            <div key={sub._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', marginBottom:6, background:'rgba(255,255,255,0.6)', borderRadius:8, border:'1px solid rgba(79,70,229,0.08)', flexWrap:'wrap', gap:8 }}>
                              {editingSub?.subId===sub._id ? (
                                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', flex:1 }}>
                                  <input value={editSub.name} onChange={e=>setEditSub(p=>({...p,name:e.target.value}))}
                                    style={input({ width:130, padding:'6px 10px', fontSize:'0.82rem' })} placeholder="English" />
                                  <input value={editSub.nameTa} onChange={e=>setEditSub(p=>({...p,nameTa:e.target.value}))}
                                    style={input({ width:130, padding:'6px 10px', fontSize:'0.82rem' })} placeholder="Tamil" />
                                  <NumInput prefix="₹" value={editSub.cost}
                                    onChange={val=>setEditSub(p=>({...p,cost:val}))}
                                    style={{ width:100, border:'1.5px solid rgba(79,70,229,0.2)', padding:'6px 10px 6px 22px', fontSize:'0.82rem' }} />
                                  <button onClick={()=>updateSub(ct._id,type._id,sub._id)}
                                    style={{ padding:'6px 12px', background:'linear-gradient(135deg,#10B981,#059669)', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.78rem', display:'flex', alignItems:'center', gap:3 }}>
                                    <Check size={12}/> Save
                                  </button>
                                  <button onClick={()=>setEditingSub(null)}
                                    style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>
                                    <X size={14}/>
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                    <div style={{ width:7, height:7, borderRadius:'50%', background:sub.isActive?'#10B981':'#EF4444', flexShrink:0 }}/>
                                    <span style={{ fontWeight:600, fontSize:'0.88rem', color:'#1E1B4B' }}>{sub.name}</span>
                                    {sub.nameTa && <span style={{ fontSize:'0.78rem', color:'#6B7280' }}>{sub.nameTa}</span>}
                                    <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#059669' }}>
                                      {sub.cost>0?`+₹${sub.cost}`:'Free'}
                                    </span>
                                  </div>
                                  <div style={{ display:'flex', gap:5 }}>
                                    <button onClick={()=>{ setEditingSub({ subId:sub._id }); setEditSub({ name:sub.name, nameTa:sub.nameTa||'', cost:sub.cost||0 }) }}
                                      style={{ padding:'4px 8px', background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:6, color:'#4F46E5', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:2 }}>
                                      <Edit2 size={10}/> Edit
                                    </button>
                                    <button onClick={()=>deleteSub(ct._id,type._id,sub._id,sub.name)}
                                      style={{ padding:'4px 8px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, color:'#DC2626', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:2 }}>
                                      <Trash2 size={10}/> Remove
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}

                          {/* Add subtype */}
                          <div style={{ display:'flex', gap:8, alignItems:'flex-end', flexWrap:'wrap', padding:'10px', background:'rgba(79,70,229,0.03)', borderRadius:8, border:'1.5px dashed rgba(79,70,229,0.2)' }}>
                            <div>
                              <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600, marginBottom:4 }}>SUBTYPE</p>
                              <input value={newSub[`${ct._id}_${type._id}`]?.name||''}
                                onChange={e=>setNewSub(p=>({...p,[`${ct._id}_${type._id}`]:{...p[`${ct._id}_${type._id}`],name:e.target.value}}))}
                                placeholder="e.g. Lining" style={input({ width:130, padding:'7px 10px', fontSize:'0.82rem' })} />
                            </div>
                            <div>
                              <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600, marginBottom:4 }}>TAMIL</p>
                              <input value={newSub[`${ct._id}_${type._id}`]?.nameTa||''}
                                onChange={e=>setNewSub(p=>({...p,[`${ct._id}_${type._id}`]:{...p[`${ct._id}_${type._id}`],nameTa:e.target.value}}))}
                                placeholder="Tamil name" style={input({ width:120, padding:'7px 10px', fontSize:'0.82rem' })} />
                            </div>
                            <div>
                              <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600, marginBottom:4 }}>EXTRA COST</p>
                              <NumInput prefix="₹"
                                value={newSub[`${ct._id}_${type._id}`]?.cost||0}
                                onChange={val=>setNewSub(p=>({...p,[`${ct._id}_${type._id}`]:{...p[`${ct._id}_${type._id}`],cost:val}}))}
                                style={{ width:100, border:'1.5px solid rgba(79,70,229,0.2)', padding:'7px 10px 7px 22px', fontSize:'0.82rem' }} />
                            </div>
                            <button onClick={()=>addSub(ct._id,type._id)}
                              disabled={savingSub===`${ct._id}_${type._id}`}
                              style={{ padding:'7px 14px', background:'linear-gradient(135deg,#4F46E5,#6366F1)', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.8rem', display:'flex', alignItems:'center', gap:4 }}>
                              {savingSub===`${ct._id}_${type._id}`?<><div className="spinner"/>Adding...</>:<><Plus size={12}/>Add Subtype</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add new type */}
                  <div style={{ padding:'14px', background:'rgba(255,255,255,0.5)', borderRadius:12, border:'1.5px dashed rgba(79,70,229,0.2)' }}>
                    <p style={{ fontSize:'0.78rem', fontWeight:600, color:'#4F46E5', marginBottom:10 }}>+ Add Type</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 110px 110px', gap:8, marginBottom:10 }}>
                      <div>
                        <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600, marginBottom:4 }}>TYPE NAME</p>
                        <input value={newType[ct._id]?.name||''}
                          onChange={e=>setNewType(p=>({...p,[ct._id]:{...p[ct._id],name:e.target.value}}))}
                          placeholder="e.g. Half Sleeve" style={input({ width:'100%', padding:'8px 10px', fontSize:'0.85rem' })} />
                      </div>
                      <div>
                        <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600, marginBottom:4 }}>TAMIL NAME</p>
                        <input value={newType[ct._id]?.nameTa||''}
                          onChange={e=>setNewType(p=>({...p,[ct._id]:{...p[ct._id],nameTa:e.target.value}}))}
                          placeholder="அரை கை" style={input({ width:'100%', padding:'8px 10px', fontSize:'0.85rem' })} />
                      </div>
                      <div>
                        <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600, marginBottom:4 }}>COST (₹)</p>
                        <NumInput prefix="₹"
                          value={newType[ct._id]?.cost||0}
                          onChange={val=>setNewType(p=>({...p,[ct._id]:{...p[ct._id],cost:val}}))}
                          style={{ border:'1.5px solid rgba(79,70,229,0.2)', padding:'8px 10px 8px 22px', fontSize:'0.85rem' }} />
                      </div>
                      <div>
                        <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600, marginBottom:4 }}>EMP RATE (₹)</p>
                        <NumInput prefix="₹"
                          value={newType[ct._id]?.empCost||0}
                          onChange={val=>setNewType(p=>({...p,[ct._id]:{...p[ct._id],empCost:val}}))}
                          style={{ border:'1.5px solid rgba(16,185,129,0.25)', padding:'8px 10px 8px 22px', fontSize:'0.85rem' }} />
                      </div>
                    </div>
                    <button onClick={()=>addType(ct._id)} disabled={savingType===ct._id}
                      style={{ padding:'9px 20px', background:'linear-gradient(135deg,#4F46E5,#6366F1)', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.85rem', display:'flex', alignItems:'center', gap:6 }}>
                      {savingType===ct._id?<><div className="spinner"/>Adding...</>:<><Plus size={14}/>Add Type</>}
                    </button>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}