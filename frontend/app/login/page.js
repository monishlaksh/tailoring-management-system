'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scissors, Shield, Eye, ArrowLeft } from 'lucide-react'

export default function LoginChoice() {
  const router = useRouter()
  const [logoError, setLogoError] = useState(false)

  return (
    <main style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>

      <button onClick={() => router.push('/')}
        style={{ position:'fixed', top:24, left:24, display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.7)', backdropFilter:'blur(10px)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:8, padding:'8px 14px', cursor:'pointer', color:'#6B7280', fontFamily:'Poppins,sans-serif', fontSize:'0.85rem', fontWeight:500 }}>
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div className="fade-up" style={{ textAlign:'center', marginBottom:'48px' }}>
        {logoError ? (
          <div style={{ width:80, height:80, borderRadius:22, background:'linear-gradient(135deg,#4F46E5,#00D4FF)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 16px 40px rgba(79,70,229,0.3)' }}>
            <Scissors size={40} color="white" strokeWidth={1.8} />
          </div>
        ) : (
          <img
            src="/logo.png"
            alt="Al-Ameen Tailors"
            onError={() => setLogoError(true)}
            style={{ width:80, height:80, borderRadius:22, objectFit:'cover', margin:'0 auto 18px', display:'block', boxShadow:'0 16px 40px rgba(79,70,229,0.25)', border:'3px solid rgba(255,255,255,0.9)' }}
          />
        )}
        <h1 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:800, color:'#1E1B4B', letterSpacing:'-0.3px' }}>
          Al-Ameen Tailors
        </h1>
        <p style={{ color:'#6B7280', marginTop:6, fontSize:'0.9rem' }}>Choose your login type</p>
      </div>

      <div className="fade-up-1" style={{ display:'flex', gap:'20px', flexWrap:'wrap', justifyContent:'center', width:'100%', maxWidth:'620px' }}>

        <div className="glass"
          onClick={() => router.push('/admin/login')}
          style={{ flex:1, minWidth:'260px', maxWidth:'290px', padding:'40px 32px', textAlign:'center', cursor:'pointer', transition:'transform 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-8px)'}
          onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
          <div style={{ width:60, height:60, borderRadius:'18px', background:'linear-gradient(135deg,#4F46E5,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 8px 24px rgba(79,70,229,0.3)' }}>
            <Shield size={28} color="white" />
          </div>
          <h2 style={{ fontWeight:700, fontSize:'1.15rem', color:'#1E1B4B', marginBottom:8 }}>Admin Portal</h2>
          <p style={{ color:'#6B7280', fontSize:'0.82rem', lineHeight:1.6, marginBottom:24 }}>
            Manage customers, orders,<br />measurements & delivery
          </p>
          <button className="btn-primary" style={{ width:'100%' }}>Login as Admin</button>
        </div>

        <div className="glass"
          onClick={() => router.push('/customer/login')}
          style={{ flex:1, minWidth:'260px', maxWidth:'290px', padding:'40px 32px', textAlign:'center', cursor:'pointer', transition:'transform 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-8px)'}
          onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
          <div style={{ width:60, height:60, borderRadius:'18px', background:'linear-gradient(135deg,#00D4FF,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 8px 24px rgba(0,212,255,0.3)' }}>
            <Eye size={28} color="white" />
          </div>
          <h2 style={{ fontWeight:700, fontSize:'1.15rem', color:'#1E1B4B', marginBottom:8 }}>Customer Portal</h2>
          <p style={{ color:'#6B7280', fontSize:'0.82rem', lineHeight:1.6, marginBottom:24 }}>
            Track your orders,<br />measurements & delivery
          </p>
          <button className="btn-accent" style={{ width:'100%' }}>Login as Customer</button>
        </div>

      </div>
    </main>
  )
}