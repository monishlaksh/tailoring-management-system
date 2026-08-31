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
  const [payCustomer, setPayCustomer]     = useState(null)
  const [custOrders, setCustOrders]       = useState([])
  const [payLoading, setPayLoading]       = useState(false)
  const [payMethod, setPayMethod]         = useState('cash')
  const [payAmount, setPayAmount]         = useState(0)
  const [payGpay, setPayGpay]             = useState('')
  const [payNotes, setPayNotes]           = useState('')
  const [payResult, setPayResult]         = useState(null)
  const [payBreakdown, setPayBreakdown]   = useState({
    fiveHundred:0, twoHundred:0, hundred:0,
    fifty:0, twenty:0, ten:0, coins:0,  
  })
  const [customers, setCustomers]         = useState([])
  const [custSearch, setCustSearch]       = useState('')
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editForm, setEditForm]           = useState({ name:'', phone:'', address:'', notes:'' })
  const [editSaving, setEditSaving]       = useState(false)
  const [activeTab, setActiveTab] = useState('orders')


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
    const [ordRes, custRes] = await Promise.all([
      API.get('/api/orders'),
      API.get('/api/customers'),
    ])
    setOrders(ordRes.data.orders || [])
    setCustomers(custRes.data.customers || [])
    setOrders(res.data.orders || [])
  } catch (e) {
    console.error('Orders fetch:', e.response?.status, e.response?.data)
    if (e.response?.status === 401) {
      localStorage.removeItem('employeeToken')
      router.push('/employee/login')
    }
  } finally {
    setLoading(false)
  }
}

const openCustomerPayment = async (customer) => {
  setPayCustomer(customer)
  setPayResult(null)
  setPayAmount(0)
  setPayMethod('cash')
  setPayBreakdown({ fiveHundred:0, twoHundred:0, hundred:0, fifty:0, twenty:0, ten:0, coins:0 })
  try {
    const res = await API.get(`/api/orders?customerID=${customer.customerID}`)
    const orders = res.data.orders || []
    const withDue = orders.map(o => ({
      ...o,
      due: Math.max((o.unitCost||0) - (o.payment?.amountPaid||o.amountSettled||0), 0)
    }))
    setCustOrders(withDue)
    const totalDue = withDue.reduce((s,o) => s+o.due, 0)
    setPayAmount(totalDue)
  } catch (e) { console.error(e) }
}

const handleBulkPay = async () => {
  if (!payAmount || payAmount <= 0) return
  setPayLoading(true)
  try {
    const noteValues = { fiveHundred:500, twoHundred:200, hundred:100, fifty:50, twenty:20, ten:10 }
    const cashTotal  = payMethod === 'cash'
      ? Object.entries(payBreakdown).reduce((sum,[k,q]) => {
          if (k==='coins') return sum+(parseFloat(q)||0)
          return sum+(noteValues[k]||0)*(parseInt(q)||0)
        }, 0)
      : payAmount

    const token = localStorage.getItem('employeeToken')
    const res   = await fetch(
      `https://tailoring-management-apwh.onrender.com/api/customers/${payCustomer.customerID}/pay`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          method:        payMethod,
          amount:        payMethod==='cash' ? cashTotal : payAmount,
          gpayRef:       payGpay,
          notes:         payNotes,
          cashBreakdown: payMethod==='cash' ? payBreakdown : {},
        }),
      }
    )
    const data = await res.json()
    if (!data.success) { alert(data.message || 'Payment failed'); return }
    setPayResult(data)
    fetchData()
  } catch (e) {
    alert('Payment failed')
  } finally { setPayLoading(false) }
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
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          <button onClick={() => setActiveTab('orders')}
            style={{ padding:'8px 18px', borderRadius:999, cursor:'pointer',
              fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.85rem',
              border: activeTab==='orders' ? '2px solid #4F46E5' : '1.5px solid rgba(79,70,229,0.2)',
              background: activeTab==='orders' ? 'rgba(79,70,229,0.1)' : 'white',
              color: activeTab==='orders' ? '#4F46E5' : '#6B7280' }}>
            📋 Orders
          </button>
          <button onClick={() => setActiveTab('customers')}
            style={{ padding:'8px 18px', borderRadius:999, cursor:'pointer',
              fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.85rem',
              border: activeTab==='customers' ? '2px solid #4F46E5' : '1.5px solid rgba(79,70,229,0.2)',
              background: activeTab==='customers' ? 'rgba(79,70,229,0.1)' : 'white',
              color: activeTab==='customers' ? '#4F46E5' : '#6B7280' }}>
            👥 Customers
          </button>
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
      {activeTab === 'orders' && (
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
                    onClick={() => router.push(`/employee/allotment/${order.orderID}`)}>
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
                      <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/employee/allotment/${order.orderID}`)
                          }}
                        style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:6, padding:'6px 10px', color:'#D97706', fontSize:'0.76rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                        allot <ChevronRight size={12}/>
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
      </div>)}
      {payCustomer && (
  <div style={{ position:'fixed', inset:0,
    background:'rgba(30,27,75,0.4)', backdropFilter:'blur(8px)',
    display:'flex', alignItems:'center', justifyContent:'center',
    zIndex:2000, padding:16 }}>
    <div style={{ background:'white', borderRadius:20, width:'100%',
      maxWidth:500, maxHeight:'92vh', overflowY:'auto',
      boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}>

      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #F3F4F6',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        position:'sticky', top:0, background:'white',
        borderRadius:'20px 20px 0 0' }}>
        <div>
          <p style={{ fontWeight:800, fontSize:'1rem', color:'#1E1B4B' }}>
            💳 Customer Payment
          </p>
          <p style={{ fontSize:'0.75rem', color:'#6B7280', marginTop:2 }}>
            {payCustomer.name} · {payCustomer.customerID}
          </p>
        </div>
        <button onClick={() => { setPayCustomer(null); setPayResult(null) }}
          style={{ background:'#F3F4F6', border:'none', borderRadius:'50%',
            width:32, height:32, cursor:'pointer', fontSize:'1rem' }}>
          ✕
        </button>
      </div>

      <div style={{ padding:'16px 20px' }}>
        {payResult ? (
          <div>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <p style={{ fontSize:'2rem', marginBottom:8 }}>✅</p>
              <p style={{ fontWeight:700, color:'#059669', fontSize:'1rem' }}>
                Payment Recorded!
              </p>
              {payResult.change > 0 && (
                <p style={{ color:'#D97706', fontWeight:600, marginTop:6 }}>
                  ⚠️ Return ₹{payResult.change.toLocaleString('en-IN')} to customer
                </p>
              )}
            </div>
            {payResult.breakdown?.map((b,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between',
                padding:'8px 12px',
                background:i%2===0?'#F8F7FF':'white',
                borderRadius:8, marginBottom:4 }}>
                <div>
                  <p style={{ fontSize:'0.82rem', fontWeight:600, color:'#4F46E5' }}>
                    {b.orderID}
                  </p>
                  <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                    {b.clothType} · Remaining: ₹{b.remaining}
                  </p>
                </div>
                <p style={{ fontWeight:800, color:'#059669' }}>
                  +₹{(b.paid||0).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
            <button onClick={() => { setPayCustomer(null); setPayResult(null) }}
              style={{ width:'100%', marginTop:16, padding:'12px',
                background:'linear-gradient(135deg,#4F46E5,#6366F1)',
                color:'white', border:'none', borderRadius:10,
                fontFamily:'Poppins,sans-serif', fontWeight:700, cursor:'pointer' }}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Orders due */}
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#9CA3AF',
                textTransform:'uppercase', marginBottom:10 }}>
                Outstanding Orders
              </p>
              {custOrders.filter(o=>o.due>0).length===0 ? (
                <p style={{ color:'#059669', fontWeight:600,
                  textAlign:'center', padding:'20px 0' }}>
                  ✅ All orders fully paid!
                </p>
              ) : (
                <>
                  {custOrders.filter(o=>o.due>0).map((o,i) => (
                    <div key={i} style={{ display:'flex',
                      justifyContent:'space-between', padding:'8px 12px',
                      background:i%2===0?'#F8F7FF':'white',
                      borderRadius:8, marginBottom:4 }}>
                      <div>
                        <p style={{ fontSize:'0.82rem', fontWeight:600,
                          color:'#4F46E5' }}>
                          {o.orderID}
                        </p>
                        <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                          {o.clothType} · Total: ₹{o.unitCost||0}
                        </p>
                      </div>
                      <p style={{ fontWeight:800, color:'#DC2626' }}>
                        ₹{o.due.toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between',
                    padding:'10px 12px',
                    background:'rgba(239,68,68,0.06)',
                    borderRadius:10, marginTop:8,
                    border:'1.5px solid rgba(239,68,68,0.15)' }}>
                    <p style={{ fontWeight:700, color:'#DC2626' }}>Total Due</p>
                    <p style={{ fontWeight:800, color:'#DC2626', fontSize:'1.1rem' }}>
                      ₹{custOrders.reduce((s,o)=>s+o.due,0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </>
              )}
            </div>

            {custOrders.filter(o=>o.due>0).length > 0 && (
              <>
                {/* Method */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                  gap:10, marginBottom:14 }}>
                  {[
                    { v:'cash', l:'💵 Cash', c:'#059669', bg:'rgba(16,185,129,0.08)', b:'rgba(16,185,129,0.3)' },
                    { v:'gpay', l:'📱 GPay', c:'#4F46E5', bg:'rgba(79,70,229,0.08)',  b:'rgba(79,70,229,0.3)'  },
                  ].map(m => (
                    <button key={m.v} type="button" onClick={() => setPayMethod(m.v)}
                      style={{ padding:'12px', borderRadius:12, cursor:'pointer',
                        border:payMethod===m.v?`2px solid ${m.b}`:'1.5px solid #E5E7EB',
                        background:payMethod===m.v?m.bg:'white',
                        fontFamily:'Poppins,sans-serif', fontWeight:700,
                        fontSize:'0.9rem',
                        color:payMethod===m.v?m.c:'#6B7280' }}>
                      {m.l}
                    </button>
                  ))}
                </div>

                {/* GPay */}
                {payMethod==='gpay' && (
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:'0.72rem', fontWeight:700,
                      color:'#9CA3AF', textTransform:'uppercase',
                      display:'block', marginBottom:6 }}>
                      Amount (₹)
                    </label>
                    <input type="number" min="0" value={payAmount}
                      onChange={e=>setPayAmount(parseFloat(e.target.value)||0)}
                      style={{ width:'100%', padding:'12px 14px',
                        border:'1.5px solid rgba(79,70,229,0.2)',
                        borderRadius:10, fontFamily:'Poppins,sans-serif',
                        fontSize:'1.1rem', fontWeight:700,
                        color:'#4F46E5', outline:'none', marginBottom:10 }}/>
                    <label style={{ fontSize:'0.72rem', fontWeight:700,
                      color:'#9CA3AF', textTransform:'uppercase',
                      display:'block', marginBottom:6 }}>
                      Reference (optional)
                    </label>
                    <input type="text" value={payGpay}
                      onChange={e=>setPayGpay(e.target.value)}
                      placeholder="UPI ref / UTR"
                      style={{ width:'100%', padding:'11px 14px',
                        border:'1.5px solid rgba(79,70,229,0.2)',
                        borderRadius:10, fontFamily:'Poppins,sans-serif',
                        fontSize:'0.9rem', color:'#1E1B4B', outline:'none' }}/>
                  </div>
                )}

                {/* Cash notes */}
                {payMethod==='cash' && (
                  <div style={{ marginBottom:14 }}>
                    {[
                      { key:'fiveHundred', label:'₹500', value:500 },
                      { key:'twoHundred',  label:'₹200', value:200 },
                      { key:'hundred',     label:'₹100', value:100 },
                      { key:'fifty',       label:'₹50',  value:50  },
                      { key:'twenty',      label:'₹20',  value:20  },
                      { key:'ten',         label:'₹10',  value:10  },
                    ].map(note => (
                      <div key={note.key} style={{ display:'flex',
                        alignItems:'center', gap:10, background:'#F9FAFB',
                        borderRadius:10, padding:'8px 12px', marginBottom:6 }}>
                        <div style={{ width:54, textAlign:'center',
                          background:note.value>=200?'rgba(79,70,229,0.08)':'rgba(16,185,129,0.08)',
                          border:`1px solid ${note.value>=200?'rgba(79,70,229,0.2)':'rgba(16,185,129,0.2)'}`,
                          borderRadius:8, padding:'4px 6px' }}>
                          <p style={{ fontWeight:800, fontSize:'0.88rem',
                            color:note.value>=200?'#4F46E5':'#059669' }}>
                            {note.label}
                          </p>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:7, flex:1 }}>
                          <button type="button"
                            onClick={()=>setPayBreakdown(p=>({...p,[note.key]:Math.max(0,(p[note.key]||0)-1)}))}
                            style={{ width:28,height:28,borderRadius:'50%',
                              background:'rgba(239,68,68,0.08)',
                              border:'1px solid rgba(239,68,68,0.2)',
                              cursor:'pointer',color:'#DC2626',
                              fontSize:'1.1rem',fontWeight:800,
                              display:'flex',alignItems:'center',justifyContent:'center' }}>
                            −
                          </button>
                          <input type="number" min="0"
                            value={payBreakdown[note.key]||''}
                            onChange={e=>setPayBreakdown(p=>({...p,[note.key]:parseInt(e.target.value)||0}))}
                            placeholder="0"
                            style={{ width:42,textAlign:'center',padding:'5px',
                              border:'1.5px solid #E5E7EB',borderRadius:8,
                              fontFamily:'Poppins,sans-serif',fontSize:'0.95rem',
                              fontWeight:700,color:'#1E1B4B',outline:'none' }}/>
                          <button type="button"
                            onClick={()=>setPayBreakdown(p=>({...p,[note.key]:(p[note.key]||0)+1}))}
                            style={{ width:28,height:28,borderRadius:'50%',
                              background:'rgba(16,185,129,0.08)',
                              border:'1px solid rgba(16,185,129,0.2)',
                              cursor:'pointer',color:'#059669',
                              fontSize:'1.1rem',fontWeight:800,
                              display:'flex',alignItems:'center',justifyContent:'center' }}>
                            +
                          </button>
                        </div>
                        <p style={{ fontSize:'0.82rem',fontWeight:700,
                          color:'#1E1B4B',minWidth:46,textAlign:'right' }}>
                          {(payBreakdown[note.key]||0)>0
                            ?`₹${(note.value*(payBreakdown[note.key]||0)).toLocaleString('en-IN')}`
                            :'—'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:'0.72rem', fontWeight:700,
                    color:'#9CA3AF', textTransform:'uppercase',
                    display:'block', marginBottom:6 }}>
                    Notes (optional)
                  </label>
                  <input type="text" value={payNotes}
                    onChange={e=>setPayNotes(e.target.value)}
                    placeholder="e.g. Full payment received..."
                    style={{ width:'100%', padding:'10px 14px',
                      border:'1.5px solid #E5E7EB', borderRadius:10,
                      fontFamily:'Poppins,sans-serif', fontSize:'0.88rem',
                      color:'#1E1B4B', outline:'none' }}/>
                </div>

                <button onClick={handleBulkPay} disabled={payLoading}
                  style={{ width:'100%', padding:'14px',
                    background:'linear-gradient(135deg,#059669,#10B981)',
                    color:'white', border:'none', borderRadius:12,
                    fontFamily:'Poppins,sans-serif', fontWeight:700,
                    fontSize:'0.95rem', cursor:'pointer' }}>
                  {payLoading ? '⏳ Processing...' : '✅ Record Payment'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  </div>
)}
        {activeTab === 'customers' && (
  <div>
    <div style={{ display:'flex', justifyContent:'space-between',
      alignItems:'center', marginBottom:14, gap:10 }}>
      <input
        value={custSearch}
        onChange={e => setCustSearch(e.target.value)}
        placeholder="Search customers..."
        style={{ flex:1, padding:'10px 14px',
          border:'1.5px solid rgba(79,70,229,0.2)',
          borderRadius:10, fontFamily:'Poppins,sans-serif',
          fontSize:'0.88rem', color:'#1E1B4B', outline:'none' }}/>
      <button onClick={() => router.push('/employee/orders/new')}
        style={{ padding:'9px 16px', whiteSpace:'nowrap',
          background:'linear-gradient(135deg,#4F46E5,#6366F1)',
          color:'white', border:'none', borderRadius:10,
          fontFamily:'Poppins,sans-serif', fontWeight:600,
          fontSize:'0.82rem', cursor:'pointer' }}>
        + New Order
      </button>
    </div>

    <div style={{ display:'grid', gap:10 }}>
      {customers
        .filter(c =>
          c.name?.toLowerCase().includes(custSearch.toLowerCase()) ||
          c.customerID?.toLowerCase().includes(custSearch.toLowerCase()) ||
          c.phone?.includes(custSearch)
        )
        .map(c => (
          <div key={c._id} style={{ background:'white',
            borderRadius:14, padding:'14px 18px',
            boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
              <div>
                <p style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.92rem' }}>
                  {c.name}
                </p>
                <p style={{ fontSize:'0.75rem', color:'#4F46E5', fontWeight:600 }}>
                  {c.customerID}
                </p>
                <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>
                  {c.phone}
                </p>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button
                  onClick={() => openCustomerPayment(c)}
                  style={{ padding:'6px 12px',
                    background:'linear-gradient(135deg,#059669,#10B981)',
                    color:'white', border:'none', borderRadius:8,
                    fontFamily:'Poppins,sans-serif', fontWeight:600,
                    fontSize:'0.75rem', cursor:'pointer' }}>
                  💳 Pay
                </button>
                <button
                  onClick={() => {
                    setEditingCustomer(c)
                    setEditForm({
                      name:    c.name    || '',
                      phone:   c.phone   || '',
                      address: c.address || '',
                      notes:   c.notes   || '',
                    })
                  }}
                  style={{ padding:'6px 12px',
                    background:'rgba(79,70,229,0.08)',
                    border:'1px solid rgba(79,70,229,0.2)',
                    borderRadius:8, color:'#4F46E5',
                    fontFamily:'Poppins,sans-serif', fontWeight:600,
                    fontSize:'0.75rem', cursor:'pointer' }}>
                  ✏️ Edit
                </button>
              </div>
            </div>
          </div>
        ))}
    </div>
  </div>
)}
    </main>
  )
}