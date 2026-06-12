'use client'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Scissors } from 'lucide-react'

const STAGE_INFO = {
  cutting:   { icon:'✂️', label:'Cutting',  color:'#D97706', bg:'rgba(245,158,11,0.08)'  },
  stitching: { icon:'🧵', label:'Stitching', color:'#2563EB', bg:'rgba(59,130,246,0.08)'  },
  finishing: { icon:'🚩', label:'Finishing', color:'#9333EA', bg:'rgba(168,85,247,0.08)'  },
  general:   { icon:'✂️', label:'General',  color:'#4F46E5', bg:'rgba(79,70,229,0.08)'   },
}

const STATUS_COLOR = {
  not_assigned: '#9CA3AF',
  pending:      '#D97706',
  completed:    '#059669',
}

export default function ScanPage() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const orderID      = pathname?.split('/').pop()
  const stage        = searchParams?.get('stage') || 'general'

  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tailoring-management-apwh.onrender.com'

  useEffect(() => {
    if (!orderID || orderID === 'undefined') {
      setError('Invalid QR code')
      setLoading(false)
      return
    }
    fetchData()
  }, [orderID, stage])

  const fetchData = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/allotment/scan/${orderID}?stage=${stage}`)
      const json = await res.json()
      if (json.success) {
        setData(json)
      } else {
        setError(json.message || 'Order not found')
      }
    } catch (e) {
      setError('Failed to load order data. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Poppins,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'3px solid rgba(79,70,229,0.2)', borderTopColor:'#4F46E5', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ color:'#6B7280' }}>Loading order details...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  if (error) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Poppins,sans-serif' }}>
      <div style={{ textAlign:'center', maxWidth:360 }}>
        <p style={{ fontSize:'3rem', marginBottom:16 }}>❌</p>
        <h2 style={{ color:'#DC2626', fontWeight:700, marginBottom:8 }}>Order Not Found</h2>
        <p style={{ color:'#6B7280', fontSize:'0.9rem' }}>{error}</p>
      </div>
    </main>
  )

  const stageInfo   = STAGE_INFO[stage] || STAGE_INFO.general
  const measurements = data.measurements || {}
  const hasMeasurements = Object.values(measurements).some(v => v)

  return (
    <main style={{ minHeight:'100vh', fontFamily:'Poppins,sans-serif', background:'#EEF2FF', padding:'20px' }}>

      {/* Header */}
      <div style={{ maxWidth:480, margin:'0 auto' }}>
        <div style={{ background:'white', borderRadius:16, padding:'20px', marginBottom:16, boxShadow:'0 4px 20px rgba(79,70,229,0.1)', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${stageInfo.color},${stageInfo.color}cc)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>
            {stageInfo.icon}
          </div>
          <div>
            <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>
              Al-Ameen Tailors
            </p>
            <h1 style={{ fontWeight:800, color:'#1E1B4B', fontSize:'1.1rem' }}>
              {stageInfo.label} Stage
            </h1>
            <p style={{ fontSize:'0.78rem', color:stageInfo.color, fontWeight:600 }}>
              {data.orderID} · {data.clothType}
            </p>
          </div>
        </div>

        {/* Stage status */}
        {data.stageInfo && (
          <div style={{ background:'white', borderRadius:16, padding:'16px 20px', marginBottom:16, boxShadow:'0 4px 20px rgba(79,70,229,0.08)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:600, marginBottom:4 }}>STAGE STATUS</p>
                <p style={{ fontSize:'1rem', fontWeight:700, color:STATUS_COLOR[data.stageInfo.status]||'#1E1B4B' }}>
                  {data.stageInfo.status === 'not_assigned' && '⏳ Not Assigned Yet'}
                  {data.stageInfo.status === 'pending'      && '🔄 Work In Progress'}
                  {data.stageInfo.status === 'completed'    && '✅ Completed'}
                </p>
              </div>
              <span style={{ fontSize:'0.75rem', fontWeight:600, padding:'4px 12px', borderRadius:999, background:stageInfo.bg, color:stageInfo.color }}>
                {data.quantity} pc{data.quantity>1?'s':''}
              </span>
            </div>
            {data.stageInfo.notes && (
              <div style={{ marginTop:10, padding:'10px 12px', background:'rgba(245,158,11,0.06)', borderRadius:8, border:'1px solid rgba(245,158,11,0.2)' }}>
                <p style={{ fontSize:'0.72rem', color:'#D97706', fontWeight:600, marginBottom:3 }}>ADMIN NOTES</p>
                <p style={{ fontSize:'0.85rem', color:'#4B5563' }}>{data.stageInfo.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Fabric notes */}
        {data.fabricNotes && (
          <div style={{ background:'white', borderRadius:16, padding:'16px 20px', marginBottom:16, boxShadow:'0 4px 20px rgba(79,70,229,0.08)' }}>
            <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:600, marginBottom:6 }}>FABRIC NOTES</p>
            <p style={{ fontSize:'0.88rem', color:'#4B5563' }}>{data.fabricNotes}</p>
          </div>
        )}

        {/* Measurements */}
        {hasMeasurements && (
          <div style={{ background:'white', borderRadius:16, padding:'20px', marginBottom:16, boxShadow:'0 4px 20px rgba(79,70,229,0.1)' }}>
            <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:14 }}>
              📏 Measurements (inches)
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {Object.entries(measurements).filter(([,v])=>v).map(([k,v]) => (
                <div key={k} style={{ background:'#EEF2FF', borderRadius:10, padding:'12px 14px' }}>
                  <p style={{ fontSize:'0.65rem', color:'#6B7280', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>{k}</p>
                  <p style={{ fontSize:'1.3rem', fontWeight:800, color:'#4F46E5' }}>{v}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alterations — only for stitching */}
        {stage === 'stitching' && data.alteration?.required && (
          <div style={{ background:'white', borderRadius:16, padding:'20px', marginBottom:16, boxShadow:'0 4px 20px rgba(245,158,11,0.15)', border:'2px solid rgba(245,158,11,0.2)' }}>
            <p style={{ fontSize:'0.75rem', color:'#D97706', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:14 }}>
              ⚠️ Alterations Required
            </p>

            {(data.alteration.selectedOptions||[]).length > 0 && (
              <div style={{ marginBottom:12 }}>
                <p style={{ fontSize:'0.72rem', color:'#9CA3AF', fontWeight:600, marginBottom:8 }}>SELECTED ALTERATIONS</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {data.alteration.selectedOptions.map((opt,i) => (
                    <span key={i} style={{ padding:'6px 14px', background:'rgba(245,158,11,0.1)', border:'1.5px solid rgba(245,158,11,0.3)', borderRadius:999, fontSize:'0.82rem', fontWeight:600, color:'#D97706' }}>
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.alteration.notes && (
              <div style={{ background:'rgba(245,158,11,0.06)', borderRadius:10, padding:'12px 14px' }}>
                <p style={{ fontSize:'0.72rem', color:'#D97706', fontWeight:600, marginBottom:4 }}>ADDITIONAL NOTES</p>
                <p style={{ fontSize:'0.88rem', color:'#4B5563', lineHeight:1.6 }}>{data.alteration.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* All stages overview */}
        {data.allStages && (
          <div style={{ background:'white', borderRadius:16, padding:'20px', marginBottom:16, boxShadow:'0 4px 20px rgba(79,70,229,0.08)' }}>
            <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:14 }}>
              ORDER PROGRESS
            </p>
            <div style={{ display:'grid', gap:8 }}>
              {[
                { key:'cutting',   icon:'✂️', label:'Cutting'   },
                { key:'stitching', icon:'🧵', label:'Stitching'  },
                { key:'finishing', icon:'🚩', label:'Finishing'  },
              ].map(s => {
                const st  = data.allStages[s.key]?.status || 'not_assigned'
                const pct = st==='completed'?100:st==='pending'?50:0
                return (
                  <div key={s.key} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:'1rem', width:24 }}>{s.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#1E1B4B' }}>{s.label}</span>
                        <span style={{ fontSize:'0.72rem', fontWeight:600, color:STATUS_COLOR[st] }}>
                          {st==='not_assigned'?'Not Started':st==='pending'?'In Progress':'Done ✓'}
                        </span>
                      </div>
                      <div style={{ height:6, background:'#EEF2FF', borderRadius:999, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:pct===100?'#10B981':'#F59E0B', borderRadius:999, transition:'width 0.4s' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div style={{ textAlign:'center', padding:'16px 0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <Scissors size={16} color="#9CA3AF" />
            <p style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>Al-Ameen Tailors · Work Order</p>
          </div>
          <p style={{ fontSize:'0.68rem', color:'#C4C9D4', marginTop:4 }}>
            Customer information is confidential and not shown here
          </p>
        </div>

      </div>
    </main>
  )
}