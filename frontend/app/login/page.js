'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scissors, Shield, Eye, Users} from 'lucide-react'

export default function LoginChoice() {
  const router = useRouter()
  const [logoError, setLogoError] = useState(false)

  return (
    <main style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>

      <button onClick={() => router.push('/')}
        lstyle={{ position:'fixed', top:24, left:24, display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.7)', backdropFilter:'blur(10px)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:8, padding:'8px 14px', cursor:'pointer', color:'#6B7280', fontFamily:'Poppins,sans-serif', fontSize:'0.85rem', fontWeight:500 }}>
      </button>

      <div className="fade-up" style={{ textAlign:'center', marginBottom:'40px' }}>
        {logoError ? (
          <div style={{ width:72, height:72, borderRadius:20, background:'linear-gradient(135deg,#4F46E5,#00D4FF)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 16px 40px rgba(79,70,229,0.3)' }}>
            <Scissors size={36} color="white" strokeWidth={1.8} />
          </div>
        ) : (
          <img src="/logo.png" alt="Al-Ameen Tailors" onError={() => setLogoError(true)}
            style={{ width:72, height:72, borderRadius:20, objectFit:'cover', margin:'0 auto 16px', display:'block', boxShadow:'0 16px 40px rgba(79,70,229,0.25)', border:'3px solid rgba(255,255,255,0.9)' }} />
        )}
        <h1 style={{ fontSize:'1.8rem', fontWeight:800, color:'#1E1B4B' }}>Al-Ameen Tailors</h1>
        <p style={{ color:'#6B7280', marginTop:6, fontSize:'0.88rem' }}>Choose your login type</p>
      </div>

      <div className="fade-up-1" style={{ display:'flex', gap:'16px', flexWrap:'wrap', justifyContent:'center', width:'100%', maxWidth:'860px' }}>

        {/* Admin */}
        <div className="glass" onClick={() => router.push('/admin/login')}
          style={{ flex:1, minWidth:'220px', maxWidth:'260px', padding:'32px 24px', textAlign:'center', cursor:'pointer', transition:'transform 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-8px)'}
          onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
          <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#4F46E5,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 8px 24px rgba(79,70,229,0.3)' }}>
            <Shield size={26} color="white" />
          </div>
          <h2 style={{ fontWeight:700, fontSize:'1rem', color:'#1E1B4B', marginBottom:6 }}>Admin</h2>
          <p style={{ color:'#6B7280', fontSize:'0.78rem', lineHeight:1.6, marginBottom:20 }}>Full control over all orders, customers & employees</p>
          <button className="btn-primary" style={{ width:'100%', padding:'11px' }}>Login as Admin</button>
        </div>

        {/* Employee */}
        <div className="glass" onClick={() => router.push('/employee/login')}
          style={{ flex:1, minWidth:'220px', maxWidth:'260px', padding:'32px 24px', textAlign:'center', cursor:'pointer', transition:'transform 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-8px)'}
          onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
          <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#F59E0B,#D97706)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 8px 24px rgba(245,158,11,0.3)' }}>
            <Users size={26} color="white" />
          </div>
          <h2 style={{ fontWeight:700, fontSize:'1rem', color:'#1E1B4B', marginBottom:6 }}>Employee</h2>
          <p style={{ color:'#6B7280', fontSize:'0.78rem', lineHeight:1.6, marginBottom:20 }}>Create customers and orders assigned to you</p>
          <button style={{ width:'100%', padding:'11px', background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.88rem', cursor:'pointer', boxShadow:'0 4px 15px rgba(245,158,11,0.35)' }}>
            Login as Employee
          </button>
        </div>

        {/* Customer */}
        <div className="glass" onClick={() => router.push('/customer/login')}
          style={{ flex:1, minWidth:'220px', maxWidth:'260px', padding:'32px 24px', textAlign:'center', cursor:'pointer', transition:'transform 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-8px)'}
          onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
          <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#00D4FF,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 8px 24px rgba(0,212,255,0.3)' }}>
            <Eye size={26} color="white" />
          </div>
          <h2 style={{ fontWeight:700, fontSize:'1rem', color:'#1E1B4B', marginBottom:6 }}>Customer</h2>
          <p style={{ color:'#6B7280', fontSize:'0.78rem', lineHeight:1.6, marginBottom:20 }}>Track your orders, measurements & delivery status</p>
          <button className="btn-accent" style={{ width:'100%', padding:'11px' }}>Login as Customer</button>
        </div>

      </div>
    </main>
  )
}