'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Plus, Search, Users, X } from 'lucide-react'
import { employeeAPI as API } from '../../../lib/api'

export default function ReceptionistPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState(null)
  const [orders, setOrders]     = useState([])
  const [customers, setCustomers] = useState([])
  const [search, setSearch]     = useState('')
  const [tab, setTab]           = useState('orders')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('employeeToken')
    const user  = localStorage.getItem('employeeUser')
    if (!token) { router.push('/employee/login'); return }
    if (user) {
      const parsed = JSON.parse(user)
      if (parsed.accessRole !== 'receptionist') {
        router.push('/employee/dashboard'); return
      }
      setEmployee(parsed)
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [ordRes, custRes] = await Promise.all([
        API.get('/api/orders'),
        API.get('/api/customers'),
      ])
      setOrders(ordRes.data.orders || [])
      setCustomers(custRes.data.customers || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleLogout = () => {
    localStorage.removeItem('employeeToken')
    localStorage.removeItem('employeeUser')
    router.push('/employee/login')
  }

  const filteredOrders = orders.filter(o =>
    !search ||
    o.orderID?.toLowerCase().includes(search.toLowerCase()) ||
    o.customerRef?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.clothType?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCustomers = customers.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.customerID?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  if (!employee) return null

  return (
    <main style={{ minHeight:'100vh', fontFamily:'Poppins,sans-serif', background:'#F8F7FF' }}>

      {/* Header */}
      <div style={{ background:'white', boxShadow:'0 1px 12px rgba(79,70,229,0.1)', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, position:'sticky', top:0, zIndex:100, borderTop:'3px solid #4F46E5' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#4F46E5,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>🎟️</div>
          <div>
            <p style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.9rem' }}>Al-Ameen Tailors</p>
            <p style={{ fontSize:'0.68rem', color:'#4F46E5', fontWeight:600 }}>{employee.name} · Receptionist</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => router.push('/employee/orders/new')}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', background:'linear-gradient(135deg,#4F46E5,#6366F1)', color:'white', border:'none', borderRadius:8, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.8rem', cursor:'pointer' }}>
            <Plus size={14}/> New Order
          </button>
          <button onClick={handleLogout}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 12px', background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#DC2626', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.8rem', cursor:'pointer' }}>
            <LogOut size={14}/> Logout
          </button>
        </div>
      </div>

      <div style={{ padding:'20px', maxWidth:900, margin:'0 auto' }}>

        {/* Notice */}
        <div style={{ background:'rgba(79,70,229,0.05)', border:'1.5px solid rgba(79,70,229,0.15)', borderRadius:12, padding:'12px 16px', marginBottom:20 }}>
          <p style={{ fontSize:'0.82rem', color:'#4F46E5', fontWeight:500 }}>
            🎟️ Receptionist Access — You can create orders and manage customers.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, background:'rgba(255,255,255,0.7)', padding:5, borderRadius:12, border:'1.5px solid rgba(79,70,229,0.1)', marginBottom:20 }}>
          {[
            { key:'orders',    label:'📋 Orders'    },
            { key:'customers', label:'👥 Customers' },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch('') }}
              style={{ flex:1, padding:'10px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.82rem', transition:'all 0.2s', background:tab===t.key?'white':'transparent', color:tab===t.key?'#4F46E5':'#6B7280', boxShadow:tab===t.key?'0 2px 8px rgba(79,70,229,0.12)':'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position:'relative', marginBottom:16 }}>
          <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
          <input type="text" placeholder={`Search ${tab}...`} value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%', padding:'10px 14px 10px 36px', background:'white', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.88rem', outline:'none', color:'#1E1B4B' }}/>
          {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}><X size={15}/></button>}
        </div>

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div style={{ display:'grid', gap:10 }}>
            {loading ? (
              <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>Loading...</p>
            ) : filteredOrders.length === 0 ? (
              <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>No orders found.</p>
            ) : filteredOrders.map(order => (
              <div key={order._id} style={{ background:'white', borderRadius:12, padding:'14px 18px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontWeight:700, color:'#4F46E5', fontSize:'0.88rem' }}>{order.orderID}</span>
                    <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:999, background:'rgba(79,70,229,0.08)', color:'#4F46E5', fontWeight:600 }}>{order.status}</span>
                  </div>
                  <p style={{ fontSize:'0.82rem', color:'#1E1B4B', fontWeight:600 }}>{order.customerRef?.name}</p>
                  <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>{order.clothType} · Qty: {order.quantity}</p>
                  <p style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>
                    Delivery: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : '—'}
                  </p>
                  {/* NOTE: NO price/cost shown to receptionist */}
                </div>
                <button onClick={() => router.push(`/admin/orders/${order.orderID}`)}
                  style={{ padding:'7px 14px', background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:8, color:'#4F46E5', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                  View →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {tab === 'customers' && (
          <div style={{ display:'grid', gap:10 }}>
            {loading ? (
              <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>Loading...</p>
            ) : filteredCustomers.length === 0 ? (
              <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>No customers found.</p>
            ) : filteredCustomers.map(c => (
              <div key={c._id} style={{ background:'white', borderRadius:12, padding:'14px 18px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#4F46E5,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700 }}>
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.9rem' }}>{c.name}</p>
                    <p style={{ fontSize:'0.75rem', color:'#4F46E5', fontWeight:600 }}>{c.customerID}</p>
                    <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>{c.phone}</p>
                    {/* NOTE: NO payment/balance shown to receptionist */}
                  </div>
                </div>
                <button onClick={() => router.push(`/admin/orders/new`)}
                  style={{ padding:'7px 14px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, color:'#059669', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:5 }}>
                  <Plus size={13}/> New Order
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}