'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Scissors, LogOut, Users, Package, Clock,
  CheckCircle, AlertTriangle, Calendar, TrendingUp, Plus,
  Search, ChevronRight
} from 'lucide-react'
import API from '../../../lib/api'

const STAGES = [
  { key:'booking',   label:'Booking',          color:'#4F46E5', bg:'rgba(79,70,229,0.1)',   icon:'📘' },
  { key:'cutting',   label:'Cutting',           color:'#D97706', bg:'rgba(245,158,11,0.1)',  icon:'✂️' },
  { key:'stitching', label:'Stitching',         color:'#2563EB', bg:'rgba(59,130,246,0.1)',  icon:'🧵' },
  { key:'finishing', label:'Finishing',         color:'#9333EA', bg:'rgba(168,85,247,0.1)',  icon:'🚩' },
  { key:'ready',     label:'Ready for Delivery',color:'#059669', bg:'rgba(16,185,129,0.1)',  icon:'✅' },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin]     = useState(null)
  const [stats, setStats]     = useState(null)
  const [orders, setOrders]   = useState([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const user  = localStorage.getItem('adminUser')
    if (!token) { router.push('/admin/login'); return }
    setAdmin(user ? JSON.parse(user) : { username:'admin' })
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        API.get('/api/orders/stats/dashboard'),
        API.get('/api/orders'),
      ])
      setStats(statsRes.data.stats)
      setOrders(ordersRes.data.orders)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    router.push('/admin/login')
  }

  const getStatusBadge = (status) => {
    const map = {
      'Booking':           { cls:'badge-booking',   icon:'📘' },
      'Cutting':           { cls:'badge-cutting',   icon:'✂️' },
      'Stitching':         { cls:'badge-stitching', icon:'🧵' },
      'Finishing':         { cls:'badge-finishing', icon:'🚩' },
      'Ready For Delivery':{ cls:'badge-ready',     icon:'✅' },
    }
    const s = map[status] || { cls:'badge-booking', icon:'📘' }
    return <span className={`badge ${s.cls}`}>{s.icon} {status}</span>
  }

  const filtered = orders.filter(o =>
    o.orderID?.toLowerCase().includes(search.toLowerCase()) ||
    o.customerID?.toLowerCase().includes(search.toLowerCase()) ||
    o.clothType?.toLowerCase().includes(search.toLowerCase()) ||
    o.customerRef?.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'3px solid rgba(79,70,229,0.2)', borderTopColor:'#4F46E5', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ color:'#6B7280', fontWeight:500 }}>Loading dashboard...</p>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:1200, margin:'0 auto' }}>

      {/* Top Bar */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#4F46E5,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Scissors size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Tailoring Manager</h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>Admin Dashboard</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={() => router.push('/admin/customers')} className="btn-ghost" style={{ padding:'8px 16px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
            <Users size={15} /> Customers
          </button>
          <button onClick={() => router.push('/admin/orders/new')} className="btn-primary" style={{ padding:'9px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
            <Plus size={15} /> New Order
          </button>
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 14px', color:'#DC2626', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="fade-up" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:24 }}>
          {[
            { label:'Total Orders',   value:stats.total,         icon:<Package size={20} color="#4F46E5" />,   bg:'rgba(79,70,229,0.07)',  border:'rgba(79,70,229,0.15)' },
            { label:'Booking',        value:stats.booking,       icon:<span style={{fontSize:'1.1rem'}}>📘</span>, bg:'rgba(79,70,229,0.05)', border:'rgba(79,70,229,0.12)' },
            { label:'Cutting',        value:stats.cutting,       icon:<span style={{fontSize:'1.1rem'}}>✂️</span>, bg:'rgba(245,158,11,0.05)', border:'rgba(245,158,11,0.15)' },
            { label:'Stitching',      value:stats.stitching,     icon:<span style={{fontSize:'1.1rem'}}>🧵</span>, bg:'rgba(59,130,246,0.05)', border:'rgba(59,130,246,0.15)' },
            { label:'Finishing',      value:stats.finishing,     icon:<span style={{fontSize:'1.1rem'}}>🚩</span>, bg:'rgba(168,85,247,0.05)', border:'rgba(168,85,247,0.15)' },
            { label:'Ready',          value:stats.ready,         icon:<CheckCircle size={20} color="#059669" />, bg:'rgba(16,185,129,0.05)', border:'rgba(16,185,129,0.15)' },
            { label:"Today's Delivery",value:stats.todayDelivery,icon:<Calendar size={20} color="#0EA5E9" />,  bg:'rgba(14,165,233,0.05)', border:'rgba(14,165,233,0.15)' },
            { label:'Delayed',        value:stats.delayed,       icon:<AlertTriangle size={20} color="#EF4444" />, bg:'rgba(239,68,68,0.05)', border:'rgba(239,68,68,0.15)' },
          ].map((card, i) => (
            <div key={i} className="glass" style={{ padding:'18px 16px', background:card.bg, border:`1.5px solid ${card.border}` }}>
              <div style={{ marginBottom:8 }}>{card.icon}</div>
              <p style={{ fontSize:'0.72rem', color:'#6B7280', marginBottom:4, fontWeight:500 }}>{card.label}</p>
              <p style={{ fontSize:'1.6rem', fontWeight:800, color:'#1E1B4B', lineHeight:1 }}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Orders Table */}
      <div className="glass fade-up-1" style={{ padding:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <h2 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>All Orders</h2>
          <div style={{ position:'relative' }}>
            <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding:'9px 14px 9px 36px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.85rem', outline:'none', width:220, color:'#1E1B4B' }}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <p style={{ fontSize:'2rem', marginBottom:12 }}>📋</p>
            <p style={{ color:'#6B7280', fontSize:'0.9rem' }}>No orders yet. Create your first order!</p>
            <button onClick={() => router.push('/admin/orders/new')} className="btn-primary" style={{ marginTop:16, padding:'10px 24px', fontSize:'0.85rem' }}>+ Create Order</button>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 6px' }}>
              <thead>
                <tr>
                  {['Order ID','Customer','Cloth Type','Qty','Status','Delivery Date','Action'].map(h => (
                    <th key={h} style={{ textAlign:'left', fontSize:'0.7rem', fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.6px', padding:'6px 12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order._id}>
                    {[
                      <span style={{ fontWeight:600, color:'#4F46E5', fontSize:'0.85rem' }}>{order.orderID}</span>,
                      <div>
                        <p style={{ fontWeight:600, fontSize:'0.85rem', color:'#1E1B4B' }}>{order.customerRef?.name || '—'}</p>
                        <p style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>{order.customerID}</p>
                      </div>,
                      <span style={{ fontSize:'0.85rem' }}>{order.clothType}</span>,
                      <span style={{ fontSize:'0.85rem' }}>{order.quantity}</span>,
                      getStatusBadge(order.status),
                      <span style={{ fontSize:'0.82rem', color:'#4B5563' }}>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : '—'}</span>,
                      <button onClick={() => router.push(`/admin/orders/${order.orderID}`)}
                        style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:6, padding:'6px 12px', color:'#4F46E5', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                        View <ChevronRight size={13} />
                      </button>
                    ].map((cell, ci) => (
                      <td key={ci} style={{ padding:'12px', background:'rgba(255,255,255,0.6)', borderTop: ci===0 ? '1px solid rgba(255,255,255,0.8)' : 'none', borderBottom: ci===0 ? '1px solid rgba(255,255,255,0.8)' : 'none', borderLeft: ci===0 ? '1px solid rgba(255,255,255,0.8)' : 'none', borderRight: ci===6 ? '1px solid rgba(255,255,255,0.8)' : 'none', borderRadius: ci===0 ? '10px 0 0 10px' : ci===6 ? '0 10px 10px 0' : 0 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </main>
  )
}