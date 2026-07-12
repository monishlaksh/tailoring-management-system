'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Plus, Users, Package, Search, ChevronRight } from 'lucide-react'
import { employeeAPI as API } from '../../../lib/api'

export default function EmployeeAdminPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState(null)
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    const token = localStorage.getItem('employeeToken')
    const user  = localStorage.getItem('employeeUser')
    if (!token) { router.push('/employee/login'); return }
    if (user) {
      const parsed = JSON.parse(user)
      if (!parsed.hasFullAccess) { router.push('/employee/dashboard'); return }
      setEmployee(parsed)
    }
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await API.get('/api/orders')
      setOrders(res.data.orders || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleLogout = () => {
    localStorage.removeItem('employeeToken')
    localStorage.removeItem('employeeUser')
    router.push('/employee/login')
  }

  if (!employee) return null

  const filtered = orders.filter(o =>
    o.orderID?.toLowerCase().includes(search.toLowerCase()) ||
    o.customerRef?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.clothType?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main style={{ minHeight:'100vh', padding:'20px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 22px', marginBottom:20, flexWrap:'wrap', gap:12, borderTop:'3px solid #F59E0B' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#F59E0B,#D97706)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' }}>
            ⭐
          </div>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>
              Al-Ameen Tailors
            </h1>
            <p style={{ fontSize:'0.7rem', color:'#D97706', fontWeight:600 }}>
              {employee.name} · Full Access Employee
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => router.push('/employee/scan')} className="btn-ghost"
            style={{ padding:'8px 14px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:5 }}>
            📱 Scan QR
          </button>
          <button onClick={() => router.push('/employee/orders/new')} className="btn-primary"
            style={{ padding:'8px 16px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:5 }}>
            <Plus size={14} /> New Order
          </button>
          <button onClick={handleLogout}
            style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 14px', color:'#DC2626', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Access notice */}
      <div style={{ background:'rgba(245,158,11,0.06)', border:'1.5px solid rgba(245,158,11,0.2)', borderRadius:12, padding:'12px 18px', marginBottom:20 }}>
        <p style={{ fontSize:'0.82rem', color:'#D97706', fontWeight:600 }}>
          ⭐ Full Access Granted — You can create orders, manage customers, and perform all admin operations.
        </p>
      </div>

      {/* Orders */}
      <div className="glass" style={{ padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:12 }}>
          <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.95rem' }}>All Orders</h2>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
            <input type="text" placeholder="Search..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding:'8px 14px 8px 30px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:8, fontFamily:'Poppins,sans-serif', fontSize:'0.82rem', outline:'none', width:180, color:'#1E1B4B' }} />
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <p style={{ fontSize:'2rem', marginBottom:12 }}>📋</p>
            <p style={{ color:'#6B7280' }}>No orders found.</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 6px' }}>
              <thead>
                <tr>
                  {['Order ID','Customer','Cloth','Status','Delivery','Action'].map(h => (
                    <th key={h} style={{ textAlign:'left', fontSize:'0.66rem', fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', padding:'4px 12px', whiteSpace:'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order._id} style={{ cursor:'pointer' }}
                    onClick={() => router.push(`/admin/orders/${order.orderID}`)}>
                    {[
                      <span style={{ fontWeight:700, color:'#F59E0B', fontSize:'0.82rem' }}>{order.orderID}</span>,
                      <div>
                        <p style={{ fontWeight:600, fontSize:'0.82rem', color:'#1E1B4B' }}>{order.customerRef?.name||'—'}</p>
                        <p style={{ fontSize:'0.68rem', color:'#9CA3AF' }}>{order.customerID}</p>
                      </div>,
                      <span style={{ fontSize:'0.82rem' }}>{order.clothType}</span>,
                      <span style={{ fontSize:'0.75rem', fontWeight:600, padding:'3px 10px', borderRadius:999, background:'rgba(79,70,229,0.08)', color:'#4F46E5' }}>{order.status}</span>,
                      <span style={{ fontSize:'0.8rem', color:'#4B5563' }}>
                        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : '—'}
                      </span>,
                      <button onClick={e=>{e.stopPropagation();router.push(`/admin/orders/${order.orderID}`)}}
                        style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:6, padding:'6px 10px', color:'#D97706', fontSize:'0.76rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                        View <ChevronRight size={12}/>
                      </button>,
                    ].map((cell,ci) => (
                      <td key={ci} style={{ padding:'11px 12px', background:'rgba(255,255,255,0.6)', borderRadius:ci===0?'10px 0 0 10px':ci===5?'0 10px 10px 0':0 }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}