'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Scissors, LogOut, Users, Package, Clock,
  CheckCircle, AlertTriangle, Calendar, Plus,
  Search, ChevronRight, ArrowLeft, X
} from 'lucide-react'
import API from '../../../lib/api'

const STAGES = ['Booking','Cutting','Stitching','Finishing','Ready For Delivery']
const STAGE_ICONS = {
  'Booking':'📘','Cutting':'✂️','Stitching':'🧵',
  'Finishing':'🚩','Ready For Delivery':'✅'
}

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin]         = useState(null)
  const [stats, setStats]         = useState(null)
  const [orders, setOrders]       = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortByDate, setSortByDate]     = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const user  = localStorage.getItem('adminUser')
    if (!token) { router.push('/admin/login'); return }
    setAdmin(user ? JSON.parse(user) : { username: 'admin' })
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
      'Booking':            { bg:'rgba(79,70,229,0.12)',  color:'#4F46E5' },
      'Cutting':            { bg:'rgba(245,158,11,0.12)', color:'#D97706' },
      'Stitching':          { bg:'rgba(59,130,246,0.12)', color:'#2563EB' },
      'Finishing':          { bg:'rgba(168,85,247,0.12)', color:'#9333EA' },
      'Ready For Delivery': { bg:'rgba(16,185,129,0.12)', color:'#059669' },
    }
    const s = map[status] || map['Booking']
    return (
      <span style={{
        display:'inline-flex', alignItems:'center', gap:4,
        padding:'4px 12px', borderRadius:999,
        background:s.bg, color:s.color,
        fontSize:'0.75rem', fontWeight:600,
      }}>
        {STAGE_ICONS[status]} {status}
      </span>
    )
  }

  // ── Filter logic ──────────────────────────────────────────
  const today = new Date()
  today.setHours(0,0,0,0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate()+1)

  const applyFilter = (order) => {
    switch (activeFilter) {
      case 'all':      return true
      case 'booking':  return order.status === 'Booking'
      case 'cutting':  return order.status === 'Cutting'
      case 'stitching':return order.status === 'Stitching'
      case 'finishing':return order.status === 'Finishing'
      case 'ready':    return order.status === 'Ready For Delivery'
      case 'today': {
        const d = new Date(order.deliveryDate)
        return d >= today && d < tomorrow
      }
      case 'delayed': {
        const d = new Date(order.deliveryDate)
        return d < today && order.status !== 'Ready For Delivery'
      }
      case 'delivery': return true // all, sorted by date
      default: return true
    }
  }

  const applySearch = (order) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      order.orderID?.toLowerCase().includes(s) ||
      order.customerID?.toLowerCase().includes(s) ||
      order.clothType?.toLowerCase().includes(s) ||
      order.customerRef?.name?.toLowerCase().includes(s)
    )
  }

  let filtered = orders.filter(o => applyFilter(o) && applySearch(o))

  // Sort by delivery date if delivery view active
  if (activeFilter === 'delivery' || sortByDate) {
    filtered = [...filtered].sort(
      (a,b) => new Date(a.deliveryDate) - new Date(b.deliveryDate)
    )
  }

  const filterLabel = {
    all:      'All Orders',
    booking:  '📘 Booking',
    cutting:  '✂️ Cutting',
    stitching:'🧵 Stitching',
    finishing:'🚩 Finishing',
    ready:    '✅ Ready for Delivery',
    today:    "📅 Today's Delivery",
    delayed:  '⚠️ Delayed Orders',
    delivery: '🗓️ Orders by Delivery Date',
  }

  const statCards = [
    { key:'all',       label:'Total Orders',    value:stats?.total,        icon:<Package size={20} color="#4F46E5" />,        bg:'rgba(79,70,229,0.07)',  border:'rgba(79,70,229,0.18)' },
    { key:'booking',   label:'Booking',         value:stats?.booking,      icon:<span style={{fontSize:'1.1rem'}}>📘</span>,  bg:'rgba(79,70,229,0.04)',  border:'rgba(79,70,229,0.12)' },
    { key:'cutting',   label:'Cutting',         value:stats?.cutting,      icon:<span style={{fontSize:'1.1rem'}}>✂️</span>,  bg:'rgba(245,158,11,0.05)', border:'rgba(245,158,11,0.15)' },
    { key:'stitching', label:'Stitching',       value:stats?.stitching,    icon:<span style={{fontSize:'1.1rem'}}>🧵</span>,  bg:'rgba(59,130,246,0.05)', border:'rgba(59,130,246,0.15)' },
    { key:'finishing', label:'Finishing',       value:stats?.finishing,    icon:<span style={{fontSize:'1.1rem'}}>🚩</span>,  bg:'rgba(168,85,247,0.05)', border:'rgba(168,85,247,0.15)' },
    { key:'ready',     label:'Ready',           value:stats?.ready,        icon:<CheckCircle size={20} color="#059669" />,    bg:'rgba(16,185,129,0.05)', border:'rgba(16,185,129,0.15)' },
    { key:'today',     label:"Today's Delivery",value:stats?.todayDelivery,icon:<Calendar size={20} color="#0EA5E9" />,       bg:'rgba(14,165,233,0.05)', border:'rgba(14,165,233,0.15)' },
    { key:'delayed',   label:'Delayed',         value:stats?.delayed,      icon:<AlertTriangle size={20} color="#EF4444" />,  bg:'rgba(239,68,68,0.05)',  border:'rgba(239,68,68,0.15)' },
    { key:'delivery',  label:'By Delivery Date',value:'↕',                 icon:<span style={{fontSize:'1.1rem'}}>🗓️</span>, bg:'rgba(16,185,129,0.05)', border:'rgba(16,185,129,0.15)' },
  ]

  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:44, height:44, border:'3px solid rgba(79,70,229,0.2)', borderTopColor:'#4F46E5', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 14px' }} />
        <p style={{ color:'#6B7280', fontWeight:500, fontSize:'0.9rem' }}>Loading dashboard...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', padding:'20px', maxWidth:1200, margin:'0 auto' }}>

      {/* Top Bar */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 22px', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#4F46E5,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <img src="/logo.png" alt="Logo"
                style={{ width:40, height:40, borderRadius:10, objectFit:'cover' }}
                onError={e => { e.target.style.display='none' }}
                />
          </div>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Al-Ameen Tailors</h1>
            <p style={{ fontSize:'0.7rem', color:'#6B7280' }}>Admin Dashboard</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={() => router.push('/admin/customers')} className="btn-ghost" style={{ padding:'8px 14px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:5 }}>
            <Users size={14} /> Customers
          </button>
          <button onClick={() => router.push('/admin/orders/new')} className="btn-primary" style={{ padding:'8px 16px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:5 }}>
            <Plus size={14} /> New Order
          </button>
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 14px', color:'#DC2626', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="fade-up" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:20 }}>
          {statCards.map(card => (
            <div key={card.key}
              onClick={() => setActiveFilter(card.key)}
              className="glass"
              style={{
                padding:'16px 14px', cursor:'pointer',
                background: activeFilter === card.key ? card.border : card.bg,
                border: `2px solid ${activeFilter === card.key ? card.border.replace('0.15','0.6').replace('0.18','0.6').replace('0.12','0.6') : card.border}`,
                transition:'all 0.2s ease',
                transform: activeFilter === card.key ? 'translateY(-3px)' : 'none',
                boxShadow: activeFilter === card.key ? `0 8px 20px ${card.border}` : '',
              }}
              onMouseEnter={e => { if(activeFilter!==card.key) e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { if(activeFilter!==card.key) e.currentTarget.style.transform='none' }}
            >
              <div style={{ marginBottom:8 }}>{card.icon}</div>
              <p style={{ fontSize:'0.68rem', color:'#6B7280', marginBottom:3, fontWeight:500 }}>{card.label}</p>
              <p style={{ fontSize:'1.5rem', fontWeight:800, color:'#1E1B4B', lineHeight:1 }}>{card.value ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Orders Table */}
      <div className="glass fade-up-1" style={{ padding:'22px' }}>

        {/* Table Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {activeFilter !== 'all' && (
              <button onClick={() => setActiveFilter('all')}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 style={{ fontSize:'0.95rem', fontWeight:700, color:'#1E1B4B' }}>
                {filterLabel[activeFilter]}
              </h2>
              <p style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>
                {filtered.length} order{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            {/* Sort by date toggle */}
            {activeFilter !== 'delivery' && (
              <button
                onClick={() => setSortByDate(!sortByDate)}
                style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'8px 14px', borderRadius:8,
                  background: sortByDate ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.7)',
                  border: sortByDate ? '1.5px solid rgba(16,185,129,0.3)' : '1.5px solid rgba(79,70,229,0.2)',
                  color: sortByDate ? '#059669' : '#6B7280',
                  fontSize:'0.8rem', fontWeight:600,
                  cursor:'pointer', fontFamily:'Poppins,sans-serif',
                  transition:'all 0.2s',
                }}
              >
                <Calendar size={14} />
                {sortByDate ? 'Sorted by Date ✓' : 'Sort by Date'}
              </button>
            )}

            {/* Search */}
            <div style={{ position:'relative' }}>
              <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
              <input type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding:'8px 12px 8px 30px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:8, fontFamily:'Poppins,sans-serif', fontSize:'0.82rem', outline:'none', width:200, color:'#1E1B4B' }} />
              {search && (
                <button onClick={() => setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:12 }}>
              {activeFilter === 'delayed' ? '🎉' : '📋'}
            </p>
            <p style={{ color:'#6B7280', fontSize:'0.9rem' }}>
              {activeFilter === 'delayed'
                ? 'No delayed orders. Great work!'
                : activeFilter === 'all'
                ? 'No orders yet. Create your first order!'
                : `No orders in ${filterLabel[activeFilter]} stage.`}
            </p>
            {activeFilter === 'all' && (
              <button onClick={() => router.push('/admin/orders/new')} className="btn-primary" style={{ marginTop:16, padding:'10px 24px', fontSize:'0.85rem' }}>
                + Create Order
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 6px' }}>
              <thead>
                <tr>
                  {['Order ID','Customer','Cloth Type','Qty','Status','Delivery Date','Days Left','Action'].map(h => (
                    <th key={h} style={{ textAlign:'left', fontSize:'0.68rem', fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', padding:'4px 12px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const delivDate  = new Date(order.deliveryDate)
                  const diffDays   = Math.ceil((delivDate - new Date()) / (1000*60*60*24))
                  const isOverdue  = diffDays < 0 && order.status !== 'Ready For Delivery'
                  const isDueToday = diffDays === 0

                  return (
                    <tr key={order._id} style={{ cursor:'pointer' }}
                      onClick={() => router.push(`/admin/orders/${order.orderID}`)}>
                      {[
                        <span style={{ fontWeight:700, color:'#4F46E5', fontSize:'0.85rem', whiteSpace:'nowrap' }}>{order.orderID}</span>,

                        <div>
                          <p style={{ fontWeight:600, fontSize:'0.85rem', color:'#1E1B4B', whiteSpace:'nowrap' }}>{order.customerRef?.name || '—'}</p>
                          <p style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>{order.customerID}</p>
                        </div>,

                        <span style={{ fontSize:'0.85rem', whiteSpace:'nowrap' }}>{order.clothType}</span>,

                        <span style={{ fontSize:'0.85rem' }}>{order.quantity}</span>,

                        getStatusBadge(order.status),

                        <span style={{ fontSize:'0.82rem', color:'#4B5563', whiteSpace:'nowrap' }}>
                          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                        </span>,

                        <span style={{
                          fontSize:'0.78rem', fontWeight:600, whiteSpace:'nowrap',
                          color: isOverdue ? '#DC2626' : isDueToday ? '#D97706' : diffDays <= 3 ? '#F59E0B' : '#059669',
                        }}>
                          {order.status === 'Ready For Delivery'
                            ? '✅ Done'
                            : isOverdue
                            ? `${Math.abs(diffDays)}d overdue`
                            : isDueToday
                            ? '⚡ Today'
                            : `${diffDays}d left`}
                        </span>,

                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/admin/orders/${order.orderID}`) }}
                          style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:6, padding:'6px 12px', color:'#4F46E5', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', whiteSpace:'nowrap' }}>
                          View <ChevronRight size={12} />
                        </button>,
                      ].map((cell, ci) => (
                        <td key={ci} style={{
                          padding:'11px 12px',
                          background: isOverdue ? 'rgba(239,68,68,0.04)' : isDueToday ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.6)',
                          borderRadius: ci===0 ? '10px 0 0 10px' : ci===7 ? '0 10px 10px 0' : 0,
                        }}>{cell}</td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}