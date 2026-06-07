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

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await API.get('/api/customers')
      setCustomers(res.data.customers)

      // Fetch payment details for each customer
      const payments = {}
      const inputs   = {}
      await Promise.all(res.data.customers.map(async (c) => {
        try {
          const pr = await API.get(`/api/customers/${c.customerID}/payment`)
          payments[c.customerID] = pr.data.payment
          inputs[c.customerID]   = pr.data.payment.amountSettled || ''
        } catch (_) {
          payments[c.customerID] = { totalCost:0, amountSettled:0, balance:0 }
          inputs[c.customerID]   = ''
        }
      }))
      setCustomerPayments(payments)
      setSettledInputs(inputs)
    } catch (e) {
      console.error(e)
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

                      {/* Order breakdown */}
                      {payment.totalCost > 0 && (
                        <div style={{ background:'rgba(79,70,229,0.04)', borderRadius:10, padding:'12px 16px', marginBottom:14 }}>
                          <p style={{ fontSize:'0.75rem', fontWeight:600, color:'#4F46E5', marginBottom:8 }}>Orders breakdown:</p>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                            {[
                              { label:'Total from Orders', value:`₹${payment.totalCost.toLocaleString('en-IN')}`, color:'#4F46E5' },
                              { label:'Amount Settled',    value:`₹${payment.amountSettled.toLocaleString('en-IN')}`, color:'#059669' },
                              { label:'Balance Due',       value:`₹${Math.max(payment.balance,0).toLocaleString('en-IN')}`, color: payment.balance>0?'#DC2626':'#059669' },
                            ].map((s,i) => (
                              <div key={i} style={{ textAlign:'center', background:'rgba(255,255,255,0.7)', borderRadius:8, padding:'10px' }}>
                                <p style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:600, marginBottom:4 }}>{s.label}</p>
                                <p style={{ fontSize:'1rem', fontWeight:800, color:s.color }}>{s.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {payment.totalCost === 0 && (
                        <p style={{ fontSize:'0.82rem', color:'#9CA3AF', marginBottom:14 }}>
                          ℹ️ No order costs set yet. Go to each order and set the ORDER COST to auto-calculate total.
                        </p>
                      )}

                      {/* Set amount settled */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
                        <div>
                          <label className="input-label">AMOUNT SETTLED (₹)</label>
                          <NumInput
                            prefix="₹"
                            value={parseFloat(settled) || 0}
                            onChange={val => setSettledInputs(prev => ({ ...prev, [c.customerID]: val }))}
                            placeholder="0"
                            style={{ border:'1.5px solid rgba(16,185,129,0.25)' }}
                          />
                        </div>
                        <div>
                          <label className="input-label">BALANCE (AUTO)</label>
                          <div style={{ padding:'11px 16px', background: liveBalance>0?'rgba(239,68,68,0.06)':'rgba(16,185,129,0.06)', border:`1.5px solid ${liveBalance>0?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}`, borderRadius:10, display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ color:'#9CA3AF' }}>₹</span>
                            <span style={{ fontSize:'1rem', fontWeight:700, color:liveBalance>0?'#DC2626':'#059669' }}>
                              {payment.totalCost > 0 ? Math.max(liveBalance,0).toLocaleString('en-IN') : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {paymentMsg[c.customerID] && (
                        <p style={{ fontSize:'0.82rem', fontWeight:500, marginBottom:10, color:paymentMsg[c.customerID].startsWith('✅')?'#059669':'#DC2626' }}>
                          {paymentMsg[c.customerID]}
                        </p>
                      )}

                      <button onClick={() => handlePaymentSave(c.customerID)} disabled={paymentSaving===c.customerID}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 22px', background:'linear-gradient(135deg,#10B981,#059669)', color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.85rem', cursor:paymentSaving===c.customerID?'not-allowed':'pointer', opacity:paymentSaving===c.customerID?0.7:1, boxShadow:'0 4px 12px rgba(16,185,129,0.25)' }}>
                        {paymentSaving===c.customerID ? <><div className="spinner" />Saving...</> : <><Check size={15} />Save Payment</>}
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
    </main>
  )
}