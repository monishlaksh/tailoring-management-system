'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'

export default function SalaryPage() {
  const router = useRouter()
  const [salaries, setSalaries] = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchSalaries()
  }, [])

  const fetchSalaries = async (sd = startDate, ed = endDate) => {
    setLoading(true)
    try {
      let url = '/api/salary'
      const params = []
      if (sd) params.push(`startDate=${sd}`)
      if (ed) params.push(`endDate=${ed}`)
      if (params.length) url += '?' + params.join('&')
      const res = await API.get(url)
      setSalaries(res.data.salaries)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const applyFilter = () => fetchSalaries(startDate, endDate)
  const clearFilter = () => { setStartDate(''); setEndDate(''); fetchSalaries('', '') }

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
      </div>

      {/* Date filter */}
      <div className="glass" style={{ padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'flex-end', gap:12, flexWrap:'wrap' }}>
        <Calendar size={16} color="#9CA3AF" style={{ marginBottom:9 }}/>
        <div>
          <label className="input-label">FROM</label>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
            style={{ padding:'9px 12px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.85rem', color:'#1E1B4B', outline:'none' }} />
        </div>
        <div>
          <label className="input-label">TO</label>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}
            style={{ padding:'9px 12px', background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10, fontFamily:'Poppins,sans-serif', fontSize:'0.85rem', color:'#1E1B4B', outline:'none' }} />
        </div>
        <button onClick={applyFilter} className="btn-primary" style={{ padding:'9px 18px', fontSize:'0.82rem' }}>Apply</button>
        {(startDate||endDate) && (
          <button onClick={clearFilter} className="btn-ghost" style={{ padding:'9px 16px', fontSize:'0.82rem' }}>Clear</button>
        )}
      </div>

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
          <p style={{ color:'#6B7280' }}>No salary records yet.</p>
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
                  {emp.dailyBreakdown.length === 0 ? (
                    <p style={{ fontSize:'0.82rem', color:'#9CA3AF', textAlign:'center', padding:'10px 0' }}>No completed work yet.</p>
                  ) : (
                    <div style={{ display:'grid', gap:6 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px', gap:8, padding:'4px 8px' }}>
                        <span style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:700, textTransform:'uppercase' }}>Date</span>
                        <span style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', textAlign:'right' }}>Orders</span>
                        <span style={{ fontSize:'0.68rem', color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', textAlign:'right' }}>Amount</span>
                      </div>
                      {emp.dailyBreakdown.map((d,i) => (
                        <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px', gap:8, padding:'8px 8px', background:'rgba(79,70,229,0.03)', borderRadius:8 }}>
                          <span style={{ fontSize:'0.85rem', color:'#1E1B4B', fontWeight:500 }}>
                            {new Date(d.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
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