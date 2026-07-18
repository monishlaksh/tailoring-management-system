'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { customerAPI as API } from '../../../lib/api'

export default function CustomerDashboard() {
  const router = useRouter()
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    const token = localStorage.getItem('customerToken')
    if (!token) {
      router.push('/customer/login')
      return
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const meRes = await API.get('/api/auth/customer/me')
      setCustomer(meRes.data.customer)

      const ordersRes = await API.get('/api/orders/my-orders')
      setOrders(ordersRes.data.orders || [])
    } catch (e) {
      console.error('[CUSTOMER DASHBOARD]', e.response?.status, e.response?.data)
      if (e.response?.status === 401 || e.response?.status === 403) {
        localStorage.removeItem('customerToken')
        router.push('/customer/login')
      } else {
        setError('Failed to load your data. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('customerToken')
    router.push('/customer/login')
  }

  const getStatusColor = (status) => {
    const map = {
      'Booking':            '#4F46E5',
      'Cutting':            '#D97706',
      'Stitching':          '#2563EB',
      'Finishing':          '#9333EA',
      'Ready For Delivery': '#059669',
      'Delivered':          '#059669',
    }
    return map[status] || '#9CA3AF'
  }

  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'Poppins,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:44, height:44, border:'3px solid rgba(79,70,229,0.2)',
          borderTopColor:'#4F46E5', borderRadius:'50%',
          animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
        <p style={{ color:'#6B7280' }}>Loading your orders...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', fontFamily:'Poppins,sans-serif',
      background:'linear-gradient(135deg,#EEF2FF,#E0E7FF)', padding:'20px' }}>
      <div style={{ maxWidth:600, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ background:'white', borderRadius:20, padding:'20px',
          marginBottom:16, boxShadow:'0 4px 20px rgba(79,70,229,0.1)' }}>
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center' }}>
            <div>
              <h1 style={{ fontSize:'1.2rem', fontWeight:800,
                color:'#1E1B4B', marginBottom:2 }}>
                ✂️ Al-Ameen Tailors
              </h1>
              <p style={{ fontSize:'0.8rem', color:'#6B7280' }}>
                Welcome, {customer?.name || '—'}
              </p>
              <p style={{ fontSize:'0.72rem', color:'#4F46E5',
                fontWeight:600 }}>
                {customer?.customerID}
              </p>
            </div>
            <button onClick={handleLogout}
              style={{ padding:'8px 16px', background:'rgba(239,68,68,0.08)',
                border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10,
                color:'#DC2626', fontSize:'0.8rem', fontWeight:600,
                cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
              Logout
            </button>
          </div>

          {/* Payment summary */}
          {customer?.payment && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)',
              gap:10, marginTop:16 }}>
              {[
                { label:'Total Cost',  value:`₹${(customer.payment.totalCost||0).toLocaleString('en-IN')}`,    color:'#4F46E5' },
                { label:'Paid',        value:`₹${(customer.payment.amountSettled||0).toLocaleString('en-IN')}`, color:'#059669' },
                { label:'Balance Due', value:`₹${(customer.payment.balance||0).toLocaleString('en-IN')}`,       color:customer.payment.balance>0?'#DC2626':'#059669' },
              ].map((s,i) => (
                <div key={i} style={{ background:'#F8F7FF', borderRadius:12,
                  padding:'10px', textAlign:'center' }}>
                  <p style={{ fontSize:'0.62rem', color:'#9CA3AF',
                    fontWeight:600, marginBottom:3 }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize:'0.95rem', fontWeight:800,
                    color:s.color }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.08)',
            border:'1.5px solid rgba(239,68,68,0.2)',
            borderRadius:12, padding:'14px 18px', marginBottom:16,
            color:'#DC2626', fontSize:'0.85rem', textAlign:'center' }}>
            {error}
            <button onClick={fetchData}
              style={{ display:'block', margin:'10px auto 0',
                padding:'8px 20px', background:'#DC2626', color:'white',
                border:'none', borderRadius:8, cursor:'pointer',
                fontFamily:'Poppins,sans-serif', fontWeight:600 }}>
              Retry
            </button>
          </div>
        )}

        {/* Orders */}
        <h2 style={{ fontSize:'0.9rem', fontWeight:700, color:'#1E1B4B',
          marginBottom:12 }}>
          Your Orders ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <div style={{ background:'white', borderRadius:16, padding:'40px',
            textAlign:'center' }}>
            <p style={{ fontSize:'2rem', marginBottom:10 }}>🧵</p>
            <p style={{ color:'#6B7280' }}>No orders yet.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gap:12 }}>
            {orders.map(order => (
              <div key={order._id} style={{ background:'white',
                borderRadius:16, padding:'16px 18px',
                boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <p style={{ fontWeight:700, color:'#4F46E5',
                      fontSize:'0.88rem', marginBottom:3 }}>
                      {order.orderID}
                    </p>
                    <p style={{ fontSize:'0.85rem', color:'#1E1B4B',
                      fontWeight:600 }}>
                      {order.clothType}
                    </p>
                    <p style={{ fontSize:'0.75rem', color:'#6B7280',
                      marginTop:2 }}>
                      Qty: {order.quantity} · Delivery:{' '}
                      {order.deliveryDate
                        ? new Date(order.deliveryDate).toLocaleDateString('en-IN',{
                            day:'numeric', month:'short', year:'numeric'
                          })
                        : '—'}
                    </p>
                  </div>
                  <span style={{ fontSize:'0.75rem', fontWeight:700,
                    padding:'4px 10px', borderRadius:999,
                    background:`${getStatusColor(order.status)}15`,
                    color:getStatusColor(order.status),
                    whiteSpace:'nowrap' }}>
                    {order.status}
                  </span>
                </div>

                {/* Alteration */}
                {order.alteration?.required &&
                  (order.alteration.selectedOptions||[]).length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5,
                    marginTop:8 }}>
                    {order.alteration.selectedOptions.map((opt,i) => (
                      <span key={i} style={{ fontSize:'0.68rem', padding:'2px 8px',
                        borderRadius:999, background:'rgba(245,158,11,0.1)',
                        color:'#D97706', fontWeight:600 }}>
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}