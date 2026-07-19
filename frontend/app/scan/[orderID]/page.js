'use client'
import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ||
  'https://tailoring-management-apwh.onrender.com'

function VoicePlayer({ voiceNote }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)

  const b64ToBlob = (b64, mime) => {
    const bytes = atob(b64)
    const arr   = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    return new Blob([arr], { type: mime })
  }

  const toggle = () => {
    if (playing && audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlaying(false)
      return
    }
    const blob = b64ToBlob(voiceNote.data, voiceNote.mimeType || 'audio/webm')
    const url  = URL.createObjectURL(blob)
    const a    = new Audio(url)
    audioRef.current = a
    a.play()
    setPlaying(true)
    a.onended = () => {
      setPlaying(false)
      audioRef.current = null
      URL.revokeObjectURL(url)
    }
  }

  const fmt = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ background:'white', borderRadius:16,
      padding:'16px', marginBottom:14,
      boxShadow:'0 2px 12px rgba(79,70,229,0.08)',
      border:'1.5px solid rgba(79,70,229,0.15)' }}>
      <p style={{ fontSize:'0.72rem', color:'#4F46E5', fontWeight:700,
        textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>
        🎙️ Admin Voice Note
      </p>
      <button onClick={toggle}
        style={{ width:'100%', padding:'13px',
          background: playing
            ? 'linear-gradient(135deg,#F59E0B,#D97706)'
            : 'linear-gradient(135deg,#4F46E5,#6366F1)',
          color:'white', border:'none', borderRadius:12,
          fontFamily:'Poppins,sans-serif', fontWeight:700,
          fontSize:'0.9rem', cursor:'pointer',
          display:'flex', alignItems:'center',
          justifyContent:'center', gap:8 }}>
        {playing ? '⏸ Tap to stop' : '▶️ Play Voice Note'}
        {voiceNote.duration > 0 && (
          <span style={{ marginLeft:'auto', fontSize:'0.78rem', opacity:0.8 }}>
            {fmt(voiceNote.duration)}
          </span>
        )}
      </button>
    </div>
  )
}

export default function ScanPage() {
  const pathname = usePathname()
  const orderID  = pathname?.split('/').pop()?.trim().toUpperCase()

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!orderID || orderID === 'UNDEFINED') {
      setError('Invalid order ID')
      setLoading(false)
      return
    }
    fetchOrder()
  }, [orderID])

  const fetchOrder = async () => {
    setLoading(true)
    setError('')
    try {
      const url = `${BACKEND}/api/scan/${orderID}`
      console.log('[SCAN] Fetching:', url)

      const res  = await fetch(url, {
        method:  'GET',
        headers: { 'Content-Type':'application/json' },
      })

      const json = await res.json()
      console.log('[SCAN] Response:', json)

      if (!res.ok || !json.success) {
        setError(json.message || `Order "${orderID}" not found`)
        return
      }

      setData(json)
    } catch (e) {
      console.error('[SCAN] Error:', e)
      setError(`Cannot reach server. Check connection. (${e.message})`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center',
      fontFamily:'Poppins,sans-serif',
      background:'linear-gradient(135deg,#EEF2FF,#E0E7FF)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48,
          border:'3px solid rgba(79,70,229,0.2)',
          borderTopColor:'#4F46E5', borderRadius:'50%',
          animation:'spin 0.8s linear infinite',
          margin:'0 auto 14px' }}/>
        <p style={{ color:'#6B7280', fontSize:'0.9rem' }}>
          Loading order details...
        </p>
        <p style={{ color:'#9CA3AF', fontSize:'0.75rem', marginTop:4 }}>
          {orderID}
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  if (error) return (
    <main style={{ minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center',
      fontFamily:'Poppins,sans-serif', padding:24,
      background:'linear-gradient(135deg,#EEF2FF,#E0E7FF)' }}>
      <div style={{ background:'white', borderRadius:20,
        padding:'32px 28px', maxWidth:360, width:'100%',
        textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.1)' }}>
        <p style={{ fontSize:'2.5rem', marginBottom:12 }}>❌</p>
        <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:8 }}>
          Order Not Found
        </h2>
        <p style={{ fontSize:'0.85rem', color:'#6B7280',
          marginBottom:20, lineHeight:1.6 }}>
          {error}
        </p>
        <p style={{ fontSize:'0.72rem', color:'#9CA3AF',
          background:'#F8F7FF', padding:'8px 12px', borderRadius:8 }}>
          Order ID: {orderID}
        </p>
        <button onClick={fetchOrder}
          style={{ marginTop:16, padding:'10px 24px',
            background:'linear-gradient(135deg,#4F46E5,#6366F1)',
            color:'white', border:'none', borderRadius:10,
            fontFamily:'Poppins,sans-serif', fontWeight:600,
            fontSize:'0.88rem', cursor:'pointer' }}>
          🔄 Retry
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  const measurements    = data.measurements || {}
  const hasMeasurements = Object.entries(measurements).some(([,v]) => v)
  const measurementImages = data.measurementImages || {}

  const statusColor = {
    not_assigned: '#9CA3AF',
    pending:      '#D97706',
    completed:    '#059669',
  }

  return (
    <main style={{ minHeight:'100vh', padding:'20px',
      fontFamily:'Poppins,sans-serif',
      background:'linear-gradient(135deg,#EEF2FF,#E0E7FF)' }}>
      <div style={{ maxWidth:500, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ background:'white', borderRadius:20, padding:'20px',
          marginBottom:16,
          boxShadow:'0 4px 20px rgba(79,70,229,0.1)' }}>
          <div style={{ display:'flex', alignItems:'center',
            gap:12, marginBottom:12 }}>
            <div style={{ width:44, height:44, borderRadius:12,
              background:'linear-gradient(135deg,#4F46E5,#6366F1)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'1.3rem', flexShrink:0 }}>
              ✂️
            </div>
            <div>
              <h1 style={{ fontWeight:800, color:'#1E1B4B',
                fontSize:'1rem', marginBottom:2 }}>
                Al-Ameen Tailors
              </h1>
              <p style={{ fontSize:'0.72rem', color:'#4F46E5',
                fontWeight:600 }}>
                Work Order — {data.orderID}
              </p>
            </div>
          </div>

          {/* Cloth type + quantity */}
          <div style={{ background:'#F8F7FF', borderRadius:12,
            padding:'12px 14px' }}>
            <p style={{ fontWeight:700, color:'#1E1B4B',
              fontSize:'0.9rem', marginBottom:2 }}>
              {data.clothType}
            </p>
            {data.clothTypeTa && (
              <p style={{ fontSize:'0.78rem', color:'#6B7280' }}>
                {data.clothTypeTa}
              </p>
            )}
            <p style={{ fontSize:'0.75rem', color:'#9CA3AF',
              marginTop:4 }}>
              Qty: <strong>{data.quantity}</strong>
            </p>
          </div>
        </div>

        {/* Type reference image */}
        {data.typeImage && (
          <div style={{ background:'white', borderRadius:16,
            padding:'16px', marginBottom:14,
            boxShadow:'0 2px 12px rgba(79,70,229,0.08)' }}>
            <p style={{ fontSize:'0.72rem', color:'#9CA3AF', fontWeight:700,
              textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>
              📸 Style Reference
            </p>
            <img src={data.typeImage} alt="style reference"
              style={{ width:'100%', borderRadius:10,
                maxHeight:200, objectFit:'cover' }}/>
          </div>
        )}

        {/* Measurements */}
        {hasMeasurements && (
          <div style={{ background:'white', borderRadius:16,
            padding:'18px', marginBottom:14,
            boxShadow:'0 2px 12px rgba(79,70,229,0.08)' }}>
            <p style={{ fontSize:'0.72rem', color:'#9CA3AF', fontWeight:700,
              textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:14 }}>
              📏 Measurements (inches / இஞ்சி)
            </p>
            <div style={{ display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',
              gap:10 }}>
              {Object.entries(measurements).filter(([,v]) => v).map(([key, val]) => {
                const imgUrl = measurementImages[key]
                const info   = data.measurementLabels?.[key]
                return (
                  <div key={key} style={{ background:'#EEF2FF',
                    borderRadius:12, padding:'10px 12px',
                    textAlign:'center' }}>
                    {imgUrl && (
                      <img src={imgUrl} alt={key}
                        style={{ width:'100%', height:60,
                          objectFit:'cover', borderRadius:8,
                          marginBottom:6 }}/>
                    )}
                    <p style={{ fontSize:'0.62rem', color:'#6B7280',
                      fontWeight:600, textTransform:'uppercase',
                      marginBottom:1 }}>
                      {info?.label || key}
                    </p>
                    {info?.labelTa && (
                      <p style={{ fontSize:'0.6rem', color:'#9CA3AF',
                        marginBottom:4 }}>
                        {info.labelTa}
                      </p>
                    )}
                    <p style={{ fontSize:'1.4rem', fontWeight:800,
                      color:'#4F46E5', lineHeight:1 }}>
                      {val}
                      <span style={{ fontSize:'0.7rem',
                        color:'#9CA3AF', marginLeft:1 }}>
                        "
                      </span>
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Alterations */}
        {data.alteration?.required &&
          (data.alteration.selectedOptions?.length > 0 ||
           data.alteration.notes) && (
          <div style={{ background:'white', borderRadius:16,
            padding:'16px', marginBottom:14,
            border:'1.5px solid rgba(245,158,11,0.2)',
            boxShadow:'0 2px 12px rgba(245,158,11,0.08)' }}>
            <p style={{ fontSize:'0.72rem', color:'#D97706', fontWeight:700,
              textTransform:'uppercase', marginBottom:10 }}>
              ⚠️ Alterations / மாற்றங்கள்
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
              {(data.alteration.selectedOptions || []).map((opt, i) => (
                <span key={i} style={{ padding:'4px 10px',
                  background:'rgba(245,158,11,0.1)',
                  border:'1px solid rgba(245,158,11,0.2)',
                  borderRadius:999, fontSize:'0.78rem',
                  fontWeight:600, color:'#D97706' }}>
                  {opt}
                </span>
              ))}
            </div>
            {data.alteration.notes && (
              <p style={{ fontSize:'0.82rem', color:'#4B5563',
                fontStyle:'italic' }}>
                {data.alteration.notes}
              </p>
            )}
          </div>
        )}

        {/* Stage progress */}
        {data.allStages && (
          <div style={{ background:'white', borderRadius:16,
            padding:'16px', marginBottom:14,
            boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize:'0.72rem', color:'#9CA3AF', fontWeight:700,
              textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>
              Stage Progress / பணி நிலை
            </p>
            <div style={{ display:'grid', gap:8 }}>
              {[
                { key:'cutting',   label:'Cutting',   ta:'வெட்டுதல்', icon:'✂️' },
                { key:'stitching', label:'Stitching',  ta:'தையல்',    icon:'🧵' },
                { key:'finishing', label:'Finishing',  ta:'இறுதி பணி', icon:'🚩' },
              ].map(s => {
                const st = data.allStages[s.key]?.status || 'not_assigned'
                return (
                  <div key={s.key} style={{ display:'flex',
                    alignItems:'center', justifyContent:'space-between',
                    padding:'10px 14px',
                    background:st==='completed'?'#F0FDF4':'#F8F7FF',
                    borderRadius:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:'1.1rem' }}>{s.icon}</span>
                      <div>
                        <p style={{ fontSize:'0.82rem', fontWeight:600,
                          color:'#1E1B4B' }}>
                          {s.label}
                        </p>
                        <p style={{ fontSize:'0.68rem', color:'#9CA3AF' }}>
                          {s.ta}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize:'0.72rem', fontWeight:700,
                      padding:'3px 10px', borderRadius:999,
                      background:`${statusColor[st]}18`,
                      color:statusColor[st] }}>
                      {st.replace('_',' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Fabric notes */}
        {data.fabricNotes && (
          <div style={{ background:'white', borderRadius:16,
            padding:'14px 16px', marginBottom:14,
            boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize:'0.72rem', color:'#9CA3AF', fontWeight:700,
              textTransform:'uppercase', marginBottom:6 }}>
              Fabric Notes / துணி குறிப்பு
            </p>
            <p style={{ fontSize:'0.88rem', color:'#1E1B4B' }}>
              {data.fabricNotes}
            </p>
          </div>
        )}

        {/* Voice note */}
        {data.voiceNote?.data && (
          <VoicePlayer voiceNote={data.voiceNote}/>
        )}

        {/* Footer */}
        <div style={{ textAlign:'center', padding:'12px 0' }}>
          <p style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>
            ✂️ Al-Ameen Tailors · {data.orderID}
          </p>
        </div>

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}