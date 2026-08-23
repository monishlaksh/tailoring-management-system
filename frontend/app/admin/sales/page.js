'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'

export default function SalesPage() {
  const router = useRouter()
  const canvasRef = useRef(null)
  const chartInstance = useRef(null)
  const scriptLoaded = useRef(false)

  const [period, setPeriod]   = useState('daily')
  const [data, setData]       = useState([])
  const [totals, setTotals]   = useState({ sales:0, expenses:0, profit:0, orders:0 })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Load Chart.js once
  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }

    if (window.Chart) {
      scriptLoaded.current = true
      fetchData()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    script.async = true
    script.onload = () => {
      scriptLoaded.current = true
      fetchData()
    }
    script.onerror = () => setError('Failed to load chart library')
    document.head.appendChild(script)
  }, [])

  // Refetch when period changes
  useEffect(() => {
    if (scriptLoaded.current) fetchData()
  }, [period])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await API.get(`/api/sales?period=${period}`)
      setData(res.data.data)
      setTotals(res.data.totals)
      // Wait a tick for canvas to be in DOM after loading=false render
      setTimeout(() => renderChart(res.data.data), 50)
    } catch (e) {
      setError('Failed to load sales data')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Replace renderChart function:
const renderChart = (chartData) => {
  if (!window.Chart || !canvasRef.current) return
  if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null }

  chartInstance.current = new window.Chart(canvasRef.current, {
    type: 'bar',
    data: {
      labels: chartData.map(d => formatPeriodLabel(d.period)),
      datasets: [
        {
          label: 'Sales',
          data:  chartData.map(d => d.sales),
          backgroundColor: '#2a78d6',
          borderRadius: 4, maxBarThickness: 22,
        },
        {
          label: 'Salary Cost',
          data:  chartData.map(d => d.salaryCost),
          backgroundColor: '#e34948',
          borderRadius: 4, maxBarThickness: 22,
        },
        {
          label: 'Shop Expenses',
          data:  chartData.map(d => d.shopExpenses),
          backgroundColor: '#F59E0B',
          borderRadius: 4, maxBarThickness: 22,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display:false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}`,
          },
        },
      },
      scales: {
        x: { grid:{ display:false }, ticks:{ autoSkip:false, maxRotation:45, font:{ size:11 } } },
        y: {
          beginAtZero: true,
          grid:{ color:'#e1e0d9' },
          ticks:{ callback:v=>'₹'+v.toLocaleString('en-IN'), font:{ size:11 } },
        },
      },
    },
  })
}

{/* Summary cards */}
<div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:24 }}>
  {[
    { label:'Total Sales',    value:`₹${(totals.sales||0).toLocaleString('en-IN')}`,        color:'#2a78d6', bg:'rgba(42,120,214,0.07)'  },
    { label:'Salary Cost',    value:`₹${(totals.salaryCost||0).toLocaleString('en-IN')}`,   color:'#e34948', bg:'rgba(227,73,72,0.07)'   },
    { label:'Shop Expenses',  value:`₹${(totals.shopExpenses||0).toLocaleString('en-IN')}`, color:'#F59E0B', bg:'rgba(245,158,11,0.07)'  },
    { label:'Net Profit',     value:`₹${(totals.profit||0).toLocaleString('en-IN')}`,       color:'#059669', bg:'rgba(16,185,129,0.07)'  },
    { label:'Total Orders',   value:totals.orders||0,                                         color:'#7C3AED', bg:'rgba(124,58,237,0.07)'  },
  ].map((s,i) => (
    <div key={i} className="glass" style={{ padding:'16px', background:s.bg }}>
      <p style={{ fontSize:'0.7rem', color:'#6B7280', fontWeight:500, marginBottom:4 }}>{s.label}</p>
      <p style={{ fontSize:'1.3rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</p>
    </div>
  ))}
</div>
    {/* Legend */}
<div style={{ display:'flex', gap:16, marginBottom:12, fontSize:'0.8rem', color:'#6B7280', flexWrap:'wrap' }}>
  {[
    { color:'#2a78d6', label:'Sales (Order revenue)'  },
    { color:'#e34948', label:'Salary Cost'            },
    { color:'#F59E0B', label:'Shop Expenses'          },
  ].map((l,i) => (
    <span key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
      <span style={{ width:11, height:11, borderRadius:3, background:l.color, flexShrink:0 }}/>
      {l.label}
    </span>
  ))}
</div>
  const formatPeriodLabel = (p) => {
    try {
      if (period === 'daily') {
        return new Date(p).toLocaleDateString('en-IN', { day:'numeric', month:'short' })
      } else if (period === 'weekly') {
        return p.replace(/^\d{4}-/, '') // "W26"
      } else {
        const [y,m] = p.split('-')
        return new Date(parseInt(y), parseInt(m)-1).toLocaleDateString('en-IN', { month:'short', year:'2-digit' })
      }
    } catch { return p }
  }

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:960, margin:'0 auto' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Sales vs Expenses</h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>Revenue vs employee salary payouts</p>
          </div>
        </div>

        {/* Period filter — ONLY this, no date range inputs */}
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
        {period === 'daily'   && 'Showing last 14 days'}
        {period === 'weekly'  && 'Showing last 12 weeks'}
        {period === 'monthly' && 'Showing last 12 months'}
      </p>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:16, color:'#DC2626', fontSize:'0.85rem' }}>
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Sales',    value:`₹${totals.sales.toLocaleString('en-IN')}`,    color:'#2a78d6', bg:'rgba(42,120,214,0.07)' },
          { label:'Total Expenses', value:`₹${totals.totalExpenses.toLocaleString('en-IN')}`, color:'#e34948', bg:'rgba(227,73,72,0.07)' },
          { label:'Net Profit',     value:`₹${totals.profit.toLocaleString('en-IN')}`,   color:'#059669', bg:'rgba(16,185,129,0.07)' },
          { label:'Total Orders',   value:totals.orders,                                  color:'#D97706', bg:'rgba(245,158,11,0.07)' },
        ].map((s,i) => (
          <div key={i} className="glass" style={{ padding:'16px' }}>
            <p style={{ fontSize:'0.7rem', color:'#6B7280', fontWeight:500, marginBottom:4 }}>{s.label}</p>
            <p style={{ fontSize:'1.3rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, marginBottom:12, fontSize:'0.8rem', color:'#6B7280' }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:11, height:11, borderRadius:3, background:'#2a78d6' }}/>
          Sales (Order revenue)
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:11, height:11, borderRadius:3, background:'#e34948' }}/>
          Expenses (Employee salary)
        </span>
      </div>

      {/* Chart — canvas ALWAYS rendered, never conditionally removed */}
      <div className="glass" style={{ padding:24 }}>
        {loading && (
          <p style={{ textAlign:'center', color:'#9CA3AF', padding:'20px 0' }}>Loading chart...</p>
        )}
        {!loading && data.length === 0 && (
          <p style={{ textAlign:'center', color:'#9CA3AF', padding:'20px 0' }}>No data for this period.</p>
        )}
        <div style={{ position:'relative', width:'100%', height:380, display: loading ? 'none' : 'block' }}>
          <canvas ref={canvasRef} role="img"
            aria-label={`Bar chart comparing sales and expenses, ${period} view`}>
            Sales vs expenses chart
          </canvas>
        </div>
      </div>
    </main>
  )
}