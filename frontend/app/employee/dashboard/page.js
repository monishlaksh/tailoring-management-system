'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function EmployeeDashboard() {
  const router   = useRouter()
  const [employee, setEmployee] = useState(null)
  const [ready, setReady]       = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('employeeToken')
    const user  = localStorage.getItem('employeeUser')

    if (!token) {
      router.push('/employee/login')
      return
    }

    if (!user) {
      router.push('/employee/login')
      return
    }

    const parsed = JSON.parse(user)

    // Strict check — must be exactly true (boolean)
    if (parsed.hasFullAccess === true) {
      router.push('/employee/admin')
      return
    }

    // Normal employee — show dashboard
    setEmployee(parsed)
    setReady(true)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('employeeToken')
    localStorage.removeItem('employeeUser')
    router.push('/employee/login')
  }

  // Show spinner while checking
  if (!ready || !employee) return (
    <main style={{ minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center',
      fontFamily:'Poppins,sans-serif' }}>
      <div style={{ width:36, height:36,
        border:'3px solid rgba(245,158,11,0.2)',
        borderTopColor:'#F59E0B', borderRadius:'50%',
        animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  const roleInfo = {
    cutting:   { icon:'✂️', label:'Cutting',   color:'#D97706', bg:'rgba(245,158,11,0.08)'  },
    stitching: { icon:'🧵', label:'Stitching',  color:'#2563EB', bg:'rgba(59,130,246,0.08)'  },
    finishing: { icon:'🚩', label:'Finishing',  color:'#9333EA', bg:'rgba(168,85,247,0.08)'  },
    all:       { icon:'⭐', label:'All Stages', color:'#059669', bg:'rgba(16,185,129,0.08)'  },
  }

  const role = roleInfo[employee.employeeRole] || roleInfo.all

  return (
    <main style={{ minHeight:'100vh', padding:'20px',
      maxWidth:700, margin:'0 auto',
      fontFamily:'Poppins,sans-serif' }}>

      {/* Top Bar */}
      <div className="glass" style={{
        display:'flex', alignItems:'center',
        justifyContent:'space-between',
        padding:'14px 22px', marginBottom:20,
        flexWrap:'wrap', gap:12,
        borderTop:`3px solid ${role.color}`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12,
            background:`linear-gradient(135deg,${role.color},${role.color}aa)`,
            display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:'1.2rem' }}>
            {role.icon}
          </div>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>
              Al-Ameen Tailors
            </h1>
            <p style={{ fontSize:'0.7rem', color:'#6B7280' }}>
              {employee.name} ·{' '}
              <span style={{ color:role.color, fontWeight:600 }}>
                {role.label}
              </span>
            </p>
          </div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => router.push('/employee/scan')}
            style={{ display:'flex', alignItems:'center', gap:5,
              background:`linear-gradient(135deg,${role.color},${role.color}aa)`,
              border:'none', borderRadius:8, padding:'8px 16px',
              color:'white', fontSize:'0.8rem', fontWeight:600,
              cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            📱 Scan QR
          </button>
          <button onClick={handleLogout}
            style={{ display:'flex', alignItems:'center', gap:5,
              background:'rgba(239,68,68,0.08)',
              border:'1.5px solid rgba(239,68,68,0.2)',
              borderRadius:8, padding:'8px 14px',
              color:'#DC2626', fontSize:'0.8rem', fontWeight:600,
              cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Welcome */}
      <div className="glass" style={{ padding:40, textAlign:'center' }}>
        <div style={{ fontSize:'4rem', marginBottom:16 }}>{role.icon}</div>
        <h2 style={{ fontSize:'1.4rem', fontWeight:800,
          color:'#1E1B4B', marginBottom:8 }}>
          Welcome, {employee.name}!
        </h2>
        <p style={{ color:'#6B7280', fontSize:'0.9rem', marginBottom:24 }}>
          You are assigned to the{' '}
          <strong style={{ color:role.color }}>{role.label}</strong> stage.
        </p>

        <div style={{ background:role.bg,
          border:`1.5px solid ${role.color}33`,
          borderRadius:12, padding:'16px 20px',
          marginBottom:24, textAlign:'left' }}>
          <p style={{ fontSize:'0.82rem', fontWeight:600,
            color:role.color, marginBottom:6 }}>
            Your Responsibilities
          </p>
          <p style={{ fontSize:'0.82rem', color:'#4B5563', lineHeight:1.7 }}>
            {employee.employeeRole === 'cutting'   &&
              'Responsible for cutting cloth as per measurements. Scan QR to view details.'}
            {employee.employeeRole === 'stitching' &&
              'Responsible for stitching. Scan QR to view measurements and alterations.'}
            {employee.employeeRole === 'finishing' &&
              'Responsible for finishing. Scan QR to view order details.'}
            {(employee.employeeRole === 'all' || !employee.employeeRole) &&
              'Can work on all stages. Scan QR on material to view details.'}
          </p>
        </div>

        <div style={{ background:'rgba(255,255,255,0.6)',
          borderRadius:10, padding:'12px 20px',
          display:'inline-block' }}>
          <p style={{ fontSize:'0.72rem', color:'#9CA3AF',
            fontWeight:600, marginBottom:2 }}>EMPLOYEE ID</p>
          <p style={{ fontSize:'1.1rem', fontWeight:800,
            color:'#4F46E5', letterSpacing:2 }}>
            {employee.employeeID}
          </p>
        </div>
      </div>

      {/* How to work */}
      <div className="glass" style={{ padding:24, marginTop:20 }}>
        <h3 style={{ fontWeight:700, color:'#1E1B4B',
          marginBottom:14, fontSize:'0.9rem' }}>
          📋 How to work
        </h3>
        {[
          'Admin assigns an order and attaches QR code to the material.',
          'Tap "Scan QR" button and allow camera access.',
          'Point camera at the QR code on the material.',
          'Your work details will load automatically.',
          'Complete the work and show admin for approval.',
        ].map((text, i) => (
          <div key={i} style={{ display:'flex', gap:12,
            alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ width:24, height:24, borderRadius:'50%',
              background:`linear-gradient(135deg,${role.color},${role.color}aa)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'white', fontSize:'0.72rem',
              fontWeight:700, flexShrink:0 }}>
              {i + 1}
            </div>
            <p style={{ fontSize:'0.83rem', color:'#4B5563',
              lineHeight:1.6 }}>{text}</p>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}