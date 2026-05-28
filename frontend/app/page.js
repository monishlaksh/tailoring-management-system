'use client'
import { useRouter } from 'next/navigation'
import { Scissors, Shield, Eye } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  return (
    <main style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div className="fade-up" style={{ textAlign:'center', marginBottom:'48px' }}>
        <div style={{ width:80, height:80, borderRadius:'24px', background:'linear-gradient(135deg,#4F46E5,#00D4FF)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 20px 50px rgba(79,70,229,0.35)' }}>
          <Scissors size={40} color="white" strokeWidth={1.8} />
        </div>
        <h1 style={{ fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:800, color:'#1E1B4B', letterSpacing:'-0.5px' }}>Tailoring Manager</h1>
        <p style={{ color:'#6B7280', marginTop:8, fontSize:'1rem' }}>Complete Order & Customer Management</p>
      </div>
      <div className="fade-up-1" style={{ display:'flex', gap:'20px', flexWrap:'wrap', justifyContent:'center', width:'100%', maxWidth:'620px' }}>
        <div className="glass" onClick={() => router.push('/admin/login')}
          style={{ flex:1, minWidth:'260px', maxWidth:'290px', padding:'40px 32px', textAlign:'center', cursor:'pointer', transition:'transform 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-8px)'}
          onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
          <div style={{ width:60, height:60, borderRadius:'18px', background:'linear-gradient(135deg,#4F46E5,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 8px 24px rgba(79,70,229,0.3)' }}>
            <Shield size={28} color="white" />
          </div>
          <h2 style={{ fontWeight:700, fontSize:'1.15rem', color:'#1E1B4B', marginBottom:8 }}>Admin Portal</h2>
          <p style={{ color:'#6B7280', fontSize:'0.82rem', lineHeight:1.6, marginBottom:24 }}>Manage customers, orders,<br/>measurements & delivery</p>
          <button className="btn-primary" style={{ width:'100%' }}>Login as Admin</button>
        </div>
        <div className="glass" onClick={() => router.push('/customer/login')}
          style={{ flex:1, minWidth:'260px', maxWidth:'290px', padding:'40px 32px', textAlign:'center', cursor:'pointer', transition:'transform 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-8px)'}
          onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
          <div style={{ width:60, height:60, borderRadius:'18px', background:'linear-gradient(135deg,#00D4FF,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 8px 24px rgba(0,212,255,0.3)' }}>
            <Eye size={28} color="white" />
          </div>
          <h2 style={{ fontWeight:700, fontSize:'1.15rem', color:'#1E1B4B', marginBottom:8 }}>Customer Portal</h2>
          <p style={{ color:'#6B7280', fontSize:'0.82rem', lineHeight:1.6, marginBottom:24 }}>Track your orders,<br/>measurements & delivery</p>
          <button className="btn-accent" style={{ width:'100%' }}>Login as Customer</button>
        </div>
      </div>
    </main>
  )
}