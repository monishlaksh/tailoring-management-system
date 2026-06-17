'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit2, X, Check } from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'
import NumInput from '../../../components/NumInput'

export default function AlterationOptionsPage() {
  const router  = useRouter()
  const [options, setOptions]     = useState([])
  const [clothTypes, setClothTypes] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [showNew, setShowNew]     = useState(false)
  const [editing, setEditing]     = useState(null)
  const [savingNew, setSavingNew] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const emptyForm = { name:'', description:'', extraCost:0, clothTypes:[] }
  const [newForm, setNewForm]   = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [optRes, ctRes] = await Promise.all([
        API.get('/api/alteration-options/all'),
        API.get('/api/cloth-types'),
      ])
      setOptions(optRes.data.options)
      setClothTypes(ctRes.data.clothTypes)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const showMsg = (msg, isErr=false) => {
    if (isErr) { setError(msg);   setTimeout(()=>setError(''),3000) }
    else       { setSuccess(msg); setTimeout(()=>setSuccess(''),3000) }
  }

  const toggleClothType = (form, setForm, ctName) => {
    const current = form.clothTypes || []
    const updated = current.includes(ctName)
      ? current.filter(c => c !== ctName)
      : [...current, ctName]
    setForm({ ...form, clothTypes:updated })
  }

  const handleCreate = async () => {
    if (!newForm.name.trim()) { showMsg('Name is required', true); return }
    setSavingNew(true)
    try {
      await API.post('/api/alteration-options', newForm)
      setNewForm(emptyForm)
      setShowNew(false)
      fetchData()
      showMsg('Alteration option created!')
    } catch (e) { showMsg(e.response?.data?.message||'Failed', true) }
    finally { setSavingNew(false) }
  }

  const handleUpdate = async (id) => {
    setSavingEdit(true)
    try {
      await API.put(`/api/alteration-options/${id}`, editForm)
      setEditing(null)
      fetchData()
      showMsg('Updated!')
    } catch (e) { showMsg('Failed', true) }
    finally { setSavingEdit(false) }
  }

  const handleToggle = async (opt) => {
    try {
      await API.put(`/api/alteration-options/${opt._id}`, { isActive:!opt.isActive })
      fetchData()
      showMsg(`${opt.name} ${opt.isActive?'deactivated':'activated'}!`)
    } catch (e) { showMsg('Failed', true) }
  }

  const ClothTypeSelector = ({ form, setForm }) => (
    <div>
      <label className="input-label">
        APPLIES TO CLOTH TYPES
        <span style={{ fontSize:'0.68rem', color:'#9CA3AF',
          fontWeight:400, marginLeft:6 }}>
          (leave empty = applies to ALL cloth types)
        </span>
      </label>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
        {clothTypes.map(ct => {
          const selected = (form.clothTypes||[]).includes(ct.name)
          return (
            <button key={ct._id} type="button"
              onClick={() => toggleClothType(form, setForm, ct.name)}
              style={{ padding:'5px 12px', borderRadius:999,
                fontFamily:'Poppins,sans-serif', fontWeight:600,
                fontSize:'0.78rem', cursor:'pointer',
                border:   selected ? '2px solid #4F46E5' : '1.5px solid rgba(79,70,229,0.2)',
                background: selected ? 'rgba(79,70,229,0.1)' : 'rgba(255,255,255,0.7)',
                color:    selected ? '#4F46E5' : '#6B7280',
                transition:'all 0.15s' }}>
              {selected && '✓ '}{ct.name}
            </button>
          )
        })}
      </div>
      {(form.clothTypes||[]).length === 0 && (
        <p style={{ fontSize:'0.72rem', color:'#059669',
          marginTop:6, fontWeight:500 }}>
          ✅ Will appear for all cloth types
        </p>
      )}
      {(form.clothTypes||[]).length > 0 && (
        <p style={{ fontSize:'0.72rem', color:'#4F46E5',
          marginTop:6, fontWeight:500 }}>
          Only for: {form.clothTypes.join(', ')}
        </p>
      )}
    </div>
  )

  return (
    <main style={{ minHeight:'100vh', padding:'24px',
      maxWidth:900, margin:'0 auto' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'14px 24px',
        marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ background:'none', border:'none',
              cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>
              Alteration Options
            </h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
              Set which cloth types each alteration applies to
            </p>
          </div>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary"
          style={{ padding:'9px 18px', fontSize:'0.82rem',
            display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={15} /> Add Option
        </button>
      </div>

      {error   && <div style={{ background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'11px 16px', marginBottom:16, color:'#DC2626', fontSize:'0.87rem' }}>{error}</div>}
      {success && <div style={{ background:'rgba(16,185,129,0.08)', border:'1.5px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'11px 16px', marginBottom:16, color:'#059669', fontSize:'0.87rem' }}>✅ {success}</div>}

      {/* New option form */}
      {showNew && (
        <div className="glass" style={{ padding:24, marginBottom:20,
          border:'1.5px solid rgba(79,70,229,0.2)' }}>
          <p style={{ fontWeight:700, color:'#1E1B4B',
            marginBottom:16, fontSize:'0.9rem' }}>
            New Alteration Option
          </p>
          <div style={{ display:'grid', gap:14 }}>
            <div>
              <label className="input-label">OPTION NAME *</label>
              <input type="text" value={newForm.name}
                onChange={e => setNewForm({...newForm,name:e.target.value})}
                placeholder="e.g. Low Neck, Short Sleeve..."
                className="input-field" />
            </div>
            <div>
              <label className="input-label">DESCRIPTION</label>
              <textarea value={newForm.description}
                onChange={e => setNewForm({...newForm,description:e.target.value})}
                placeholder="Brief description..." rows={2}
                style={{ width:'100%', padding:'12px 16px',
                  background:'rgba(255,255,255,0.8)',
                  border:'1.5px solid rgba(79,70,229,0.2)',
                  borderRadius:10, fontFamily:'Poppins,sans-serif',
                  fontSize:'0.9rem', color:'#1E1B4B',
                  outline:'none', resize:'vertical' }} />
            </div>
            <div style={{ maxWidth:200 }}>
              <label className="input-label">EXTRA COST (₹)</label>
              <NumInput prefix="₹" value={newForm.extraCost}
                onChange={val => setNewForm({...newForm,extraCost:val})}
                style={{ border:'1.5px solid rgba(79,70,229,0.2)' }} />
            </div>
            <ClothTypeSelector form={newForm} setForm={setNewForm} />
          </div>
          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <button onClick={handleCreate} disabled={savingNew}
              className="btn-primary"
              style={{ padding:'11px 24px', display:'flex',
                alignItems:'center', gap:6 }}>
              {savingNew
                ? <><div className="spinner"/>Saving...</>
                : <><Check size={15}/>Add Option</>}
            </button>
            <button onClick={() => { setShowNew(false); setNewForm(emptyForm) }}
              className="btn-ghost" style={{ padding:'11px 20px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Options list */}
      {loading ? (
        <p style={{ textAlign:'center', color:'#9CA3AF',
          padding:'40px 0' }}>Loading...</p>
      ) : options.length === 0 ? (
        <div className="glass" style={{ textAlign:'center', padding:48 }}>
          <p style={{ fontSize:'2rem', marginBottom:12 }}>✂️</p>
          <p style={{ color:'#6B7280', marginBottom:16 }}>
            No alteration options yet.
          </p>
          <button onClick={() => setShowNew(true)} className="btn-primary"
            style={{ padding:'10px 24px' }}>
            + Add First Option
          </button>
        </div>
      ) : (
        <div style={{ display:'grid', gap:10 }}>
          {options.map(opt => (
            <div key={opt._id} className="glass"
              style={{ overflow:'hidden',
                border:opt.isActive
                  ? '1.5px solid rgba(255,255,255,0.8)'
                  : '1.5px solid rgba(239,68,68,0.15)' }}>

              {editing === opt._id ? (
                <div style={{ padding:'20px' }}>
                  <div style={{ display:'grid', gap:12, marginBottom:14 }}>
                    <div>
                      <label className="input-label">NAME</label>
                      <input type="text" value={editForm.name}
                        onChange={e => setEditForm({...editForm,name:e.target.value})}
                        className="input-field" />
                    </div>
                    <div>
                      <label className="input-label">DESCRIPTION</label>
                      <textarea value={editForm.description}
                        onChange={e => setEditForm({...editForm,description:e.target.value})}
                        rows={2}
                        style={{ width:'100%', padding:'12px 16px',
                          background:'rgba(255,255,255,0.8)',
                          border:'1.5px solid rgba(79,70,229,0.2)',
                          borderRadius:10, fontFamily:'Poppins,sans-serif',
                          fontSize:'0.9rem', color:'#1E1B4B',
                          outline:'none', resize:'vertical' }} />
                    </div>
                    <div style={{ maxWidth:200 }}>
                      <label className="input-label">EXTRA COST (₹)</label>
                      <NumInput prefix="₹" value={editForm.extraCost}
                        onChange={val => setEditForm({...editForm,extraCost:val})}
                        style={{ border:'1.5px solid rgba(79,70,229,0.2)' }} />
                    </div>
                    <ClothTypeSelector form={editForm} setForm={setEditForm} />
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => handleUpdate(opt._id)}
                      disabled={savingEdit}
                      style={{ padding:'9px 20px',
                        background:'linear-gradient(135deg,#10B981,#059669)',
                        color:'white', border:'none', borderRadius:10,
                        fontFamily:'Poppins,sans-serif', fontWeight:600,
                        fontSize:'0.85rem', cursor:'pointer',
                        display:'flex', alignItems:'center', gap:6 }}>
                      {savingEdit
                        ? <><div className="spinner"/>Saving...</>
                        : <><Check size={14}/>Save</>}
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="btn-ghost" style={{ padding:'9px 16px' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding:'16px 20px', display:'flex',
                  alignItems:'center', justifyContent:'space-between',
                  flexWrap:'wrap', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center',
                      gap:10, marginBottom:4, flexWrap:'wrap' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%',
                        background:opt.isActive?'#10B981':'#EF4444',
                        flexShrink:0 }} />
                      <span style={{ fontWeight:700, fontSize:'0.95rem',
                        color:opt.isActive?'#1E1B4B':'#9CA3AF' }}>
                        {opt.name}
                      </span>
                      {(opt.extraCost||0) > 0 && (
                        <span style={{ fontSize:'0.75rem', fontWeight:700,
                          color:'#059669', padding:'2px 8px',
                          background:'rgba(16,185,129,0.1)', borderRadius:999 }}>
                          +₹{opt.extraCost.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {opt.description && (
                      <p style={{ fontSize:'0.8rem', color:'#6B7280',
                        marginLeft:18, marginBottom:4 }}>
                        {opt.description}
                      </p>
                    )}
                    {/* Cloth type tags */}
                    <div style={{ marginLeft:18, display:'flex',
                      flexWrap:'wrap', gap:4 }}>
                      {(!opt.clothTypes || opt.clothTypes.length === 0) ? (
                        <span style={{ fontSize:'0.68rem', padding:'2px 8px',
                          borderRadius:999, background:'rgba(16,185,129,0.08)',
                          color:'#059669', fontWeight:600 }}>
                          All cloth types
                        </span>
                      ) : (
                        opt.clothTypes.map(ct => (
                          <span key={ct} style={{ fontSize:'0.68rem',
                            padding:'2px 8px', borderRadius:999,
                            background:'rgba(79,70,229,0.08)',
                            color:'#4F46E5', fontWeight:600 }}>
                            {ct}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => {
                      setEditing(opt._id)
                      setEditForm({
                        name:        opt.name,
                        description: opt.description||'',
                        extraCost:   opt.extraCost||0,
                        clothTypes:  opt.clothTypes||[],
                      })
                    }}
                      style={{ background:'rgba(79,70,229,0.08)',
                        border:'1px solid rgba(79,70,229,0.2)',
                        borderRadius:8, padding:'6px 12px',
                        color:'#4F46E5', fontSize:'0.78rem',
                        fontWeight:600, cursor:'pointer',
                        fontFamily:'Poppins,sans-serif',
                        display:'flex', alignItems:'center', gap:4 }}>
                      <Edit2 size={12}/> Edit
                    </button>
                    <button onClick={() => handleToggle(opt)}
                      style={{ background:opt.isActive
                        ? 'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)',
                        border:`1px solid ${opt.isActive
                          ? 'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}`,
                        borderRadius:8, padding:'6px 12px',
                        color:opt.isActive?'#DC2626':'#059669',
                        fontSize:'0.78rem', fontWeight:600,
                        cursor:'pointer',
                        fontFamily:'Poppins,sans-serif' }}>
                      {opt.isActive?'Deactivate':'Activate'}
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