'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, Check, X, Users, ChevronDown, ChevronUp, Printer } from 'lucide-react'
import { adminAPI as API } from '../../../../lib/api'
import VoicePlayer from '../../../../components/VoicePlayer'
import PaymentModal from '../../../components/PaymentModal'


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

// Delivery state
const [deliveryModal, setDeliveryModal] = useState(false)
const [deliveryNote, setDeliveryNote]   = useState('')
const [delivering, setDelivering]       = useState(false)
const [paymentModal, setPaymentModal] = useState(false)


  // Per-stage state
  const [assigning, setAssigning]   = useState(null) // stage name
  const [approving, setApproving]   = useState(null) // stage name
  const [empRates, setEmpRates] = useState({ cutting:0, stitching:0, finishing:0 })
  const [selectedEmp, setSelectedEmp]  = useState({ cutting:'', stitching:'', finishing:'' })
  const [stageNotes, setStageNotes]    = useState({ cutting:'', stitching:'', finishing:'' })
  
  const [empBonuses, setEmpBonuses] = useState({ cutting:0, stitching:0, finishing:0 })
    // Inside fetchData, after setting order:
    const fetchData = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const [allotRes, empRes] = await Promise.all([
            API.get(`/api/allotment/${orderID}`),
            API.get('/api/employees'),
          ])
          setAllotment(allotRes.data.allotment)
          setOrder(allotRes.data.order)
          setEmployees(empRes.data.employees.filter(e => e.isActive))

          // Only fetch employee bonuses — empRate comes from order.empRate
          const bonuses = { cutting:0, stitching:0, finishing:0 }
          for (const stage of ['cutting','stitching','finishing']) {
            const empID = allotRes.data.allotment?.[stage]?.employeeID
            if (empID) {
              const emp = empRes.data.employees.find(e => e.employeeID === empID)
              bonuses[stage] = emp?.bonus || 0
            }
          }
          setEmpBonuses(bonuses)
          return
        } catch (e) {
          if (e.response?.status === 401) {
            localStorage.removeItem('adminToken')
            router.push('/admin/login')
            return
          }
          if (i < retries - 1) {
            await new Promise(r => setTimeout(r, 800))
          } else {
            setError('Failed to load allotment')
          }
        }
      }
      setLoading(false)
    }
      const showMsg = (msg, isErr = false) => {
        if (isErr) { setError(msg);   setTimeout(() => setError(''),   4000) }
        else       { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
      }

      useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    if (orderID && orderID !== 'undefined') fetchData()
  }, [orderID])

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
    const { empRate=0, empBonus=0, totalAward=0 } = res.data
    showMsg(`✅ ${STAGE_INFO[stage].label} approved! ₹${empRate} + ₹${empBonus} bonus = ₹${totalAward} awarded`)
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

  const handleDeliver = async () => {
  setDelivering(true)
  try {
    await API.post(`/api/allotment/${orderID}/deliver`, {
      notes: deliveryNote, acknowledgedBy: 'Admin',
    })
    showMsg('✅ Order marked as delivered!')
    setDeliveryModal(false)
    fetchData()
  } catch (e) {
    showMsg(e.response?.data?.message || 'Failed', true)
  } finally { setDelivering(false) }
}

const handleUndoDeliver = async () => {
  if (!confirm('Undo delivery? This will set status back to Ready For Delivery.')) return
  try {
    await API.post(`/api/allotment/${orderID}/undo-deliver`)
    showMsg('Delivery undone')
    fetchData()
  } catch (e) {
    showMsg(e.response?.data?.message || 'Failed', true)
  }
}

  const handlePrint = () => {
  // Get measurements from cloth type
  const measurementRows = selectedClothType?.measurements
    ?.map(m => {
      const val = order?.measurements?.[m.key] || '—'
      return `
        <tr>
          <td>${m.label}</td>
          <td>${m.labelTa || ''}</td>
          <td><strong>${val}"</strong></td>
        </tr>`
    }).join('') || ''

  const alterationList = (order?.alteration?.selectedOptions || [])
    .map(o => `<li>${o}</li>`).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>Order ${order?.orderID}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          font-family: 'Poppins', sans-serif;
          width: 148mm;
          min-height: 210mm;
          padding: 12mm 10mm;
          color: #1E1B4B;
          background: white;
          font-size: 11px;
          display: flex;
          flex-direction: column;
        }

        /* ── HEADER ── */
        .header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 10px;
          border-bottom: 2.5px solid #4F46E5;
          margin-bottom: 12px;
        }
        .logo {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          object-fit: cover;
          border: 2px solid #4F46E5;
          flex-shrink: 0;
        }
        .logo-fallback {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: linear-gradient(135deg, #4F46E5, #00D4FF);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }
        .shop-info h1 {
          font-size: 16px;
          font-weight: 800;
          color: #1E1B4B;
          line-height: 1.2;
        }
        .shop-info p {
          font-size: 9.5px;
          color: #6B7280;
          margin-top: 2px;
        }
        .shop-info .tagline {
          font-size: 9px;
          color: #4F46E5;
          font-weight: 600;
          margin-top: 3px;
        }

        /* ── QR + ORDER ID row ── */
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 10px;
        }
        .order-meta h2 {
          font-size: 13px;
          font-weight: 800;
          color: #4F46E5;
        }
        .order-meta p {
          font-size: 9.5px;
          color: #6B7280;
          margin-top: 2px;
          line-height: 1.5;
        }
        .qr-box {
          text-align: center;
        }
        .qr-box img {
          width: 72px;
          height: 72px;
          border: 2px solid #EEF2FF;
          border-radius: 8px;
        }
        .qr-box p {
          font-size: 8px;
          color: #9CA3AF;
          margin-top: 3px;
        }

        /* ── SECTION LABEL ── */
        .section-label {
          font-size: 8px;
          font-weight: 700;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 5px;
          margin-top: 10px;
        }

        /* ── CLOTH TYPE BOX ── */
        .cloth-box {
          background: #EEF2FF;
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 10px;
        }
        .cloth-box .cloth-name {
          font-size: 13px;
          font-weight: 800;
          color: #1E1B4B;
        }
        .cloth-box .cloth-sub {
          font-size: 9.5px;
          color: #4F46E5;
          font-weight: 600;
          margin-top: 2px;
        }
        .cloth-box .cloth-qty {
          font-size: 9px;
          color: #6B7280;
          margin-top: 3px;
        }

        /* ── MEASUREMENTS TABLE ── */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        th {
          background: #4F46E5;
          color: white;
          font-size: 8.5px;
          font-weight: 700;
          text-align: left;
          padding: 5px 8px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        td {
          font-size: 10px;
          padding: 5px 8px;
          border-bottom: 1px solid #F3F4F6;
          color: #1E1B4B;
        }
        tr:nth-child(even) td { background: #F8F7FF; }

        /* ── STAGES ── */
        .stages {
          display: flex;
          gap: 5px;
          margin-bottom: 10px;
        }
        .stage {
          flex: 1;
          text-align: center;
          padding: 6px 3px;
          border-radius: 6px;
          font-size: 8px;
          font-weight: 600;
        }
        .stage.done    { background:#DCFCE7; color:#059669; }
        .stage.pending { background:#FEF3C7; color:#D97706; }
        .stage.waiting { background:#F3F4F6; color:#9CA3AF; }

        /* ── ALTERATION ── */
        .alt-box {
          background: #FEF3C7;
          border: 1.5px solid #FDE68A;
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 10px;
        }
        .alt-box h3 { font-size: 10px; font-weight: 700; color: #D97706; margin-bottom: 5px; }
        .alt-box ul { padding-left: 14px; }
        .alt-box li { font-size: 9.5px; color: #92400E; margin-bottom: 2px; }
        .alt-box p  { font-size: 9px; color: #6B7280; margin-top: 4px; font-style: italic; }

        /* ── VOICE NOTE NOTICE ── */
        .voice-notice {
          background: #EEF2FF;
          border: 1.5px solid #C7D2FE;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 9px;
          color: #4338CA;
          font-weight: 600;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ── FOOTER GREETING ── */
        .footer {
          margin-top: auto;
          padding-top: 10px;
          border-top: 1.5px dashed #E5E7EB;
          text-align: center;
        }
        .footer .greeting {
          font-size: 10px;
          font-weight: 700;
          color: #4F46E5;
          margin-bottom: 3px;
        }
        .footer .greeting-ta {
          font-size: 10px;
          color: #6B7280;
          margin-bottom: 5px;
        }
        .footer .tagline {
          font-size: 8.5px;
          color: #9CA3AF;
        }

        @media print {
          body { width:148mm; min-height:210mm; }
          @page { size: A5 portrait; margin: 0; }
        }
      </style>
    </head>
    <body>

      <!-- HEADER WITH LOGO -->
      <div class="header">
        <img
          class="logo"
          src="${window.location.origin}/logo.png"
          alt="Logo"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
        />
        <div class="logo-fallback" style="display:none">✂️</div>
        <div class="shop-info">
          <h1>Al-Ameen Tailors</h1>
          <p>Master Tailoring & Alterations</p>
          <p class="tagline">✂️ Crafting Perfect Fits Since 2004</p>
        </div>
      </div>

      <!-- ORDER + QR -->
      <div class="order-header">
        <div class="order-meta">
          <h2>${order?.orderID}</h2>
          <p>
            👤 ${order?.customerRef?.name || '—'}<br/>
            📞 ${order?.customerRef?.phone || '—'}<br/>
            📅 Booked: ${order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '—'}<br/>
            🚚 Delivery: <strong>${order?.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '—'}</strong>
          </p>
        </div>
        ${allotment?.qrCode ? `
          <div class="qr-box">
            <img src="${allotment.qrCode}" alt="QR"/>
            <p>Scan to view</p>
          </div>` : ''}
      </div>

      <!-- CLOTH TYPE -->
      <div class="section-label">Cloth / துணி</div>
      <div class="cloth-box">
        <div class="cloth-name">${order?.clothType?.split(' - ')[0] || order?.clothType || '—'}</div>
        <div class="cloth-sub">${order?.clothType?.split(' - ').slice(1).join(' → ') || ''}</div>
        <div class="cloth-qty">Qty: ${order?.quantity || 1} piece${(order?.quantity || 1) > 1 ? 's' : ''}</div>
      </div>

      <!-- MEASUREMENTS -->
      ${measurementRows ? `
        <div class="section-label">Measurements / அளவுகள் (inches)</div>
        <table>
          <thead>
            <tr>
              <th>Measurement</th>
              <th>தமிழ்</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>${measurementRows}</tbody>
        </table>` : ''}

      <!-- VOICE NOTE NOTICE -->
      ${order?.voiceNote?.data ? `
        <div class="voice-notice">
          🎙️ Voice note from admin — scan QR to listen to special instructions
        </div>` : ''}

      <!-- ALTERATIONS -->
      ${order?.alteration?.required ? `
        <div class="section-label">Alterations / மாற்றங்கள்</div>
        <div class="alt-box">
          <h3>⚠️ Alteration Required</h3>
          ${alterationList ? `<ul>${alterationList}</ul>` : ''}
          ${order?.alteration?.notes ? `<p>"${order.alteration.notes}"</p>` : ''}
        </div>` : ''}

      <!-- STAGE PROGRESS -->
      <div class="section-label">Stage Progress / பணி நிலை</div>
      <div class="stages">
        ${['cutting','stitching','finishing'].map(s => {
          const st = allotment?.[s]?.status || 'not_assigned'
          const cls = st === 'completed' ? 'done' : st === 'pending' ? 'pending' : 'waiting'
          const icons = { cutting:'✂️', stitching:'🧵', finishing:'🚩' }
          const labels = { cutting:'Cutting', stitching:'Stitching', finishing:'Finishing' }
          return `<div class="stage ${cls}">${icons[s]}<br/>${labels[s]}<br/>${st.replace('_',' ')}</div>`
        }).join('')}
      </div>

      <!-- FOOTER GREETING -->
      <div class="footer">
        <p class="greeting">Thank you for choosing Al-Ameen Tailors! 🙏</p>
        <p class="greeting-ta">அல்-அமீன் டெய்லர்ஸை தேர்ந்தெடுத்ததற்கு நன்றி!</p>
        <p class="tagline">✂️ Al-Ameen Tailors — Crafting Perfect Fits Since 2004 | Quality You Can Trust</p>
      </div>

    </body>
    </html>
  `

  const win = window.open('', '_blank', 'width=600,height=800')
  win.document.write(html)
  win.document.close()
  win.onload = () => {
    setTimeout(() => {
      win.print()
      win.close()
    }, 500)
  }
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
          {/* Voice Note */}
          {order.voiceNote?.data && (
            <div style={{ marginTop:14 }}>
              <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:700,
                textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>
                🎙 Voice Note
              </p>
              <VoicePlayer voiceNote={order.voiceNote}/>
            </div>
          )}

          {/* Payment Card */}
          <div className="glass" style={{ padding:20 }}>
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
                { label:'Total Cost',  value:`₹${(order.unitCost||0).toLocaleString('en-IN')}`,                              color:'#1E1B4B' },
                { label:'Paid',        value:`₹${(order.payment?.amountPaid||order.amountSettled||0).toLocaleString('en-IN')}`, color:'#059669' },
                { label:'Balance Due', value:`₹${Math.max((order.unitCost||0)-(order.payment?.amountPaid||order.amountSettled||0),0).toLocaleString('en-IN')}`,
                  color: Math.max((order.unitCost||0)-(order.payment?.amountPaid||order.amountSettled||0),0) > 0 ? '#DC2626' : '#059669' },
              ].map((s,i) => (
                <div key={i} style={{ display:'flex',
                  justifyContent:'space-between', padding:'8px 12px',
                  background: i%2===0 ? 'rgba(79,70,229,0.04)' : 'transparent',
                  borderRadius:8 }}>
                  <span style={{ fontSize:'0.8rem', color:'#6B7280',
                    fontWeight:600 }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize:'0.88rem', fontWeight:800,
                    color:s.color }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Method badge */}
            {order.payment?.method && order.payment.method !== 'unpaid' && (
              <div style={{ marginTop:10, display:'flex', alignItems:'center',
                gap:6, padding:'6px 12px',
                background: order.payment.method === 'cash'
                  ? 'rgba(16,185,129,0.08)' : 'rgba(79,70,229,0.08)',
                borderRadius:8, width:'fit-content' }}>
                <span style={{ fontSize:'0.9rem' }}>
                  {order.payment.method === 'cash' ? '💵' : '📱'}
                </span>
                <span style={{ fontSize:'0.75rem', fontWeight:700,
                  color: order.payment.method === 'cash' ? '#059669' : '#4F46E5' }}>
                  {order.payment.method === 'cash' ? 'Cash' : 'GPay'}
                  {order.payment.gpayRef && ` · ${order.payment.gpayRef}`}
                </span>
              </div>
            )}
          </div>

          {/* Payment Modal */}
          {paymentModal && (
            <PaymentModal
              order={order}
              API={API}
              onClose={() => setPaymentModal(false)}
              onSuccess={() => {
                setPaymentModal(false)
                fetchData()
              }}
            />
          )}
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
          <div style={{ padding:'12px 14px',
            background:'rgba(16,185,129,0.06)',
            border:'1.5px solid rgba(16,185,129,0.2)',
            borderRadius:12, marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center',
              justifyContent:'space-between' }}>
              <div>
                <p style={{ fontSize:'0.68rem', color:'#059669',
                  fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>
                  Will Be Awarded
                </p>
                <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                  Emp rate: ₹{order?.empRate || 0}
                  {(empBonuses[stage] || 0) > 0 && ` + Bonus: ₹${empBonuses[stage]}`}
                </p>
              </div>
              <p style={{ fontSize:'1.4rem', fontWeight:800, color:'#059669' }}>
                ₹{(order?.empRate || 0) + (empBonuses[stage] || 0)}
              </p>
            </div>
          </div>

          <div style={{ display:'grid',
            gridTemplateColumns:'1fr auto', gap:10 }}>
            <button onClick={() => handleApprove(stage)}
              disabled={approving === stage}
              style={{ padding:'13px',
                background:'linear-gradient(135deg,#10B981,#059669)',
                color:'white', border:'none', borderRadius:12,
                fontFamily:'Poppins,sans-serif', fontWeight:700,
                fontSize:'0.9rem', cursor:'pointer',
                display:'flex', alignItems:'center',
                justifyContent:'center', gap:8 }}>
              {approving === stage
                ? <><div style={{ width:18, height:18,
                    border:'2px solid rgba(255,255,255,0.3)',
                    borderTopColor:'white', borderRadius:'50%',
                    animation:'spin 0.8s linear infinite' }}/>
                    Approving...</>
                : <>✅ Approve</>}
            </button>
            <button onClick={() => handleUnassign(stage)}
              style={{ width:48, height:48, background:'#FEF2F2',
                border:'1.5px solid #FECACA', borderRadius:12,
                cursor:'pointer', display:'flex', alignItems:'center',
                justifyContent:'center', color:'#DC2626' }}>
              <X size={18}/>
            </button>
          </div>
        </div>
      )}

        {/* COMPLETED */}
        {stageData.status === 'completed' && (
        <div>
          <div style={{ padding:'14px', background:'#F0FDF4',
            borderRadius:12, border:'1px solid #D1FAE5',
            marginBottom: stage==='finishing' && waFormatted ? 10 : 0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ fontSize:'0.88rem', color:'#059669',
                  fontWeight:700, marginBottom:4 }}>
                  ✅ {stageData.employeeName}
                </p>
                <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
                  Completed {stageData.completedAt
                    ? new Date(stageData.completedAt).toLocaleDateString('en-IN')
                    : ''}
                </p>
              </div>
              <div style={{ textAlign:'right', background:'#DCFCE7',
                padding:'8px 12px', borderRadius:10 }}>
                <p style={{ fontSize:'0.65rem', color:'#059669',
                  fontWeight:600, marginBottom:2 }}>
                  AWARDED
                </p>
                <p style={{ fontSize:'1.1rem', fontWeight:800,
                  color:'#059669', lineHeight:1 }}>
                  ₹{(stageData.award||0).toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize:'0.65rem', color:'#6B7280', marginTop:2 }}>
                  incl. bonus
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp — finishing only */}
          {stage === 'finishing' && waFormatted && (  
            <a href={waURL} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center',
                gap:10, padding:'12px', marginTop:10,
                background:'linear-gradient(135deg,#25D366,#128C7E)',
                color:'white', borderRadius:10, textDecoration:'none',
                fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'0.88rem' }}>
              <span style={{ fontSize:'1.2rem' }}>💬</span>
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
      
      {/* Delivery Modal */}
        {deliveryModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(30,27,75,0.3)',
            backdropFilter:'blur(8px)', display:'flex', alignItems:'center',
            justifyContent:'center', zIndex:1000, padding:20 }}>
            <div className="glass" style={{ width:'100%', maxWidth:420, padding:28 }}>
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:20 }}>
                <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1.05rem', display:'flex', alignItems:'center', gap:8 }}>
                  🚚 Confirm Delivery
                </h2>
                <button onClick={()=>setDeliveryModal(false)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>
                  <X size={18}/>
                </button>
              </div>

              <div style={{ padding:'12px 14px', background:'rgba(16,185,129,0.06)',
                borderRadius:10, marginBottom:16,
                border:'1px solid rgba(16,185,129,0.2)' }}>
                <p style={{ fontSize:'0.85rem', color:'#059669', fontWeight:600, marginBottom:2 }}>
                  {order?.orderID} — {order?.clothType}
                </p>
                <p style={{ fontSize:'0.78rem', color:'#6B7280' }}>
                  Customer: {order?.customerRef?.name} · {order?.customerRef?.phone}
                </p>
              </div>

              <label className="input-label">DELIVERY NOTE (OPTIONAL)</label>
              <textarea
                value={deliveryNote}
                onChange={e => setDeliveryNote(e.target.value)}
                placeholder="e.g. Customer collected in person, Delivered via courier..."
                rows={3}
                style={{ width:'100%', padding:'11px 14px',
                  background:'rgba(255,255,255,0.8)',
                  border:'1.5px solid rgba(79,70,229,0.2)',
                  borderRadius:10, fontFamily:'Poppins,sans-serif',
                  fontSize:'0.88rem', color:'#1E1B4B',
                  outline:'none', resize:'none', marginBottom:20 }}
              />

              <div style={{ padding:'10px 14px', background:'rgba(245,158,11,0.06)',
                borderRadius:8, marginBottom:16,
                border:'1px solid rgba(245,158,11,0.2)' }}>
                <p style={{ fontSize:'0.8rem', color:'#D97706', fontWeight:500 }}>
                  ⚠️ This confirms the customer has received their order. This will be recorded as the official delivery acknowledgement.
                </p>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setDeliveryModal(false)}
                  className="btn-ghost" style={{ flex:1 }}>
                  Cancel
                </button>
                <button onClick={handleDeliver} disabled={delivering}
                  style={{ flex:2, padding:'12px',
                    background:'linear-gradient(135deg,#059669,#10B981)',
                    color:'white', border:'none', borderRadius:12,
                    fontFamily:'Poppins,sans-serif', fontWeight:700,
                    fontSize:'0.9rem', cursor:'pointer',
                    display:'flex', alignItems:'center',
                    justifyContent:'center', gap:8 }}>
                  {delivering
                    ? <><div style={{ width:18,height:18,
                        border:'2px solid rgba(255,255,255,0.3)',
                        borderTopColor:'white', borderRadius:'50%',
                        animation:'spin 0.8s linear infinite' }}/>
                        Confirming...</>
                    : <>🚚 Confirm Delivered</>}
                </button>
              </div>
            </div>
          </div>
        )}

      
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}