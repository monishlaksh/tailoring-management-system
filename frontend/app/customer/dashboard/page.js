'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Scissors, LogOut, User, Phone, CreditCard,
  Package, Clock, CheckCircle, ChevronRight, Calendar
} from 'lucide-react'
import API from '../../../lib/api'

const STAGES    = ['Booking','Cutting','Stitching','Finishing','Ready For Delivery']
const STAGE_ICONS = { 'Booking':'📘','Cutting':'✂️','Stitching':'🧵','Finishing':'🚩','Ready For Delivery':'✅' }

export default function CustomerDashboard() {
  const router   = useRouter()
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('customerToken')
    const user  = localStorage.getItem('customerUser')
    if (!token) { router.push('/customer/login'); return }
    if (user) setCustomer(JSON.parse(user))
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await API.get('/api/orders/my-orders')
      setOrders(res.data.orders)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleLogout = () => {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerUser')
    router.push('/customer/login')
  }

  const getDaysRemaining = (deliveryDate) => {
    const diff = new Date(deliveryDate) - new Date()
    const days = Math.ceil(diff / (1000*60*60*24))
    if (days < 0)  return { label:`${Math.abs(days)}d overdue`, color:'#EF4444' }
    if (days === 0) return { label:'Due today!', color:'#F59E0B' }
    return { label:`${days} days left`, color:'#059669' }
  }

  if (loading || !customer) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:40, height:40, border:'3px solid rgba(0,212,255,0.2)', borderTopColor:'#00D4FF', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  const inProgress = orders.filter(o => o.status !== 'Ready For Delivery').length
  const ready      = orders.filter(o => o.status === 'Ready For Delivery').length

  return (
    <main style={{ minHeight:'100vh', padding:'24px' }}>

      {/* Top Bar */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12, maxWidth:960, margin:'0 auto 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#00D4FF,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Scissors size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Tailoring Manager</h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>Customer Portal</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 14px', color:'#DC2626', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto' }}>

        {/* Profile Banner */}
        <div className="glass fade-up" style={{ padding:'28px', marginBottom:20, background:'linear-gradient(135deg,rgba(0,212,255,0.07),rgba(14,165,233,0.04))', display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg,#00D4FF,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(0,212,255,0.3)', flexShrink:0 }}>
            <User size={28} color="white" />
          </div>
          <div>
            <p style={{ fontSize:'0.78rem', color:'#6B7280', marginBottom:2 }}>Welcome back</p>
            <h2 style={{ fontSize:'1.4rem', fontWeight:800, color:'#1E1B4B', marginBottom:5 }}>{customer.name}</h2>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem', color:'#0EA5E9', fontWeight:600 }}><CreditCard size={13} />{customer.customerID}</span>
              <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem', color:'#6B7280' }}><Phone size={13} />{customer.phone}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="fade-up-1" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
          {[
            { icon:<Package size={20} color="#4F46E5" />, label:'Total Orders', value:orders.length, bg:'rgba(79,70,229,0.06)', border:'rgba(79,70,229,0.15)' },
            { icon:<Clock size={20} color="#F59E0B" />,   label:'In Progress',  value:inProgress,    bg:'rgba(245,158,11,0.06)', border:'rgba(245,158,11,0.15)' },
            { icon:<CheckCircle size={20} color="#059669" />, label:'Ready',    value:ready,         bg:'rgba(16,185,129,0.06)', border:'rgba(16,185,129,0.15)' },
          ].map((c,i) => (
            <div key={i} className="glass" style={{ padding:'20px 16px', background:c.bg, border:`1.5px solid ${c.border}` }}>
              <div style={{ marginBottom:8 }}>{c.icon}</div>
              <p style={{ fontSize:'0.72rem', color:'#6B7280', marginBottom:2, fontWeight:500 }}>{c.label}</p>
              <p style={{ fontSize:'1.7rem', fontWeight:800, color:'#1E1B4B', lineHeight:1 }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Orders */}
        <div className="glass fade-up-2" style={{ padding:24 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:18, fontSize:'0.95rem' }}>My Orders</h2>
          {orders.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 0' }}>
              <p style={{ fontSize:'2.5rem', marginBottom:12 }}>🧵</p>
              <p style={{ color:'#6B7280', fontSize:'0.9rem' }}>No orders yet. Visit the shop to place an order.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gap:12 }}>
              {orders.map(order => {
                const stageIdx = STAGES.indexOf(order.status)
                const pct      = Math.round(((stageIdx+1)/STAGES.length)*100)
                const days     = getDaysRemaining(order.deliveryDate)
                return (
                  <div key={order._id} className="glass" style={{ padding:'20px', background:'rgba(255,255,255,0.5)', cursor:'pointer', transition:'all 0.2s' }}
                    onClick={() => setSelected(selected?._id===order._id ? null : order)}
                    onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 30px rgba(0,212,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow=''}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8, marginBottom:12 }}>
                      <div>
                        <p style={{ fontWeight:700, color:'#4F46E5', fontSize:'0.9rem' }}>{order.orderID}</p>
                        <p style={{ fontWeight:600, color:'#1E1B4B', fontSize:'1rem' }}>{order.clothType}</p>
                        <p style={{ fontSize:'0.78rem', color:'#9CA3AF' }}>Qty: {order.quantity}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:999, fontSize:'0.75rem', fontWeight:600, background:'rgba(0,212,255,0.1)', color:'#0369A1' }}>
                          {STAGE_ICONS[order.status]} {order.status}
                        </span>
                        <p style={{ fontSize:'0.78rem', marginTop:5, fontWeight:600, color:days.color }}>{days.label}</p>
                      </div>
                    </div>
                    {/* Progress */}
                    <div style={{ background:'rgba(79,70,229,0.08)', borderRadius:999, height:6, overflow:'hidden', marginBottom:6 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#4F46E5,#00D4FF)', borderRadius:999 }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <p style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>{pct}% complete</p>
                      <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.72rem', color:'#6B7280' }}>
                        <Calendar size={11} /> {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : '—'}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {selected?._id === order._id && (
                      <div style={{ marginTop:16, paddingTop:16, borderTop:'1.5px solid rgba(79,70,229,0.1)' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 }}>
                          {[
                            { label:'Booking Date', value: order.bookingDate ? new Date(order.bookingDate).toLocaleDateString('en-IN') : '—' },
                            { label:'Delivery Date', value: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : '—' },
                            { label:'Fabric Notes', value: order.fabricNotes || '—' },
                            { label:'Instructions', value: order.specialInstructions || '—' },
                          ].map((item,i) => (
                            <div key={i} style={{ background:'rgba(255,255,255,0.6)', borderRadius:8, padding:'10px 12px' }}>
                              <p style={{ fontSize:'0.7rem', color:'#9CA3AF', fontWeight:600, marginBottom:3 }}>{item.label}</p>
                              <p style={{ fontSize:'0.82rem', color:'#1E1B4B', fontWeight:500 }}>{item.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Measurements */}
                        {order.measurements && Object.values(order.measurements).some(v => v) && (
                          <div style={{ marginTop:12 }}>
                            <p style={{ fontSize:'0.78rem', color:'#4F46E5', fontWeight:600, marginBottom:8 }}>📏 Measurements</p>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:8 }}>
                              {Object.entries(order.measurements).filter(([,v]) => v).map(([k,v]) => (
                                <div key={k} style={{ background:'rgba(79,70,229,0.05)', borderRadius:8, padding:'8px 10px' }}>
                                  <p style={{ fontSize:'0.68rem', color:'#9CA3AF', textTransform:'uppercase', fontWeight:600 }}>{k}</p>
                                  <p style={{ fontSize:'0.88rem', color:'#1E1B4B', fontWeight:700 }}>{v}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Alteration */}
                        {order.alteration?.required && (
                          <div style={{ marginTop:12, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'10px 14px' }}>
                            <p style={{ fontSize:'0.78rem', color:'#D97706', fontWeight:600, marginBottom:3 }}>⚠️ Alteration Required</p>
                            <p style={{ fontSize:'0.82rem', color:'#4B5563' }}>{order.alteration.notes || 'No notes'}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}