'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera } from 'lucide-react'

export default function EmployeeScanPage() {
  const router  = useRouter()
  const scanRef = useRef(null)

  const [scanning, setScanning]       = useState(false)
  const [error, setError]             = useState('')
  const [manualInput, setManualInput] = useState('')
  const [scannerObj, setScannerObj]   = useState(null)
  const [employee, setEmployee]       = useState(null)
  const [lastScanned, setLastScanned] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('employeeToken')
    const user  = localStorage.getItem('employeeUser')
    if (!token) { router.push('/employee/login'); return }
    if (user) {
      const parsed = JSON.parse(user)
      console.log('Employee data:', parsed) // debug
      setEmployee(parsed)
    }
  }, [])

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerObj) {
        try { scannerObj.stop() } catch (_) {}
      }
    }
  }, [scannerObj])

  const getStageFromRole = (role) => {
    // Map employee role to stage
    if (role === 'cutting')   return 'cutting'
    if (role === 'stitching') return 'stitching'
    if (role === 'finishing') return 'finishing'
    return 'general' // for 'all' role
  }

  const extractOrderID = (scannedText) => {
    // The QR contains a full URL like:
    // https://tailoring-management-system.vercel.app/admin/allotment/ORD000001
    // OR just the orderID directly: ORD000001
    try {
      const text = scannedText.trim()

      // If it's a URL, extract the last path segment
      if (text.includes('/')) {
        const parts   = text.split('/')
        const lastPart = parts[parts.length - 1]
          .split('?')[0] // remove query params
          .split('#')[0] // remove hash
          .trim()
          .toUpperCase()
        return lastPart
      }

      // If it's already an order ID
      return text.toUpperCase()
    } catch (e) {
      return ''
    }
  }

const handleScannedURL = (scannedText) => {
  let orderID = ''
  if (scannedText.includes('/')) {
    const withoutQuery = scannedText.split('?')[0]
    const parts        = withoutQuery.split('/')
    orderID = parts[parts.length - 1].trim().toUpperCase()
  } else {
    orderID = scannedText.trim().toUpperCase()
  }

  if (!orderID || !orderID.startsWith('ORD')) {
    setError(`Could not read order ID. Got: "${scannedText}"`)
    return
  }

  const empRole = employee?.employeeRole || 'all'
  const stage   = empRole === 'all' ? 'general' : empRole
  router.push(`/scan/${orderID}?stage=${stage}`)
}

  const startScanner = async () => {
    setError('')
    setScanning(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      // Stop any existing scanner
      if (scannerObj) {
        try { await scannerObj.stop() } catch (_) {}
      }

      const scanner = new Html5Qrcode('emp-qr-reader')
      setScannerObj(scanner)

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          try { scanner.stop() } catch (_) {}
          setScanning(false)
          handleScannedURL(decoded)
        },
        () => {} // ignore scan errors silently
      )
    } catch (e) {
      setScanning(false)
      if (e.message?.includes('Permission')) {
        setError('Camera permission denied. Please allow camera access in browser settings.')
      } else {
        setError('Camera not available. Use manual entry below.')
      }
    }
  }

  const stopScanner = () => {
    if (scannerObj) {
      try { scannerObj.stop() } catch (_) {}
    }
    setScanning(false)
  }

  const handleManualEntry = (e) => {
    e.preventDefault()
    const input = manualInput.trim().toUpperCase()
    if (!input) { setError('Please enter an Order ID'); return }
    if (!input.startsWith('ORD')) {
      setError('Order ID must start with ORD (e.g. ORD000001)')
      return
    }
    const role  = employee?.employeeRole || employee?.role || 'all'
    const stage = getStageFromRole(role)
    router.push(`/scan/${input}?stage=${stage}`)
  }

  if (!employee) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'Poppins,sans-serif' }}>
      <div style={{ width:32, height:32, border:'3px solid rgba(79,70,229,0.2)',
        borderTopColor:'#4F46E5', borderRadius:'50%',
        animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  const roleColors = {
    cutting:'#D97706', stitching:'#2563EB',
    finishing:'#9333EA', all:'#059669',
  }
  const roleIcons = {
    cutting:'✂️', stitching:'🧵',
    finishing:'🚩', all:'📱',
  }
  const empRole  = employee?.employeeRole || employee?.role || 'all'
  const roleColor = roleColors[empRole] || '#4F46E5'
  const roleIcon  = roleIcons[empRole]  || '📱'

  return (
    <main style={{ minHeight:'100vh', padding:'24px',
      maxWidth:480, margin:'0 auto', fontFamily:'Poppins,sans-serif' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center',
        gap:12, padding:'14px 24px', marginBottom:24,
        borderTop:`3px solid ${roleColor}` }}>
        <button onClick={() => router.push('/employee/dashboard')}
          style={{ background:'none', border:'none', cursor:'pointer',
            color:roleColor, display:'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>
            Scan QR Code
          </h1>
          <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
            {employee.name} ·{' '}
            <span style={{ color:roleColor, fontWeight:600 }}>
              {empRole === 'all' ? 'All Stages' : empRole} stage
            </span>
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)',
          border:'1.5px solid rgba(239,68,68,0.2)',
          borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
          <p style={{ color:'#DC2626', fontSize:'0.87rem',
            fontWeight:500, marginBottom:4 }}>{error}</p>
          {lastScanned && (
            <p style={{ color:'#9CA3AF', fontSize:'0.72rem',
              fontFamily:'monospace', wordBreak:'break-all' }}>
              Scanned: {lastScanned}
            </p>
          )}
          <button onClick={() => { setError(''); setLastScanned('') }}
            style={{ marginTop:8, fontSize:'0.78rem', color:roleColor,
              background:'none', border:'none', cursor:'pointer',
              fontFamily:'Poppins,sans-serif', fontWeight:600 }}>
            Try again →
          </button>
        </div>
      )}

      <div className="glass" style={{ padding:28, textAlign:'center' }}>

        {/* QR reader container */}
        <div id="emp-qr-reader" ref={scanRef}
          style={{ width:'100%', maxWidth:300, margin:'0 auto',
            borderRadius:12, overflow:'hidden',
            minHeight: scanning ? 300 : 0 }}
        />

        {!scanning ? (
          <div>
            <div style={{ fontSize:'3.5rem', marginBottom:14 }}>
              {roleIcon}
            </div>
            <h2 style={{ fontWeight:700, color:'#1E1B4B',
              marginBottom:8, fontSize:'1.1rem' }}>
              Ready to Scan
            </h2>
            <p style={{ color:'#6B7280', fontSize:'0.85rem',
              marginBottom:8, lineHeight:1.6 }}>
              Scan the QR code on the material to view your work details.
            </p>
            <p style={{ color:roleColor, fontSize:'0.8rem',
              fontWeight:600, marginBottom:20 }}>
              Your stage:{' '}
              {empRole === 'all' ? 'General (all stages)' : empRole}
            </p>
            <button onClick={startScanner}
              style={{ padding:'14px 32px',
                background:`linear-gradient(135deg,${roleColor},${roleColor}cc)`,
                color:'white', border:'none', borderRadius:12,
                fontFamily:'Poppins,sans-serif', fontWeight:600,
                fontSize:'0.95rem', cursor:'pointer',
                display:'inline-flex', alignItems:'center', gap:8,
                boxShadow:`0 4px 16px ${roleColor}44` }}>
              <Camera size={18} /> Scan QR Code
            </button>
          </div>
        ) : (
          <div style={{ marginTop:16 }}>
            <p style={{ color:roleColor, fontWeight:600,
              marginBottom:12, fontSize:'0.9rem' }}>
              📸 Point camera at QR code...
            </p>
            <button onClick={stopScanner}
              style={{ padding:'10px 24px',
                background:'rgba(239,68,68,0.08)',
                border:'1.5px solid rgba(239,68,68,0.2)',
                borderRadius:10, color:'#DC2626', fontSize:'0.85rem',
                fontWeight:600, cursor:'pointer',
                fontFamily:'Poppins,sans-serif' }}>
              Stop
            </button>
          </div>
        )}

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center',
          gap:12, margin:'20px 0' }}>
          <div style={{ flex:1, height:1,
            background:'rgba(79,70,229,0.1)' }} />
          <span style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>
            or enter manually
          </span>
          <div style={{ flex:1, height:1,
            background:'rgba(79,70,229,0.1)' }} />
        </div>

        {/* Manual entry */}
        <form onSubmit={handleManualEntry}>
          <div style={{ display:'flex', gap:8 }}>
            <input type="text" value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="e.g. ORD000001"
              style={{ flex:1, padding:'12px 14px',
                background:'rgba(255,255,255,0.8)',
                border:`1.5px solid ${roleColor}44`,
                borderRadius:10, fontFamily:'Poppins,sans-serif',
                fontSize:'0.9rem', color:'#1E1B4B',
                outline:'none', textTransform:'uppercase' }}
            />
            <button type="submit"
              style={{ padding:'12px 20px',
                background:`linear-gradient(135deg,${roleColor},${roleColor}cc)`,
                color:'white', border:'none', borderRadius:10,
                fontFamily:'Poppins,sans-serif',
                fontWeight:600, cursor:'pointer',
                fontSize:'0.9rem' }}>
              Go →
            </button>
          </div>
        </form>

      </div>

      {/* How to use */}
      <div className="glass" style={{ padding:20, marginTop:16 }}>
        <p style={{ fontWeight:600, color:'#1E1B4B',
          marginBottom:10, fontSize:'0.88rem' }}>
          How to use
        </p>
        {[
          'Admin will assign an order to you and attach QR code to material',
          'Tap "Scan QR Code" and allow camera access when asked',
          'Point the camera steadily at the QR code for 1-2 seconds',
          'Your work details will load automatically',
          'If scanning fails, enter the Order ID manually (printed on tag)',
        ].map((text, i) => (
          <div key={i} style={{ display:'flex', gap:10, marginBottom:8 }}>
            <span style={{ width:22, height:22, borderRadius:'50%',
              background:`${roleColor}18`,
              display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'0.7rem',
              fontWeight:700, color:roleColor, flexShrink:0 }}>
              {i + 1}
            </span>
            <p style={{ fontSize:'0.82rem', color:'#4B5563',
              lineHeight:1.5 }}>{text}</p>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}