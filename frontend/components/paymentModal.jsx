'use client'
import { useState, useEffect } from 'react'
import { X, Smartphone, Banknote } from 'lucide-react'

const NOTES = [
  { key:'fiveHundred', label:'₹500', value:500 },
  { key:'twoHundred',  label:'₹200', value:200 },
  { key:'hundred',     label:'₹100', value:100 },
  { key:'fifty',       label:'₹50',  value:50  },
  { key:'twenty',      label:'₹20',  value:20  },
  { key:'ten',         label:'₹10',  value:10  },
]

const emptyBreakdown = {
  fiveHundred:0, twoHundred:0, hundred:0,
  fifty:0, twenty:0, ten:0, coins:0,
}

export default function PaymentModal({ order, onClose, onSuccess, API }) {
  const totalCost   = order?.unitCost || 0
  const alreadyPaid = order?.payment?.amountPaid || order?.amountSettled || 0
  const remaining   = Math.max(totalCost - alreadyPaid, 0)

  const [method, setMethod]       = useState('cash')
  const [amount, setAmount]       = useState(remaining)
  const [gpayRef, setGpayRef]     = useState('')
  const [notes, setNotes]         = useState('')
  const [breakdown, setBreakdown] = useState({ ...emptyBreakdown })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const cashTotal = Object.entries(breakdown).reduce((sum, [key, qty]) => {
    if (key === 'coins') return sum + (parseFloat(qty) || 0)
    const note = NOTES.find(n => n.key === key)
    return sum + (note ? note.value * (parseInt(qty) || 0) : 0)
  }, 0)

  useEffect(() => {
    if (method === 'cash') setAmount(cashTotal)
  }, [cashTotal, method])

  const setNote = (key, val) => {
    setBreakdown(p => ({ ...p, [key]: Math.max(0, parseInt(val) || 0) }))
  }

  const change = method === 'cash' ? Math.max(cashTotal - remaining, 0) : 0

  const handleSubmit = async () => {
    if (method === 'gpay' && (!amount || amount <= 0)) {
      setError('Enter a valid amount'); return
    }
    if (method === 'cash' && cashTotal === 0) {
      setError('Enter cash notes received'); return
    }
    setSaving(true); setError('')
    try {
      await API.post(`/api/orders/${order.orderID}/payment`, {
        method,
        amount: method === 'cash'
          ? Math.min(cashTotal, remaining)
          : parseFloat(amount),
        gpayRef,
        notes,
        cashBreakdown: method === 'cash' ? breakdown : {},
      })
      onSuccess()
    } catch (e) {
      setError(e.response?.data?.message || 'Payment failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0,
      background:'rgba(30,27,75,0.45)',
      backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center',
      justifyContent:'center', zIndex:2000, padding:16 }}>

      <div style={{ background:'white', borderRadius:20,
        width:'100%', maxWidth:460,
        maxHeight:'92vh', overflowY:'auto',
        boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px',
          borderBottom:'1px solid #F3F4F6',
          display:'flex', justifyContent:'space-between',
          alignItems:'center', position:'sticky',
          top:0, background:'white', zIndex:1,
          borderRadius:'20px 20px 0 0' }}>
          <div>
            <p style={{ fontWeight:800, fontSize:'1rem', color:'#1E1B4B' }}>
              💳 Record Payment
            </p>
            <p style={{ fontSize:'0.75rem', color:'#6B7280', marginTop:2 }}>
              {order?.orderID} · {order?.customerRef?.name || order?.customerID}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background:'#F3F4F6', border:'none',
              borderRadius:'50%', width:32, height:32,
              cursor:'pointer', display:'flex',
              alignItems:'center', justifyContent:'center' }}>
            <X size={16} color="#6B7280"/>
          </button>
        </div>

        <div style={{ padding:'16px 20px' }}>

          {/* Summary */}
          <div style={{ background:'#F8F7FF', borderRadius:12,
            padding:'12px', marginBottom:16 }}>
            <div style={{ display:'grid',
              gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {[
                { label:'Total',     value:`₹${totalCost.toLocaleString('en-IN')}`,   color:'#1E1B4B' },
                { label:'Paid',      value:`₹${alreadyPaid.toLocaleString('en-IN')}`,  color:'#059669' },
                { label:'Remaining', value:`₹${remaining.toLocaleString('en-IN')}`,
                  color: remaining > 0 ? '#DC2626' : '#059669' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign:'center' }}>
                  <p style={{ fontSize:'0.62rem', color:'#9CA3AF',
                    fontWeight:600, marginBottom:3 }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize:'0.92rem', fontWeight:800, color:s.color }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {remaining === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <p style={{ fontSize:'2rem', marginBottom:8 }}>✅</p>
              <p style={{ fontWeight:700, color:'#059669', fontSize:'1rem' }}>
                Fully Paid!
              </p>
              <p style={{ fontSize:'0.82rem', color:'#6B7280', marginTop:4 }}>
                ₹{totalCost.toLocaleString('en-IN')} received
              </p>
            </div>
          ) : (
            <>
              {/* Method selector */}
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:'0.72rem', fontWeight:700,
                  color:'#9CA3AF', textTransform:'uppercase',
                  letterSpacing:'0.5px', marginBottom:10 }}>
                  Payment Method
                </p>
                <div style={{ display:'grid',
                  gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { value:'cash', label:'Cash',
                      icon:<Banknote size={20}/>,
                      color:'#059669',
                      bg:'rgba(16,185,129,0.08)',
                      border:'rgba(16,185,129,0.3)' },
                    { value:'gpay', label:'GPay',
                      icon:<Smartphone size={20}/>,
                      color:'#4F46E5',
                      bg:'rgba(79,70,229,0.08)',
                      border:'rgba(79,70,229,0.3)' },
                  ].map(m => (
                    <button key={m.value} type="button"
                      onClick={() => setMethod(m.value)}
                      style={{ padding:'14px',
                        border: method === m.value
                          ? `2px solid ${m.border}`
                          : '1.5px solid #E5E7EB',
                        borderRadius:12, cursor:'pointer',
                        background: method === m.value ? m.bg : 'white',
                        display:'flex', flexDirection:'column',
                        alignItems:'center', gap:6,
                        fontFamily:'Poppins,sans-serif',
                        transition:'all 0.2s' }}>
                      <span style={{ color: method === m.value
                        ? m.color : '#9CA3AF' }}>
                        {m.icon}
                      </span>
                      <span style={{ fontSize:'0.85rem', fontWeight:700,
                        color: method === m.value ? m.color : '#6B7280' }}>
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CASH UI */}
              {method === 'cash' && (
                <div>
                  <p style={{ fontSize:'0.72rem', fontWeight:700,
                    color:'#9CA3AF', textTransform:'uppercase',
                    letterSpacing:'0.5px', marginBottom:10 }}>
                    Enter number of notes received
                  </p>

                  <div style={{ display:'grid', gap:7, marginBottom:12 }}>
                    {NOTES.map(note => (
                      <div key={note.key} style={{ display:'flex',
                        alignItems:'center', gap:10,
                        background:'#F9FAFB', borderRadius:10,
                        padding:'9px 12px' }}>

                        <div style={{ width:58, textAlign:'center',
                          background: note.value >= 200
                            ? 'rgba(79,70,229,0.08)'
                            : 'rgba(16,185,129,0.08)',
                          border: `1px solid ${note.value >= 200
                            ? 'rgba(79,70,229,0.2)'
                            : 'rgba(16,185,129,0.2)'}`,
                          borderRadius:8, padding:'4px 6px' }}>
                          <p style={{ fontWeight:800, fontSize:'0.9rem',
                            color: note.value >= 200 ? '#4F46E5' : '#059669' }}>
                            {note.label}
                          </p>
                        </div>

                        <div style={{ display:'flex', alignItems:'center',
                          gap:7, flex:1 }}>
                          <button type="button"
                            onClick={() => setNote(note.key,
                              (breakdown[note.key] || 0) - 1)}
                            style={{ width:30, height:30, borderRadius:'50%',
                              background:'rgba(239,68,68,0.08)',
                              border:'1px solid rgba(239,68,68,0.2)',
                              cursor:'pointer', fontWeight:800,
                              color:'#DC2626', fontSize:'1.1rem',
                              display:'flex', alignItems:'center',
                              justifyContent:'center' }}>
                            −
                          </button>
                          <input type="number" min="0"
                            value={breakdown[note.key] || ''}
                            onChange={e => setNote(note.key, e.target.value)}
                            placeholder="0"
                            style={{ width:44, textAlign:'center',
                              padding:'5px 2px',
                              border:'1.5px solid #E5E7EB',
                              borderRadius:8,
                              fontFamily:'Poppins,sans-serif',
                              fontSize:'0.95rem', fontWeight:700,
                              color:'#1E1B4B', outline:'none' }}/>
                          <button type="button"
                            onClick={() => setNote(note.key,
                              (breakdown[note.key] || 0) + 1)}
                            style={{ width:30, height:30, borderRadius:'50%',
                              background:'rgba(16,185,129,0.08)',
                              border:'1px solid rgba(16,185,129,0.2)',
                              cursor:'pointer', fontWeight:800,
                              color:'#059669', fontSize:'1.1rem',
                              display:'flex', alignItems:'center',
                              justifyContent:'center' }}>
                            +
                          </button>
                        </div>

                        <p style={{ fontSize:'0.85rem', fontWeight:700,
                          color:'#1E1B4B', minWidth:48, textAlign:'right' }}>
                          {(breakdown[note.key] || 0) > 0
                            ? `₹${(note.value * breakdown[note.key])
                                .toLocaleString('en-IN')}`
                            : '—'}
                        </p>
                      </div>
                    ))}

                    {/* Coins */}
                    <div style={{ display:'flex', alignItems:'center',
                      gap:10, background:'#F9FAFB', borderRadius:10,
                      padding:'9px 12px' }}>
                      <div style={{ width:58, textAlign:'center',
                        background:'rgba(245,158,11,0.08)',
                        border:'1px solid rgba(245,158,11,0.2)',
                        borderRadius:8, padding:'4px 6px' }}>
                        <p style={{ fontWeight:800, fontSize:'0.9rem',
                          color:'#D97706' }}>🪙</p>
                        <p style={{ fontSize:'0.6rem', color:'#9CA3AF' }}>
                          coins
                        </p>
                      </div>
                      <div style={{ flex:1, display:'flex',
                        alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:'0.82rem', color:'#6B7280' }}>
                          ₹
                        </span>
                        <input type="number" min="0" step="0.5"
                          value={breakdown.coins || ''}
                          onChange={e => setBreakdown(p => ({
                            ...p, coins: parseFloat(e.target.value) || 0
                          }))}
                          placeholder="0"
                          style={{ flex:1, padding:'7px 8px',
                            border:'1.5px solid #E5E7EB', borderRadius:8,
                            fontFamily:'Poppins,sans-serif',
                            fontSize:'0.95rem', fontWeight:700,
                            color:'#1E1B4B', outline:'none' }}/>
                      </div>
                      <p style={{ fontSize:'0.85rem', fontWeight:700,
                        color:'#1E1B4B', minWidth:48, textAlign:'right' }}>
                        {(breakdown.coins || 0) > 0
                          ? `₹${breakdown.coins}` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Cash summary */}
                  <div style={{ background: cashTotal >= remaining
                      ? 'rgba(16,185,129,0.06)'
                      : 'rgba(245,158,11,0.06)',
                    border: `1.5px solid ${cashTotal >= remaining
                      ? 'rgba(16,185,129,0.2)'
                      : 'rgba(245,158,11,0.2)'}`,
                    borderRadius:12, padding:'12px 14px',
                    marginBottom:14 }}>
                    <div style={{ display:'grid',
                      gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                      {[
                        { label:'Cash Given', value:`₹${cashTotal.toLocaleString('en-IN')}`,     color:'#1E1B4B' },
                        { label:'Amount Due', value:`₹${remaining.toLocaleString('en-IN')}`,     color:'#DC2626' },
                        { label: change > 0 ? '↩ Return' : 'Change',
                          value: change > 0 ? `₹${change.toLocaleString('en-IN')}` : '—',
                          color: change > 0 ? '#D97706' : '#9CA3AF' },
                      ].map((s, i) => (
                        <div key={i} style={{ textAlign:'center' }}>
                          <p style={{ fontSize:'0.62rem', color: i===2 && change>0
                            ? '#D97706' : '#9CA3AF',
                            fontWeight:600, marginBottom:2 }}>
                            {s.label}
                          </p>
                          <p style={{ fontSize:'0.95rem', fontWeight:800,
                            color:s.color }}>
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    {change > 0 && (
                      <p style={{ textAlign:'center', fontSize:'0.75rem',
                        color:'#D97706', fontWeight:600, marginTop:8 }}>
                        ⚠️ Return ₹{change.toLocaleString('en-IN')} to customer
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* GPAY UI */}
              {method === 'gpay' && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ textAlign:'center', padding:'16px',
                    background:'rgba(79,70,229,0.05)',
                    borderRadius:12, marginBottom:14 }}>
                    <p style={{ fontSize:'2rem', marginBottom:6 }}>📱</p>
                    <p style={{ fontSize:'0.85rem', color:'#4F46E5',
                      fontWeight:600, marginBottom:4 }}>
                      GPay / UPI Payment
                    </p>
                    <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>
                      Record after confirming payment received
                    </p>
                  </div>

                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:'0.72rem', fontWeight:700,
                      color:'#9CA3AF', textTransform:'uppercase',
                      display:'block', marginBottom:6 }}>
                      Amount Received (₹)
                    </label>
                    <input type="number" min="0"
                      value={amount}
                      onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                      style={{ width:'100%', padding:'12px 14px',
                        border:'1.5px solid rgba(79,70,229,0.2)',
                        borderRadius:10, fontFamily:'Poppins,sans-serif',
                        fontSize:'1.1rem', fontWeight:700,
                        color:'#4F46E5', outline:'none' }}/>
                  </div>

                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:'0.72rem', fontWeight:700,
                      color:'#9CA3AF', textTransform:'uppercase',
                      display:'block', marginBottom:6 }}>
                      GPay Reference / UTR (optional)
                    </label>
                    <input type="text" value={gpayRef}
                      onChange={e => setGpayRef(e.target.value)}
                      placeholder="e.g. UPI123456789"
                      style={{ width:'100%', padding:'11px 14px',
                        border:'1.5px solid rgba(79,70,229,0.2)',
                        borderRadius:10, fontFamily:'Poppins,sans-serif',
                        fontSize:'0.9rem', color:'#1E1B4B', outline:'none' }}/>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:'0.72rem', fontWeight:700,
                  color:'#9CA3AF', textTransform:'uppercase',
                  display:'block', marginBottom:6 }}>
                  Notes (optional)
                </label>
                <input type="text" value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Partial payment, balance later..."
                  style={{ width:'100%', padding:'10px 14px',
                    border:'1.5px solid #E5E7EB', borderRadius:10,
                    fontFamily:'Poppins,sans-serif', fontSize:'0.88rem',
                    color:'#1E1B4B', outline:'none' }}/>
              </div>

              {error && (
                <p style={{ color:'#DC2626', fontSize:'0.82rem', marginBottom:12 }}>
                  ⚠️ {error}
                </p>
              )}

              {/* Submit */}
              <button type="button" onClick={handleSubmit}
                disabled={saving
                  || (method === 'cash' && cashTotal === 0)
                  || (method === 'gpay' && !amount)}
                style={{ width:'100%', padding:'14px',
                  background: (method === 'cash' && cashTotal === 0)
                    || (method === 'gpay' && !amount)
                    ? '#E5E7EB'
                    : method === 'cash'
                      ? 'linear-gradient(135deg,#059669,#10B981)'
                      : 'linear-gradient(135deg,#4F46E5,#6366F1)',
                  color: (method === 'cash' && cashTotal === 0)
                    || (method === 'gpay' && !amount)
                    ? '#9CA3AF' : 'white',
                  border:'none', borderRadius:12,
                  fontFamily:'Poppins,sans-serif', fontWeight:700,
                  fontSize:'0.95rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center',
                  justifyContent:'center', gap:8 }}>
                {saving
                  ? '⏳ Recording...'
                  : method === 'cash'
                    ? `✅ Confirm ₹${Math.min(cashTotal, remaining)
                        .toLocaleString('en-IN')} Cash`
                    : `✅ Confirm ₹${(parseFloat(amount) || 0)
                        .toLocaleString('en-IN')} GPay`}
              </button>
            </>
          )}

          {/* Payment history */}
          {(order?.payment?.history?.length > 0) && (
            <div style={{ marginTop:18 }}>
              <p style={{ fontSize:'0.72rem', fontWeight:700,
                color:'#9CA3AF', textTransform:'uppercase',
                letterSpacing:'0.5px', marginBottom:10 }}>
                Payment History
              </p>
              <div style={{ display:'grid', gap:8 }}>
                {order.payment.history.map((h, i) => (
                  <div key={i} style={{ padding:'10px 14px',
                    background:'#F9FAFB', borderRadius:10,
                    display:'flex', justifyContent:'space-between',
                    alignItems:'center' }}>
                    <div>
                      <p style={{ fontSize:'0.82rem', fontWeight:600,
                        color:'#1E1B4B' }}>
                        {h.method === 'cash' ? '💵 Cash' : '📱 GPay'}
                        {h.notes && (
                          <span style={{ fontSize:'0.72rem',
                            color:'#9CA3AF', fontWeight:400,
                            marginLeft:6 }}>
                            · {h.notes}
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize:'0.7rem', color:'#9CA3AF', marginTop:2 }}>
                        {h.paidAt
                          ? new Date(h.paidAt).toLocaleString('en-IN', {
                              day:'numeric', month:'short',
                              hour:'2-digit', minute:'2-digit',
                            })
                          : ''}
                      </p>
                    </div>
                    <p style={{ fontWeight:800, color:'#059669',
                      fontSize:'0.95rem' }}>
                      +₹{(h.amount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}