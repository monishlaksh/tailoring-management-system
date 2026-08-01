'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import PaymentModal from '../../../components/PaymentModal'
import VoicePlayer  from '../../../components/VoicePlayer'
import { adminAPI as API } from '../../../lib/api'

const STAGE_INFO = {
  cutting:   { icon:'✂️', label:'Cutting',   color:'#D97706', bg:'rgba(245,158,11,0.08)'  },
  stitching: { icon:'🧵', label:'Stitching',  color:'#2563EB', bg:'rgba(59,130,246,0.08)'  },
  finishing: { icon:'🚩', label:'Finishing',  color:'#9333EA', bg:'rgba(168,85,247,0.08)'  },
}

const STATUS_BADGE = {
  not_assigned: { label:'Not Assigned', color:'#9CA3AF', bg:'rgba(156,163,175,0.1)'  },
  pending:      { label:'Pending',      color:'#D97706', bg:'rgba(245,158,11,0.1)'   },
  completed:    { label:'Completed ✓',  color:'#059669', bg:'rgba(16,185,129,0.1)'   },
}

export default function EmployeeAllotmentPage() {
  const router = useRouter()
  const params = useParams()
  const orderID = params?.orderID

  const hasFetched = useRef(false)

  const [allotment, setAllotment]   = useState(null)
  const [order, setOrder]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [pageError, setPageError]   = useState('')
  const [success, setSuccess]       = useState('')
  const [employee, setEmployee]     = useState(null)
  const [employees, setEmployees]   = useState([])
  const [empBonuses, setEmpBonuses] = useState({ cutting:0, stitching:0, finishing:0 })

  const [assigning, setAssigning]         = useState(null)
  const [approving, setApproving]         = useState(null)
  const [selectedEmp, setSelectedEmp]     = useState({ cutting:'', stitching:'', finishing:'' })
  const [stageNotes, setStageNotes]       = useState({ cutting:'', stitching:'', finishing:'' })
  const [delivering, setDelivering]       = useState(false)
  const [deliveryModal, setDeliveryModal] = useState(false)
  const [deliveryNote, setDeliveryNote]   = useState('')
  const [paymentModal, setPaymentModal]   = useState(false)

  const loadData = useCallback(async () => {
    if (!orderID || orderID === 'undefined') {
      setPageError('Invalid order ID')
      setLoading(false)
      return
    }

    setLoading(true)
    setPageError('')

    try {
      const allotRes = await API.get(`/api/allotment/${orderID}`)

      if (!allotRes.data.success) {
        setPageError(allotRes.data.message || 'Failed to load allotment')
        setLoading(false)
        return
      }

      setAllotment(allotRes.data.allotment)
      setOrder(allotRes.data.order)

      // Employees — separate try so it doesn't block
      try {
        const empRes  = await API.get('/api/employees')
        const allEmps = empRes.data.employees?.filter(e => e.isActive) || []
        setEmployees(allEmps)

        const bonuses = { cutting:0, stitching:0, finishing:0 }
        for (const stage of ['cutting','stitching','finishing']) {
          const empID = allotRes.data.allotment?.[stage]?.employeeID
          if (empID) {
            const found = allEmps.find(e => e.employeeID === empID)
            bonuses[stage] = found?.bonus || 0
          }
        }
        setEmpBonuses(bonuses)
      } catch {
        // non-critical
      }

    } catch (e) {
      const status = e.response?.status
      if (status === 401) {
        localStorage.removeItem('employeeToken')
        localStorage.removeItem('employeeUser')
        router.push('/employee/login')
        return
      }
      setPageError(e.response?.data?.message || `Failed to load (${status || 'network error'})`)
    } finally {
      setLoading(false)
    }
  }, [orderID])

  useEffect(() => {
    // Auth check
    const token = localStorage.getItem('employeeToken')
    if (!token) { router.push('/employee/login'); return }

    const userStr = localStorage.getItem('employeeUser')
    if (userStr) {
      try {
        const emp  = JSON.parse(userStr)
        const role = emp.accessRole || 'employee'
        if (role !== 'manager' && role !== 'receptionist' && !emp.hasFullAccess) {
          router.push('/employee/dashboard')
          return
        }
        setEmployee(emp)
      } catch {
        router.push('/employee/login')
        return
      }
    }

    // Prevent double-fetch in React strict mode
    if (hasFetched.current) return
    hasFetched.current = true

    loadData()
  }, []) // ← empty deps — only run once on mount

  const showMsg = (msg, isErr = false) => {
    if (isErr) { setPageError(msg); setTimeout(() => setPageError(''), 4000) }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
  }

  const handleAssign = async (stage) => {
    if (!selectedEmp[stage]) { showMsg('Select an employee', true); return }
    setAssigning(stage)
    try {
      await API.post(`/api/allotment/${orderID}/assign`, {
        stage, employeeID: selectedEmp[stage], notes: stageNotes[stage],
      })
      showMsg(`✅ ${STAGE_INFO[stage].label} assigned!`)
      hasFetched.current = false
      loadData()
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed to assign', true)
    } finally { setAssigning(null) }
  }

  const handleApprove = async (stage) => {
    setApproving(stage)
    try {
      const res = await API.post(`/api/allotment/${orderID}/approve`, { stage })
      showMsg(`✅ Approved! ₹${res.data.totalAward || 0} awarded`)
      hasFetched.current = false
      loadData()
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed to approve', true)
    } finally { setApproving(null) }
  }

  const handleDeliver = async () => {
    setDelivering(true)
    try {
      await API.post(`/api/allotment/${orderID}/deliver`, {
        notes: deliveryNote,
        acknowledgedBy: employee?.name || 'Manager',
      })
      showMsg('✅ Order marked as delivered!')
      setDeliveryModal(false)
      hasFetched.current = false
      loadData()
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed', true)
    } finally { setDelivering(false) }
  }

  const canAssign = (stage) => {
    if (!allotment) return false
    if (stage === 'cutting')   return allotment.cutting.status === 'not_assigned'
    if (stage === 'stitching') return allotment.cutting.status === 'completed' && allotment.stitching.status === 'not_assigned'
    if (stage === 'finishing') return allotment.stitching.status === 'completed' && allotment.finishing.status === 'not_assigned'
    return false
  }

  const getEligible = (stage) => employees.filter(e => e.role === stage || e.role === 'all')

  const card = { background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'Poppins,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:44, height:44,
          border:'3px solid rgba(79,70,229,0.15)',
          borderTopColor:'#4F46E5', borderRadius:'50%',
          animation:'spin 0.8s linear infinite', margin:'0 auto 14px' }}/>
        <p style={{ color:'#6B7280', fontSize:'0.9rem' }}>Loading allotment...</p>
        <p style={{ color:'#C4C9D4', fontSize:'0.75rem', marginTop:4 }}>{orderID}</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  // ── Error ─────────────────────────────────────────────────
  if (pageError || !allotment || !order) return (
    <main style={{ minHeight:'100vh', padding:24, fontFamily:'Poppins,sans-serif',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ maxWidth:400, width:'100%', textAlign:'center' }}>
        <p style={{ fontSize:'2rem', marginBottom:12 }}>⚠️</p>
        <p style={{ fontWeight:700, color:'#1E1B4B', marginBottom:6 }}>
          Could not load allotment
        </p>
        <p style={{ fontSize:'0.85rem', color:'#6B7280', marginBottom:6 }}>
          {pageError || 'Order or allotment not found'}
        </p>
        <p style={{ fontSize:'0.72rem', color:'#9CA3AF',
          background:'#F8F7FF', padding:'6px 12px',
          borderRadius:8, marginBottom:20 }}>
          {orderID}
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={() => { hasFetched.current = false; loadData() }}
            style={{ padding:'10px 24px',
              background:'linear-gradient(135deg,#4F46E5,#6366F1)',
              color:'white', border:'none', borderRadius:10,
              fontFamily:'Poppins,sans-serif', fontWeight:700,
              fontSize:'0.9rem', cursor:'pointer' }}>
            🔄 Retry
          </button>
          <button onClick={() => router.back()}
            style={{ padding:'10px 24px', background:'rgba(79,70,229,0.08)',
              color:'#4F46E5', border:'1.5px solid rgba(79,70,229,0.2)',
              borderRadius:10, fontFamily:'Poppins,sans-serif',
              fontWeight:600, fontSize:'0.9rem', cursor:'pointer' }}>
            ← Back
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  // ── Computed ──────────────────────────────────────────────
  const stagesCompleted = ['cutting','stitching','finishing']
    .filter(s => allotment[s].status === 'completed').length
  const progressPct = Math.round((stagesCompleted / 3) * 100)
  const totalCost   = order.unitCost || 0
  const amountPaid  = order.payment?.amountPaid || order.amountSettled || 0
  const balanceDue  = Math.max(totalCost - amountPaid, 0)

  const waPhone     = order?.customerRef?.phone
    ? String(order.customerRef.phone).replace(/\D/g, '') : ''
  const waFormatted = waPhone.startsWith('91') ? waPhone : `91${waPhone}`
  const waMsg       = encodeURIComponent(
    `🎉 *Al-Ameen Tailors*\n\nDear ${order?.customerRef?.name || 'Customer'},\n\nYour order *${order?.orderID}* is *Ready for Delivery!* ✅\n\nPlease visit our shop.\n\nThank you! ✂️`
  )
  const waURL = waPhone ? `https://wa.me/${waFormatted}?text=${waMsg}` : ''

  return (
    <main style={{ minHeight:'100vh', padding:'16px',
      maxWidth:900, margin:'0 auto', fontFamily:'Poppins,sans-serif' }}>

      {/* Header */}
      <div style={{ ...card, padding:'14px 20px', marginBottom:16,
        display:'flex', alignItems:'center',
        justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => router.back()}
            style={{ width:36, height:36, borderRadius:10,
              background:'rgba(79,70,229,0.08)', border:'none',
              cursor:'pointer', display:'flex', alignItems:'center',
              justifyContent:'center', color:'#4F46E5' }}>
            <ArrowLeft size={18}/>
          </button>
          <div>
            <p style={{ fontWeight:800, color:'#1E1B4B', fontSize:'0.95rem' }}>
              Allotment — {orderID}
            </p>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
              {order.clothType} · {order.customerRef?.name}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'0.8rem', color:'#6B7280' }}>{stagesCompleted}/3</span>
          <div style={{ width:80, height:6, background:'rgba(79,70,229,0.1)',
            borderRadius:999, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progressPct}%`,
              background:'linear-gradient(90deg,#4F46E5,#00D4FF)',
              borderRadius:999, transition:'width 0.5s' }}/>
          </div>
          <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#4F46E5' }}>
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Messages */}
      {pageError && (
        <div style={{ background:'rgba(239,68,68,0.08)',
          border:'1.5px solid rgba(239,68,68,0.2)',
          borderRadius:10, padding:'11px 16px', marginBottom:12,
          color:'#DC2626', fontSize:'0.87rem' }}>
          {pageError}
        </div>
      )}
      {success && (
        <div style={{ background:'rgba(16,185,129,0.08)',
          border:'1.5px solid rgba(16,185,129,0.2)',
          borderRadius:10, padding:'11px 16px', marginBottom:12,
          color:'#059669', fontSize:'0.87rem' }}>
          {success}
        </div>
      )}

      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>

        {/* LEFT column */}
        <div style={{ display:'grid', gap:14 }}>

          {/* Order Details */}
          <div style={{ ...card, padding:'18px' }}>
            <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:700,
              textTransform:'uppercase', marginBottom:12 }}>
              📋 Order Details
            </p>
            {[
              { l:'Order ID',   v: order.orderID },
              { l:'Cloth Type', v: order.clothType },
              { l:'Quantity',   v: order.quantity ?? '—' },
              { l:'Delivery',   v: order.deliveryDate
                ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : '—' },
              { l:'Status',     v: order.status },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between',
                padding:'7px 10px',
                background: i % 2 === 0 ? '#F8F7FF' : 'white',
                borderRadius:7 }}>
                <span style={{ fontSize:'0.78rem', color:'#9CA3AF', fontWeight:600 }}>
                  {item.l}
                </span>
                <span style={{ fontSize:'0.82rem', color:'#1E1B4B', fontWeight:600 }}>
                  {item.v}
                </span>
              </div>
            ))}
          </div>

          {/* Measurements */}
          {order.measurements && Object.values(order.measurements).some(v => v) && (
            <div style={{ ...card, padding:'18px' }}>
              <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:700,
                textTransform:'uppercase', marginBottom:12 }}>
                📏 Measurements
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                {Object.entries(order.measurements).filter(([,v]) => v).map(([k,v]) => (
                  <div key={k} style={{ background:'rgba(79,70,229,0.05)',
                    borderRadius:8, padding:'8px 12px' }}>
                    <p style={{ fontSize:'0.65rem', color:'#9CA3AF',
                      textTransform:'uppercase', fontWeight:600 }}>{k}</p>
                    <p style={{ fontSize:'0.95rem', color:'#1E1B4B',
                      fontWeight:700 }}>{v}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Note */}
          {order.voiceNote?.data && (
            <div style={{ ...card, padding:'18px' }}>
              <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:700,
                textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>
                🎙 Voice Note
              </p>
              <VoicePlayer voiceNote={order.voiceNote}/>
            </div>
          )}

          {/* Alteration */}
          {order.alteration?.required && (
            <div style={{ ...card, padding:'18px', border:'1.5px solid #FDE68A' }}>
              <p style={{ fontSize:'0.75rem', color:'#D97706', fontWeight:700,
                textTransform:'uppercase', marginBottom:10 }}>
                ⚠️ Alterations
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(order.alteration.selectedOptions || []).map((opt, i) => (
                  <span key={i} style={{ padding:'4px 10px',
                    background:'rgba(245,158,11,0.1)',
                    border:'1px solid rgba(245,158,11,0.2)',
                    borderRadius:999, fontSize:'0.78rem',
                    fontWeight:600, color:'#D97706' }}>
                    {opt}
                  </span>
                ))}
              </div>
              {order.alteration.notes && (
                <p style={{ fontSize:'0.82rem', color:'#4B5563',
                  marginTop:8, fontStyle:'italic' }}>
                  {order.alteration.notes}
                </p>
              )}
            </div>
          )}

          {/* QR Code */}
          {allotment.qrCode && (
            <div style={{ ...card, padding:'18px', textAlign:'center' }}>
              <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:700,
                textTransform:'uppercase', marginBottom:10 }}>
                📱 QR Code
              </p>
              <img src={allotment.qrCode} alt="QR"
                style={{ width:160, height:160,
                  border:'3px solid #EEF2FF', borderRadius:10 }}/>
              <p style={{ fontSize:'0.72rem', color:'#9CA3AF', marginTop:8 }}>
                {orderID}
              </p>
              <a href={allotment.qrCode} download={`QR-${orderID}.png`}
                style={{ display:'inline-block', marginTop:10, padding:'7px 18px',
                  background:'linear-gradient(135deg,#4F46E5,#6366F1)',
                  color:'white', borderRadius:8, fontSize:'0.8rem',
                  fontWeight:600, textDecoration:'none' }}>
                ⬇ Download QR
              </a>
            </div>
          )}

          {/* Payment */}
          <div style={{ ...card, padding:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:14 }}>
              <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:700,
                textTransform:'uppercase', letterSpacing:'0.5px' }}>
                💳 Payment
              </p>
              <button onClick={() => setPaymentModal(true)}
                style={{ padding:'7px 14px',
                  background:'linear-gradient(135deg,#4F46E5,#6366F1)',
                  color:'white', border:'none', borderRadius:8,
                  fontFamily:'Poppins,sans-serif', fontWeight:600,
                  fontSize:'0.78rem', cursor:'pointer' }}>
                + Record Payment
              </button>
            </div>
            <div style={{ display:'grid', gap:6 }}>
              {[
                { label:'Total Cost',  value:`₹${totalCost.toLocaleString('en-IN')}`,   color:'#1E1B4B' },
                { label:'Paid',        value:`₹${amountPaid.toLocaleString('en-IN')}`,   color:'#059669' },
                { label:'Balance Due', value:`₹${balanceDue.toLocaleString('en-IN')}`,
                  color: balanceDue > 0 ? '#DC2626' : '#059669' },
              ].map((s, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between',
                  padding:'8px 12px',
                  background: i % 2 === 0 ? 'rgba(79,70,229,0.04)' : 'transparent',
                  borderRadius:8 }}>
                  <span style={{ fontSize:'0.8rem', color:'#6B7280', fontWeight:600 }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize:'0.88rem', fontWeight:800, color:s.color }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
            {order.payment?.method && order.payment.method !== 'unpaid' && (
              <div style={{ marginTop:10, display:'inline-flex',
                alignItems:'center', gap:6, padding:'6px 12px',
                background: order.payment.method === 'cash'
                  ? 'rgba(16,185,129,0.08)' : 'rgba(79,70,229,0.08)',
                borderRadius:8 }}>
                <span>{order.payment.method === 'cash' ? '💵' : '📱'}</span>
                <span style={{ fontSize:'0.75rem', fontWeight:700,
                  color: order.payment.method === 'cash' ? '#059669' : '#4F46E5' }}>
                  {order.payment.method === 'cash' ? 'Cash' : 'GPay'}
                  {order.payment.gpayRef && ` · ${order.payment.gpayRef}`}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT column — Stages */}
        <div style={{ display:'grid', gap:14, alignContent:'start' }}>

          {['cutting', 'stitching', 'finishing'].map((stage, idx) => {
            const info      = STAGE_INFO[stage]
            const stageData = allotment[stage]
            const badge     = STATUS_BADGE[stageData.status] || STATUS_BADGE.not_assigned
            const locked    = !canAssign(stage) && stageData.status === 'not_assigned'
            const eligible  = getEligible(stage)

            return (
              <div key={stage} style={{ ...card, overflow:'hidden',
                border: stageData.status === 'completed'
                  ? '1.5px solid rgba(16,185,129,0.3)' : '1.5px solid #E5E7EB',
                opacity: locked ? 0.6 : 1 }}>

                <div style={{ padding:'14px 18px', background:info.bg,
                  display:'flex', alignItems:'center',
                  justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:'1.3rem' }}>{info.icon}</span>
                    <div>
                      <p style={{ fontWeight:700, color:info.color, fontSize:'0.95rem' }}>
                        {info.label}
                      </p>
                      {locked && (
                        <p style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>
                          Complete {['cutting','stitching','finishing'][idx-1]} first
                        </p>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize:'0.75rem', fontWeight:600,
                    padding:'4px 12px', borderRadius:999,
                    background:badge.bg, color:badge.color }}>
                    {badge.label}
                  </span>
                </div>

                <div style={{ padding:'16px 18px' }}>

                  {stageData.status === 'not_assigned' && !locked && (
                    <div>
                      <label style={{ fontSize:'0.72rem', color:'#9CA3AF',
                        fontWeight:700, textTransform:'uppercase',
                        display:'block', marginBottom:6 }}>
                        ASSIGN EMPLOYEE
                      </label>
                      {eligible.length === 0 ? (
                        <p style={{ fontSize:'0.82rem', color:'#EF4444', marginBottom:10 }}>
                          No employees available for {stage}.
                        </p>
                      ) : (
                        <select value={selectedEmp[stage]}
                          onChange={e => setSelectedEmp(p => ({...p, [stage]:e.target.value}))}
                          style={{ width:'100%', padding:'11px 14px',
                            background:'white',
                            border:'1.5px solid rgba(79,70,229,0.2)',
                            borderRadius:10, fontFamily:'Poppins,sans-serif',
                            fontSize:'0.88rem', color:'#1E1B4B',
                            outline:'none', marginBottom:10 }}>
                          <option value="">Select employee...</option>
                          {eligible.map(e => (
                            <option key={e._id} value={e.employeeID}>
                              {e.name} ({e.employeeID})
                            </option>
                          ))}
                        </select>
                      )}
                      <textarea value={stageNotes[stage]}
                        onChange={e => setStageNotes(p => ({...p, [stage]:e.target.value}))}
                        placeholder="Notes for employee..." rows={2}
                        style={{ width:'100%', padding:'9px 12px',
                          background:'white',
                          border:'1.5px solid rgba(79,70,229,0.2)',
                          borderRadius:10, fontFamily:'Poppins,sans-serif',
                          fontSize:'0.85rem', color:'#1E1B4B',
                          outline:'none', resize:'none', marginBottom:10 }}/>
                      <button onClick={() => handleAssign(stage)}
                        disabled={assigning === stage || !selectedEmp[stage]}
                        style={{ width:'100%', padding:'11px',
                          background: selectedEmp[stage]
                            ? `linear-gradient(135deg,${info.color},${info.color}cc)`
                            : '#E5E7EB',
                          color: selectedEmp[stage] ? 'white' : '#9CA3AF',
                          border:'none', borderRadius:10,
                          fontFamily:'Poppins,sans-serif', fontWeight:600,
                          fontSize:'0.88rem',
                          cursor: selectedEmp[stage] ? 'pointer' : 'not-allowed',
                          display:'flex', alignItems:'center',
                          justifyContent:'center', gap:6 }}>
                        {assigning === stage ? '⏳ Assigning...' : `Assign ${info.label}`}
                      </button>
                    </div>
                  )}

                  {stageData.status === 'pending' && (
                    <div>
                      <div style={{ padding:'12px 14px', background:info.bg,
                        borderRadius:12, border:`1px solid ${info.color}33`,
                        marginBottom:12 }}>
                        <p style={{ fontWeight:700, color:info.color,
                          fontSize:'0.88rem', marginBottom:3 }}>
                          {stageData.employeeName}
                        </p>
                        <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                          Assigned {stageData.assignedAt
                            ? new Date(stageData.assignedAt).toLocaleDateString('en-IN')
                            : ''}
                        </p>
                        {stageData.notes && (
                          <p style={{ fontSize:'0.78rem', color:'#4B5563',
                            marginTop:6, fontStyle:'italic' }}>
                            "{stageData.notes}"
                          </p>
                        )}
                      </div>
                      <div style={{ padding:'10px 14px',
                        background:'rgba(16,185,129,0.06)',
                        border:'1.5px solid rgba(16,185,129,0.2)',
                        borderRadius:10, marginBottom:12 }}>
                        <div style={{ display:'flex', justifyContent:'space-between',
                          alignItems:'center' }}>
                          <div>
                            <p style={{ fontSize:'0.68rem', color:'#059669',
                              fontWeight:700, textTransform:'uppercase',
                              marginBottom:2 }}>
                              Will Be Awarded
                            </p>
                            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                              ₹{order?.empRate || 0} rate
                              {(empBonuses[stage] || 0) > 0
                                && ` + ₹${empBonuses[stage]} bonus`}
                            </p>
                          </div>
                          <p style={{ fontSize:'1.3rem', fontWeight:800, color:'#059669' }}>
                            ₹{((order?.empRate || 0) + (empBonuses[stage] || 0))
                                .toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleApprove(stage)}
                        disabled={approving === stage}
                        style={{ width:'100%', padding:'12px',
                          background:'linear-gradient(135deg,#10B981,#059669)',
                          color:'white', border:'none', borderRadius:12,
                          fontFamily:'Poppins,sans-serif', fontWeight:700,
                          fontSize:'0.88rem', cursor:'pointer',
                          display:'flex', alignItems:'center',
                          justifyContent:'center', gap:6 }}>
                        {approving === stage ? '⏳ Approving...' : '✅ Approve & Complete'}
                      </button>
                    </div>
                  )}

                  {stageData.status === 'completed' && (
                    <div>
                      <div style={{ padding:'12px 14px', background:'#F0FDF4',
                        borderRadius:12, border:'1px solid #D1FAE5',
                        marginBottom: stage === 'finishing' && waURL ? 10 : 0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between',
                          alignItems:'center' }}>
                          <div>
                            <p style={{ fontSize:'0.88rem', color:'#059669',
                              fontWeight:700 }}>
                              ✅ {stageData.employeeName}
                            </p>
                            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                              {stageData.completedAt
                                ? new Date(stageData.completedAt)
                                    .toLocaleDateString('en-IN') : ''}
                            </p>
                          </div>
                          {(stageData.award || 0) > 0 && (
                            <div style={{ background:'#DCFCE7', padding:'6px 10px',
                              borderRadius:8, textAlign:'right' }}>
                              <p style={{ fontSize:'0.65rem', color:'#059669',
                                fontWeight:600 }}>
                                AWARDED
                              </p>
                              <p style={{ fontSize:'1rem', fontWeight:800,
                                color:'#059669' }}>
                                ₹{stageData.award.toLocaleString('en-IN')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {stage === 'finishing' && waURL && (
                        <a href={waURL} target="_blank" rel="noopener noreferrer"
                          style={{ display:'flex', alignItems:'center',
                            justifyContent:'center', gap:8, padding:'11px',
                            background:'linear-gradient(135deg,#25D366,#128C7E)',
                            color:'white', borderRadius:10, textDecoration:'none',
                            fontFamily:'Poppins,sans-serif', fontWeight:700,
                            fontSize:'0.85rem' }}>
                          💬 Notify Customer on WhatsApp
                        </a>
                      )}
                    </div>
                  )}

                  {locked && (
                    <p style={{ textAlign:'center', color:'#9CA3AF',
                      fontSize:'0.82rem', padding:'12px 0' }}>
                      🔒 Complete previous stage first
                    </p>
                  )}
                </div>
              </div>
            )
          })}

          {/* Delivery */}
          <div style={{ ...card, overflow:'hidden',
            border: allotment.delivery?.status === 'delivered'
              ? '2px solid #10B981' : '1.5px solid #E5E7EB' }}>
            <div style={{ padding:'14px 18px',
              background: allotment.delivery?.status === 'delivered'
                ? '#F0FDF4' : '#F9FAFB',
              display:'flex', alignItems:'center',
              justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:'1.3rem' }}>🚚</span>
                <div>
                  <p style={{ fontWeight:700, color:'#059669', fontSize:'0.95rem' }}>
                    Delivery
                  </p>
                  <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                    {allotment.delivery?.status === 'delivered'
                      ? 'Delivered'
                      : allotment.finishing?.status !== 'completed'
                        ? 'Complete finishing first'
                        : 'Ready to deliver'}
                  </p>
                </div>
              </div>
              <span style={{ fontSize:'0.75rem', fontWeight:700,
                padding:'4px 12px', borderRadius:999,
                background: allotment.delivery?.status === 'delivered'
                  ? 'rgba(16,185,129,0.15)' : 'rgba(156,163,175,0.15)',
                color: allotment.delivery?.status === 'delivered'
                  ? '#059669' : '#6B7280' }}>
                {allotment.delivery?.status === 'delivered' ? '✅ Delivered' : 'Pending'}
              </span>
            </div>
            <div style={{ padding:'16px 18px' }}>
              {allotment.delivery?.status === 'delivered' ? (
                <div style={{ padding:'12px', background:'#F0FDF4',
                  borderRadius:10, border:'1px solid #D1FAE5' }}>
                  <p style={{ fontSize:'0.85rem', fontWeight:700, color:'#059669' }}>
                    ✅ Delivered {new Date(allotment.delivery.deliveredAt)
                      .toLocaleDateString('en-IN',{
                        day:'numeric', month:'long', year:'numeric'
                      })}
                  </p>
                  <p style={{ fontSize:'0.75rem', color:'#6B7280', marginTop:3 }}>
                    By: {allotment.delivery.acknowledgedBy}
                  </p>
                  {allotment.delivery.notes && (
                    <p style={{ fontSize:'0.78rem', color:'#4B5563',
                      marginTop:6, fontStyle:'italic' }}>
                      "{allotment.delivery.notes}"
                    </p>
                  )}
                </div>
              ) : allotment.finishing?.status !== 'completed' ? (
                <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:'0.82rem' }}>
                  🔒 Complete all 3 stages first
                </p>
              ) : (
                <button onClick={() => setDeliveryModal(true)}
                  style={{ width:'100%', padding:'13px',
                    background:'linear-gradient(135deg,#059669,#10B981)',
                    color:'white', border:'none', borderRadius:12,
                    fontFamily:'Poppins,sans-serif', fontWeight:700,
                    fontSize:'0.9rem', cursor:'pointer' }}>
                  🚚 Mark as Delivered
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Delivery Modal */}
      {deliveryModal && (
        <div style={{ position:'fixed', inset:0,
          background:'rgba(30,27,75,0.3)', backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:1000, padding:20 }}>
          <div style={{ background:'white', borderRadius:20,
            width:'100%', maxWidth:400, padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:18 }}>
              <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1rem' }}>
                🚚 Confirm Delivery
              </h2>
              <button onClick={() => setDeliveryModal(false)}
                style={{ background:'none', border:'none',
                  cursor:'pointer', color:'#9CA3AF', fontSize:'1.2rem' }}>
                ✕
              </button>
            </div>
            <div style={{ padding:'10px 14px', background:'rgba(16,185,129,0.06)',
              borderRadius:10, marginBottom:14,
              border:'1px solid rgba(16,185,129,0.2)' }}>
              <p style={{ fontSize:'0.85rem', color:'#059669', fontWeight:600 }}>
                {order?.orderID} — {order?.clothType}
              </p>
              <p style={{ fontSize:'0.78rem', color:'#6B7280' }}>
                {order?.customerRef?.name} · {order?.customerRef?.phone}
              </p>
            </div>
            <label style={{ fontSize:'0.72rem', color:'#9CA3AF',
              fontWeight:700, display:'block', marginBottom:6 }}>
              DELIVERY NOTE
            </label>
            <textarea value={deliveryNote}
              onChange={e => setDeliveryNote(e.target.value)}
              rows={3} placeholder="e.g. Customer collected in person..."
              style={{ width:'100%', padding:'10px 14px', background:'#F8F7FF',
                border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10,
                fontFamily:'Poppins,sans-serif', fontSize:'0.88rem',
                color:'#1E1B4B', outline:'none', resize:'none', marginBottom:16 }}/>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setDeliveryModal(false)}
                style={{ flex:1, padding:'11px', background:'#F3F4F6',
                  border:'none', borderRadius:10,
                  fontFamily:'Poppins,sans-serif', fontWeight:600,
                  cursor:'pointer', color:'#6B7280' }}>
                Cancel
              </button>
              <button onClick={handleDeliver} disabled={delivering}
                style={{ flex:2, padding:'11px',
                  background:'linear-gradient(135deg,#059669,#10B981)',
                  color:'white', border:'none', borderRadius:10,
                  fontFamily:'Poppins,sans-serif', fontWeight:700,
                  fontSize:'0.9rem', cursor:'pointer' }}>
                {delivering ? '⏳ Confirming...' : '🚚 Confirm Delivered'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <PaymentModal
          order={order}
          API={API}
          onClose={() => setPaymentModal(false)}
          onSuccess={() => {
            setPaymentModal(false)
            hasFetched.current = false
            loadData()
          }}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}