'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'

export default function SalaryPage() {
  const router = useRouter()
  const [salaries, setSalaries] = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [period, setPeriod]     = useState('daily')
  const [showHistory, setShowHistory] = useState(false)

// In fetchSalaries, pass custom range when history toggled:
const fetchSalaries = async () => {
  setLoading(true)
  try {
    let url = `/api/salary?period=${period}`
    if (showHistory) {
      const now = new Date()
      const start = new Date()
      if (period === 'daily')   start.setDate(now.getDate() - 30)
      if (period === 'weekly')  start.setDate(now.getDate() - 90)
      if (period === 'monthly') start.setMonth(now.getMonth() - 12)
      url += `&startDate=${start.toISOString()}&endDate=${now.toISOString()}`
    }
    const res = await API.get(url)
    setSalaries(res.data.salaries)
  } catch (e) { console.error(e) }
  finally { setLoading(false) }
}

useEffect(() => {
  if (localStorage.getItem('adminToken')) fetchSalaries()
}, [period, showHistory])

  

  

  const formatPeriodLabel = (p) => {
    try {
      if (period === 'daily') {
        return new Date(p).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
      } else if (period === 'weekly') {
        return `Week ${p.split('-W')[1]}, ${p.split('-W')[0]}`
      } else {
        const [y,m] = p.split('-')
        return new Date(parseInt(y), parseInt(m)-1).toLocaleDateString('en-IN', { month:'long', year:'numeric' })
      }
    } catch { return p }
  }

  const totalPaid = salaries.reduce((s,e) => s+e.totalEarned, 0)
  const totalOrdersAll = salaries.reduce((s,e) => s+e.totalOrders, 0)

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:900, margin:'0 auto' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Employee Salary</h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>Earnings based on completed work</p>
          </div>
        </div>

        {/* Period filter */}
        <div style={{ display:'flex', gap:6, background:'rgba(79,70,229,0.06)', padding:5, borderRadius:10 }}>
          {['daily','weekly','monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer',
                fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.8rem',
                background: period===p ? 'white' : 'transparent',
                color:      period===p ? '#4F46E5' : '#6B7280',
                boxShadow:  period===p ? '0 2px 6px rgba(79,70,229,0.15)' : 'none',
                textTransform:'capitalize' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Range hint */}
        <p style={{ fontSize:'0.75rem', color:'#9CA3AF', marginBottom:16 }}>
        {showHistory ? (
            <>
            {period === 'daily'   && 'Showing last 30 days'}
            {period === 'weekly'  && 'Showing last 12 weeks'}
            {period === 'monthly' && 'Showing last 12 months'}
            </>
        ) : (
            <>
            {period === 'daily'   && `Showing today — ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}`}
            {period === 'weekly'  && 'Showing this week (Mon–today)'}
            {period === 'monthly' && `Showing ${new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'})}`}
            </>
        )}
        </p>

        <button onClick={() => setShowHistory(!showHistory)}
        style={{ padding:'7px 14px', borderRadius:8,
            border:'1.5px solid rgba(79,70,229,0.2)', cursor:'pointer',
            fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.78rem',
            background: showHistory ? 'rgba(79,70,229,0.1)' : 'white',
            color:'#4F46E5', marginLeft:8 }}>
        {showHistory ? '📅 Showing History' : '📅 View History'}
        </button>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:20 }}>
        {[
          { label:'Total Paid to Employees', value:`₹${totalPaid.toLocaleString('en-IN')}`, color:'#059669', bg:'rgba(16,185,129,0.07)', icon:'💰' },
          { label:'Total Completed Orders',  value:totalOrdersAll, color:'#4F46E5', bg:'rgba(79,70,229,0.07)', icon:'✅' },
          { label:'Active Employees',        value:salaries.length, color:'#D97706', bg:'rgba(245,158,11,0.07)', icon:'👷' },
        ].map((s,i) => (
          <div key={i} className="glass" style={{ padding:'18px 16px', background:s.bg }}>
            <p style={{ fontSize:'1.4rem', marginBottom:4 }}>{s.icon}</p>
            <p style={{ fontSize:'0.7rem', color:'#6B7280', fontWeight:500, marginBottom:4 }}>{s.label}</p>
            <p style={{ fontSize:'1.4rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Salary list */}
      {loading ? (
        <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>Loading...</p>
      ) : salaries.length === 0 ? (
        <div className="glass" style={{ textAlign:'center', padding:48 }}>
          <p style={{ fontSize:'2.5rem', marginBottom:12 }}>💰</p>
          <p style={{ color:'#6B7280' }}>No salary records for this period.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gap:12 }}>
          {salaries.map(emp => (
            <div key={emp.employeeID} className="glass" style={{ overflow:'hidden' }}>
              <button
                onClick={() => setExpanded(expanded===emp.employeeID?null:emp.employeeID)}
                style={{ width:'100%', padding:'16px 20px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', textAlign:'left' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#4F46E5,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'0.9rem' }}>
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.92rem' }}>{emp.name}</p>
                    <p style={{ fontSize:'0.74rem', color:'#6B7280' }}>{emp.employeeID} · {emp.role}</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:600 }}>ORDERS</p>
                    <p style={{ fontSize:'1.1rem', fontWeight:800, color:'#4F46E5' }}>{emp.totalOrders}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:600 }}>EARNED</p>
                    <p style={{ fontSize:'1.1rem', fontWeight:800, color:'#059669' }}>₹{emp.totalEarned.toLocaleString('en-IN')}</p>
                  </div>
                  {expanded===emp.employeeID ? <ChevronUp size={18} color="#9CA3AF"/> : <ChevronDown size={18} color="#9CA3AF"/>}
                </div>
              </button>

              {expanded === emp.employeeID && (
                <div style={{ borderTop:'1px solid rgba(79,70,229,0.08)', padding:'14px 20px' }}>
                  {emp.breakdown.length === 0 ? (
                    <p style={{ fontSize:'0.82rem', color:'#9CA3AF', textAlign:'center', padding:'10px 0' }}>No completed work in this period.</p>
                  ) : (
                    <div style={{ display:'grid', gap:6 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px', gap:8, padding:'4px 8px' }}>
                        <span style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:700, textTransform:'uppercase' }}>
                          {period === 'daily' ? 'Date' : period === 'weekly' ? 'Week' : 'Month'}
                        </span>
                        <span style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', textAlign:'right' }}>Orders</span>
                        <span style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', textAlign:'right' }}>Amount</span>
                      </div>
                      {emp.breakdown.map((d,i) => (
                        <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px', gap:8, padding:'8px 8px', background:'rgba(79,70,229,0.03)', borderRadius:8 }}>
                          <span style={{ fontSize:'0.85rem', color:'#1E1B4B', fontWeight:500 }}>
                            {formatPeriodLabel(d.period)}
                          </span>
                          <span style={{ fontSize:'0.85rem', color:'#4F46E5', fontWeight:600, textAlign:'right' }}>{d.orders}</span>
                          <span style={{ fontSize:'0.85rem', color:'#059669', fontWeight:700, textAlign:'right' }}>₹{d.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}