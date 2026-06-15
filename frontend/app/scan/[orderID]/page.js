'use client'
import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Scissors } from 'lucide-react'

const STAGE_INFO = {
  cutting:   { icon:'✂️', label:'Cutting',   color:'#D97706', bg:'rgba(245,158,11,0.06)'  },
  stitching: { icon:'🧵', label:'Stitching',  color:'#2563EB', bg:'rgba(59,130,246,0.06)'  },
  finishing: { icon:'🚩', label:'Finishing',  color:'#9333EA', bg:'rgba(168,85,247,0.06)'  },
  general:   { icon:'📋', label:'Work Order', color:'#4F46E5', bg:'rgba(79,70,229,0.06)'   },
}

const STATUS_INFO = {
  not_assigned: { label:'Not Assigned Yet', color:'#9CA3AF', icon:'⏳' },
  pending:      { label:'Work In Progress',  color:'#D97706', icon:'🔄' },
  completed:    { label:'Completed',         color:'#059669', icon:'✅' },
}

const BACKEND = 'https://tailoring-management-apwh.onrender.com'

function ScanContent() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const pathParts = (pathname || '').split('/').filter(Boolean)
  const orderID   = pathParts[pathParts.length - 1]?.toUpperCase() || ''
  const stage     = searchParams?.get('stage') || 'general'

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!orderID || !orderID.startsWith('ORD')) {
      setError('Invalid QR code')
      setLoading(false)
      return
    }
    fetchData()
  }, [orderID, stage])

  const fetchData = async () => {
    const url = `${BACKEND}/api/scan/${orderID}?stage=${stage}`
    try {
      const res  = await fetch(url, { method:'GET', headers:{ 'Content-Type':'application/json' } })
      const text = await res.text()
      let json
      try { json = JSON.parse(text) }
      catch { setError('Server returned invalid data'); setLoading(false); return }

      if (res.ok && json.success) setData(json)
      else setError(json.message || `Order not found (${res.status})`)
    } catch (e) {
      setError('Cannot connect to server. Check your internet.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'Poppins,sans-serif',
      background:'#EEF2FF' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:52, height:52,
          border:'4px solid rgba(79,70,229,0.15)',
          borderTopColor:'#4F46E5', borderRadius:'50%',
          animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ color:'#6B7280', fontWeight:500 }}>Loading order details...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  if (error) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', padding:24, fontFamily:'Poppins,sans-serif',
      background:'#EEF2FF' }}>
      <div style={{ textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:'3.5rem', marginBottom:16 }}>❌</div>
        <h2 style={{ color:'#DC2626', fontWeight:700, marginBottom:8, fontSize:'1.2rem' }}>
          Order Not Found
        </h2>
        <p style={{ color:'#6B7280', fontSize:'0.9rem', marginBottom:20 }}>{error}</p>
        <button onClick={() => { setError(''); setLoading(true); fetchData() }}
          style={{ padding:'11px 28px', background:'#4F46E5', color:'white',
            border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif',
            fontWeight:600, cursor:'pointer', fontSize:'0.9rem' }}>
          Try Again
        </button>
      </div>
    </main>
  )

  if (!data) return null

  const stageInfo    = STAGE_INFO[stage]  || STAGE_INFO.general
  const statusInfo   = STATUS_INFO[data.stageInfo?.status] || STATUS_INFO.not_assigned
  const measurements = data.measurements || {}
  const hasMeasurements = Object.entries(measurements).some(([,v]) => v && v.trim() !== '')

  // Parse cloth type — stored as "Blouse - Half Sleeve - Normal"
  const clothParts = (data.clothType || '').split(' - ')
  const clothMain  = clothParts[0] || data.clothType || '—'
  const clothType  = clothParts[1] || null
  const clothSub   = clothParts[2] || null

  const MEASUREMENT_LABELS = {
    shoulder: 'Shoulder',
    chest:    'Chest',
    waist:    'Waist',
    hip:      'Hip',
    sleeve:   'Sleeve',
    length:   'Length',
    neck:     'Neck',
    custom:   'Custom',
  }

  return (
    <main style={{ minHeight:'100vh', fontFamily:'Poppins,sans-serif',
      background:'linear-gradient(135deg,#EEF2FF 0%,#E0E7FF 100%)',
      padding:'16px' }}>
      <div style={{ maxWidth:480, margin:'0 auto' }}>

        {/* ── Header ── */}
        <div style={{ background:'white', borderRadius:20, padding:'20px',
          marginBottom:14, boxShadow:'0 4px 24px rgba(79,70,229,0.12)',
          display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:54, height:54, borderRadius:16,
            background:`linear-gradient(135deg,${stageInfo.color},${stageInfo.color}bb)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.6rem', flexShrink:0,
            boxShadow:`0 6px 20px ${stageInfo.color}44` }}>
            {stageInfo.icon}
          </div>
          <div>
            <p style={{ fontSize:'0.7rem', color:'#9CA3AF', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'1px', marginBottom:2 }}>
              Al-Ameen Tailors
            </p>
            <h1 style={{ fontWeight:800, color:'#1E1B4B', fontSize:'1.15rem',
              marginBottom:2 }}>
              {stageInfo.label} Stage
            </h1>
            <p style={{ fontSize:'0.78rem', fontWeight:600, color:stageInfo.color }}>
              {data.orderID}
            </p>
          </div>
        </div>

        {/* ── Stage Status ── */}
        <div style={{ background:'white', borderRadius:16, padding:'16px 20px',
          marginBottom:14, boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:600,
              textTransform:'uppercase', marginBottom:4 }}>
              Stage Status
            </p>
            <p style={{ fontSize:'1rem', fontWeight:700,
              color:statusInfo.color }}>
              {statusInfo.icon} {statusInfo.label}
            </p>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:600,
              textTransform:'uppercase', marginBottom:4 }}>
              Quantity
            </p>
            <p style={{ fontSize:'1.3rem', fontWeight:800, color:'#1E1B4B' }}>
              {data.quantity}
              <span style={{ fontSize:'0.75rem', color:'#9CA3AF',
                fontWeight:500, marginLeft:3 }}>
                pc{data.quantity > 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </div>

        {/* ── Admin Notes ── */}
        {data.stageInfo?.notes && (
          <div style={{ background:'white', borderRadius:16,
            padding:'14px 18px', marginBottom:14,
            boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
            border:'1.5px solid rgba(245,158,11,0.2)' }}>
            <p style={{ fontSize:'0.68rem', color:'#D97706', fontWeight:700,
              textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>
              📌 Admin Notes
            </p>
            <p style={{ fontSize:'0.88rem', color:'#4B5563', lineHeight:1.6 }}>
              {data.stageInfo.notes}
            </p>
          </div>
        )}

        {/* ── Cloth Type Details ── */}
        <div style={{ background:'white', borderRadius:16, padding:'20px',
          marginBottom:14, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:700,
            textTransform:'uppercase', letterSpacing:'1px', marginBottom:14 }}>
            🧶 Cloth Details
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            <div style={{ background:'#EEF2FF', borderRadius:12,
              padding:'12px 10px', textAlign:'center' }}>
              <p style={{ fontSize:'0.62rem', color:'#6B7280', fontWeight:600,
                textTransform:'uppercase', marginBottom:6 }}>
                Cloth Type
              </p>
              <p style={{ fontSize:'0.95rem', fontWeight:800,
                color:'#4F46E5', lineHeight:1.2 }}>
                {clothMain}
              </p>
            </div>
            <div style={{ background:'rgba(245,158,11,0.08)', borderRadius:12,
              padding:'12px 10px', textAlign:'center' }}>
              <p style={{ fontSize:'0.62rem', color:'#6B7280', fontWeight:600,
                textTransform:'uppercase', marginBottom:6 }}>
                Type
              </p>
              <p style={{ fontSize:'0.95rem', fontWeight:800,
                color:'#D97706', lineHeight:1.2 }}>
                {clothType || '—'}
              </p>
            </div>
            <div style={{ background:'rgba(16,185,129,0.08)', borderRadius:12,
              padding:'12px 10px', textAlign:'center' }}>
              <p style={{ fontSize:'0.62rem', color:'#6B7280', fontWeight:600,
                textTransform:'uppercase', marginBottom:6 }}>
                Subtype
              </p>
              <p style={{ fontSize:'0.95rem', fontWeight:800,
                color:'#059669', lineHeight:1.2 }}>
                {clothSub || '—'}
              </p>
            </div>
          </div>

          {/* Fabric Notes */}
          {data.fabricNotes && data.fabricNotes.trim() && (
            <div style={{ marginTop:12, padding:'10px 14px',
              background:'rgba(79,70,229,0.04)', borderRadius:10,
              border:'1px solid rgba(79,70,229,0.1)' }}>
              <p style={{ fontSize:'0.68rem', color:'#4F46E5', fontWeight:600,
                marginBottom:3 }}>FABRIC NOTES</p>
              <p style={{ fontSize:'0.85rem', color:'#4B5563' }}>
                {data.fabricNotes}
              </p>
            </div>
          )}
        </div>

        {/* ── Measurements ── */}
        <div style={{ background:'white', borderRadius:16, padding:'20px',
          marginBottom:14, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:700,
            textTransform:'uppercase', letterSpacing:'1px', marginBottom:14 }}>
            📏 Measurements (inches)
          </p>

          {!hasMeasurements ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <p style={{ fontSize:'1.8rem', marginBottom:8 }}>📐</p>
              <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>
                No measurements recorded yet
              </p>
            </div>
          ) : (
            <div style={{ display:'grid',
              gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {Object.entries(measurements)
                .filter(([, v]) => v && v.trim() !== '')
                .map(([key, val]) => (
                  <div key={key} style={{ background:'#EEF2FF',
                    borderRadius:12, padding:'14px' }}>
                    <p style={{ fontSize:'0.63rem', color:'#6B7280',
                      fontWeight:600, textTransform:'uppercase',
                      letterSpacing:'0.5px', marginBottom:4 }}>
                      {MEASUREMENT_LABELS[key] || key}
                    </p>
                    <p style={{ fontSize:'1.5rem', fontWeight:800,
                      color:'#4F46E5', lineHeight:1 }}>
                      {val}
                      <span style={{ fontSize:'0.75rem',
                        color:'#9CA3AF', marginLeft:2 }}>
                        "
                      </span>
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ── Alterations — stitching stage only ── */}
        {stage === 'stitching' && (
          <div style={{ background:'white', borderRadius:16, padding:'20px',
            marginBottom:14, boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
            border:'2px solid rgba(245,158,11,0.2)' }}>
            <p style={{ fontSize:'0.68rem', color:'#D97706', fontWeight:700,
              textTransform:'uppercase', letterSpacing:'1px', marginBottom:14 }}>
              ⚠️ Alterations
            </p>

            {!data.alteration?.required ? (
              <div style={{ display:'flex', alignItems:'center', gap:10,
                padding:'12px 16px', background:'rgba(16,185,129,0.06)',
                borderRadius:10, border:'1px solid rgba(16,185,129,0.2)' }}>
                <span style={{ fontSize:'1.3rem' }}>✅</span>
                <p style={{ fontSize:'0.88rem', color:'#059669', fontWeight:600 }}>
                  No alterations required for this order
                </p>
              </div>
            ) : (
              <>
                {/* Selected options */}
                {(data.alteration.selectedOptions || []).length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <p style={{ fontSize:'0.72rem', color:'#9CA3AF',
                      fontWeight:600, marginBottom:10 }}>
                      REQUIRED ALTERATIONS
                    </p>
                    <div style={{ display:'grid',
                      gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',
                      gap:8 }}>
                      {data.alteration.selectedOptions.map((opt, i) => (
                        <div key={i} style={{ padding:'10px 12px',
                          background:'rgba(245,158,11,0.08)',
                          border:'1.5px solid rgba(245,158,11,0.25)',
                          borderRadius:10, display:'flex',
                          alignItems:'center', gap:8 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%',
                            background:'#F59E0B', flexShrink:0 }} />
                          <span style={{ fontSize:'0.82rem', fontWeight:600,
                            color:'#D97706' }}>
                            {opt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {data.alteration.notes && data.alteration.notes.trim() && (
                  <div style={{ padding:'14px 16px',
                    background:'rgba(245,158,11,0.05)',
                    border:'1.5px solid rgba(245,158,11,0.15)',
                    borderRadius:12 }}>
                    <p style={{ fontSize:'0.7rem', color:'#D97706',
                      fontWeight:700, textTransform:'uppercase',
                      marginBottom:6 }}>
                      Additional Notes
                    </p>
                    <p style={{ fontSize:'0.9rem', color:'#4B5563',
                      lineHeight:1.7 }}>
                      {data.alteration.notes}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Order Progress ── */}
        {data.allStages && (
          <div style={{ background:'white', borderRadius:16, padding:'20px',
            marginBottom:14, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:700,
              textTransform:'uppercase', letterSpacing:'1px', marginBottom:16 }}>
              📊 Order Progress
            </p>
            <div style={{ display:'grid', gap:12 }}>
              {[
                { key:'cutting',   icon:'✂️', label:'Cutting',   color:'#D97706' },
                { key:'stitching', icon:'🧵', label:'Stitching',  color:'#2563EB' },
                { key:'finishing', icon:'🚩', label:'Finishing',  color:'#9333EA' },
              ].map(s => {
                const st  = data.allStages[s.key]?.status || 'not_assigned'
                const pct = st === 'completed' ? 100
                          : st === 'pending'   ? 50 : 0
                const isCurrentStage = stage === s.key
                return (
                  <div key={s.key} style={{ display:'flex',
                    alignItems:'center', gap:12,
                    padding:'10px 12px',
                    background: isCurrentStage
                      ? `rgba(${s.color === '#D97706' ? '245,158,11'
                        : s.color === '#2563EB' ? '37,99,235'
                        : '147,51,234'},0.06)`
                      : 'transparent',
                    borderRadius:10,
                    border: isCurrentStage
                      ? `1.5px solid ${s.color}33`
                      : '1.5px solid transparent' }}>
                    <span style={{ fontSize:'1.1rem', width:26,
                      textAlign:'center' }}>
                      {s.icon}
                    </span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center', marginBottom:5 }}>
                        <span style={{ fontSize:'0.82rem', fontWeight:700,
                          color: isCurrentStage ? s.color : '#1E1B4B' }}>
                          {s.label}
                          {isCurrentStage && (
                            <span style={{ fontSize:'0.65rem',
                              marginLeft:6, color:s.color,
                              fontWeight:600 }}>
                              ← YOUR STAGE
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize:'0.75rem', fontWeight:700,
                          color: st === 'completed' ? '#059669'
                               : st === 'pending'   ? '#D97706'
                               : '#9CA3AF' }}>
                          {st === 'completed' ? '✓ Done'
                           : st === 'pending' ? 'In Progress'
                           : 'Not Started'}
                        </span>
                      </div>
                      <div style={{ height:6, background:'#EEF2FF',
                        borderRadius:999, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`,
                          background: pct === 100 ? '#10B981'
                                    : pct === 50  ? s.color
                                    : 'transparent',
                          borderRadius:999,
                          transition:'width 0.4s ease' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <div style={{ display:'inline-flex', alignItems:'center',
            gap:8, padding:'8px 20px',
            background:'rgba(255,255,255,0.7)', borderRadius:999,
            boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <Scissors size={14} color="#9CA3AF" />
            <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:500 }}>
              Al-Ameen Tailors · Work Order
            </p>
          </div>
          <p style={{ fontSize:'0.68rem', color:'#C4C9D4',
            marginTop:8 }}>
            Customer details are confidential and protected
          </p>
        </div>

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight:'100vh', display:'flex',
        alignItems:'center', justifyContent:'center',
        background:'#EEF2FF', fontFamily:'Poppins,sans-serif' }}>
        <div style={{ width:48, height:48,
          border:'3px solid rgba(79,70,229,0.2)',
          borderTopColor:'#4F46E5', borderRadius:'50%',
          animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </main>
    }>
      <ScanContent />
    </Suspense>
  )
}