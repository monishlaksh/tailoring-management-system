'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, LogOut, Plus, Search,
  ChevronRight, X, Package, Clock, CheckCircle
} from 'lucide-react'
import API from '../../../lib/api'

const STAGE_ICONS = {
  'Booking':            '📘',
  'Cutting':            '✂️',
  'Stitching':          '🧵',
  'Finishing':          '🚩',
  'Ready For Delivery': '✅',
}

export default function EmployeeDashboard() {
  const router = useRouter()
  const [employee, setEmployee] = useState(null)
  const [orders, setOrders]     = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('employeeToken')
    const user  = localStorage.getItem('employeeUser')
    if (!token) { router.push('/employee/login'); return }
    if (user) setEmployee(JSON.parse(user))
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await API.get('/api/orders')
      setOrders(res.data.orders || [])
    } catch (e) {
      console.error('Failed to fetch orders:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('employeeToken')
    localStorage.removeItem('employeeUser')
    router.push('/employee/login')
  }

  const handleViewOrder = (order) => {
    if (!order.orderID) {
      alert('Order ID is missing. Please contact admin.')
      return
    }
    router.push(`/employee/orders/${order.orderID}`)
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
        padding:'4px 10px', borderRadius:999,
        background:s.bg, color:s.color,
        fontSize:'0.73rem', fontWeight:600,
      }}>
        {STAGE_ICONS[status]} {status}
      </span>
    )
  }

  const filtered = orders.filter(o =>
    (o.orderID?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (o.customerID?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (o.clothType?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (o.customerRef?.name?.toLowerCase() || '').includes(search.toLowerCase())
  )

  const inProgress = orders.filter(o => o.status !== 'Ready For Delivery').length
  const ready      = orders.filter(o => o.status === 'Ready For Delivery').length

  if (loading || !employee) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{
        width:40, height:40,
        border:'3px solid rgba(245,158,11,0.2)',
        borderTopColor:'#F59E0B',
        borderRadius:'50%',
        animation:'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', padding:'20px', maxWidth:1100, margin:'0 auto' }}>

      {/* Top Bar */}
      <div className="glass" style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 22px', marginBottom:20, flexWrap:'wrap', gap:12,
        borderTop:'3px solid #F59E0B',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:40, height:40, borderRadius:12,
            background:'linear-gradient(135deg,#F59E0B,#D97706)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Users size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>
              Al-Ameen Tailors
            </h1>
            <p style={{ fontSize:'0.7rem', color:'#6B7280' }}>
              Employee: <span style={{ color:'#D97706', fontWeight:600 }}>{employee.name}</span>
              <span style={{ color:'#9CA3AF' }}> · {employee.employeeID}</span>
            </p>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button
            onClick={() => router.push('/employee/customers/new')}
            style={{
              display:'flex', alignItems:'center', gap:5,
              background:'rgba(245,158,11,0.1)',
              border:'1.5px solid rgba(245,158,11,0.3)',
              borderRadius:8, padding:'8px 14px',
              color:'#D97706', fontSize:'0.8rem', fontWeight:600,
              cursor:'pointer', fontFamily:'Poppins,sans-serif',
            }}>
            <Plus size={14} /> Add Customer
          </button>

          <button
            onClick={() => router.push('/employee/orders/new')}
            style={{
              display:'flex', alignItems:'center', gap:5,
              background:'linear-gradient(135deg,#F59E0B,#D97706)',
              border:'none', borderRadius:8, padding:'8px 16px',
              color:'white', fontSize:'0.8rem', fontWeight:600,
              cursor:'pointer', fontFamily:'Poppins,sans-serif',
              boxShadow:'0 4px 12px rgba(245,158,11,0.3)',
            }}>
            <Plus size={14} /> New Order
          </button>

          <button
            onClick={handleLogout}
            style={{
              display:'flex', alignItems:'center', gap:5,
              background:'rgba(239,68,68,0.08)',
              border:'1.5px solid rgba(239,68,68,0.2)',
              borderRadius:8, padding:'8px 14px',
              color:'#DC2626', fontSize:'0.8rem', fontWeight:600,
              cursor:'pointer', fontFamily:'Poppins,sans-serif',
            }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        background:'rgba(245,158,11,0.06)',
        border:'1.5px solid rgba(245,158,11,0.2)',
        borderRadius:12, padding:'12px 18px', marginBottom:20,
        display:'flex', alignItems:'center', gap:10,
      }}>
        <span style={{ fontSize:'1rem' }}>ℹ️</span>
        <p style={{ fontSize:'0.82rem', color:'#92400E' }}>
          You can see and update status of only the orders <strong>you have created</strong>.
          Order details cannot be edited after creation.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(3,1fr)',
        gap:14, marginBottom:20,
      }}>
        {[
          { icon:<Package size={20} color="#4F46E5" />,     label:'My Orders',   value:orders.length, bg:'rgba(79,70,229,0.06)',  border:'rgba(79,70,229,0.15)'  },
          { icon:<Clock size={20} color="#F59E0B" />,       label:'In Progress', value:inProgress,    bg:'rgba(245,158,11,0.06)', border:'rgba(245,158,11,0.15)' },
          { icon:<CheckCircle size={20} color="#059669" />, label:'Ready',       value:ready,         bg:'rgba(16,185,129,0.06)', border:'rgba(16,185,129,0.15)' },
        ].map((c,i) => (
          <div key={i} className="glass" style={{
            padding:'18px 16px', background:c.bg, border:`1.5px solid ${c.border}`,
          }}>
            <div style={{ marginBottom:8 }}>{c.icon}</div>
            <p style={{ fontSize:'0.72rem', color:'#6B7280', marginBottom:2, fontWeight:500 }}>{c.label}</p>
            <p style={{ fontSize:'1.6rem', fontWeight:800, color:'#1E1B4B', lineHeight:1 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="glass" style={{ padding:'22px' }}>
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:18, flexWrap:'wrap', gap:12,
        }}>
          <h2 style={{ fontSize:'0.95rem', fontWeight:700, color:'#1E1B4B' }}>
            My Orders ({filtered.length})
          </h2>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding:'8px 30px 8px 30px',
                background:'rgba(255,255,255,0.8)',
                border:'1.5px solid rgba(245,158,11,0.2)',
                borderRadius:8, fontFamily:'Poppins,sans-serif',
                fontSize:'0.82rem', outline:'none', width:180, color:'#1E1B4B',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:12 }}>📋</p>
            <p style={{ color:'#6B7280', fontSize:'0.9rem', marginBottom:16 }}>
              {search ? 'No orders match your search.' : 'No orders yet. Create your first order!'}
            </p>
            {!search && (
              <button
                onClick={() => router.push('/employee/orders/new')}
                style={{
                  padding:'10px 24px',
                  background:'linear-gradient(135deg,#F59E0B,#D97706)',
                  color:'white', border:'none', borderRadius:10,
                  fontFamily:'Poppins,sans-serif', fontWeight:600,
                  fontSize:'0.85rem', cursor:'pointer',
                }}>
                + Create Order
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 6px' }}>
              <thead>
                <tr>
                  {['Order ID','Customer','Cloth','Qty','Status','Delivery Date','Action'].map(h => (
                    <th key={h} style={{
                      textAlign:'left', fontSize:'0.66rem', fontWeight:600,
                      color:'#9CA3AF', textTransform:'uppercase',
                      letterSpacing:'0.5px', padding:'4px 12px', whiteSpace:'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, idx) => (
                  <tr key={order._id || idx}>
                    <td style={{ padding:'11px 12px', background:'rgba(255,255,255,0.6)', borderRadius:'10px 0 0 10px' }}>
                      <span style={{ fontWeight:700, color:'#D97706', fontSize:'0.82rem' }}>
                        {order.orderID || '—'}
                      </span>
                    </td>
                    <td style={{ padding:'11px 12px', background:'rgba(255,255,255,0.6)' }}>
                      <p style={{ fontWeight:600, fontSize:'0.82rem', color:'#1E1B4B' }}>
                        {order.customerRef?.name || '—'}
                      </p>
                      <p style={{ fontSize:'0.68rem', color:'#9CA3AF' }}>
                        {order.customerID || '—'}
                      </p>
                    </td>
                    <td style={{ padding:'11px 12px', background:'rgba(255,255,255,0.6)' }}>
                      <span style={{ fontSize:'0.82rem' }}>{order.clothType || '—'}</span>
                    </td>
                    <td style={{ padding:'11px 12px', background:'rgba(255,255,255,0.6)' }}>
                      <span style={{ fontSize:'0.82rem' }}>{order.quantity || 1}</span>
                    </td>
                    <td style={{ padding:'11px 12px', background:'rgba(255,255,255,0.6)' }}>
                      {getStatusBadge(order.status)}
                    </td>
                    <td style={{ padding:'11px 12px', background:'rgba(255,255,255,0.6)' }}>
                      <span style={{ fontSize:'0.8rem', color:'#4B5563', whiteSpace:'nowrap' }}>
                        {order.deliveryDate
                          ? new Date(order.deliveryDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
                          : '—'}
                      </span>
                    </td>
                    <td style={{ padding:'11px 12px', background:'rgba(255,255,255,0.6)', borderRadius:'0 10px 10px 0' }}>
                      <button
                        onClick={() => handleViewOrder(order)}
                        style={{
                          display:'flex', alignItems:'center', gap:3,
                          background:'rgba(245,158,11,0.1)',
                          border:'1px solid rgba(245,158,11,0.25)',
                          borderRadius:6, padding:'6px 10px',
                          color:'#D97706', fontSize:'0.76rem', fontWeight:600,
                          cursor:'pointer', fontFamily:'Poppins,sans-serif',
                        }}>
                        Update <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}