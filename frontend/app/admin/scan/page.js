'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera } from 'lucide-react'

export default function AdminScanPage() {
  const router  = useRouter()
  const scanRef = useRef(null)
  const [scanning, setScanning]   = useState(false)
  const [error, setError]         = useState('')
  const [scanned, setScanned]     = useState('')
  const [scannerObj, setScannerObj] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      router.push('/admin/login')
    }
    return () => {
      // Cleanup scanner on unmount
      if (scannerObj) {
        scannerObj.stop().catch(() => {})
      }
    }
  }, [])

  const startScanner = async () => {
    setError('')
    setScanning(true)

    try {
      // Dynamically import to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      setScannerObj(scanner)

      await scanner.start(
        { facingMode: 'environment' }, // use back camera
        { fps: 10, qrbox: { width:250, height:250 } },
        (decodedText) => {
          // QR decoded successfully
          setScanned(decodedText)
          scanner.stop().then(() => {
            setScanning(false)
            handleScannedURL(decodedText)
          }).catch(() => {})
        },
        () => {} // ignore scan errors
      )
    } catch (e) {
      setScanning(false)
      setError('Camera access denied or not available. Please allow camera permission.')
    }
  }

  const stopScanner = () => {
    if (scannerObj) {
      scannerObj.stop().catch(() => {})
    }
    setScanning(false)
  }

  const handleScannedURL = (url) => {
    try {
      // Extract orderID from URL
      // URL format: https://domain.com/admin/allotment/ORD000001
      const parts   = url.split('/')
      const orderID = parts[parts.length - 1]

      if (orderID && orderID.startsWith('ORD')) {
        router.push(`/admin/allotment/${orderID}`)
      } else {
        setError(`Invalid QR code: ${url}`)
      }
    } catch (e) {
      setError('Could not read QR code')
    }
  }

  const handleManualEntry = (e) => {
    e.preventDefault()
    if (scanned.trim()) {
      handleScannedURL(scanned.trim())
    }
  }

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:560, margin:'0 auto', fontFamily:'Poppins,sans-serif' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 24px', marginBottom:24 }}>
        <button onClick={() => router.push('/admin/dashboard')} style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Scan QR Code</h1>
          <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>Scan order QR to open allotment page</p>
        </div>
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'11px 16px', marginBottom:16, color:'#DC2626', fontSize:'0.87rem' }}>
          {error}
        </div>
      )}

      <div className="glass" style={{ padding:28, textAlign:'center' }}>

        {/* QR Reader container */}
        <div id="qr-reader" ref={scanRef}
          style={{ width:'100%', maxWidth:320, margin:'0 auto', borderRadius:12, overflow:'hidden', minHeight: scanning ? 320 : 0 }}
        />

        {!scanning ? (
          <div>
            <div style={{ fontSize:'4rem', marginBottom:16 }}>📱</div>
            <p style={{ color:'#6B7280', fontSize:'0.9rem', marginBottom:24, lineHeight:1.6 }}>
              Click the button below to open the camera and scan an order QR code.
            </p>
            <button onClick={startScanner} className="btn-primary"
              style={{ padding:'14px 32px', fontSize:'0.95rem', display:'inline-flex', alignItems:'center', gap:8, margin:'0 auto' }}>
              <Camera size={18} /> Start Scanning
            </button>
          </div>
        ) : (
          <div style={{ marginTop:16 }}>
            <p style={{ color:'#4F46E5', fontWeight:600, fontSize:'0.9rem', marginBottom:12 }}>
              📸 Point camera at QR code...
            </p>
            <button onClick={stopScanner}
              style={{ padding:'10px 24px', background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, color:'#DC2626', fontSize:'0.85rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
              Stop Scanner
            </button>
          </div>
        )}

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'24px 0' }}>
          <div style={{ flex:1, height:1, background:'rgba(79,70,229,0.1)' }} />
          <span style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>or enter manually</span>
          <div style={{ flex:1, height:1, background:'rgba(79,70,229,0.1)' }} />
        </div>

        {/* Manual entry */}
        <form onSubmit={handleManualEntry}>
          <div style={{ display:'flex', gap:8 }}>
            <input
              type="text"
              value={scanned}
              onChange={e => setScanned(e.target.value)}
              placeholder="Enter Order ID (e.g. ORD000001)"
              style={{ flex:1, padding:'12px 14px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none', textTransform:'uppercase' }}
            />
            <button type="submit" className="btn-primary"
              style={{ padding:'12px 18px', whiteSpace:'nowrap' }}>
              Go →
            </button>
          </div>
        </form>

      </div>

      {/* Instructions */}
      <div className="glass" style={{ padding:20, marginTop:16 }}>
        <p style={{ fontWeight:600, color:'#1E1B4B', marginBottom:12, fontSize:'0.88rem' }}>
          How to use
        </p>
        {[
          'Open this page on your phone or tablet',
          'Click "Start Scanning" and allow camera access',
          'Point the camera at the QR code on the material',
          'You will be automatically redirected to the allotment page',
          'Approve stages and award employees from the allotment page',
        ].map((text, i) => (
          <div key={i} style={{ display:'flex', gap:10, marginBottom:8 }}>
            <span style={{ width:22, height:22, borderRadius:'50%', background:'rgba(79,70,229,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:700, color:'#4F46E5', flexShrink:0 }}>
              {i+1}
            </span>
            <p style={{ fontSize:'0.82rem', color:'#4B5563', lineHeight:1.5 }}>{text}</p>
          </div>
        ))}
      </div>

    </main>
  )
}