'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Scissors, Star, Phone, MapPin, Clock,
  ChevronRight, CheckCircle, Award, Users,
  Mail, ArrowRight, Zap, Menu, X
} from 'lucide-react'

export default function LandingPage() {
  const router   = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const services = [
    { icon:'👗', name:'Blouse & Saree Blouse', desc:'Custom fitted blouses stitched to your exact measurements with premium finish.' },
    { icon:'👘', name:'Chudi & Lehenga',        desc:'Elegant ethnic wear crafted with attention to every pleat and embellishment.' },
    { icon:'👔', name:'Shirts & Pants',          desc:'Perfectly tailored formals and casuals for men that fit like they were made for you.' },
    { icon:'🎀', name:'Kids Dress',              desc:'Cute and comfortable outfits for your little ones stitched with soft fabrics.' },
    { icon:'✨', name:'Custom Dress',            desc:'Bring any design — we will bring it to life exactly as you imagined it.' },
    { icon:'🪡', name:'Alterations',             desc:'Resize, reshape or repair any garment. We make old clothes feel brand new.' },
  ]

  const whyUs = [
    { icon:<Award size={28} color="#4F46E5" />,       title:'20+ Years Experience',   desc:'Two decades of crafting perfect fits for thousands of happy customers.' },
    { icon:<Scissors size={28} color="#00D4FF" />,    title:'Expert Tailors',          desc:'Our team of skilled artisans handle every stitch with care and precision.' },
    { icon:<CheckCircle size={28} color="#10B981" />, title:'On-Time Delivery',        desc:'We respect your time. Orders are always delivered on the promised date.' },
    { icon:<Users size={28} color="#F59E0B" />,       title:'1000+ Happy Customers',   desc:'Trusted by families across the region for all their tailoring needs.' },
  ]

  const testimonials = [
    { name:'Fatima R.',    location:'Chennai',   rating:5, text:'Al-Ameen Tailors stitched my wedding blouse perfectly. The fit was absolutely stunning and delivered on time!' },
    { name:'Priya M.',     location:'Karur',     rating:5, text:'I have been coming here for 5 years. The quality and finishing is always top notch. Highly recommended!' },
    { name:'Ravi Kumar',   location:'Trichy',    rating:5, text:'Best tailor in the region. My shirts always fit perfectly. Never going anywhere else.' },
  ]

  return (
    <div style={{ fontFamily:'Poppins,sans-serif', color:'#1E1B4B', overflowX:'hidden' }}>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(79,70,229,0.1)' : 'none',
        transition:'all 0.4s ease',
        padding:'0 5%',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:70, maxWidth:1200, margin:'0 auto' }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <img src="/logo.png" alt="Al-Ameen Tailors"
              style={{ width:44, height:44, borderRadius:12, objectFit:'cover',
                boxShadow:'0 4px 12px rgba(79,70,229,0.25)',
                border:'2px solid rgba(255,255,255,0.8)' }}
              onError={e => { e.target.style.display='none' }}
            />
            <div>
              <p style={{ fontWeight:800, fontSize:'1rem', color:'#1E1B4B', lineHeight:1.1 }}>Al-Ameen Tailors</p>
              <p style={{ fontSize:'0.65rem', color:'#6B7280', fontWeight:400 }}>Master Tailoring Since 2004</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div style={{ display:'flex', alignItems:'center', gap:32 }} className="desktop-nav">
            {['Services','Why Us','Testimonials','Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ','-')}`}
                style={{ fontSize:'0.88rem', fontWeight:500, color:'#4B5563', textDecoration:'none', transition:'color 0.2s' }}
                onMouseEnter={e => e.target.style.color='#4F46E5'}
                onMouseLeave={e => e.target.style.color='#4B5563'}>
                {item}
              </a>
            ))}
          </div>

          {/* Login Button */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => router.push('/login')} className="btn-primary"
              style={{ padding:'9px 22px', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:6 }}>
              Login <ChevronRight size={15} />
            </button>
            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#1E1B4B', display:'none' }}
              className="mobile-menu-btn">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div style={{ background:'rgba(255,255,255,0.98)', backdropFilter:'blur(20px)', padding:'20px 5%', borderTop:'1px solid rgba(79,70,229,0.1)' }}>
            {['Services','Why Us','Testimonials','Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ','-')}`}
                onClick={() => setMenuOpen(false)}
                style={{ display:'block', padding:'10px 0', fontSize:'0.95rem', fontWeight:500, color:'#4B5563', textDecoration:'none', borderBottom:'1px solid rgba(79,70,229,0.06)' }}>
                {item}
              </a>
            ))}
            <button onClick={() => router.push('/login')} className="btn-primary"
              style={{ marginTop:14, width:'100%', padding:'12px', fontSize:'0.9rem' }}>
              Login to Portal
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{
        minHeight:'100vh', display:'flex', alignItems:'center',
        padding:'120px 5% 80px',
        background:'linear-gradient(135deg, #EEF2FF 0%, #E0F2FE 50%, #F0FDF4 100%)',
        position:'relative', overflow:'hidden',
      }}>
        {/* Background decorations */}
        <div style={{ position:'absolute', top:'10%', right:'5%', width:400, height:400, borderRadius:'50%', background:'rgba(79,70,229,0.07)', filter:'blur(60px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'10%', left:'5%', width:300, height:300, borderRadius:'50%', background:'rgba(0,212,255,0.07)', filter:'blur(60px)', pointerEvents:'none' }} />

        <div style={{ maxWidth:1200, margin:'0 auto', width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>

          {/* Left */}
          <div className="fade-up">
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.15)', borderRadius:999, padding:'6px 16px', marginBottom:24 }}>
              <Zap size={14} color="#4F46E5" />
              <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#4F46E5' }}>Premium Custom Tailoring in Karur</span>
            </div>

            <h1 style={{ fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:800, lineHeight:1.15, marginBottom:20, color:'#1E1B4B' }}>
              Crafting Perfect Fits
              <br />
              <span style={{ background:'linear-gradient(135deg,#4F46E5,#00D4FF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                For Every Occasion
              </span>
            </h1>

            <p style={{ fontSize:'1rem', color:'#6B7280', lineHeight:1.8, marginBottom:32, maxWidth:480 }}>
              Al-Ameen Tailors brings 20+ years of expertise to every stitch.
              From elegant ethnic wear to sharp formals — we tailor to perfection,
              every single time.
            </p>

            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              <button onClick={() => router.push('/login')} className="btn-primary"
                style={{ padding:'14px 32px', fontSize:'0.95rem', display:'flex', alignItems:'center', gap:8 }}>
                Track My Order <ArrowRight size={17} />
              </button>
              <a href="#services">
                <button className="btn-ghost" style={{ padding:'14px 28px', fontSize:'0.95rem' }}>
                  Our Services
                </button>
              </a>
            </div>

            {/* Stats row */}
            <div style={{ display:'flex', gap:32, marginTop:40, flexWrap:'wrap' }}>
              {[
                { value:'1000+', label:'Happy Customers' },
                { value:'20+',   label:'Years Experience' },
                { value:'100%',  label:'On-Time Delivery' },
              ].map((s,i) => (
                <div key={i}>
                  <p style={{ fontSize:'1.5rem', fontWeight:800, color:'#4F46E5' }}>{s.value}</p>
                  <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:500 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — decorative card */}
          <div className="fade-up-1" style={{ display:'flex', justifyContent:'center' }}>
            <div style={{ position:'relative', width:'100%', maxWidth:420 }}>
              {/* Main card */}
              <div className="glass" style={{ padding:32, background:'rgba(255,255,255,0.8)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
                  <img src="/logo.png" alt="Logo"
                    style={{ width:64, height:64, borderRadius:18, objectFit:'cover', boxShadow:'0 8px 24px rgba(79,70,229,0.2)', border:'2px solid rgba(255,255,255,0.9)' }}
                    onError={e => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(135deg,#4F46E5,#00D4FF)', display:'none', alignItems:'center', justifyContent:'center' }}>
                    <Scissors size={30} color="white" />
                  </div>
                  <div>
                    <p style={{ fontWeight:800, fontSize:'1.1rem', color:'#1E1B4B' }}>Al-Ameen Tailors</p>
                    <div style={{ display:'flex', gap:2, marginTop:4 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#F59E0B" color="#F59E0B" />)}
                    </div>
                  </div>
                </div>

                {/* Sample order status */}
                {[
                  { id:'ORD000042', item:'Saree Blouse', status:'Stitching',  color:'#2563EB', bg:'rgba(59,130,246,0.08)', pct:60 },
                  { id:'ORD000041', item:'Chudi Set',    status:'Finishing',  color:'#9333EA', bg:'rgba(168,85,247,0.08)', pct:80 },
                  { id:'ORD000040', item:'Kids Dress',   status:'Ready ✅',   color:'#059669', bg:'rgba(16,185,129,0.08)', pct:100 },
                ].map((o,i) => (
                  <div key={i} style={{ marginBottom:12, padding:'12px 14px', background:o.bg, borderRadius:10, border:`1px solid ${o.color}22` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <div>
                        <p style={{ fontSize:'0.8rem', fontWeight:700, color:'#1E1B4B' }}>{o.item}</p>
                        <p style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>{o.id}</p>
                      </div>
                      <span style={{ fontSize:'0.72rem', fontWeight:600, color:o.color, background:o.bg, padding:'3px 10px', borderRadius:999, border:`1px solid ${o.color}33`, height:'fit-content' }}>
                        {o.status}
                      </span>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.6)', borderRadius:999, height:5, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${o.pct}%`, background:`linear-gradient(90deg,${o.color},${o.color}88)`, borderRadius:999 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating badge */}
              <div style={{ position:'absolute', top:-16, right:-16, background:'linear-gradient(135deg,#4F46E5,#6366F1)', color:'white', borderRadius:14, padding:'10px 16px', boxShadow:'0 8px 24px rgba(79,70,229,0.4)', fontSize:'0.78rem', fontWeight:700 }}>
                🎉 Order Ready!
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────── */}
      <section id="services" style={{ padding:'90px 5%', background:'white' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <p style={{ fontSize:'0.8rem', fontWeight:600, color:'#4F46E5', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10 }}>What We Do</p>
            <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.4rem)', fontWeight:800, color:'#1E1B4B', marginBottom:14 }}>Our Services</h2>
            <p style={{ color:'#6B7280', maxWidth:500, margin:'0 auto', fontSize:'0.95rem', lineHeight:1.7 }}>
              From traditional ethnic wear to modern western styles — we stitch everything with the same dedication to quality.
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
            {services.map((s,i) => (
              <div key={i} className="glass"
                style={{ padding:'28px', transition:'all 0.3s ease', cursor:'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(79,70,229,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='' }}>
                <div style={{ fontSize:'2.2rem', marginBottom:14 }}>{s.icon}</div>
                <h3 style={{ fontWeight:700, fontSize:'1rem', color:'#1E1B4B', marginBottom:8 }}>{s.name}</h3>
                <p style={{ color:'#6B7280', fontSize:'0.88rem', lineHeight:1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ─────────────────────────────────────────── */}
      <section id="why-us" style={{ padding:'90px 5%', background:'linear-gradient(135deg,#EEF2FF,#E0F2FE)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <p style={{ fontSize:'0.8rem', fontWeight:600, color:'#4F46E5', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10 }}>Our Promise</p>
            <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.4rem)', fontWeight:800, color:'#1E1B4B' }}>Why Choose Al-Ameen Tailors?</h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20 }}>
            {whyUs.map((w,i) => (
              <div key={i} className="glass" style={{ padding:'32px 24px', textAlign:'center' }}>
                <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 4px 16px rgba(79,70,229,0.12)' }}>
                  {w.icon}
                </div>
                <h3 style={{ fontWeight:700, fontSize:'1rem', color:'#1E1B4B', marginBottom:10 }}>{w.title}</h3>
                <p style={{ color:'#6B7280', fontSize:'0.85rem', lineHeight:1.7 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section id="testimonials" style={{ padding:'90px 5%', background:'white' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <p style={{ fontSize:'0.8rem', fontWeight:600, color:'#4F46E5', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10 }}>Reviews</p>
            <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.4rem)', fontWeight:800, color:'#1E1B4B' }}>What Our Customers Say</h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 }}>
            {testimonials.map((t,i) => (
              <div key={i} className="glass" style={{ padding:'28px' }}>
                <div style={{ display:'flex', gap:2, marginBottom:16 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <p style={{ color:'#4B5563', fontSize:'0.9rem', lineHeight:1.8, marginBottom:20, fontStyle:'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#4F46E5,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'0.9rem' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight:700, fontSize:'0.88rem', color:'#1E1B4B' }}>{t.name}</p>
                    <p style={{ fontSize:'0.75rem', color:'#9CA3AF' }}><MapPin size={10} style={{display:'inline',marginRight:2}} />{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────── */}
      <section style={{ padding:'70px 5%', background:'linear-gradient(135deg,#4F46E5,#6366F1,#00D4FF)' }}>
        <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.4rem)', fontWeight:800, color:'white', marginBottom:14 }}>
            Ready to Track Your Order?
          </h2>
          <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'0.95rem', lineHeight:1.7, marginBottom:32 }}>
            Login to the customer portal with your Customer ID and Phone Number to track your order in real time.
          </p>
          <button onClick={() => router.push('/login')}
            style={{ background:'white', color:'#4F46E5', border:'none', borderRadius:12, padding:'15px 40px', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'1rem', cursor:'pointer', boxShadow:'0 8px 24px rgba(0,0,0,0.2)', transition:'all 0.3s ease', display:'inline-flex', alignItems:'center', gap:8 }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform='none'}>
            Login to Portal <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── CONTACT ────────────────────────────────────────── */}
      <section id="contact" style={{ padding:'90px 5%', background:'white' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <p style={{ fontSize:'0.8rem', fontWeight:600, color:'#4F46E5', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10 }}>Get In Touch</p>
            <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.4rem)', fontWeight:800, color:'#1E1B4B' }}>Contact Us</h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:20, marginBottom:40 }}>
            {[
              { icon:<Phone size={22} color="#4F46E5" />,   label:'Phone',    value:'+91 98765 43210',              sub:'Mon–Sat, 9am–8pm' },
              { icon:<MapPin size={22} color="#10B981" />,  label:'Address',  value:'123 Main Street, Karur',       sub:'Tamil Nadu, India' },
              { icon:<Clock size={22} color="#F59E0B" />,   label:'Hours',    value:'Mon–Sat: 9am – 8pm',           sub:'Sunday: 10am – 5pm' },
              { icon:<Mail size={22} color="#00D4FF" />,    label:'Email',    value:'alameen@tailors.com',          sub:'Reply within 24 hrs' },
            ].map((c,i) => (
              <div key={i} className="glass" style={{ padding:'24px', textAlign:'center' }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(79,70,229,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                  {c.icon}
                </div>
                <p style={{ fontSize:'0.72rem', fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{c.label}</p>
                <p style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.9rem', marginBottom:4 }}>{c.value}</p>
                <p style={{ fontSize:'0.78rem', color:'#9CA3AF' }}>{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ background:'#1E1B4B', color:'white', padding:'40px 5%' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <img src="/logo.png" alt="Logo"
              style={{ width:40, height:40, borderRadius:10, objectFit:'cover', border:'2px solid rgba(255,255,255,0.2)' }}
              onError={e => e.target.style.display='none'}
            />
            <div>
              <p style={{ fontWeight:700, fontSize:'0.95rem' }}>Al-Ameen Tailors</p>
              <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.5)' }}>Crafting perfection since 2004</p>
            </div>
          </div>

          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', textAlign:'center' }}>
            © 2026 Al-Ameen Tailors. All rights reserved.
          </p>

          <div style={{ display:'flex', gap:14 }}>
            {[
              { icon:'📸', href:'#' },
              { icon:'📘', href:'#' },
              { icon:'🐦', href:'#' },
              ].map((s,i) => (
              <a key={i} href={s.href}
                style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.7)', textDecoration:'none', transition:'all 0.2s', fontSize:'1rem' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(79,70,229,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)' }}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          section > div > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
} 