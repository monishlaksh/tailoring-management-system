'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'
import NumInput from '../../../components/NumInput'

export default function ClothTypesPage() {
  const router = useRouter()
  const [clothTypes, setClothTypes] = useState([])
  const [loading, setLoading]       = useState(true)
  const [expandedCT, setExpandedCT] = useState(null)
  const [expandedType, setExpandedType] = useState(null)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  // New cloth type
  const [showNewCT, setShowNewCT] = useState(false)
  const [newCTName, setNewCTName] = useState('')
  const [savingCT, setSavingCT]   = useState(false)

  // Edit cloth type
  const [editingCT, setEditingCT] = useState(null)
  const [editCTName, setEditCTName] = useState('')

  // New type per cloth type
  const [newTypeName, setNewTypeName] = useState({})
  const [savingType, setSavingType]   = useState(null)

  // Edit type
  const [editingType, setEditingType] = useState(null)
  const [editTypeName, setEditTypeName] = useState('')

  // New subtype per type
  const [newSubtype, setNewSubtype] = useState({})
  const [savingSub, setSavingSub]   = useState(null)

  // Edit subtype
  const [editingSub, setEditingSub] = useState(null)
  const [editSubData, setEditSubData] = useState({ name:'', cost:0 })

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetch()
  }, [])

  const fetch = async () => {
    try {
      const res = await API.get('/api/cloth-types/all')
      setClothTypes(res.data.clothTypes)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const msg = (text, isErr=false) => {
    if (isErr) { setError(text);   setTimeout(()=>setError(''),3000) }
    else       { setSuccess(text); setTimeout(()=>setSuccess(''),3000) }
  }

  // ── Cloth Type CRUD ──────────────────────────────────────────

  const createCT = async () => {
    if (!newCTName.trim()) { msg('Name required',true); return }
    setSavingCT(true)
    try {
      await API.post('/api/cloth-types', { name:newCTName.trim() })
      setNewCTName(''); setShowNewCT(false); fetch(); msg('Cloth type created!')
    } catch (e) { msg(e.response?.data?.message||'Failed',true) }
    finally { setSavingCT(false) }
  }

  const updateCT = async (ct) => {
    if (!editCTName.trim()) return
    try {
      await API.put(`/api/cloth-types/${ct._id}`, { name:editCTName.trim() })
      setEditingCT(null); fetch(); msg('Renamed!')
    } catch (e) { msg(e.response?.data?.message||'Failed',true) }
  }

  const toggleCT = async (ct) => {
    try {
      await API.put(`/api/cloth-types/${ct._id}`, { isActive:!ct.isActive })
      fetch(); msg(`${ct.name} ${ct.isActive?'deactivated':'activated'}!`)
    } catch (e) { msg('Failed',true) }
  }

  // ── Type CRUD ────────────────────────────────────────────────

  const addType = async (ctId) => {
    const name = newTypeName[ctId]?.trim()
    if (!name) { msg('Type name required',true); return }
    setSavingType(ctId)
    try {
      await API.post(`/api/cloth-types/${ctId}/types`, { name })
      setNewTypeName(p=>({...p,[ctId]:''})); fetch(); msg('Type added!')
    } catch (e) { msg(e.response?.data?.message||'Failed',true) }
    finally { setSavingType(null) }
  }

  const updateType = async (ctId, typeId) => {
    if (!editTypeName.trim()) return
    try {
      await API.put(`/api/cloth-types/${ctId}/types/${typeId}`, { name:editTypeName.trim() })
      setEditingType(null); fetch(); msg('Type renamed!')
    } catch (e) { msg('Failed',true) }
  }

  const deleteType = async (ctId, typeId, name) => {
    if (!confirm(`Remove type "${name}"?`)) return
    try {
      await API.delete(`/api/cloth-types/${ctId}/types/${typeId}`)
      fetch(); msg('Type removed!')
    } catch (e) { msg('Failed',true) }
  }

  // ── Subtype CRUD ─────────────────────────────────────────────

  const addSubtype = async (ctId, typeId) => {
    const key = `${ctId}_${typeId}`
    const sub = newSubtype[key] || { name:'', cost:0 }
    if (!sub.name?.trim()) { msg('Subtype name required',true); return }
    setSavingSub(key)
    try {
      await API.post(`/api/cloth-types/${ctId}/types/${typeId}/subtypes`, {
        name:sub.name.trim(), cost:parseFloat(sub.cost)||0
      })
      setNewSubtype(p=>({...p,[key]:{ name:'',cost:0 }})); fetch(); msg('Subtype added!')
    } catch (e) { msg(e.response?.data?.message||'Failed',true) }
    finally { setSavingSub(null) }
  }

  const updateSubtype = async (ctId, typeId, subId) => {
    try {
      await API.put(`/api/cloth-types/${ctId}/types/${typeId}/subtypes/${subId}`, editSubData)
      setEditingSub(null); fetch(); msg('Subtype updated!')
    } catch (e) { msg('Failed',true) }
  }

  const deleteSubtype = async (ctId, typeId, subId, name) => {
    if (!confirm(`Remove subtype "${name}"?`)) return
    try {
      await API.delete(`/api/cloth-types/${ctId}/types/${typeId}/subtypes/${subId}`)
      fetch(); msg('Subtype removed!')
    } catch (e) { msg('Failed',true) }
  }

  const inputStyle = {
    padding:'10px 14px', background:'rgba(255,255,255,0.9)',
    border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10,
    fontFamily:'Poppins,sans-serif', fontSize:'0.88rem',
    color:'#1E1B4B', outline:'none',
  }

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:900, margin:'0 auto' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')} style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Cloth Type Management</h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
              Cloth Type → Types (Half Sleeve, Backless) → Subtypes (Normal, Lining) → Cost
            </p>
          </div>
        </div>
        <button onClick={() => setShowNewCT(!showNewCT)} className="btn-primary"
          style={{ padding:'9px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={15} /> Add Cloth Type
        </button>
      </div>

      {error   && <div style={{ background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'11px 16px', marginBottom:16, color:'#DC2626', fontSize:'0.87rem' }}>{error}</div>}
      {success && <div style={{ background:'rgba(16,185,129,0.08)', border:'1.5px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'11px 16px', marginBottom:16, color:'#059669', fontSize:'0.87rem' }}>✅ {success}</div>}

      {/* New cloth type */}
      {showNewCT && (
        <div className="glass" style={{ padding:20, marginBottom:20, border:'1.5px solid rgba(79,70,229,0.2)' }}>
          <p style={{ fontWeight:600, color:'#1E1B4B', marginBottom:12, fontSize:'0.9rem' }}>New Cloth Type</p>
          <div style={{ display:'flex', gap:10 }}>
            <input type="text" value={newCTName} onChange={e=>setNewCTName(e.target.value)}
              placeholder="e.g. Kurta, Salwar..." style={{ ...inputStyle, flex:1 }}
              onKeyDown={e=>e.key==='Enter'&&createCT()} />
            <button onClick={createCT} disabled={savingCT} className="btn-primary"
              style={{ padding:'10px 20px', display:'flex', alignItems:'center', gap:5 }}>
              {savingCT?<><div className="spinner"/>Adding...</>:<><Check size={14}/>Add</>}
            </button>
            <button onClick={()=>{setShowNewCT(false);setNewCTName('')}} className="btn-ghost" style={{ padding:'10px 14px' }}>
              <X size={16}/>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>Loading...</p>
      ) : clothTypes.length === 0 ? (
        <div className="glass" style={{ textAlign:'center', padding:48 }}>
          <p style={{ fontSize:'2.5rem', marginBottom:12 }}>✂️</p>
          <p style={{ color:'#6B7280', marginBottom:16 }}>No cloth types yet.</p>
          <button onClick={()=>setShowNewCT(true)} className="btn-primary" style={{ padding:'10px 24px' }}>+ Add First</button>
        </div>
      ) : (
        <div style={{ display:'grid', gap:14 }}>
          {clothTypes.map(ct => (
            <div key={ct._id} className="glass" style={{ overflow:'hidden', border:ct.isActive?'1.5px solid rgba(255,255,255,0.8)':'1.5px solid rgba(239,68,68,0.15)' }}>

              {/* Cloth type header */}
              <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                {editingCT === ct._id ? (
                  <div style={{ display:'flex', gap:8, alignItems:'center', flex:1 }}>
                    <input value={editCTName} onChange={e=>setEditCTName(e.target.value)}
                      style={{ ...inputStyle, maxWidth:220 }} autoFocus
                      onKeyDown={e=>e.key==='Enter'&&updateCT(ct)} />
                    <button onClick={()=>updateCT(ct)} style={{ background:'none', border:'none', cursor:'pointer', color:'#059669', display:'flex' }}><Check size={18}/></button>
                    <button onClick={()=>setEditingCT(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}><X size={18}/></button>
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontWeight:700, fontSize:'1rem', color:ct.isActive?'#1E1B4B':'#9CA3AF' }}>{ct.name}</span>
                    <span style={{ fontSize:'0.7rem', padding:'2px 8px', borderRadius:999, background:ct.isActive?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color:ct.isActive?'#059669':'#DC2626', fontWeight:600 }}>
                      {ct.isActive?'Active':'Inactive'}
                    </span>
                    <span style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>
                      {ct.types?.filter(t=>t.isActive).length||0} type(s)
                    </span>
                  </div>
                )}
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>{setEditingCT(ct._id);setEditCTName(ct.name)}}
                    style={{ padding:'6px 12px', background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:8, color:'#4F46E5', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:4 }}>
                    <Edit2 size={12}/> Rename
                  </button>
                  <button onClick={()=>toggleCT(ct)}
                    style={{ padding:'6px 12px', background:ct.isActive?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)', border:`1px solid ${ct.isActive?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}`, borderRadius:8, color:ct.isActive?'#DC2626':'#059669', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                    {ct.isActive?'Deactivate':'Activate'}
                  </button>
                  <button onClick={()=>setExpandedCT(expandedCT===ct._id?null:ct._id)}
                    style={{ padding:'6px 12px', background:'rgba(79,70,229,0.06)', border:'1px solid rgba(79,70,229,0.15)', borderRadius:8, color:'#4F46E5', cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4 }}>
                    Types {expandedCT===ct._id?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                  </button>
                </div>
              </div>

              {/* Types panel */}
              {expandedCT === ct._id && (
                <div style={{ borderTop:'1px solid rgba(79,70,229,0.1)', padding:'16px 20px', background:'rgba(79,70,229,0.02)' }}>

                  {/* Existing types */}
                  {ct.types?.map(type => (
                    <div key={type._id} style={{ marginBottom:16, background:'rgba(255,255,255,0.6)', borderRadius:10, overflow:'hidden', border:'1px solid rgba(79,70,229,0.1)' }}>

                      {/* Type header */}
                      <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(79,70,229,0.04)' }}>
                        {editingType?.ctId===ct._id && editingType?.typeId===type._id ? (
                          <div style={{ display:'flex', gap:8, alignItems:'center', flex:1 }}>
                            <input value={editTypeName} onChange={e=>setEditTypeName(e.target.value)}
                              style={{ ...inputStyle, maxWidth:200, padding:'6px 10px', fontSize:'0.85rem' }} autoFocus
                              onKeyDown={e=>e.key==='Enter'&&updateType(ct._id,type._id)} />
                            <button onClick={()=>updateType(ct._id,type._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#059669' }}><Check size={16}/></button>
                            <button onClick={()=>setEditingType(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={16}/></button>
                          </div>
                        ) : (
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontWeight:600, color:'#4F46E5', fontSize:'0.88rem' }}>📌 {type.name}</span>
                            <span style={{ fontSize:'0.68rem', color:'#9CA3AF' }}>
                              {type.subtypes?.length||0} subtype(s)
                            </span>
                          </div>
                        )}
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={()=>{setEditingType({ctId:ct._id,typeId:type._id});setEditTypeName(type.name)}}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
                            <Edit2 size={14}/>
                          </button>
                          <button onClick={()=>deleteType(ct._id,type._id,type.name)}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', display:'flex' }}>
                            <Trash2 size={14}/>
                          </button>
                          <button onClick={()=>setExpandedType(expandedType===type._id?null:type._id)}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280', display:'flex' }}>
                            {expandedType===type._id?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                          </button>
                        </div>
                      </div>

                      {/* Subtypes */}
                      {expandedType === type._id && (
                        <div style={{ padding:'12px 14px' }}>
                          {type.subtypes?.map(sub => (
                            <div key={sub._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', marginBottom:6, background:'rgba(255,255,255,0.7)', borderRadius:8, border:'1px solid rgba(79,70,229,0.08)', flexWrap:'wrap', gap:8 }}>
                              {editingSub?.subId===sub._id ? (
                                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', flex:1 }}>
                                  <input value={editSubData.name} onChange={e=>setEditSubData(p=>({...p,name:e.target.value}))}
                                    style={{ ...inputStyle, width:130, padding:'6px 10px', fontSize:'0.82rem' }} />
                                  <NumInput prefix="₹" value={editSubData.cost}
                                    onChange={val=>setEditSubData(p=>({...p,cost:val}))}
                                    style={{ width:110, padding:'6px 10px 6px 24px', border:'1.5px solid rgba(79,70,229,0.2)', fontSize:'0.82rem' }} />
                                  <button onClick={()=>updateSubtype(ct._id,type._id,sub._id)}
                                    style={{ padding:'6px 12px', background:'linear-gradient(135deg,#10B981,#059669)', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4 }}>
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
                                    <div style={{ width:7, height:7, borderRadius:'50%', background:sub.isActive?'#10B981':'#EF4444' }}/>
                                    <span style={{ fontWeight:600, fontSize:'0.88rem', color:'#1E1B4B' }}>{sub.name}</span>
                                    <span style={{ fontWeight:700, fontSize:'0.88rem', color:'#059669' }}>₹{(sub.cost||0).toLocaleString('en-IN')}</span>
                                  </div>
                                  <div style={{ display:'flex', gap:5 }}>
                                    <button onClick={()=>{setEditingSub({subId:sub._id});setEditSubData({name:sub.name,cost:sub.cost||0})}}
                                      style={{ padding:'4px 8px', background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:6, color:'#4F46E5', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:3 }}>
                                      <Edit2 size={10}/> Edit
                                    </button>
                                    <button onClick={()=>deleteSubtype(ct._id,type._id,sub._id,sub.name)}
                                      style={{ padding:'4px 8px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, color:'#DC2626', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:3 }}>
                                      <Trash2 size={10}/> Remove
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}

                          {/* Add subtype */}
                          <div style={{ display:'flex', gap:8, alignItems:'flex-end', marginTop:10, flexWrap:'wrap', padding:'12px', background:'rgba(79,70,229,0.03)', borderRadius:8, border:'1.5px dashed rgba(79,70,229,0.2)' }}>
                            <div>
                              <p style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:600, marginBottom:4 }}>SUBTYPE NAME</p>
                              <input value={newSubtype[`${ct._id}_${type._id}`]?.name||''}
                                onChange={e=>setNewSubtype(p=>({...p,[`${ct._id}_${type._id}`]:{...p[`${ct._id}_${type._id}`],name:e.target.value}}))}
                                placeholder="e.g. Normal, Lining..."
                                style={{ ...inputStyle, width:150, padding:'8px 12px', fontSize:'0.82rem' }} />
                            </div>
                            <div>
                              <p style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:600, marginBottom:4 }}>COST (₹)</p>
                              <NumInput prefix="₹"
                                value={newSubtype[`${ct._id}_${type._id}`]?.cost||0}
                                onChange={val=>setNewSubtype(p=>({...p,[`${ct._id}_${type._id}`]:{...p[`${ct._id}_${type._id}`],cost:val}}))}
                                style={{ width:110, border:'1.5px solid rgba(79,70,229,0.2)', padding:'8px 12px 8px 24px', fontSize:'0.82rem' }} />
                            </div>
                            <button onClick={()=>addSubtype(ct._id,type._id)}
                              disabled={savingSub===`${ct._id}_${type._id}`}
                              style={{ padding:'8px 16px', background:'linear-gradient(135deg,#4F46E5,#6366F1)', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.82rem', display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
                              {savingSub===`${ct._id}_${type._id}`?<><div className="spinner"/>Adding...</>:<><Plus size={13}/>Add Subtype</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add new type */}
                  <div style={{ display:'flex', gap:8, alignItems:'center', padding:'12px', background:'rgba(255,255,255,0.5)', borderRadius:10, border:'1.5px dashed rgba(79,70,229,0.2)' }}>
                    <span style={{ fontSize:'0.82rem', color:'#4F46E5', fontWeight:600, whiteSpace:'nowrap' }}>+ Add Type:</span>
                    <input value={newTypeName[ct._id]||''}
                      onChange={e=>setNewTypeName(p=>({...p,[ct._id]:e.target.value}))}
                      placeholder="e.g. Half Sleeve, Backless..."
                      style={{ ...inputStyle, flex:1, padding:'8px 12px', fontSize:'0.85rem' }}
                      onKeyDown={e=>e.key==='Enter'&&addType(ct._id)} />
                    <button onClick={()=>addType(ct._id)} disabled={savingType===ct._id}
                      style={{ padding:'8px 16px', background:'linear-gradient(135deg,#4F46E5,#6366F1)', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.82rem', display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
                      {savingType===ct._id?<><div className="spinner"/>Adding...</>:<><Plus size={13}/>Add</>}
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