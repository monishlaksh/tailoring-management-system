'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { employeeAPI as API } from '../../../../lib/api'

const STAGES = ['Booking','Cutting','Stitching','Finishing','Ready For Delivery']
const STAGE_ICONS = {
  'Booking':            '📘',
  'Cutting':            '✂️',
  'Stitching':          '🧵',
  'Finishing':          '🚩',
  'Ready For Delivery': '✅',
}

export default function EmployeeOrderDetail() {
  const router   = useRouter()
  const pathname = usePathname()

  // Extract orderID from URL path: /employee/orders/ORD000012
  const orderID = pathname?.split('/').pop()

  const [order, setOrder]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!localStorage.getItem('employeeToken')) {
      router.push('/employee/login')
      return
    }
    if (orderID && orderID !== 'undefined') {
      fetchOrder()
    } else {
      setError('Invalid order ID')
      setLoading(false)
    }
  }, [orderID])

  const fetchOrder = async () => {
    try {
      const res = await API.get(`/api/orders/${orderID}`)
      setOrder(res.data.order)
    } catch (e) {
      console.error('Fetch error:', e.response?.data || e.message)
      setError('Order not found or you do not have access.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (status) => {
    setError(''); setSuccess('')
    try {
      console.log('Updating status to:', status, 'for order:', orderID)
      const res = await API.patch(`/api/orders/${orderID}/status`, { status })
      setOrder(o => ({ ...o, status }))
      setSuccess(`✅ Status updated to "${status}"`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      console.error('Status update error:', e.response?.data || e.message)
      setError(e.response?.data?.message || 'Failed to update status')
    }
  }

  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{
        width:36, height:36,
        border:'3px solid rgba(245,158,11,0.2)',
        borderTopColor:'#F59E0B',
        borderRadius:'50%',
        animation:'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  if (!order) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div className="glass" style={{ padding:32, textAlign:'center', maxWidth:400 }}>
        <p style={{ fontSize:'2rem', marginBottom:12 }}>❌</p>
        <p style={{ color:'#DC2626', fontWeight:600, marginBottom:16 }}>{error || 'Order not found'}</p>
        <button
          onClick={() => router.push('/employee/dashboard')}
          style={{ padding:'10px 24px', background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, cursor:'pointer' }}>
          ← Back to Dashboard
        </button>
      </div>
    </main>
  )

  const stageIndex = STAGES.indexOf(order.status)
  const pct        = Math.round(((stageIndex + 1) / STAGES.length) * 100)

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:800, margin:'0 auto' }}>

      {/* Top bar */}
      <div className="glass" style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 24px', marginBottom:24, borderTop:'3px solid #F59E0B',
        flexWrap:'wrap', gap:12,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button
            onClick={() => router.push('/employee/dashboard')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#D97706', display:'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>
              Order: {order.orderID}
            </h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
              {order.customerRef?.name} · {order.customerID}
            </p>
          </div>
        </div>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:5,
          padding:'5px 12px', borderRadius:999,
          background:'rgba(245,158,11,0.1)',
          border:'1px solid rgba(245,158,11,0.2)',
          fontSize:'0.73rem', fontWeight:600, color:'#D97706',
        }}>
          🔒 Status Editable Only
        </div>
      </div>

      {success && (
        <div style={{
          background:'rgba(16,185,129,0.08)', border:'1.5px solid rgba(16,185,129,0.2)',
          borderRadius:10, padding:'11px 16px', marginBottom:16,
          color:'#059669', fontSize:'0.87rem', fontWeight:500,
        }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{
          background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)',
          borderRadius:10, padding:'11px 16px', marginBottom:16,
          color:'#DC2626', fontSize:'0.87rem',
        }}>
          {error}
        </div>
      )}

      <div style={{ display:'grid', gap:20 }}>

        {/* Stage Updater */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:20, fontSize:'0.95rem' }}>
            Update Order Stage
          </h2>
          <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6 }}>
            {STAGES.map((stage, i) => {
              const done    = i <  stageIndex
              const current = i === stageIndex
              return (
                <div key={stage} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <button
                    onClick={() => handleStatusChange(stage)}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                      padding:'10px 12px', borderRadius:10, cursor:'pointer',
                      fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.72rem',
                      border:  current ? '2px solid #F59E0B' : done ? '2px solid #10B981' : '1.5px solid rgba(79,70,229,0.15)',
                      background: current ? 'rgba(245,158,11,0.1)' : done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.6)',
                      color:   current ? '#D97706' : done ? '#059669' : '#9CA3AF',
                      transition:'all 0.2s',
                    }}>
                    <span style={{ fontSize:'1.1rem' }}>{STAGE_ICONS[stage]}</span>
                    {stage}
                  </button>
                  {i < STAGES.length - 1 && (
                    <ChevronRight size={13} color={done ? '#10B981' : '#D1D5DB'} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress bar */}
          <div style={{
            marginTop:16, background:'rgba(245,158,11,0.08)',
            borderRadius:999, height:8, overflow:'hidden',
          }}>
            <div style={{
              height:'100%', width:`${pct}%`,
              background:'linear-gradient(90deg,#F59E0B,#D97706)',
              borderRadius:999, transition:'width 0.5s ease',
            }} />
          </div>
          <p style={{ fontSize:'0.75rem', color:'#6B7280', marginTop:6 }}>
            {pct}% complete · Current: <strong>{order.status}</strong>
          </p>
        </div>

        {/* Order Info — read only */}
        <div className="glass" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>
            Order Details <span style={{ fontSize:'0.72rem', color:'#9CA3AF', fontWeight:400 }}>(read only)</span>
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
            {[
              { label:'Order ID',      value: order.orderID },
              { label:'Cloth Type',    value: order.clothType },
              { label:'Quantity',      value: order.quantity },
              { label:'Customer',      value: order.customerRef?.name },
              { label:'Phone',         value: order.customerRef?.phone },
              { label:'Booking Date',  value: order.bookingDate  ? new Date(order.bookingDate).toLocaleDateString('en-IN')  : '—' },
              { label:'Delivery Date', value: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : '—' },
              { label:'Fabric Notes',  value: order.fabricNotes || '—' },
            ].map((item, i) => (
              <div key={i} style={{
                background:'rgba(255,255,255,0.6)',
                borderRadius:8, padding:'10px 12px',
              }}>
                <p style={{
                  fontSize:'0.68rem', color:'#9CA3AF',
                  fontWeight:600, textTransform:'uppercase', marginBottom:3,
                }}>
                  {item.label}
                </p>
                <p style={{ fontSize:'0.85rem', color:'#1E1B4B', fontWeight:600 }}>
                  {item.value || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Measurements */}
        {order.measurements && Object.values(order.measurements).some(v => v) && (
          <div className="glass" style={{ padding:24 }}>
            <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>
              Measurements
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10 }}>
              {Object.entries(order.measurements)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} style={{
                    background:'rgba(245,158,11,0.05)',
                    border:'1px solid rgba(245,158,11,0.15)',
                    borderRadius:8, padding:'10px 12px',
                  }}>
                    <p style={{ fontSize:'0.68rem', color:'#9CA3AF', textTransform:'uppercase', fontWeight:600 }}>{k}</p>
                    <p style={{ fontSize:'0.95rem', color:'#1E1B4B', fontWeight:700 }}>{v}"</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="glass" style={{ padding:24 }}>
            <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:10, fontSize:'0.95rem' }}>
              Special Instructions
            </h2>
            <p style={{ color:'#4B5563', fontSize:'0.88rem', lineHeight:1.7 }}>
              {order.specialInstructions}
            </p>
          </div>
        )}

        {/* Alteration */}
        {order.alteration?.required && (
          <div className="glass" style={{
            padding:24,
            background:'rgba(245,158,11,0.04)',
            border:'1.5px solid rgba(245,158,11,0.2)',
          }}>
            <h2 style={{ fontWeight:700, color:'#D97706', marginBottom:10, fontSize:'0.95rem' }}>
              ⚠️ Alteration Required
            </h2>
            <p style={{ color:'#4B5563', fontSize:'0.88rem' }}>
              {order.alteration.notes || 'No notes provided'}
            </p>
          </div>
        )}

      </div>
    </main>
  )
}