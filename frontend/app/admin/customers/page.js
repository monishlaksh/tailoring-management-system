'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Search, Edit2, Trash2,
  X, Check, User, ChevronDown, ChevronUp
} from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'
import NumInput from '../../../components/NumInput'

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers]           = useState([])
  const [customerPayments, setCustomerPayments] = useState({})
  const [search, setSearch]                 = useState('')
  const [loading, setLoading]               = useState(true)
  const [modal, setModal]                   = useState(false)
  const [editData, setEditData]             = useState(null)
  const [form, setForm]                     = useState({ name:'', phone:'', address:'', notes:'' })
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState('')
  const [expandedPayment, setExpandedPayment] = useState(null)
  const [settledInputs, setSettledInputs]   = useState({})
  const [paymentSaving, setPaymentSaving]   = useState(null)
  const [paymentMsg, setPaymentMsg]         = useState({})

  const [payCustomer, setPayCustomer]   = useState(null)
const [custOrders, setCustOrders]     = useState([])
const [payLoading, setPayLoading]     = useState(false)
const [payMethod, setPayMethod]       = useState('cash')
const [payAmount, setPayAmount]       = useState(0)
const [payGpay, setPayGpay]           = useState('')
const [payNotes, setPayNotes]         = useState('')
const [payResult, setPayResult]       = useState(null)
const [payBreakdown, setPayBreakdown] = useState({
  fiveHundred:0, twoHundred:0, hundred:0,
  fifty:0, twenty:0, ten:0, coins:0,
})


  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
  try {
    const res = await API.get('/api/customers/with-payments')

    const customerList = res.data.customers || []

    setCustomers(customerList)

    const payments = {}
    const inputs = {}

    customerList.forEach(c => {
      payments[c.customerID] = c.payment || {
        totalCost: 0,
        amountSettled: 0,
        balance: 0
      }

      inputs[c.customerID] =
        c.payment?.amountSettled || ''
    })

    setCustomerPayments(payments)
    setSettledInputs(inputs)

  } catch (e) {
    console.error('[CUSTOMERS]', e)
  } finally {
    setLoading(false)
  }
}

  const openAdd = () => {
    setEditData(null)
    setForm({ name:'', phone:'', address:'', notes:'' })
    setError('')
    setModal(true)
  }

  const openEdit = (c) => {
    setEditData(c)
    setForm({ name:c.name, phone:c.phone, address:c.address||'', notes:c.notes||'' })
    setError('')
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.phone) { setError('Name and phone required'); return }
    setSaving(true); setError('')
    try {
      if (editData) {
        await API.put(`/api/customers/${editData.customerID}`, form)
      } else {
        await API.post('/api/customers', form)
      }
      setModal(false)
      fetchCustomers()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (customerID) => {
    if (!confirm('Delete this customer?')) return
    try {
      await API.delete(`/api/customers/${customerID}`)
      fetchCustomers()
    } catch (e) { alert('Failed to delete') }
  }

  const handlePaymentSave = async (customerID) => {
    setPaymentSaving(customerID)
    setPaymentMsg(prev => ({ ...prev, [customerID]:'' }))
    try {
      const settled = parseFloat(settledInputs[customerID]) || 0
      const res     = await API.patch(`/api/customers/${customerID}/payment`, { amountSettled: settled })
      setPaymentMsg(prev => ({ ...prev, [customerID]:'✅ Payment saved!' }))
      setCustomerPayments(prev => ({ ...prev, [customerID]: res.data.payment }))
      setTimeout(() => setPaymentMsg(prev => ({ ...prev, [customerID]:'' })), 3000)
    } catch (e) {
      setPaymentMsg(prev => ({ ...prev, [customerID]:'❌ ' + (e.response?.data?.message || 'Failed') }))
    } finally { setPaymentSaving(null) }
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
    // Calculate due per order
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
    const cashTotal = payMethod === 'cash'
      ? Object.entries(payBreakdown).reduce((sum, [key, qty]) => {
          if (key === 'coins') return sum + (parseFloat(qty)||0)
          const noteValues = { fiveHundred:500, twoHundred:200, hundred:100, fifty:50, twenty:20, ten:10 }
          return sum + (noteValues[key]||0) * (parseInt(qty)||0)
        }, 0)
      : payAmount

    const res = await API.post(
      `/api/customers/${payCustomer.customerID}/pay`,
      {
        method:        payMethod,
        amount:        payMethod === 'cash' ? cashTotal : payAmount,
        gpayRef:       payGpay,
        notes:         payNotes,
        cashBreakdown: payMethod === 'cash' ? payBreakdown : {},
      }
    )
    setPayResult(res.data)
    fetchCustomers() // refresh list
  } catch (e) {
    alert(e.response?.data?.message || 'Payment failed')
  } finally {
    setPayLoading(false) }
}

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.customerID?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:1000, margin:'0 auto' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')} style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Customer Management</h1>
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ padding:'9px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={15} /> Add Customer
        </button>
      </div>

      <div className="glass fade-up" style={{ padding:'24px' }}>

        <div style={{ position:'relative', marginBottom:20, maxWidth:300 }}>
          <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
          <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding:'9px 14px 9px 34px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.85rem', outline:'none', width:'100%', color:'#1E1B4B' }} />
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:12 }}>👤</p>
            <p style={{ color:'#6B7280', fontSize:'0.9rem' }}>No customers yet.</p>
            <button onClick={openAdd} className="btn-primary" style={{ marginTop:16, padding:'10px 24px', fontSize:'0.85rem' }}>+ Add First Customer</button>
          </div>
        ) : (
          <div style={{ display:'grid', gap:12 }}>
            {filtered.map(c => {
              const payment    = customerPayments[c.customerID] || { totalCost:0, amountSettled:0, balance:0 }
              const isExpanded = expandedPayment === c.customerID
              const hasDue     = payment.balance > 0
              const settled    = settledInputs[c.customerID]
              const liveBalance = payment.totalCost - (parseFloat(settled)||0)

              return (
                <div key={c._id} className="glass" style={{ overflow:'hidden', border: hasDue?'1.5px solid rgba(239,68,68,0.2)':'1.5px solid rgba(255,255,255,0.8)' }}>

                  {/* Customer row */}
                  <div style={{ padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#4F46E5,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <User size={20} color="white" />
                      </div>
                      <div>
                        <p style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.95rem' }}>{c.name}</p>
                        <p style={{ fontSize:'0.78rem', color:'#4F46E5', fontWeight:600 }}>{c.customerID}</p>
                        <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>📞 {c.phone}</p>
                        {c.address && <p style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>📍 {c.address}</p>}
                      </div>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>

                      {/* Payment badges */}
                      {payment.totalCost > 0 && (
                        <div style={{ display:'flex', gap:6 }}>
                          <span style={{ fontSize:'0.73rem', fontWeight:600, padding:'3px 10px', borderRadius:999, background:'rgba(79,70,229,0.08)', color:'#4F46E5' }}>
                            ₹{payment.totalCost.toLocaleString('en-IN')} total
                          </span>
                          <span style={{ fontSize:'0.73rem', fontWeight:600, padding:'3px 10px', borderRadius:999, background:hasDue?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)', color:hasDue?'#DC2626':'#059669' }}>
                            {hasDue ? `₹${payment.balance.toLocaleString('en-IN')} due` : '✅ Paid'}
                          </span>
                        </div>
                      )}

                      <button onClick={() => setExpandedPayment(isExpanded?null:c.customerID)}
                        style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, padding:'7px 12px', color:'#059669', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                        ₹ Payment
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      <button onClick={() => openEdit(c)} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:8, padding:'7px 12px', color:'#4F46E5', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button onClick={() => handleDelete(c.customerID)} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'7px 12px', color:'#DC2626', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Payment panel */}
                  {isExpanded && (
                    <div style={{ borderTop:'1px solid rgba(79,70,229,0.1)', padding:'20px', background:'rgba(16,185,129,0.02)' }}>
                      <p style={{ fontSize:'0.82rem', fontWeight:600, color:'#059669', marginBottom:14 }}>
                        💰 Payment for {c.name}
                      </p>

                      
                      {payment.totalCost === 0 && (
                        <p style={{ fontSize:'0.82rem', color:'#9CA3AF', marginBottom:14 }}>
                          ℹ️ No order costs set yet. Go to each order and set the ORDER COST to auto-calculate total.
                        </p>
                      )}

                      <button
                          onClick={e => { e.stopPropagation(); openCustomerPayment(c) }}
                          style={{ padding:'7px 14px',
                            background:'linear-gradient(135deg,#059669,#10B981)',
                            color:'white', border:'none', borderRadius:8,
                            fontFamily:'Poppins,sans-serif', fontWeight:600,
                            fontSize:'0.78rem', cursor:'pointer',
                            display:'flex', alignItems:'center', gap:5 }}>
                          💳 Pay
                        </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(30,27,75,0.3)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div className="glass" style={{ width:'100%', maxWidth:480, padding:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1.1rem' }}>{editData?'Edit Customer':'Add New Customer'}</h2>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={20} /></button>
            </div>
            {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'#DC2626', fontSize:'0.83rem' }}>{error}</div>}
            <div style={{ display:'grid', gap:14 }}>
              {[
                { label:'CUSTOMER NAME *', key:'name',    placeholder:'Full name'      },
                { label:'PHONE NUMBER *',  key:'phone',   placeholder:'10-digit phone' },
                { label:'ADDRESS',         key:'address', placeholder:'Full address'   },
                { label:'NOTES',           key:'notes',   placeholder:'Any notes'      },
              ].map(f => (
                <div key={f.key}>
                  <label className="input-label">{f.label}</label>
                  <input type="text" value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})}
                    placeholder={f.placeholder} className="input-field" />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24 }}>
              <button onClick={() => setModal(false)} className="btn-ghost" style={{ flex:1 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {saving ? <><div className="spinner" />Saving...</> : <><Check size={16} />{editData?'Update':'Save Customer'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

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
            display:'flex', justifyContent:'space-between',
            alignItems:'center', position:'sticky', top:0,
            background:'white', borderRadius:'20px 20px 0 0' }}>
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
              // Show result
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
                <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#9CA3AF',
                  textTransform:'uppercase', marginBottom:10 }}>
                  Payment Breakdown
                </p>
                {payResult.breakdown.map((b,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between',
                    padding:'8px 12px',
                    background: i%2===0 ? '#F8F7FF' : 'white',
                    borderRadius:8, marginBottom:4 }}>
                    <div>
                      <p style={{ fontSize:'0.82rem', fontWeight:600,
                        color:'#4F46E5' }}>
                        {b.orderID}
                      </p>
                      <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                        {b.clothType} · Remaining: ₹{b.remaining}
                      </p>
                    </div>
                    <p style={{ fontWeight:800, color:'#059669' }}>
                      +₹{b.paid.toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
                <button onClick={() => { setPayCustomer(null); setPayResult(null) }}
                  style={{ width:'100%', marginTop:16, padding:'12px',
                    background:'linear-gradient(135deg,#4F46E5,#6366F1)',
                    color:'white', border:'none', borderRadius:10,
                    fontFamily:'Poppins,sans-serif', fontWeight:700,
                    cursor:'pointer' }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Orders summary */}
                <div style={{ marginBottom:16 }}>
                  <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#9CA3AF',
                    textTransform:'uppercase', marginBottom:10 }}>
                    Outstanding Orders
                  </p>
                  {custOrders.filter(o => o.due > 0).length === 0 ? (
                    <p style={{ color:'#059669', fontWeight:600,
                      textAlign:'center', padding:'20px 0' }}>
                      ✅ All orders fully paid!
                    </p>
                  ) : (
                    custOrders.filter(o => o.due > 0).map((o,i) => (
                      <div key={i} style={{ display:'flex',
                        justifyContent:'space-between', padding:'8px 12px',
                        background: i%2===0 ? '#F8F7FF' : 'white',
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
                          Due: ₹{o.due.toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))
                  )}

                  {/* Total due */}
                  <div style={{ display:'flex', justifyContent:'space-between',
                    padding:'10px 12px', background:'rgba(239,68,68,0.06)',
                    borderRadius:10, marginTop:8,
                    border:'1.5px solid rgba(239,68,68,0.15)' }}>
                    <p style={{ fontWeight:700, color:'#DC2626' }}>Total Due</p>
                    <p style={{ fontWeight:800, color:'#DC2626', fontSize:'1.1rem' }}>
                      ₹{custOrders.reduce((s,o) => s+o.due, 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {custOrders.filter(o => o.due > 0).length > 0 && (
                  <>
                    {/* Method */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                      gap:10, marginBottom:16 }}>
                      {[
                        { v:'cash', l:'💵 Cash', c:'#059669', bg:'rgba(16,185,129,0.08)', b:'rgba(16,185,129,0.3)' },
                        { v:'gpay', l:'📱 GPay', c:'#4F46E5', bg:'rgba(79,70,229,0.08)',  b:'rgba(79,70,229,0.3)'  },
                      ].map(m => (
                        <button key={m.v} type="button"
                          onClick={() => setPayMethod(m.v)}
                          style={{ padding:'12px', borderRadius:12, cursor:'pointer',
                            border: payMethod===m.v ? `2px solid ${m.b}` : '1.5px solid #E5E7EB',
                            background: payMethod===m.v ? m.bg : 'white',
                            fontFamily:'Poppins,sans-serif', fontWeight:700,
                            fontSize:'0.9rem',
                            color: payMethod===m.v ? m.c : '#6B7280' }}>
                          {m.l}
                        </button>
                      ))}
                    </div>

                    {/* GPay amount */}
                    {payMethod === 'gpay' && (
                      <div style={{ marginBottom:14 }}>
                        <label style={{ fontSize:'0.72rem', fontWeight:700,
                          color:'#9CA3AF', textTransform:'uppercase',
                          display:'block', marginBottom:6 }}>
                          Amount (₹)
                        </label>
                        <input type="number" min="0" value={payAmount}
                          onChange={e => setPayAmount(parseFloat(e.target.value)||0)}
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
                          onChange={e => setPayGpay(e.target.value)}
                          placeholder="UPI ref / UTR"
                          style={{ width:'100%', padding:'11px 14px',
                            border:'1.5px solid rgba(79,70,229,0.2)',
                            borderRadius:10, fontFamily:'Poppins,sans-serif',
                            fontSize:'0.9rem', color:'#1E1B4B', outline:'none' }}/>
                      </div>
                    )}

                    {/* Cash notes */}
                    {payMethod === 'cash' && (
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
                            alignItems:'center', gap:10,
                            background:'#F9FAFB', borderRadius:10,
                            padding:'8px 12px', marginBottom:6 }}>
                            <div style={{ width:54, textAlign:'center',
                              background: note.value>=200
                                ? 'rgba(79,70,229,0.08)' : 'rgba(16,185,129,0.08)',
                              border:`1px solid ${note.value>=200
                                ? 'rgba(79,70,229,0.2)' : 'rgba(16,185,129,0.2)'}`,
                              borderRadius:8, padding:'4px 6px' }}>
                              <p style={{ fontWeight:800, fontSize:'0.88rem',
                                color: note.value>=200 ? '#4F46E5' : '#059669' }}>
                                {note.label}
                              </p>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:7, flex:1 }}>
                              <button type="button"
                                onClick={() => setPayBreakdown(p=>({...p,[note.key]:Math.max(0,(p[note.key]||0)-1)}))}
                                style={{ width:28, height:28, borderRadius:'50%',
                                  background:'rgba(239,68,68,0.08)',
                                  border:'1px solid rgba(239,68,68,0.2)',
                                  cursor:'pointer', color:'#DC2626',
                                  fontSize:'1.1rem', fontWeight:800,
                                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                                −
                              </button>
                              <input type="number" min="0"
                                value={payBreakdown[note.key]||''}
                                onChange={e => setPayBreakdown(p=>({...p,[note.key]:parseInt(e.target.value)||0}))}
                                placeholder="0"
                                style={{ width:42, textAlign:'center', padding:'5px',
                                  border:'1.5px solid #E5E7EB', borderRadius:8,
                                  fontFamily:'Poppins,sans-serif', fontSize:'0.95rem',
                                  fontWeight:700, color:'#1E1B4B', outline:'none' }}/>
                              <button type="button"
                                onClick={() => setPayBreakdown(p=>({...p,[note.key]:(p[note.key]||0)+1}))}
                                style={{ width:28, height:28, borderRadius:'50%',
                                  background:'rgba(16,185,129,0.08)',
                                  border:'1px solid rgba(16,185,129,0.2)',
                                  cursor:'pointer', color:'#059669',
                                  fontSize:'1.1rem', fontWeight:800,
                                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                                +
                              </button>
                            </div>
                            <p style={{ fontSize:'0.82rem', fontWeight:700,
                              color:'#1E1B4B', minWidth:46, textAlign:'right' }}>
                              {(payBreakdown[note.key]||0)>0
                                ? `₹${(note.value*(payBreakdown[note.key]||0)).toLocaleString('en-IN')}`
                                : '—'}
                            </p>
                          </div>
                        ))}

                        {/* Cash total summary */}
                        {(() => {
                          const noteValues = { fiveHundred:500, twoHundred:200, hundred:100, fifty:50, twenty:20, ten:10 }
                          const cashTotal  = Object.entries(payBreakdown).reduce((sum,[k,q]) => {
                            if (k==='coins') return sum+(parseFloat(q)||0)
                            return sum+(noteValues[k]||0)*(parseInt(q)||0)
                          }, 0)
                          const totalDue   = custOrders.reduce((s,o) => s+o.due, 0)
                          const change     = Math.max(cashTotal - totalDue, 0)
                          return (
                            <div style={{ background: cashTotal>=totalDue
                                ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
                              border:`1.5px solid ${cashTotal>=totalDue
                                ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                              borderRadius:12, padding:'12px 14px', marginTop:10 }}>
                              <div style={{ display:'grid',
                                gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                                {[
                                  { l:'Cash Given', v:`₹${cashTotal.toLocaleString('en-IN')}`,  c:'#1E1B4B' },
                                  { l:'Total Due',  v:`₹${totalDue.toLocaleString('en-IN')}`,   c:'#DC2626' },
                                  { l:change>0?'↩ Return':'Change',
                                    v:change>0?`₹${change.toLocaleString('en-IN')}`:'—',
                                    c:change>0?'#D97706':'#9CA3AF' },
                                ].map((s,i) => (
                                  <div key={i} style={{ textAlign:'center' }}>
                                    <p style={{ fontSize:'0.62rem', color:'#9CA3AF',
                                      fontWeight:600, marginBottom:2 }}>{s.l}</p>
                                    <p style={{ fontSize:'0.9rem', fontWeight:800,
                                      color:s.c }}>{s.v}</p>
                                  </div>
                                ))}
                              </div>
                              {change>0 && (
                                <p style={{ textAlign:'center', fontSize:'0.75rem',
                                  color:'#D97706', fontWeight:600, marginTop:8 }}>
                                  ⚠️ Return ₹{change.toLocaleString('en-IN')} to customer
                                </p>
                              )}
                            </div>
                          )
                        })()}
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
                        onChange={e => setPayNotes(e.target.value)}
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
                      {payLoading ? '⏳ Processing...' : `✅ Record Payment`}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )}

    </main>
  )
}