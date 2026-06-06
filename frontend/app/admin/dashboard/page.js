'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Scissors, LogOut, Users, Package,
  CheckCircle, AlertTriangle, Calendar, Plus,
  Search, ChevronRight, X,
} from 'lucide-react'
import API from '../../../lib/api'

const STAGE_ICONS = {
  'Booking':            '📘',
  'Cutting':            '✂️',
  'Stitching':          '🧵',
  'Finishing':          '🚩',
  'Ready For Delivery': '✅',
}

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin]               = useState(null)
  const [stats, setStats]               = useState(null)
  const [orders, setOrders]             = useState([])
  const [pendingCustomers, setPendingCustomers] = useState([])
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [activeFilter, setActiveFilter] = useState(null)
  const [showPending, setShowPending]   = useState(false)
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
      setStats(statsRes.data.stats || {})
      setOrders(ordersRes.data.orders || [])

      try {
        const payRes = await API.get('/api/customers/stats/payment-summary')
        const s      = payRes.data.summary || {}
        setStats(prev => ({
          ...prev,
          totalPending:     s.totalBalance          || 0,
          customersWithDue: s.customersWithDueCount || 0,
        }))
        setPendingCustomers(s.customersWithDue || [])
      } catch (_) {
        setStats(prev => ({ ...prev, totalPending: 0, customersWithDue: 0 }))
      }
    } catch (e) {
      setStats({ total:0, booking:0, cutting:0, stitching:0, finishing:0, ready:0, todayDelivery:0, delayed:0, totalPending:0, customersWithDue:0 })
      setOrders([])
    } finally {
      setLoading(false)
    }
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
      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:999, background:s.bg, color:s.color, fontSize:'0.75rem', fontWeight:600 }}>
        {STAGE_ICONS[status]} {status}
      </span>
    )
  }

  const today    = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1)

  const applyFilter = (order) => {
    if (!activeFilter) return true
    switch (activeFilter) {
      case 'booking':   return order.status === 'Booking'
      case 'cutting':   return order.status === 'Cutting'
      case 'stitching': return order.status === 'Stitching'
      case 'finishing': return order.status === 'Finishing'
      case 'ready':     return order.status === 'Ready For Delivery'
      case 'today': {
        const d = new Date(order.deliveryDate)
        return d >= today && d < tomorrow
      }
      case 'delayed': {
        const d = new Date(order.deliveryDate)
        return d < today && order.status !== 'Ready For Delivery'
      }
      default: return true
    }
  }

  let filtered = orders.filter(o =>
    applyFilter(o) &&
    (!search || (
      (o.orderID?.toLowerCase()||'').includes(search.toLowerCase()) ||
      (o.customerID?.toLowerCase()||'').includes(search.toLowerCase()) ||
      (o.clothType?.toLowerCase()||'').includes(search.toLowerCase()) ||
      (o.customerRef?.name?.toLowerCase()||'').includes(search.toLowerCase())
    ))
  )

  if (sortByDate) {
    filtered = [...filtered].sort((a,b) => new Date(a.deliveryDate) - new Date(b.deliveryDate))
  }

  const filterLabel = {
    booking:  '📘 Booking',
    cutting:  '✂️ Cutting',
    stitching:'🧵 Stitching',
    finishing:'🚩 Finishing',
    ready:    '✅ Ready for Delivery',
    today:    "📅 Today's Delivery",
    delayed:  '⚠️ Delayed Orders',
    delivery: '🗓️ By Delivery Date',
  }

  const statCards = [
    { key:'total',     label:'Total Orders',     value:stats?.total         ?? 0, icon:<Package size={18} color="#4F46E5" />,       bg:'rgba(79,70,229,0.07)',  border:'rgba(79,70,229,0.2)',   clickKey:null       },
    { key:'booking',   label:'Booking',           value:stats?.booking       ?? 0, icon:<span style={{fontSize:'1rem'}}>📘</span>,   bg:'rgba(79,70,229,0.04)',  border:'rgba(79,70,229,0.15)', clickKey:'booking'  },
    { key:'cutting',   label:'Cutting',           value:stats?.cutting       ?? 0, icon:<span style={{fontSize:'1rem'}}>✂️</span>,   bg:'rgba(245,158,11,0.05)', border:'rgba(245,158,11,0.2)', clickKey:'cutting'  },
    { key:'stitching', label:'Stitching',         value:stats?.stitching     ?? 0, icon:<span style={{fontSize:'1rem'}}>🧵</span>,   bg:'rgba(59,130,246,0.05)', border:'rgba(59,130,246,0.2)', clickKey:'stitching'},
    { key:'finishing', label:'Finishing',         value:stats?.finishing     ?? 0, icon:<span style={{fontSize:'1rem'}}>🚩</span>,   bg:'rgba(168,85,247,0.05)', border:'rgba(168,85,247,0.2)', clickKey:'finishing'},
    { key:'ready',     label:'Ready',             value:stats?.ready         ?? 0, icon:<CheckCircle size={18} color="#059669" />,   bg:'rgba(16,185,129,0.05)', border:'rgba(16,185,129,0.2)', clickKey:'ready'    },
    { key:'today',     label:"Today's Delivery",  value:stats?.todayDelivery ?? 0, icon:<Calendar size={18} color="#0EA5E9" />,      bg:'rgba(14,165,233,0.05)', border:'rgba(14,165,233,0.2)', clickKey:'today'    },
    { key:'delayed',   label:'Delayed',           value:stats?.delayed       ?? 0, icon:<AlertTriangle size={18} color="#EF4444" />, bg:'rgba(239,68,68,0.05)',  border:'rgba(239,68,68,0.2)',  clickKey:'delayed'  },
    { key:'delivery',  label:'By Delivery Date',  value:'↕',                       icon:<span style={{fontSize:'1rem'}}>🗓️</span>,  bg:'rgba(16,185,129,0.04)', border:'rgba(16,185,129,0.15)',clickKey:'delivery' },
    {
      key:'pending',
      label:'Total Pending',
      value: (stats?.totalPending || 0) > 0
        ? `₹${Number(stats.totalPending).toLocaleString('en-IN')}`
        : '₹0',
      icon: <span style={{fontSize:'1rem'}}>💰</span>,
      bg:'rgba(239,68,68,0.04)', border:'rgba(239,68,68,0.15)',
      clickKey: 'pending-special',
      sub: (stats?.customersWithDue || 0) > 0
        ? `${stats.customersWithDue} customers with due`
        : 'All settled',
    },
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
          <img src="/logo.png" alt="Logo"
            style={{ width:40, height:40, borderRadius:10, objectFit:'cover', border:'2px solid rgba(255,255,255,0.8)' }}
            onError={e => e.target.style.display='none'} />
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Al-Ameen Tailors</h1>
            <p style={{ fontSize:'0.7rem', color:'#6B7280' }}>Admin Dashboard</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={() => router.push('/admin/customers')} className="btn-ghost"
            style={{ padding:'8px 14px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:5 }}>
            <Users size={14} /> Customers
          </button>
          <button onClick={() => router.push('/admin/employees')} className="btn-ghost"
            style={{ padding:'8px 14px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:5 }}>
            <Users size={14} /> Employees
          </button>
          <button onClick={() => router.push('/admin/orders/new')} className="btn-primary"
            style={{ padding:'8px 16px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:5 }}>
            <Plus size={14} /> New Order
          </button>
          <button onClick={handleLogout}
            style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 14px', color:'#DC2626', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="fade-up" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:12, marginBottom:20 }}>
        {statCards.map(card => (
          <div key={card.key}
            onClick={() => {
              if (!card.clickKey) return
              if (card.clickKey === 'pending-special') {
                setShowPending(!showPending)
                setActiveFilter(null)
                return
              }
              setShowPending(false)
              setActiveFilter(activeFilter === card.clickKey ? null : card.clickKey)
            }}
            className="glass"
            style={{
              padding:'16px 14px',
              cursor: card.clickKey ? 'pointer' : 'default',
              background: (activeFilter === card.clickKey || (card.clickKey === 'pending-special' && showPending)) ? card.border : card.bg,
              border:`2px solid ${card.border}`,
              transition:'all 0.25s ease',
              transform: (activeFilter === card.clickKey || (card.clickKey === 'pending-special' && showPending)) ? 'translateY(-4px)' : 'none',
              position:'relative',
            }}
            onMouseEnter={e => { if (card.clickKey) e.currentTarget.style.transform='translateY(-2px)' }}
            onMouseLeave={e => { if (card.clickKey && !(activeFilter === card.clickKey || (card.clickKey === 'pending-special' && showPending))) e.currentTarget.style.transform='none' }}
          >
            <div style={{ marginBottom:8 }}>{card.icon}</div>
            <p style={{ fontSize:'0.65rem', color:'#6B7280', marginBottom:3, fontWeight:500 }}>{card.label}</p>
            <p style={{
              fontSize: card.key === 'pending' ? '0.9rem' : '1.4rem',
              fontWeight:800,
              color: card.key === 'pending' && (stats?.totalPending||0) > 0 ? '#DC2626' : '#1E1B4B',
              lineHeight:1,
            }}>
              {card.value}
            </p>
            {card.sub && (
              <p style={{ fontSize:'0.62rem', marginTop:4, fontWeight:500, color:(stats?.customersWithDue||0)>0?'#DC2626':'#059669' }}>
                {card.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Pending Customers Panel */}
      {showPending && (
        <div className="glass fade-up" style={{ padding:24, marginBottom:20, border:'1.5px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.02)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.95rem' }}>
              💰 Customers with Pending Balance
            </h2>
            <button onClick={() => setShowPending(false)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
              <X size={18} />
            </button>
          </div>

          {pendingCustomers.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <p style={{ fontSize:'2rem', marginBottom:8 }}>🎉</p>
              <p style={{ color:'#059669', fontWeight:600 }}>All customers are fully settled!</p>
            </div>
          ) : (
            <>
              {/* Summary totals */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:16 }}>
                {[
                  { label:'Total Due',          value:`₹${(stats?.totalPending||0).toLocaleString('en-IN')}`,  color:'#DC2626', bg:'rgba(239,68,68,0.06)'  },
                  { label:'Customers with Due',  value:pendingCustomers.length,                                 color:'#D97706', bg:'rgba(245,158,11,0.06)' },
                ].map((s,i) => (
                  <div key={i} style={{ background:s.bg, borderRadius:10, padding:'12px 16px', textAlign:'center' }}>
                    <p style={{ fontSize:'0.7rem', color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>{s.label}</p>
                    <p style={{ fontSize:'1.2rem', fontWeight:800, color:s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Customer list */}
              <div style={{ display:'grid', gap:8 }}>
                {pendingCustomers.map((c, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, padding:'14px 18px', background:'rgba(255,255,255,0.7)', borderRadius:10, border:'1px solid rgba(239,68,68,0.1)' }}>
                    <div>
                      <p style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.9rem' }}>{c.name}</p>
                      <p style={{ fontSize:'0.75rem', color:'#4F46E5', fontWeight:600 }}>{c.customerID}</p>
                    </div>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ fontSize:'0.78rem', padding:'4px 10px', borderRadius:999, background:'rgba(79,70,229,0.08)', color:'#4F46E5', fontWeight:600 }}>
                        Total: ₹{(c.totalCost||0).toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize:'0.78rem', padding:'4px 10px', borderRadius:999, background:'rgba(16,185,129,0.08)', color:'#059669', fontWeight:600 }}>
                        Paid: ₹{(c.settled||0).toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize:'0.85rem', padding:'5px 14px', borderRadius:999, background:'rgba(239,68,68,0.1)', color:'#DC2626', fontWeight:700 }}>
                        Due: ₹{(c.balance||0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Orders Table */}
      <div className="glass fade-up-1" style={{ padding:'22px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <h2 style={{ fontSize:'0.95rem', fontWeight:700, color:'#1E1B4B' }}>
              {activeFilter ? filterLabel[activeFilter] : 'All Orders'}
            </h2>
            {activeFilter && (
              <button onClick={() => { setActiveFilter(null); setSearch('') }}
                style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(79,70,229,0.1)', border:'1.5px solid rgba(79,70,229,0.25)', borderRadius:999, padding:'4px 12px', color:'#4F46E5', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                {filterLabel[activeFilter]} <X size={13} />
              </button>
            )}
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <button onClick={() => setSortByDate(!sortByDate)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, background:sortByDate?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.7)', border:sortByDate?'1.5px solid rgba(16,185,129,0.3)':'1.5px solid rgba(79,70,229,0.2)', color:sortByDate?'#059669':'#6B7280', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
              <Calendar size={13} />{sortByDate ? 'Date ✓' : 'Sort by Date'}
            </button>
            <div style={{ position:'relative' }}>
              <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding:'8px 30px 8px 30px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:8, fontFamily:'Poppins,sans-serif', fontSize:'0.82rem', outline:'none', width:180, color:'#1E1B4B' }} />
              {search && (
                <button onClick={() => setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        <p style={{ fontSize:'0.72rem', color:'#9CA3AF', marginBottom:14 }}>
          Showing {filtered.length} order{filtered.length!==1?'s':''}
        </p>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:12 }}>
              {activeFilter==='delayed'?'🎉':'📋'}
            </p>
            <p style={{ color:'#6B7280', fontSize:'0.9rem', marginBottom:16 }}>
              {activeFilter==='delayed' ? 'No delayed orders!' : activeFilter ? 'No orders in this stage.' : 'No orders yet.'}
            </p>
            {!activeFilter && (
              <button onClick={() => router.push('/admin/orders/new')} className="btn-primary" style={{ padding:'10px 24px', fontSize:'0.85rem' }}>
                + Create First Order
              </button>
            )}
            {activeFilter && (
              <button onClick={() => setActiveFilter(null)} className="btn-ghost" style={{ padding:'9px 20px', fontSize:'0.82rem', display:'inline-flex', alignItems:'center', gap:6 }}>
                <X size={14} /> Clear Filter
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 6px' }}>
              <thead>
                <tr>
                  {['Order ID','Customer','Cloth','Qty','Status','Delivery Date','Days Left','Action'].map(h => (
                    <th key={h} style={{ textAlign:'left', fontSize:'0.66rem', fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', padding:'4px 12px', whiteSpace:'nowrap' }}>
                      {h}
                    </th>
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
                        <span style={{ fontWeight:700, color:'#4F46E5', fontSize:'0.82rem', whiteSpace:'nowrap' }}>{order.orderID}</span>,
                        <div>
                          <p style={{ fontWeight:600, fontSize:'0.82rem', color:'#1E1B4B', whiteSpace:'nowrap' }}>{order.customerRef?.name||'—'}</p>
                          <p style={{ fontSize:'0.68rem', color:'#9CA3AF' }}>{order.customerID}</p>
                        </div>,
                        <span style={{ fontSize:'0.82rem', whiteSpace:'nowrap' }}>{order.clothType}</span>,
                        <span style={{ fontSize:'0.82rem' }}>{order.quantity}</span>,
                        getStatusBadge(order.status),
                        <span style={{ fontSize:'0.8rem', color:'#4B5563', whiteSpace:'nowrap' }}>
                          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                        </span>,
                        <span style={{ fontSize:'0.76rem', fontWeight:600, whiteSpace:'nowrap', color:isOverdue?'#DC2626':isDueToday?'#D97706':diffDays<=3?'#F59E0B':'#059669' }}>
                          {order.status==='Ready For Delivery'?'✅ Done':isOverdue?`${Math.abs(diffDays)}d overdue`:isDueToday?'⚡ Today':`${diffDays}d left`}
                        </span>,
                        <button onClick={e => { e.stopPropagation(); router.push(`/admin/orders/${order.orderID}`) }}
                          style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:6, padding:'6px 10px', color:'#4F46E5', fontSize:'0.76rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', whiteSpace:'nowrap' }}>
                          View <ChevronRight size={12} />
                        </button>,
                      ].map((cell,ci) => (
                        <td key={ci} style={{ padding:'11px 12px', background:isOverdue?'rgba(239,68,68,0.04)':isDueToday?'rgba(245,158,11,0.04)':'rgba(255,255,255,0.6)', borderRadius:ci===0?'10px 0 0 10px':ci===7?'0 10px 10px 0':0 }}>
                          {cell}
                        </td>
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