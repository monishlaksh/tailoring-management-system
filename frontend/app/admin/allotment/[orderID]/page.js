'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, Check, X, Users, ChevronDown, ChevronUp, Printer } from 'lucide-react'
import { adminAPI as API } from '../../../../lib/api'


const STAGES = ['cutting', 'stitching', 'finishing']

const STAGE_INFO = {
  cutting:   { icon:'✂️', label:'Cutting',   color:'#D97706', bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.25)'  },
  stitching: { icon:'🧵', label:'Stitching',  color:'#2563EB', bg:'rgba(59,130,246,0.08)',  border:'rgba(59,130,246,0.25)'  },
  finishing: { icon:'🚩', label:'Finishing',  color:'#9333EA', bg:'rgba(168,85,247,0.08)',  border:'rgba(168,85,247,0.25)'  },
}

const STATUS_BADGE = {
  not_assigned: { label:'Not Assigned', color:'#9CA3AF', bg:'rgba(156,163,175,0.1)'  },
  pending:      { label:'Pending',      color:'#D97706', bg:'rgba(245,158,11,0.1)'   },
  completed:    { label:'Completed ✓',  color:'#059669', bg:'rgba(16,185,129,0.1)'   },
}

export default function AllotmentPage() {
  const router   = useRouter()
  const pathname = usePathname()
  const orderID  = pathname?.split('/').pop()

  const [allotment, setAllotment]   = useState(null)
  const [order, setOrder]           = useState(null)
  const [employees, setEmployees]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [sendingWA, setSendingWA] = useState(false)
const [waMsg, setWaMsg]         = useState('')
const [printing, setPrinting] = useState(false)



  // Per-stage state
  const [assigning, setAssigning]   = useState(null) // stage name
  const [approving, setApproving]   = useState(null) // stage name
  const [empRates, setEmpRates] = useState({ cutting:0, stitching:0, finishing:0 })
  const [selectedEmp, setSelectedEmp]  = useState({ cutting:'', stitching:'', finishing:'' })
  const [stageNotes, setStageNotes]    = useState({ cutting:'', stitching:'', finishing:'' })

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    if (orderID && orderID !== 'undefined') fetchData()
  }, [orderID])

  

    // Inside fetchData, after setting order:
    const fetchData = async () => {
      try {
        const [allotRes, empRes] = await Promise.all([
          API.get(`/api/allotment/${orderID}`),
          API.get('/api/employees'),
        ])
        setAllotment(allotRes.data.allotment)
        setOrder(allotRes.data.order)
        setEmployees(empRes.data.employees.filter(e => e.isActive))

        // Get emp rate from cloth type
        const clothTypeFull = allotRes.data.order.clothType || ''
        const [ctName, typeName] = clothTypeFull.split(' - ').map(s => s?.trim())
        if (ctName && typeName) {
          const ctRes = await API.get('/api/cloth-types/all')
          const matchedCT = ctRes.data.clothTypes.find(c => c.name === ctName)
          const matchedType = matchedCT?.types?.find(t => t.name === typeName)
          const rate = matchedType?.empCost || 0
          // Same rate applies to all 3 stages (or customize per stage if needed)
          setEmpRates({ cutting: rate, stitching: rate, finishing: rate })
        }
      } catch (e) {
        setError('Failed to load allotment')
      } finally {
        setLoading(false)
      }
    }
      const showMsg = (msg, isErr = false) => {
        if (isErr) { setError(msg);   setTimeout(() => setError(''),   4000) }
        else       { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
      }

  const handleAssign = async (stage) => {
    const empID = selectedEmp[stage]
    if (!empID) { showMsg('Please select an employee', true); return }
    setAssigning(stage)
    try {
      await API.post(`/api/allotment/${orderID}/assign`, {
        stage,
        employeeID: empID,
        notes:      stageNotes[stage],
      })
      showMsg(`✅ ${STAGE_INFO[stage].label} assigned successfully!`)
      fetchData()
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed to assign', true)
    } finally { setAssigning(null) }
  }

  const handleApprove = async (stage) => {
  setApproving(stage)
  try {
    const res = await API.post(`/api/allotment/${orderID}/approve`, { stage })
    showMsg(`✅ ${STAGE_INFO[stage].label} approved! ₹${res.data.empRate} credited to employee`)
    fetchData()
  } catch (e) {
    showMsg(e.response?.data?.message || 'Failed', true)
  } finally { setApproving(null) }
}

  const handleUnassign = async (stage) => {
    if (!confirm(`Unassign ${stage}? This will reset the stage.`)) return
    try {
      await API.post(`/api/allotment/${orderID}/unassign`, { stage })
      showMsg(`${STAGE_INFO[stage].label} unassigned`)
      fetchData()
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed', true)
    }
  }

  const handlePrint = () => {
  if (!order || !allotment) return

  const measurements = order.measurements || {}
  const hasMeasurements = Object.entries(measurements).some(([,v]) => v)

  const alterations = order.alteration?.selectedOptions || []
  const hasAlteration = order.alteration?.required && alterations.length > 0

  const stageRows = ['cutting','stitching','finishing'].map(stage => {
    const s = allotment[stage]
    const icon = stage==='cutting'?'✂️':stage==='stitching'?'🧵':'🚩'
    const statusLabel = (s?.status||'not_assigned').replace('_',' ')
    return `
      <tr>
        <td>${icon} ${stage.charAt(0).toUpperCase()+stage.slice(1)}</td>
        <td>${s?.employeeName || '—'}</td>
        <td style="text-transform:capitalize">${statusLabel}</td>
      </tr>
    `
  }).join('')

  const measurementCells = hasMeasurements
    ? Object.entries(measurements)
        .filter(([,v]) => v)
        .map(([k,v]) => `
          <td style="border:1px solid #ccc;padding:8px 10px;">
            <div style="font-size:10px;color:#666;text-transform:uppercase;margin-bottom:3px">${k}</div>
            <div style="font-size:18px;font-weight:bold">${v}"</div>
          </td>
        `).join('')
    : ''

  const alterationHtml = hasAlteration ? `
    <div style="margin-bottom:16px">
      <h3 style="font-size:13px;font-weight:bold;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:8px">
        ⚠️ Alterations Required
      </h3>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">
        ${alterations.map(a => `
          <span style="border:1px solid #000;padding:3px 10px;font-size:11px;border-radius:4px">${a}</span>
        `).join('')}
      </div>
      ${order.alteration?.notes ? `<p style="font-size:12px;font-style:italic;color:#333">Notes: ${order.alteration.notes}</p>` : ''}
    </div>
  ` : ''

  const voiceNoteHtml = order.voiceNote?.data ? `
    <div style="border:2px dashed #4F46E5;padding:10px 14px;border-radius:8px;margin-bottom:16px">
      <p style="font-size:12px;font-weight:bold;color:#4F46E5;margin:0">
        🎙️ VOICE NOTE ATTACHED — Duration: ${Math.floor((order.voiceNote.duration||0)/60)}:${String((order.voiceNote.duration||0)%60).padStart(2,'0')}
      </p>
      <p style="font-size:11px;color:#555;margin:4px 0 0">
        Scan the QR code below and open the work order page to play the voice note.
      </p>
    </div>
  ` : ''

  const qrHtml = allotment.qrCode ? `
    <div style="text-align:center;padding-top:12px;border-top:1px solid #ccc;margin-top:8px">
      <p style="font-size:12px;font-weight:bold;margin-bottom:8px">📱 Scan QR to view full work order on phone</p>
      <img src="${allotment.qrCode}" alt="QR" style="width:150px;height:150px;border:2px solid #000;border-radius:6px" />
      <p style="font-size:11px;color:#666;margin-top:4px">${order.orderID}</p>
    </div>
  ` : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Work Order — ${order.orderID}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Georgia, serif; font-size:13px; color:#000; padding:20px; }
        h1 { font-size:22px; font-weight:bold; margin-bottom:4px; }
        h3 { font-size:13px; font-weight:bold; }
        table { width:100%; border-collapse:collapse; margin-bottom:14px; }
        th { background:#000; color:white; padding:6px 10px; font-size:11px; text-align:left; }
        td { padding:5px 8px; font-size:12px; border-bottom:1px solid #eee; }
        tr:nth-child(even) td { background:#f9f9f9; }
        .label { font-weight:bold; width:28%; color:#333; }
        .section-title { font-size:13px; font-weight:bold; border-bottom:1px solid #000; padding-bottom:4px; margin:14px 0 8px; }
        .footer { border-top:1px solid #000; padding-top:8px; margin-top:12px; display:flex; justify-content:space-between; font-size:10px; color:#666; }
        @media print {
          @page { margin:12mm; size:A4; }
          body { padding:0; }
        }
      </style>
    </head>
    <body>
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:16px">
        <h1>✂️ Al-Ameen Tailors</h1>
        <p style="font-size:12px;color:#444;margin-top:4px">Work Order Sheet</p>
      </div>

      <table>
        <tbody>
          <tr>
            <td class="label">Order ID</td>
            <td style="font-weight:bold;font-size:14px">${order.orderID}</td>
            <td class="label">Delivery Date</td>
            <td>${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '—'}</td>
          </tr>
          <tr>
            <td class="label">Customer</td>
            <td>${order.customerRef?.name || '—'}</td>
            <td class="label">Phone</td>
            <td style="font-weight:bold">${order.customerRef?.phone || '—'}</td>
          </tr>
          <tr>
            <td class="label">Cloth Type</td>
            <td colspan="3">${order.clothType}</td>
          </tr>
          <tr>
            <td class="label">Quantity</td>
            <td>${order.quantity}</td>
            <td class="label">Status</td>
            <td>${order.status}</td>
          </tr>
          ${order.fabricNotes ? `
          <tr>
            <td class="label">Fabric Notes</td>
            <td colspan="3">${order.fabricNotes}</td>
          </tr>` : ''}
          ${order.specialInstructions ? `
          <tr>
            <td class="label">Special Instructions</td>
            <td colspan="3">${order.specialInstructions}</td>
          </tr>` : ''}
        </tbody>
      </table>

      ${hasMeasurements ? `
        <div class="section-title">📏 Measurements (inches)</div>
        <table><tbody><tr>${measurementCells}</tr></tbody></table>
      ` : ''}

      ${alterationHtml}

      <div class="section-title">Stage Progress</div>
      <table>
        <thead>
          <tr>
            <th>Stage</th>
            <th>Assigned To</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${stageRows}</tbody>
      </table>

      ${voiceNoteHtml}
      ${qrHtml}

      <div class="footer">
        <span>Printed: ${new Date().toLocaleString('en-IN')}</span>
        <span>Al-Ameen Tailors — Work Order (Confidential)</span>
      </div>

      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=800,height=900')
  printWindow.document.write(html)
  printWindow.document.close()
}

  // Get employees eligible for a stage
  const getEligibleEmployees = (stage) =>
    employees.filter(e => e.role === stage || e.role === 'all')

  // Check if a stage can be assigned
  const canAssign = (stage) => {
    if (!allotment) return false
    if (stage === 'cutting')   return allotment.cutting.status   === 'not_assigned'
    if (stage === 'stitching') return allotment.cutting.status   === 'completed' && allotment.stitching.status === 'not_assigned'
    if (stage === 'finishing') return allotment.stitching.status === 'completed' && allotment.finishing.status === 'not_assigned'
    return false
  }

  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:40, height:40, border:'3px solid rgba(79,70,229,0.2)', borderTopColor:'#4F46E5', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  if (!allotment || !order) return (
    <main style={{ padding:24 }}>
      <p style={{ color:'#EF4444' }}>Allotment not found.</p>
    </main>
  )

  // Overall progress
  const stagesCompleted = STAGES.filter(s => allotment[s].status === 'completed').length
  const progressPct     = Math.round((stagesCompleted / 3) * 100)

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:1000, margin:'0 auto' }}>

      {/* Top Bar */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')} style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>
              Allotment — {orderID}
            </h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
              {order.clothType} · {order.customerRef?.name}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={handlePrint}
            style={{ width:36, height:36, borderRadius:10,
              background:'rgba(79,70,229,0.08)', border:'none',
              cursor:'pointer', display:'flex', alignItems:'center',
              justifyContent:'center', color:'#4F46E5', flexShrink:0 }}>
            <Printer size={18}/>
          </button>
          <span style={{ fontSize:'0.82rem', color:'#6B7280' }}>
            {stagesCompleted}/3 stages done
          </span>
          <div style={{ width:100, height:8, background:'rgba(79,70,229,0.1)', borderRadius:999, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progressPct}%`, background:'linear-gradient(90deg,#4F46E5,#00D4FF)', borderRadius:999, transition:'width 0.5s' }} />
          </div>
          <span style={{ fontSize:'0.82rem', fontWeight:700, color:'#4F46E5' }}>{progressPct}%</span>
        </div>
      </div>

      {error   && <div style={{ background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'11px 16px', marginBottom:16, color:'#DC2626', fontSize:'0.87rem' }}>{error}</div>}
      {success && <div style={{ background:'rgba(16,185,129,0.08)', border:'1.5px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'11px 16px', marginBottom:16, color:'#059669', fontSize:'0.87rem' }}>{success}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Left — Order details + QR */}
        <div style={{ display:'grid', gap:20 }}>

          {/* Order Info */}
          <div className="glass" style={{ padding:24 }}>
            <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:16, fontSize:'0.95rem' }}>📋 Order Details</h2>
            <div style={{ display:'grid', gap:10 }}>
              {[
                { label:'Order ID',     value:order.orderID },
                { label:'Cloth Type',   value:order.clothType },
                { label:'Quantity',     value:order.quantity },
                { label:'Delivery',     value:order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : '—' },
                { label:'Status',       value:order.status },
              ].map((item,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'rgba(255,255,255,0.6)', borderRadius:8 }}>
                  <span style={{ fontSize:'0.78rem', color:'#9CA3AF', fontWeight:600 }}>{item.label}</span>
                  <span style={{ fontSize:'0.82rem', color:'#1E1B4B', fontWeight:600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Measurements */}
          {order.measurements && Object.values(order.measurements).some(v => v) && (
            <div className="glass" style={{ padding:24 }}>
              <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:14, fontSize:'0.95rem' }}>📏 Measurements</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                {Object.entries(order.measurements).filter(([,v]) => v).map(([k,v]) => (
                  <div key={k} style={{ background:'rgba(79,70,229,0.05)', borderRadius:8, padding:'8px 12px' }}>
                    <p style={{ fontSize:'0.65rem', color:'#9CA3AF', textTransform:'uppercase', fontWeight:600 }}>{k}</p>
                    <p style={{ fontSize:'0.95rem', color:'#1E1B4B', fontWeight:700 }}>{v}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alteration */}
          {order.alteration?.required && (
            <div className="glass" style={{ padding:24, background:'rgba(245,158,11,0.03)', border:'1.5px solid rgba(245,158,11,0.2)' }}>
              <h2 style={{ fontWeight:700, color:'#D97706', marginBottom:12, fontSize:'0.95rem' }}>⚠️ Alterations Required</h2>
              {(order.alteration.selectedOptions||[]).length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                  {order.alteration.selectedOptions.map((opt,i) => (
                    <span key={i} style={{ padding:'4px 10px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:999, fontSize:'0.78rem', fontWeight:600, color:'#D97706' }}>
                      {opt}
                    </span>
                  ))}
                </div>
              )}
              {order.alteration.notes && (
                <p style={{ fontSize:'0.83rem', color:'#4B5563' }}>{order.alteration.notes}</p>
              )}
            </div>
          )}

          {/* QR Code */}
          <div className="glass" style={{ padding:24, textAlign:'center' }}>
            <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:6, fontSize:'0.95rem' }}>📱 QR Code</h2>
            <p style={{ fontSize:'0.78rem', color:'#6B7280', marginBottom:16 }}>
              Print and attach this to the material. Admin scans to open this page.
            </p>
            {allotment.qrCode ? (
              <div>
                <img src={allotment.qrCode} alt="QR Code" style={{ width:180, height:180, border:'4px solid #EEF2FF', borderRadius:12 }} />
                <p style={{ fontSize:'0.72rem', color:'#9CA3AF', marginTop:10 }}>{orderID}</p>
                <a href={allotment.qrCode} download={`QR-${orderID}.png`}
                  style={{ display:'inline-block', marginTop:12, padding:'8px 20px', background:'linear-gradient(135deg,#4F46E5,#6366F1)', color:'white', borderRadius:8, fontSize:'0.82rem', fontWeight:600, textDecoration:'none' }}>
                  ⬇ Download QR
                </a>
              </div>
            ) : (
              <p style={{ color:'#9CA3AF' }}>Generating QR...</p>
            )}
          </div>

        </div>

        {/* Right — Stage Allotment */}
        <div style={{ display:'grid', gap:16, alignContent:'start' }}>

          {STAGES.map((stage, idx) => {
  const info        = STAGE_INFO[stage]
  const stageData   = allotment[stage]
  const statusBadge = STATUS_BADGE[stageData.status]
  const eligible    = getEligibleEmployees(stage)
  const isLocked    = !canAssign(stage) && stageData.status === 'not_assigned'

  // Build WhatsApp URL for finishing completion
  const waPhone = order?.customerRef?.phone
    ? String(order.customerRef.phone).replace(/\D/g,'')
    : ''
  const waFormatted = waPhone.startsWith('91') ? waPhone : `91${waPhone}`
  const waMessage   = encodeURIComponent(
    `🎉 *Al-Ameen Tailors*\n\n` +
    `Dear ${order?.customerRef?.name || 'Customer'},\n\n` +
    `Your order *${order?.orderID}* (${order?.clothType}) is ` +
    `*Ready for Delivery!* ✅\n\n` +
    `Please visit our shop to collect your order.\n\n` +
    `Thank you for choosing Al-Ameen Tailors! ✂️`
  )
  const waURL = `https://wa.me/${waFormatted}?text=${waMessage}`

  return (
    <div key={stage} className="glass" style={{
      padding:0, overflow:'hidden',
      border:`1.5px solid ${stageData.status==='completed'
        ? 'rgba(16,185,129,0.3)' : info.border}`,
      opacity: isLocked ? 0.6 : 1,
    }}>

      {/* Stage header */}
      <div style={{ padding:'14px 18px', background:info.bg,
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'1.3rem' }}>{info.icon}</span>
          <div>
            <p style={{ fontWeight:700, color:info.color, fontSize:'0.95rem' }}>
              {info.label}
            </p>
            {isLocked && (
              <p style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>
                Complete {STAGES[idx-1]} first
              </p>
            )}
          </div>
        </div>
        <span style={{ fontSize:'0.75rem', fontWeight:600,
          padding:'4px 12px', borderRadius:999,
          background:statusBadge.bg, color:statusBadge.color }}>
          {statusBadge.label}
        </span>
      </div>

      <div style={{ padding:'16px 18px' }}>

        {/* Not assigned */}
        {stageData.status === 'not_assigned' && !isLocked && (
          <div>
            <label className="input-label">ASSIGN EMPLOYEE</label>
            {eligible.length === 0 ? (
              <p style={{ fontSize:'0.82rem', color:'#EF4444', marginBottom:12 }}>
                No employees for {stage} stage.
              </p>
            ) : (
              <select
                value={selectedEmp[stage]}
                onChange={e => setSelectedEmp(p => ({...p,[stage]:e.target.value}))}
                style={{ width:'100%', padding:'11px 14px',
                  background:'rgba(255,255,255,0.8)',
                  border:'1.5px solid rgba(79,70,229,0.2)',
                  borderRadius:10, fontFamily:'Poppins,sans-serif',
                  fontSize:'0.88rem', color:'#1E1B4B',
                  outline:'none', marginBottom:12 }}>
                <option value="">Select employee...</option>
                {eligible.map(e => (
                  <option key={e._id} value={e.employeeID}>
                    {e.name} ({e.employeeID}) — {e.role}
                  </option>
                ))}
              </select>
            )}

            <label className="input-label">NOTES FOR EMPLOYEE</label>
            <textarea
              value={stageNotes[stage]}
              onChange={e => setStageNotes(p => ({...p,[stage]:e.target.value}))}
              placeholder="Any specific instructions..."
              rows={2}
              style={{ width:'100%', padding:'10px 14px',
                background:'rgba(255,255,255,0.8)',
                border:'1.5px solid rgba(79,70,229,0.2)',
                borderRadius:10, fontFamily:'Poppins,sans-serif',
                fontSize:'0.85rem', color:'#1E1B4B',
                outline:'none', resize:'none', marginBottom:12 }}
            />

            <button
              onClick={() => handleAssign(stage)}
              disabled={assigning===stage || !selectedEmp[stage]}
              style={{ width:'100%', padding:'11px',
                background:`linear-gradient(135deg,${info.color},${info.color}cc)`,
                color:'white', border:'none', borderRadius:10,
                fontFamily:'Poppins,sans-serif', fontWeight:600,
                fontSize:'0.88rem', cursor:'pointer',
                display:'flex', alignItems:'center',
                justifyContent:'center', gap:8,
                opacity:!selectedEmp[stage]?0.6:1 }}>
              {assigning===stage
                ? <><div className="spinner"/>Assigning...</>
                : <><Users size={15}/>Assign {info.label}</>}
            </button>
          </div>
        )}

        {/* Pending */}
        {/* PENDING → approve (no manual award input) */}
        {stageData.status === 'pending' && (
          <div>
            {/* Employee info */}
            <div style={{ padding:'14px', background:info.bg, borderRadius:12,
              border:`1px solid ${info.border}`, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:40, height:40, borderRadius:12,
                  background:info.color, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>
                  {info.icon}
                </div>
                <div>
                  <p style={{ fontWeight:700, color:info.color, fontSize:'0.9rem',
                    marginBottom:2 }}>
                    {stageData.employeeName}
                  </p>
                  <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                    {stageData.employeeID} · Assigned{' '}
                    {stageData.assignedAt
                      ? new Date(stageData.assignedAt).toLocaleDateString('en-IN')
                      : ''}
                  </p>
                </div>
              </div>
              {stageData.notes && (
                <p style={{ fontSize:'0.78rem', color:'#4B5563', marginTop:10,
                  padding:'8px 10px', background:'rgba(255,255,255,0.6)',
                  borderRadius:8, fontStyle:'italic' }}>
                  "{stageData.notes}"
                </p>
              )}
            </div>

            {/* Fixed employee rate display — read only */}
            <div style={{ padding:'14px', background:'rgba(16,185,129,0.06)',
              border:'1.5px solid rgba(16,185,129,0.2)', borderRadius:12,
              marginBottom:16, display:'flex', alignItems:'center',
              justifyContent:'space-between' }}>
              <div>
                <p style={{ fontSize:'0.68rem', color:'#059669', fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>
                  Fixed Employee Rate
                </p>
                <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                  Set in Cloth Type → Type → Emp Rate
                </p>
              </div>
              <p style={{ fontSize:'1.4rem', fontWeight:800, color:'#059669' }}>
                ₹{(empRates[stage]||0).toLocaleString('en-IN')}
              </p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10 }}>
              <button onClick={() => handleApprove(stage)}
                disabled={approving===stage}
                style={{ padding:'14px',
                  background:'linear-gradient(135deg,#10B981,#059669)',
                  color:'white', border:'none', borderRadius:12,
                  fontFamily:'Poppins,sans-serif', fontWeight:700,
                  fontSize:'0.9rem', cursor:'pointer',
                  display:'flex', alignItems:'center',
                  justifyContent:'center', gap:8 }}>
                {approving===stage
                  ? <><div style={{ width:18,height:18,
                      border:'2px solid rgba(255,255,255,0.3)',
                      borderTopColor:'white', borderRadius:'50%',
                      animation:'spin 0.8s linear infinite' }}/> Approving...</>
                  : <><Check size={17}/>Approve (₹{empRates[stage]||0} to employee)</>}
              </button>
              <button onClick={() => handleUnassign(stage)}
                style={{ width:48, height:48, background:'#FEF2F2',
                  border:'1.5px solid #FECACA', borderRadius:12, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#DC2626' }}>
                <X size={18}/>
              </button>
            </div>
          </div>
        )}
        {/* Completed */}
        {stageData.status === 'completed' && (
          <div style={{ background:'rgba(16,185,129,0.05)',
            border:'1px solid rgba(16,185,129,0.2)',
            borderRadius:10, padding:'14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <p style={{ fontSize:'0.82rem', color:'#059669',
                  fontWeight:700, marginBottom:2 }}>
                  ✅ Completed by {stageData.employeeName}
                </p>
                <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                  {stageData.completedAt
                    ? new Date(stageData.completedAt).toLocaleDateString('en-IN')
                    : ''}
                </p>
              </div>
              {(stageData.award||0) > 0 && (
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:'0.68rem', color:'#9CA3AF',
                    fontWeight:600 }}>AWARDED</p>
                  <p style={{ fontSize:'1rem', fontWeight:800,
                    color:'#059669' }}>
                    ₹{stageData.award.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>

            {/* WhatsApp notify — ONLY on finishing stage */}
            {stage === 'finishing' && waPhone && (
              <a
                href={waURL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:'flex', alignItems:'center',
                  justifyContent:'center', gap:8,
                  width:'100%', padding:'11px',
                  background:'linear-gradient(135deg,#25D366,#128C7E)',
                  color:'white', borderRadius:10,
                  textDecoration:'none',
                  fontFamily:'Poppins,sans-serif', fontWeight:600,
                  fontSize:'0.85rem', marginTop:8,
                  boxShadow:'0 4px 12px rgba(37,211,102,0.25)',
                }}>
                <span style={{ fontSize:'1.1rem' }}>💬</span>
                Notify Customer on WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Locked */}
        {isLocked && (
          <div style={{ textAlign:'center', padding:'16px 0',
            color:'#9CA3AF' }}>
            <p style={{ fontSize:'0.82rem' }}>
              🔒 Complete {idx > 0 ? STAGE_INFO[STAGES[idx-1]].label : ''} first
            </p>
          </div>
        )}

      </div>
    </div>
  )
})}

        </div>
      </div>
      
      

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}