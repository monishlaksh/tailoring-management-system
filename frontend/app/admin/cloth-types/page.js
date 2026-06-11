'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'
import NumInput from '../../../components/NumInput'

export default function ClothTypesPage() {
  const router = useRouter()
  const [clothTypes, setClothTypes]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [expanded, setExpanded]         = useState(null)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')

  // New cloth type
  const [showNewType, setShowNewType]   = useState(false)
  const [newTypeName, setNewTypeName]   = useState('')
  const [savingType, setSavingType]     = useState(false)

  // Edit cloth type name
  const [editingType, setEditingType]   = useState(null)
  const [editTypeName, setEditTypeName] = useState('')

  // New subtype per cloth type
  const [newSubtype, setNewSubtype]     = useState({})   // { [typeId]: { name, cost } }
  const [savingSubtype, setSavingSubtype] = useState(null)

  // Edit subtype
  const [editingSubtype, setEditingSubtype] = useState(null) // { typeId, subtypeId }
  const [editSubtypeData, setEditSubtypeData] = useState({ name:'', cost:0 })

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchClothTypes()
  }, [])

  const fetchClothTypes = async () => {
    try {
      const res = await API.get('/api/cloth-types/all')
      setClothTypes(res.data.clothTypes)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const showMsg = (msg, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(''), 3000) }
    else         { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
  }

  // Create cloth type
  const handleCreateType = async () => {
    if (!newTypeName.trim()) { showMsg('Name is required', true); return }
    setSavingType(true)
    try {
      await API.post('/api/cloth-types', { name: newTypeName.trim() })
      setNewTypeName('')
      setShowNewType(false)
      fetchClothTypes()
      showMsg('Cloth type created!')
    } catch (e) { showMsg(e.response?.data?.message || 'Failed', true) }
    finally { setSavingType(false) }
  }

  // Toggle active
  const handleToggleType = async (ct) => {
    try {
      await API.put(`/api/cloth-types/${ct._id}`, { isActive: !ct.isActive })
      fetchClothTypes()
      showMsg(`${ct.name} ${ct.isActive ? 'deactivated' : 'activated'}!`)
    } catch (e) { showMsg('Failed', true) }
  }

  // Update type name
  const handleUpdateTypeName = async (ct) => {
    if (!editTypeName.trim()) return
    try {
      await API.put(`/api/cloth-types/${ct._id}`, { name: editTypeName.trim() })
      setEditingType(null)
      fetchClothTypes()
      showMsg('Name updated!')
    } catch (e) { showMsg(e.response?.data?.message || 'Failed', true) }
  }

  // Add subtype
  const handleAddSubtype = async (typeId) => {
    const sub = newSubtype[typeId] || { name:'', cost:0 }
    if (!sub.name?.trim()) { showMsg('Subtype name is required', true); return }
    setSavingSubtype(typeId)
    try {
      await API.post(`/api/cloth-types/${typeId}/subtypes`, {
        name: sub.name.trim(),
        cost: parseFloat(sub.cost) || 0,
      })
      setNewSubtype(prev => ({ ...prev, [typeId]: { name:'', cost:0 } }))
      fetchClothTypes()
      showMsg('Subtype added!')
    } catch (e) { showMsg(e.response?.data?.message || 'Failed', true) }
    finally { setSavingSubtype(null) }
  }

  // Update subtype
  const handleUpdateSubtype = async (typeId, subtypeId) => {
    try {
      await API.put(`/api/cloth-types/${typeId}/subtypes/${subtypeId}`, editSubtypeData)
      setEditingSubtype(null)
      fetchClothTypes()
      showMsg('Subtype updated!')
    } catch (e) { showMsg('Failed', true) }
  }

  // Delete subtype
  const handleDeleteSubtype = async (typeId, subtypeId, subtypeName) => {
    if (!confirm(`Remove subtype "${subtypeName}"?`)) return
    try {
      await API.delete(`/api/cloth-types/${typeId}/subtypes/${subtypeId}`)
      fetchClothTypes()
      showMsg('Subtype removed!')
    } catch (e) { showMsg('Failed', true) }
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
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>Manage cloth types and their subtypes with costs</p>
          </div>
        </div>
        <button onClick={() => setShowNewType(!showNewType)} className="btn-primary"
          style={{ padding:'9px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={15} /> Add Cloth Type
        </button>
      </div>

      {/* Messages */}
      {error   && <div style={{ background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'11px 16px', marginBottom:16, color:'#DC2626', fontSize:'0.87rem' }}>{error}</div>}
      {success && <div style={{ background:'rgba(16,185,129,0.08)', border:'1.5px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'11px 16px', marginBottom:16, color:'#059669', fontSize:'0.87rem' }}>✅ {success}</div>}

      {/* New cloth type input */}
      {showNewType && (
        <div className="glass" style={{ padding:20, marginBottom:20, border:'1.5px solid rgba(79,70,229,0.2)' }}>
          <p style={{ fontWeight:600, color:'#1E1B4B', marginBottom:14, fontSize:'0.9rem' }}>New Cloth Type</p>
          <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
            <div style={{ flex:1 }}>
              <label className="input-label">CLOTH TYPE NAME</label>
              <input type="text" value={newTypeName} onChange={e => setNewTypeName(e.target.value)}
                placeholder="e.g. Kurta, Salwar..."
                className="input-field"
                onKeyDown={e => e.key==='Enter' && handleCreateType()}
              />
            </div>
            <button onClick={handleCreateType} disabled={savingType} className="btn-primary"
              style={{ padding:'13px 20px', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
              {savingType ? <><div className="spinner" />Adding...</> : <><Check size={15} />Add</>}
            </button>
            <button onClick={() => { setShowNewType(false); setNewTypeName('') }} className="btn-ghost"
              style={{ padding:'13px 16px' }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Cloth Types List */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'48px 0', color:'#9CA3AF' }}>Loading...</div>
      ) : clothTypes.length === 0 ? (
        <div className="glass" style={{ textAlign:'center', padding:'48px' }}>
          <p style={{ fontSize:'2.5rem', marginBottom:12 }}>✂️</p>
          <p style={{ color:'#6B7280', marginBottom:16 }}>No cloth types yet.</p>
          <button onClick={() => setShowNewType(true)} className="btn-primary" style={{ padding:'10px 24px' }}>+ Add First Cloth Type</button>
        </div>
      ) : (
        <div style={{ display:'grid', gap:14 }}>
          {clothTypes.map(ct => {
            const isOpen = expanded === ct._id
            return (
              <div key={ct._id} className="glass" style={{ overflow:'hidden', border: ct.isActive?'1.5px solid rgba(255,255,255,0.8)':'1.5px solid rgba(239,68,68,0.15)' }}>

                {/* Cloth type header */}
                <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
                    {/* Edit name inline */}
                    {editingType === ct._id ? (
                      <div style={{ display:'flex', gap:8, alignItems:'center', flex:1 }}>
                        <input type="text" value={editTypeName} onChange={e => setEditTypeName(e.target.value)}
                          className="input-field" style={{ maxWidth:220 }}
                          onKeyDown={e => e.key==='Enter' && handleUpdateTypeName(ct)}
                          autoFocus
                        />
                        <button onClick={() => handleUpdateTypeName(ct)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#059669', display:'flex' }}>
                          <Check size={18} />
                        </button>
                        <button onClick={() => setEditingType(null)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontWeight:700, color: ct.isActive?'#1E1B4B':'#9CA3AF', fontSize:'1rem' }}>
                          {ct.name}
                        </span>
                        <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:999, background:ct.isActive?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color:ct.isActive?'#059669':'#DC2626', fontWeight:600 }}>
                          {ct.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>
                          {ct.subtypes.filter(s=>s.isActive).length} subtype{ct.subtypes.filter(s=>s.isActive).length!==1?'s':''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <button onClick={() => { setEditingType(ct._id); setEditTypeName(ct.name) }}
                      style={{ background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:8, padding:'6px 12px', color:'#4F46E5', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:4 }}>
                      <Edit2 size={12} /> Rename
                    </button>
                    <button onClick={() => handleToggleType(ct)}
                      style={{ background:ct.isActive?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)', border:`1px solid ${ct.isActive?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}`, borderRadius:8, padding:'6px 12px', color:ct.isActive?'#DC2626':'#059669', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                      {ct.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : ct._id)}
                      style={{ background:'rgba(79,70,229,0.06)', border:'1px solid rgba(79,70,229,0.15)', borderRadius:8, padding:'6px 12px', color:'#4F46E5', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:'0.78rem', fontWeight:600, fontFamily:'Poppins,sans-serif' }}>
                      Subtypes {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Subtypes panel */}
                {isOpen && (
                  <div style={{ borderTop:'1px solid rgba(79,70,229,0.1)', padding:'20px', background:'rgba(79,70,229,0.02)' }}>

                    {/* Existing subtypes */}
                    {ct.subtypes.length === 0 ? (
                      <p style={{ color:'#9CA3AF', fontSize:'0.85rem', marginBottom:16 }}>No subtypes yet. Add one below.</p>
                    ) : (
                      <div style={{ display:'grid', gap:8, marginBottom:20 }}>
                        {ct.subtypes.map(sub => (
                          <div key={sub._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'rgba(255,255,255,0.7)', borderRadius:10, border:`1px solid ${sub.isActive?'rgba(79,70,229,0.1)':'rgba(239,68,68,0.1)'}`, flexWrap:'wrap', gap:10 }}>

                            {editingSubtype?.typeId === ct._id && editingSubtype?.subtypeId === sub._id ? (
                              /* Edit mode */
                              <div style={{ display:'flex', gap:10, alignItems:'center', flex:1, flexWrap:'wrap' }}>
                                <div>
                                  <label className="input-label" style={{ fontSize:'0.65rem' }}>NAME</label>
                                  <input type="text" value={editSubtypeData.name}
                                    onChange={e => setEditSubtypeData({...editSubtypeData, name:e.target.value})}
                                    className="input-field" style={{ width:140, padding:'8px 12px' }} />
                                </div>
                                <div>
                                  <label className="input-label" style={{ fontSize:'0.65rem' }}>COST (₹)</label>
                                  <NumInput prefix="₹"
                                    value={editSubtypeData.cost}
                                    onChange={val => setEditSubtypeData({...editSubtypeData, cost:val})}
                                    style={{ width:120, padding:'8px 12px 8px 24px', border:'1.5px solid rgba(79,70,229,0.2)' }}
                                  />
                                </div>
                                <div style={{ display:'flex', gap:6, alignSelf:'flex-end' }}>
                                  <button onClick={() => handleUpdateSubtype(ct._id, sub._id)}
                                    style={{ padding:'8px 14px', background:'linear-gradient(135deg,#10B981,#059669)', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.8rem', display:'flex', alignItems:'center', gap:4 }}>
                                    <Check size={14} /> Save
                                  </button>
                                  <button onClick={() => setEditingSubtype(null)}
                                    style={{ padding:'8px 12px', background:'none', border:'1px solid rgba(79,70,229,0.2)', borderRadius:8, cursor:'pointer', color:'#9CA3AF' }}>
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* View mode */
                              <>
                                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                  <div style={{ width:8, height:8, borderRadius:'50%', background: sub.isActive?'#10B981':'#EF4444' }} />
                                  <span style={{ fontWeight:600, color: sub.isActive?'#1E1B4B':'#9CA3AF', fontSize:'0.9rem' }}>
                                    {sub.name}
                                  </span>
                                  <span style={{ fontSize:'0.85rem', fontWeight:700, color:'#059669' }}>
                                    ₹{(sub.cost||0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div style={{ display:'flex', gap:6 }}>
                                  <button onClick={() => { setEditingSubtype({ typeId:ct._id, subtypeId:sub._id }); setEditSubtypeData({ name:sub.name, cost:sub.cost||0 }) }}
                                    style={{ background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:6, padding:'5px 10px', color:'#4F46E5', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:3 }}>
                                    <Edit2 size={11} /> Edit
                                  </button>
                                  <button onClick={() => handleDeleteSubtype(ct._id, sub._id, sub.name)}
                                    style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, padding:'5px 10px', color:'#DC2626', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:3 }}>
                                    <Trash2 size={11} /> Remove
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new subtype */}
                    <div style={{ background:'rgba(255,255,255,0.6)', borderRadius:10, padding:'16px', border:'1.5px dashed rgba(79,70,229,0.2)' }}>
                      <p style={{ fontSize:'0.8rem', fontWeight:600, color:'#4F46E5', marginBottom:12 }}>+ Add Subtype</p>
                      <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
                        <div>
                          <label className="input-label">SUBTYPE NAME</label>
                          <input type="text"
                            value={newSubtype[ct._id]?.name || ''}
                            onChange={e => setNewSubtype(prev => ({ ...prev, [ct._id]: { ...prev[ct._id], name:e.target.value } }))}
                            placeholder="e.g. Lining, Normal..."
                            className="input-field" style={{ width:180 }}
                          />
                        </div>
                        <div>
                          <label className="input-label">COST (₹)</label>
                          <NumInput
                            prefix="₹"
                            value={newSubtype[ct._id]?.cost || 0}
                            onChange={val => setNewSubtype(prev => ({ ...prev, [ct._id]: { ...prev[ct._id], cost:val } }))}
                            placeholder="0"
                            style={{ width:130, border:'1.5px solid rgba(79,70,229,0.2)' }}
                          />
                        </div>
                        <button onClick={() => handleAddSubtype(ct._id)} disabled={savingSubtype===ct._id}
                          style={{ padding:'13px 18px', background:'linear-gradient(135deg,#4F46E5,#6366F1)', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.85rem', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
                          {savingSubtype===ct._id ? <><div className="spinner" />Adding...</> : <><Plus size={14} />Add Subtype</>}
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}