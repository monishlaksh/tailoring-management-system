'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, Search, ChevronRight, X } from 'lucide-react'
import { adminAPI as API } from '../../../../lib/api'

const STAGE_ICONS = {
  'Booking':'📘','Cutting':'✂️','Stitching':'🧵',
  'Finishing':'🚩','Ready For Delivery':'✅',
}

export default function EmployeeOrdersPage() {
  const router   = useRouter()
  const pathname = usePathname()
  const employeeID = pathname?.split('/').pop()

  const [employee, setEmployee] = useState(null)
  const [orders, setOrders]     = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchData()
  }, [employeeID])

  const fetchData = async () => {
    try {
      const [empRes, ordersRes] = await Promise.all([
        API.get('/api/employees'),
        API.get('/api/orders'),
      ])
      const emp = empRes.data.employees.find(e => e.employeeID === employeeID)
      setEmployee(emp || null)
      const empOrders = ordersRes.data.orders.filter(
        o => o.createdBy?.employeeID === employeeID
      )
      setOrders(empOrders)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
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
      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:999, background:s.bg, color:s.color, fontSize:'0.73rem', fontWeight:600 }}>
        {STAGE_ICONS[status]} {status}
      </span>
    )
  }

  const filtered = orders.filter(o =>
    (o.orderID?.toLowerCase()||'').includes(search.toLowerCase()) ||
    (o.customerID?.toLowerCase()||'').includes(search.toLowerCase()) ||
    (o.clothType?.toLowerCase()||'').includes(search.toLowerCase()) ||
    (o.customerRef?.name?.toLowerCase()||'').includes(search.toLowerCase())
  )

  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(245,158,11,0.2)', borderTopColor:'#F59E0B', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:1100, margin:'0 auto' }}>

      {/* Top Bar */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12, borderTop:'3px solid #F59E0B' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/employees')} style={{ background:'none', border:'none', cursor:'pointer', color:'#D97706', display:'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>
              {employee?.name || employeeID} — Orders
            </h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
              {employeeID} · {orders.length} orders created
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:20 }}>
        {[
          { label:'Total Orders',   value:orders.length,                                                    bg:'rgba(79,70,229,0.06)',  color:'#4F46E5'  },
          { label:'In Progress',    value:orders.filter(o=>o.status!=='Ready For Delivery').length,         bg:'rgba(245,158,11,0.06)', color:'#D97706'  },
          { label:'Ready',          value:orders.filter(o=>o.status==='Ready For Delivery').length,         bg:'rgba(16,185,129,0.06)', color:'#059669'  },
          { label:'Total Revenue',  value:`₹${orders.reduce((s,o)=>(s+(o.unitCost||0)),0).toLocaleString('en-IN')}`, bg:'rgba(239,68,68,0.06)', color:'#DC2626' },
        ].map((s,i) => (
          <div key={i} className="glass" style={{ padding:'18px 16px', background:s.bg }}>
            <p style={{ fontSize:'0.72rem', color:'#6B7280', marginBottom:4, fontWeight:500 }}>{s.label}</p>
            <p style={{ fontSize:'1.4rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="glass" style={{ padding:24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:12 }}>
          <h2 style={{ fontSize:'0.95rem', fontWeight:700, color:'#1E1B4B' }}>All Orders by {employee?.name}</h2>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding:'8px 30px 8px 30px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(245,158,11,0.2)', borderRadius:8, fontFamily:'Poppins,sans-serif', fontSize:'0.82rem', outline:'none', width:180, color:'#1E1B4B' }} />
            {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}><X size={13} /></button>}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:12 }}>📋</p>
            <p style={{ color:'#6B7280', fontSize:'0.9rem' }}>No orders found.</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 6px' }}>
              <thead>
                <tr>
                  {['Order ID','Customer','Cloth Type','Qty','Status','Delivery Date','Cost','Action'].map(h => (
                    <th key={h} style={{ textAlign:'left', fontSize:'0.66rem', fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', padding:'4px 12px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const delivDate  = new Date(order.deliveryDate)
                  const diffDays   = Math.ceil((delivDate - new Date()) / (1000*60*60*24))
                  const isOverdue  = diffDays < 0 && order.status !== 'Ready For Delivery'
                  return (
                    <tr key={order._id} style={{ cursor:'pointer' }} onClick={() => router.push(`/admin/orders/${order.orderID}`)}>
                      {[
                        <span style={{ fontWeight:700, color:'#D97706', fontSize:'0.82rem' }}>{order.orderID}</span>,
                        <div>
                          <p style={{ fontWeight:600, fontSize:'0.82rem', color:'#1E1B4B' }}>{order.customerRef?.name||'—'}</p>
                          <p style={{ fontSize:'0.68rem', color:'#9CA3AF' }}>{order.customerID}</p>
                        </div>,
                        <span style={{ fontSize:'0.82rem' }}>{order.clothType}</span>,
                        <span style={{ fontSize:'0.82rem' }}>{order.quantity}</span>,
                        getStatusBadge(order.status),
                        <span style={{ fontSize:'0.8rem', color:isOverdue?'#DC2626':'#4B5563', whiteSpace:'nowrap', fontWeight:isOverdue?600:400 }}>
                          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                          {isOverdue && ' ⚠️'}
                        </span>,
                        <span style={{ fontSize:'0.82rem', fontWeight:600, color:'#059669' }}>
                          {(order.unitCost||0) > 0 ? `₹${order.unitCost.toLocaleString('en-IN')}` : '—'}
                        </span>,
                        <button onClick={e => { e.stopPropagation(); router.push(`/admin/orders/${order.orderID}`) }}
                          style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:6, padding:'6px 10px', color:'#D97706', fontSize:'0.76rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                          View <ChevronRight size={12} />
                        </button>,
                      ].map((cell,ci) => (
                        <td key={ci} style={{ padding:'11px 12px', background:'rgba(255,255,255,0.6)', borderRadius:ci===0?'10px 0 0 10px':ci===7?'0 10px 10px 0':0 }}>{cell}</td>
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