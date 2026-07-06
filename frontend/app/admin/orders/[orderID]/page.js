'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, Save, Trash2, ChevronRight } from 'lucide-react'
import { adminAPI as API } from '../../../../lib/api'
import NumInput from '../../../../components/NumInput'

const STAGES      = ['Booking','Cutting','Stitching','Finishing','Ready For Delivery','Delivered']
const STAGE_ICONS = { 'Booking':'📘','Cutting':'✂️','Stitching':'🧵','Finishing':'🚩','Ready For Delivery':'✅','Delivered':'🚚' }
const MEASUREMENT_FIELDS = ['shoulder','chest','waist','hip','sleeve','length','neck','custom']

export default function OrderDetail() {
  const router   = useRouter()
  const pathname = usePathname()
  const orderID  = pathname?.split('/').pop()

  const [order, setOrder]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [form, setForm]         = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    if (orderID && orderID !== 'undefined') fetchOrder()
  }, [orderID])

  const fetchOrder = async () => {
    try {
      const res = await API.get(`/api/orders/${orderID}`)
      const o   = res.data.order
      setOrder(o)
      setForm({
        clothType:           o.clothType,
        quantity:            o.quantity            || 1,
        unitCost:            o.unitCost            || 0,
        amountSettled:       o.amountSettled       || 0,
        fabricNotes:         o.fabricNotes         || '',
        specialInstructions: o.specialInstructions || '',
        deliveryDate:        o.deliveryDate ? new Date(o.deliveryDate).toISOString().split('T')[0] : '',
        measurements:        o.measurements        || {},
        alteration:          o.alteration          || { required:false, notes:'' },
        status:              o.status,
      })
    } catch (e) {
      setError('Order not found')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if ((form.amountSettled||0) > (form.unitCost||0)) {
      setError('Amount settled cannot exceed order cost')
      return
    }
    setSaving(true); setError(''); setSuccess('')
    try {
      await API.put(`/api/orders/${orderID}`, form)
      setSuccess('Order updated successfully!')
      fetchOrder()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update')
    } finally { setSaving(false) }
  }

  const handleStatusChange = async (status) => {
    try {
      await API.patch(`/api/orders/${orderID}/status`, { status })
      setForm(f => ({ ...f, status }))
      setOrder(o => ({ ...o, status }))
      setSuccess(`Status updated to "${status}"`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError('Failed to update status') }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete order ${orderID}? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await API.delete(`/api/orders/${orderID}`)
      router.push('/admin/dashboard')
    } catch (e) { setError('Failed to delete'); setDeleting(false) }
  }

  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:'3px solid rgba(79,70,229,0.2)', borderTopColor:'#4F46E5', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  if (!order || !form) return (
    <main style={{ padding:24 }}><p style={{ color:'#EF4444' }}>Order not found.</p></main>
  )

  const stageIndex = STAGES.indexOf(form.status)
  const balance    = Math.max((form.unitCost||0) - (form.amountSettled||0), 0)

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:900, margin:'0 auto' }}>

      {/* Top Bar */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')} style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}><ArrowLeft size={20} /></button>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Order: {orderID}</h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>{order.customerRef?.name} · {order.customerID}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger" style={{ padding:'9px 16px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:5 }}>
            <Trash2 size={14} />{deleting?'Deleting...':'Delete'}
          </button>
          <button
            onClick={() => router.push(`/admin/allotment/${orderID}`)}
            style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(79,70,229,0.08)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:8, padding:'9px 16px', color:'#4F46E5', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            ✂️ Allotment
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding:'9px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:5 }}>
            {saving?<><div className="spinner"/>Saving...</>:<><Save size={14}/>Save Changes</>}
          </button>
        </div>
      </div>

      {error   && <div style={{ background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'11px 16px', marginBottom:16, color:'#DC2626', fontSize:'0.87rem' }}>{error}</div>}
      {success && <div style={{ background:'rgba(16,185,129,0.08)', border:'1.5px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'11px 16px', marginBottom:16, color:'#059669', fontSize:'0.87rem' }}>✅ {success}</div>}

      <div style={{ display:'grid', gap:20 }}>

        {/* Stage Tracker */}
        <div className="glass fade-up" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:20, fontSize:'0.95rem' }}>Order Stage</h2>
          <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:4 }}>
            {STAGES.map((stage, i) => {
              const done = i < stageIndex; const current = i === stageIndex
              return (
                <div key={stage} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <button onClick={() => handleStatusChange(stage)}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'10px 14px', borderRadius:10, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.75rem',
                      border:current?'2px solid #4F46E5':done?'2px solid #10B981':'1.5px solid rgba(79,70,229,0.15)',
                      background:current?'rgba(79,70,229,0.1)':done?'rgba(16,185,129,0.08)':'rgba(255,255,255,0.6)',
                      color:current?'#4F46E5':done?'#059669':'#9CA3AF', transition:'all 0.2s' }}>
                    <span style={{ fontSize:'1.2rem' }}>{STAGE_ICONS[stage]}</span>{stage}
                  </button>
                  {i < STAGES.length-1 && <ChevronRight size={14} color={done?'#10B981':'#D1D5DB'} />}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop:16, background:'rgba(79,70,229,0.08)', borderRadius:999, height:8, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${((stageIndex+1)/STAGES.length)*100}%`, background:'linear-gradient(90deg,#4F46E5,#00D4FF)', borderRadius:999, transition:'width 0.5s ease' }} />
          </div>
          <p style={{ fontSize:'0.75rem', color:'#6B7280', marginTop:6 }}>{Math.round(((stageIndex+1)/STAGES.length)*100)}% complete</p>
        </div>

        {/* Payment */}
        <div className="glass fade-up-1" style={{ padding:24, background:'rgba(16,185,129,0.02)', border:'1.5px solid rgba(16,185,129,0.15)' }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>💰 Order Payment</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
            <div>
              <label className="input-label">ORDER COST (₹)</label>
              <NumInput
                prefix="₹"
                value={form.unitCost}
                onChange={val => setForm({ ...form, unitCost: val })}
                placeholder="0"
                style={{ border:'1.5px solid rgba(16,185,129,0.25)' }}
              />
            </div>
            <div>
              <label className="input-label">AMOUNT SETTLED (₹)</label>
              <NumInput
                prefix="₹"
                value={form.amountSettled}
                onChange={val => setForm({ ...form, amountSettled: val })}
                placeholder="0"
                style={{ border:'1.5px solid rgba(16,185,129,0.25)' }}
              />
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
          <p style={{ fontSize:'0.75rem', color:'#6B7280', marginTop:12 }}>ℹ️ Saving updates the customer's total pending in dashboard automatically.</p>
        </div>

        {/* Order Details */}
        <div className="glass fade-up-1" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>Order Details</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
            <div>
              <label className="input-label">CLOTH TYPE</label>
              <select value={form.clothType} onChange={e => setForm({...form,clothType:e.target.value})}
                style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none' }}>
                {['Blouse','Chudi','Saree Blouse','Shirt','Pant','Lehenga','Kids Dress','Custom Dress'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">QUANTITY</label>
              <NumInput
                value={form.quantity}
                onChange={val => setForm({ ...form, quantity: Math.max(1, Math.round(val)) })}
                placeholder="1"
                min={1}
              />
            </div>
            <div>
              <label className="input-label">DELIVERY DATE</label>
              <input type="date" value={form.deliveryDate} onChange={e => setForm({...form,deliveryDate:e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="input-label">FABRIC NOTES</label>
              <input type="text" value={form.fabricNotes} onChange={e => setForm({...form,fabricNotes:e.target.value})} placeholder="Fabric notes" className="input-field" />
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <label className="input-label">SPECIAL INSTRUCTIONS</label>
            <textarea value={form.specialInstructions} onChange={e => setForm({...form,specialInstructions:e.target.value})} rows={3}
              style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none', resize:'vertical' }} />
          </div>
        </div>

        {/* Measurements */}
        <div className="glass fade-up-2" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>Measurements <span style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:400 }}>(inches)</span></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
            {MEASUREMENT_FIELDS.map(field => (
              <div key={field}>
                <label className="input-label">{field.toUpperCase()}</label>
                <input type="text" value={form.measurements?.[field]||''} onChange={e => setForm({...form,measurements:{...form.measurements,[field]:e.target.value}})} placeholder={field==='custom'?'Any other':'e.g. 36'} className="input-field" />
              </div>
            ))}
          </div>
        </div>

        {/* Alteration */}
        <div className="glass fade-up-3" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>Alteration</h2>
          <div style={{ display:'flex', gap:12, marginBottom:14 }}>
            {[true,false].map(v => (
              <button key={String(v)} onClick={() => setForm({...form,alteration:{...form.alteration,required:v}})}
                style={{ padding:'10px 24px', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.85rem', cursor:'pointer',
                  border:form.alteration?.required===v?'2px solid #4F46E5':'1.5px solid rgba(79,70,229,0.2)',
                  background:form.alteration?.required===v?'rgba(79,70,229,0.1)':'rgba(255,255,255,0.7)',
                  color:form.alteration?.required===v?'#4F46E5':'#6B7280', transition:'all 0.2s' }}>
                {v?'✅ Yes':'❌ No'}
              </button>
            ))}
          </div>
          {form.alteration?.required && (
            <textarea value={form.alteration.notes||''} onChange={e => setForm({...form,alteration:{...form.alteration,notes:e.target.value}})} placeholder="e.g. Tight near waist" rows={3}
              style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none', resize:'vertical' }} />
          )}
        </div>

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}