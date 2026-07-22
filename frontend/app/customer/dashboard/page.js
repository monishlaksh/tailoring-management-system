'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const BACKEND = 'https://tailoring-management-apwh.onrender.com'

export default function CustomerDashboard() {
  const router          = useRouter()
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const hasFetched = useRef(false) // prevent double-fetch in strict mode

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const token = localStorage.getItem('customerToken')
    if (!token) {
      router.replace('/customer/login')
      return
    }
    fetchData(token)
  }, [])

  const fetchData = async (token) => {
  setLoading(true)
  setError('')
  try {
    // Fetch customer info
    const meRes  = await fetch(`${BACKEND}/api/auth/customer/me`, {
      method: 'GET',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    const meText = await meRes.text()
    let meJson
    try { meJson = JSON.parse(meText) }
    catch (e) {
      setError('Server error. Please try again.')
      setLoading(false)
      return
    }

    if (meRes.status === 401) {
      localStorage.removeItem('customerToken')
      router.replace('/customer/login')
      return
    }

    if (!meJson.success) {
      setError(meJson.message || 'Failed to load your data.')
      setLoading(false)
      return
    }

    setCustomer(meJson.customer)

    // Fetch orders
    const ordRes  = await fetch(`${BACKEND}/api/orders/my-orders`, {
      method: 'GET',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    const ordText = await ordRes.text()

    try {
      const ordJson = JSON.parse(ordText)
      if (ordJson.success) {
        setOrders(ordJson.orders || [])
      } else {
        console.error('[ORDERS]', ordJson.message)
        // Still show dashboard — just no orders
        setOrders([])
      }
    } catch (e) {
      console.error('[ORDERS] Non-JSON response:', ordText.slice(0, 200))
      setOrders([])
    }

  } catch (e) {
    console.error('[CUSTOMER DASHBOARD]', e)
    setError('Cannot reach server. Check your connection.')
  } finally {
    setLoading(false)
  }
}

  const handleLogout = () => {
    localStorage.removeItem('customerToken')
    router.replace('/customer/login')
  }

  const getStatusColor = (status) => ({
    'Booking':            '#4F46E5',
    'Cutting':            '#D97706',
    'Stitching':          '#2563EB',
    'Finishing':          '#9333EA',
    'Ready For Delivery': '#059669',
    'Delivered':          '#059669',
  }[status] || '#9CA3AF')

  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#EEF2FF,#E0E7FF)',
      fontFamily:'Poppins,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:44, height:44,
          border:'3px solid rgba(79,70,229,0.2)',
          borderTopColor:'#4F46E5', borderRadius:'50%',
          animation:'spin 0.8s linear infinite',
          margin:'0 auto 14px' }}/>
        <p style={{ color:'#6B7280' }}>Loading your orders...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh',
      background:'linear-gradient(135deg,#EEF2FF,#E0E7FF)',
      fontFamily:'Poppins,sans-serif', padding:'20px' }}>
      <div style={{ maxWidth:600, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ background:'white', borderRadius:20,
          padding:'20px', marginBottom:16,
          boxShadow:'0 4px 20px rgba(79,70,229,0.1)' }}>
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom: customer?.payment ? 16 : 0 }}>
            <div>
              <h1 style={{ fontSize:'1.2rem', fontWeight:800,
                color:'#1E1B4B', marginBottom:2 }}>
                ✂️ Al-Ameen Tailors
              </h1>
              <p style={{ fontSize:'0.82rem', color:'#6B7280' }}>
                {customer?.name || '—'}
              </p>
              <p style={{ fontSize:'0.72rem', color:'#4F46E5',
                fontWeight:600 }}>
                {customer?.customerID}
              </p>
            </div>
            <button onClick={handleLogout}
              style={{ padding:'8px 16px',
                background:'rgba(239,68,68,0.08)',
                border:'1.5px solid rgba(239,68,68,0.2)',
                borderRadius:10, color:'#DC2626',
                fontSize:'0.8rem', fontWeight:600,
                cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
              Logout
            </button>
          </div>

          {/* Payment summary */}
          {customer?.payment && (
            <div style={{ display:'grid',
              gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {[
                { label:'Total',   value:`₹${(customer.payment.totalCost||0).toLocaleString('en-IN')}`,    color:'#4F46E5' },
                { label:'Paid',    value:`₹${(customer.payment.amountSettled||0).toLocaleString('en-IN')}`, color:'#059669' },
                { label:'Balance', value:`₹${(customer.payment.balance||0).toLocaleString('en-IN')}`,       color:customer.payment.balance>0?'#DC2626':'#059669' },
              ].map((s,i) => (
                <div key={i} style={{ background:'#F8F7FF',
                  borderRadius:12, padding:'10px',
                  textAlign:'center' }}>
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

        {/* Error */}
        {error && (
          <div style={{ background:'white', borderRadius:16,
            padding:'20px', marginBottom:16, textAlign:'center',
            border:'1.5px solid rgba(239,68,68,0.2)' }}>
            <p style={{ color:'#DC2626', marginBottom:12,
              fontSize:'0.88rem' }}>
              {error}
            </p>
            <button
              onClick={() => {
                const token = localStorage.getItem('customerToken')
                if (token) fetchData(token)
              }}
              style={{ padding:'9px 24px',
                background:'linear-gradient(135deg,#4F46E5,#6366F1)',
                color:'white', border:'none', borderRadius:10,
                fontFamily:'Poppins,sans-serif', fontWeight:600,
                fontSize:'0.88rem', cursor:'pointer' }}>
              🔄 Retry
            </button>
          </div>
        )}

        {/* Orders */}
        {!error && (
          <>
            <h2 style={{ fontSize:'0.9rem', fontWeight:700,
              color:'#1E1B4B', marginBottom:12 }}>
              Your Orders ({orders.length})
            </h2>

            {orders.length === 0 ? (
              <div style={{ background:'white', borderRadius:16,
                padding:'40px', textAlign:'center' }}>
                <p style={{ fontSize:'2rem', marginBottom:10 }}>🧵</p>
                <p style={{ color:'#6B7280' }}>No orders yet.</p>
              </div>
            ) : (
              <div style={{ display:'grid', gap:12 }}>
                {orders.map(order => (
                  <div key={order._id} style={{ background:'white',
                    borderRadius:16, padding:'16px 18px',
                    boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ display:'flex',
                      justifyContent:'space-between',
                      alignItems:'flex-start', marginBottom:8 }}>
                      <div>
                        <p style={{ fontWeight:700, color:'#4F46E5',
                          fontSize:'0.85rem', marginBottom:2 }}>
                          {order.orderID}
                        </p>
                        <p style={{ fontSize:'0.88rem', color:'#1E1B4B',
                          fontWeight:600, marginBottom:2 }}>
                          {order.clothType}
                        </p>
                        <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>
                          Qty: {order.quantity} · Delivery:{' '}
                          {order.deliveryDate
                            ? new Date(order.deliveryDate)
                                .toLocaleDateString('en-IN',{
                                  day:'numeric',month:'short',year:'numeric'
                                })
                            : '—'}
                        </p>
                      </div>
                      <span style={{ fontSize:'0.72rem', fontWeight:700,
                        padding:'4px 10px', borderRadius:999,
                        background:`${getStatusColor(order.status)}18`,
                        color:getStatusColor(order.status),
                        whiteSpace:'nowrap', flexShrink:0 }}>
                        {order.status}
                      </span>
                    </div>

                    {/* Cost */}
                    {(order.unitCost||0) > 0 && (
                      <div style={{ display:'flex', gap:10,
                        marginTop:8, paddingTop:8,
                        borderTop:'1px solid #F3F4F6' }}>
                        <span style={{ fontSize:'0.72rem',
                          color:'#6B7280' }}>
                          Cost: <strong style={{ color:'#1E1B4B' }}>
                            ₹{order.unitCost.toLocaleString('en-IN')}
                          </strong>
                        </span>
                        {(order.amountSettled||0) > 0 && (
                          <span style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                            Paid: <strong style={{ color:'#059669' }}>
                              ₹{order.amountSettled.toLocaleString('en-IN')}
                            </strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}