'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera } from 'lucide-react'

export default function EmployeeScanPage() {
  const router   = useRouter()
  const scanRef  = useRef(null)
  const [scanning, setScanning]     = useState(false)
  const [error, setError]           = useState('')
  const [manualInput, setManualInput] = useState('')
  const [scannerObj, setScannerObj] = useState(null)
  const [employee, setEmployee]     = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('employeeToken')
    const user  = localStorage.getItem('employeeUser')
    if (!token) { router.push('/employee/login'); return }
    if (user) setEmployee(JSON.parse(user))

    return () => {
      if (scannerObj) scannerObj.stop().catch(() => {})
    }
  }, [])

  const startScanner = async () => {
    setError('')
    setScanning(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('emp-qr-reader')
      setScannerObj(scanner)

      await scanner.start(
        { facingMode:'environment' },
        { fps:10, qrbox:{ width:250, height:250 } },
        (decodedText) => {
          scanner.stop().then(() => {
            setScanning(false)
            handleScannedURL(decodedText)
          }).catch(() => {})
        },
        () => {}
      )
    } catch (e) {
      setScanning(false)
      setError('Camera access denied. Please allow camera permission and try again.')
    }
  }

  const stopScanner = () => {
    if (scannerObj) scannerObj.stop().catch(() => {})
    setScanning(false)
  }

  const handleScannedURL = (url) => {
    try {
      const parts   = url.split('/')
      const orderID = parts[parts.length - 1]

      if (orderID && orderID.startsWith('ORD')) {
        // Get employee role to determine stage
        const role  = employee?.employeeRole || 'general'
        const stage = role === 'all' ? 'general' : role
        router.push(`/scan/${orderID}?stage=${stage}`)
      } else {
        setError('Invalid QR code')
      }
    } catch (e) {
      setError('Could not read QR code')
    }
  }

  const handleManualEntry = (e) => {
    e.preventDefault()
    const input = manualInput.trim().toUpperCase()
    if (input.startsWith('ORD')) {
      const role  = employee?.employeeRole || 'general'
      const stage = role === 'all' ? 'general' : role
      router.push(`/scan/${input}?stage=${stage}`)
    } else {
      setError('Please enter a valid Order ID starting with ORD')
    }
  }

  if (!employee) return null

  const roleColors = {
    cutting:   '#D97706',
    stitching: '#2563EB',
    finishing: '#9333EA',
    all:       '#059669',
  }
  const roleColor = roleColors[employee.employeeRole] || '#4F46E5'

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:480, margin:'0 auto', fontFamily:'Poppins,sans-serif' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 24px', marginBottom:24, borderTop:`3px solid ${roleColor}` }}>
        <button onClick={() => router.push('/employee/dashboard')} style={{ background:'none', border:'none', cursor:'pointer', color:roleColor, display:'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Scan QR Code</h1>
          <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>
            {employee.name} · <span style={{ color:roleColor, fontWeight:600 }}>{employee.employeeRole || 'All'} stage</span>
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'11px 16px', marginBottom:16, color:'#DC2626', fontSize:'0.87rem' }}>
          {error}
        </div>
      )}

      <div className="glass" style={{ padding:28, textAlign:'center' }}>

        <div id="emp-qr-reader" ref={scanRef}
          style={{ width:'100%', maxWidth:300, margin:'0 auto', borderRadius:12, overflow:'hidden', minHeight: scanning ? 300 : 0 }}
        />

        {!scanning ? (
          <div>
            <div style={{ fontSize:'3.5rem', marginBottom:14 }}>
              {employee.employeeRole === 'cutting'   && '✂️'}
              {employee.employeeRole === 'stitching' && '🧵'}
              {employee.employeeRole === 'finishing' && '🚩'}
              {(employee.employeeRole === 'all' || !employee.employeeRole) && '📱'}
            </div>
            <h2 style={{ fontWeight:700, color:'#1E1B4B', marginBottom:8, fontSize:'1.1rem' }}>
              Ready to Scan
            </h2>
            <p style={{ color:'#6B7280', fontSize:'0.85rem', marginBottom:20, lineHeight:1.6 }}>
              Scan the QR code on the material to view your work details.
            </p>
            <button onClick={startScanner}
              style={{ padding:'14px 32px', background:`linear-gradient(135deg,${roleColor},${roleColor}cc)`, color:'white', border:'none', borderRadius:12, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.95rem', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8, boxShadow:`0 4px 16px ${roleColor}44` }}>
              <Camera size={18} /> Scan QR Code
            </button>
          </div>
        ) : (
          <div style={{ marginTop:16 }}>
            <p style={{ color:roleColor, fontWeight:600, marginBottom:12 }}>📸 Scanning...</p>
            <button onClick={stopScanner}
              style={{ padding:'10px 24px', background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, color:'#DC2626', fontSize:'0.85rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
              Stop
            </button>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
          <div style={{ flex:1, height:1, background:'rgba(79,70,229,0.1)' }} />
          <span style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>or enter manually</span>
          <div style={{ flex:1, height:1, background:'rgba(79,70,229,0.1)' }} />
        </div>

        <form onSubmit={handleManualEntry}>
          <div style={{ display:'flex', gap:8 }}>
            <input type="text" value={manualInput} onChange={e => setManualInput(e.target.value)}
              placeholder="e.g. ORD000001"
              style={{ flex:1, padding:'12px 14px', background:'rgba(255,255,255,0.8)', border:`1.5px solid ${roleColor}44`, borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.9rem', color:'#1E1B4B', outline:'none', textTransform:'uppercase' }}
            />
            <button type="submit"
              style={{ padding:'12px 18px', background:`linear-gradient(135deg,${roleColor},${roleColor}cc)`, color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, cursor:'pointer' }}>
              Go →
            </button>
          </div>
        </form>
      </div>

    </main>
  )
}