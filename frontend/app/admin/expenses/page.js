'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, Filter } from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'
import NumInput from '../../../components/NumInput'

const CATEGORIES = [
  'Rent','Electricity','Materials','Equipment',
  'Salary','Maintenance','Transport','Food','Other'
]

const CAT_COLORS = {
  Rent:        '#4F46E5', Electricity:'#D97706', Materials:'#059669',
  Equipment:   '#2563EB', Salary:     '#7C3AED', Maintenance:'#DC2626',
  Transport:   '#D97706', Food:       '#059669', Other:      '#6B7280',
}

const CAT_ICONS = {
  Rent:'🏠', Electricity:'⚡', Materials:'🧵', Equipment:'🔧',
  Salary:'💰', Maintenance:'🔨', Transport:'🚗', Food:'🍽️', Other:'📦',
}

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses]   = useState([])
  const [summary, setSummary]     = useState([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [loading, setLoading]     = useState(true)
  const [msg, setMsg]             = useState({ text:'', err:false })

  // Filters
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStart, setFilterStart]       = useState('')
  const [filterEnd, setFilterEnd]           = useState('')

  // Modal
  const [modal, setModal]     = useState(false)
  const [editData, setEditData] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    title:'', category:'Other', amount:0,
    date: new Date().toISOString().split('T')[0],
    notes:'', paidBy:'Admin', isRecurring:false,
  })

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchData()
  }, [])

  const fetchData = async (cat='', sd='', ed='') => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (cat) params.append('category', cat)
      if (sd)  params.append('startDate', sd)
      if (ed)  params.append('endDate', ed)

      const [expRes, sumRes] = await Promise.all([
        API.get(`/api/expenses?${params}`),
        API.get(`/api/expenses/summary?${params}`),
      ])
      setExpenses(expRes.data.expenses)
      setSummary(sumRes.data.summary)
      setGrandTotal(sumRes.data.grandTotal)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const applyFilter = () => fetchData(filterCategory, filterStart, filterEnd)
  const clearFilter = () => {
    setFilterCategory(''); setFilterStart(''); setFilterEnd('')
    fetchData()
  }

  const showMsg = (text, err=false) => {
    setMsg({ text, err })
    setTimeout(() => setMsg({ text:'', err:false }), 3000)
  }

  const openAdd = () => {
    setEditData(null)
    setForm({ title:'', category:'Other', amount:0, date:new Date().toISOString().split('T')[0], notes:'', paidBy:'Admin', isRecurring:false })
    setModal(true)
  }

  const openEdit = (exp) => {
    setEditData(exp)
    setForm({
      title:       exp.title,
      category:    exp.category,
      amount:      exp.amount,
      date:        new Date(exp.date).toISOString().split('T')[0],
      notes:       exp.notes || '',
      paidBy:      exp.paidBy || 'Admin',
      isRecurring: exp.isRecurring || false,
    })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { showMsg('Title required', true); return }
    if (!form.amount || form.amount <= 0) { showMsg('Valid amount required', true); return }
    setSaving(true)
    try {
      if (editData) await API.put(`/api/expenses/${editData._id}`, form)
      else          await API.post('/api/expenses', form)
      setModal(false)
      fetchData(filterCategory, filterStart, filterEnd)
      showMsg(editData ? 'Expense updated!' : 'Expense added!')
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed', true)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return
    try {
      await API.delete(`/api/expenses/${id}`)
      fetchData(filterCategory, filterStart, filterEnd)
      showMsg('Deleted')
    } catch (e) { showMsg('Failed', true) }
  }

  const inputStyle = {
    width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.9)',
    border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10,
    fontFamily:'Poppins,sans-serif', fontSize:'0.88rem', color:'#1E1B4B', outline:'none',
  }

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:1000, margin:'0 auto' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Shop Expenses</h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>Track all shop expenditures</p>
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary"
          style={{ padding:'9px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={15}/> Add Expense
        </button>
      </div>

      {msg.text && (
        <div style={{ padding:'11px 16px', marginBottom:16, borderRadius:10,
          background:msg.err?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)',
          border:`1.5px solid ${msg.err?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}`,
          color:msg.err?'#DC2626':'#059669', fontSize:'0.87rem' }}>
          {msg.err ? msg.text : `✅ ${msg.text}`}
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:20 }}>
        <div className="glass" style={{ padding:18, background:'rgba(239,68,68,0.05)', border:'1.5px solid rgba(239,68,68,0.15)' }}>
          <p style={{ fontSize:'0.7rem', color:'#6B7280', fontWeight:600, marginBottom:4 }}>TOTAL EXPENSES</p>
          <p style={{ fontSize:'1.5rem', fontWeight:800, color:'#DC2626' }}>₹{grandTotal.toLocaleString('en-IN')}</p>
        </div>
        {summary.slice(0,4).map((s,i) => (
          <div key={i} className="glass" style={{ padding:18 }}>
            <p style={{ fontSize:'0.7rem', color:'#6B7280', fontWeight:600, marginBottom:4 }}>
              {CAT_ICONS[s._id]} {s._id}
            </p>
            <p style={{ fontSize:'1.3rem', fontWeight:800, color:CAT_COLORS[s._id]||'#4F46E5' }}>
              ₹{s.total.toLocaleString('en-IN')}
            </p>
            <p style={{ fontSize:'0.7rem', color:'#9CA3AF', marginTop:2 }}>{s.count} entries</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'flex-end', gap:12, flexWrap:'wrap' }}>
        <Filter size={16} color="#9CA3AF" style={{ marginBottom:9 }}/>
        <div>
          <label className="input-label">CATEGORY</label>
          <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}
            style={{ ...inputStyle, width:160 }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">FROM</label>
          <input type="date" value={filterStart} onChange={e=>setFilterStart(e.target.value)} style={{ ...inputStyle, width:160 }} />
        </div>
        <div>
          <label className="input-label">TO</label>
          <input type="date" value={filterEnd} onChange={e=>setFilterEnd(e.target.value)} style={{ ...inputStyle, width:160 }} />
        </div>
        <button onClick={applyFilter} className="btn-primary" style={{ padding:'9px 18px', fontSize:'0.82rem' }}>Apply</button>
        {(filterCategory||filterStart||filterEnd) && (
          <button onClick={clearFilter} className="btn-ghost" style={{ padding:'9px 14px', fontSize:'0.82rem' }}>Clear</button>
        )}
      </div>

      {/* Category breakdown bar */}
      {summary.length > 0 && grandTotal > 0 && (
        <div className="glass" style={{ padding:20, marginBottom:20 }}>
          <p style={{ fontSize:'0.78rem', fontWeight:700, color:'#1E1B4B', marginBottom:12 }}>Breakdown by Category</p>
          <div style={{ display:'flex', height:12, borderRadius:999, overflow:'hidden', marginBottom:12 }}>
            {summary.map((s,i) => (
              <div key={i}
                style={{ width:`${(s.total/grandTotal)*100}%`, background:CAT_COLORS[s._id]||'#9CA3AF', transition:'width 0.4s' }}
                title={`${s._id}: ₹${s.total}`}
              />
            ))}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {summary.map((s,i) => (
              <span key={i} style={{ fontSize:'0.74rem', display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:10, height:10, borderRadius:'50%', background:CAT_COLORS[s._id]||'#9CA3AF', display:'inline-block' }}/>
                {s._id}: ₹{s.total.toLocaleString('en-IN')} ({Math.round((s.total/grandTotal)*100)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expense list */}
      {loading ? (
        <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>Loading...</p>
      ) : expenses.length === 0 ? (
        <div className="glass" style={{ textAlign:'center', padding:48 }}>
          <p style={{ fontSize:'2.5rem', marginBottom:12 }}>💸</p>
          <p style={{ color:'#6B7280', marginBottom:16 }}>No expenses recorded yet.</p>
          <button onClick={openAdd} className="btn-primary" style={{ padding:'10px 24px' }}>+ Add First Expense</button>
        </div>
      ) : (
        <div style={{ display:'grid', gap:10 }}>
          {expenses.map(exp => (
            <div key={exp._id} className="glass" style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:`${CAT_COLORS[exp.category]}18`, border:`1.5px solid ${CAT_COLORS[exp.category]}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>
                  {CAT_ICONS[exp.category]||'📦'}
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <p style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.92rem' }}>{exp.title}</p>
                    <span style={{ fontSize:'0.68rem', padding:'2px 8px', borderRadius:999, background:`${CAT_COLORS[exp.category]}18`, color:CAT_COLORS[exp.category], fontWeight:600 }}>
                      {exp.category}
                    </span>
                    {exp.isRecurring && (
                      <span style={{ fontSize:'0.65rem', padding:'2px 7px', borderRadius:999, background:'rgba(79,70,229,0.08)', color:'#4F46E5', fontWeight:600 }}>🔄 Recurring</span>
                    )}
                  </div>
                  <p style={{ fontSize:'0.75rem', color:'#6B7280' }}>
                    {new Date(exp.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
                    {exp.notes && ` · ${exp.notes}`}
                  </p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <p style={{ fontSize:'1.15rem', fontWeight:800, color:'#DC2626' }}>
                  ₹{exp.amount.toLocaleString('en-IN')}
                </p>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>openEdit(exp)}
                    style={{ padding:'6px 10px', background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:8, color:'#4F46E5', cursor:'pointer', display:'flex', alignItems:'center' }}>
                    <Edit2 size={13}/>
                  </button>
                  <button onClick={()=>handleDelete(exp._id, exp.title)}
                    style={{ padding:'6px 10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#DC2626', cursor:'pointer', display:'flex', alignItems:'center' }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(30,27,75,0.3)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div className="glass" style={{ width:'100%', maxWidth:480, padding:28, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1.05rem' }}>
                {editData ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={20}/></button>
            </div>

            <div style={{ display:'grid', gap:14 }}>
              <div>
                <label className="input-label">EXPENSE TITLE *</label>
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}
                  placeholder="e.g. Monthly Rent, Electricity Bill..." style={inputStyle} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="input-label">CATEGORY *</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">DATE *</label>
                  <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inputStyle} />
                </div>
              </div>

              <div>
                <label className="input-label">AMOUNT (₹) *</label>
                <NumInput prefix="₹" value={form.amount}
                  onChange={val=>setForm({...form,amount:val})}
                  placeholder="0"
                  style={{ border:'1.5px solid rgba(239,68,68,0.25)' }} />
              </div>

              <div>
                <label className="input-label">PAID BY</label>
                <input value={form.paidBy} onChange={e=>setForm({...form,paidBy:e.target.value})}
                  placeholder="Admin" style={inputStyle} />
              </div>

              <div>
                <label className="input-label">NOTES (OPTIONAL)</label>
                <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
                  rows={2} placeholder="Any additional details..."
                  style={{ ...inputStyle, resize:'vertical' }} />
              </div>

              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <input type="checkbox" checked={form.isRecurring}
                  onChange={e=>setForm({...form,isRecurring:e.target.checked})}
                  style={{ width:16, height:16 }} />
                <span style={{ fontSize:'0.85rem', color:'#4B5563', fontWeight:500 }}>
                  🔄 Recurring expense (monthly)
                </span>
              </label>
            </div>

            <div style={{ display:'flex', gap:10, marginTop:22 }}>
              <button onClick={()=>setModal(false)} className="btn-ghost" style={{ flex:1 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary"
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {saving ? <><div className="spinner"/>Saving...</> : <><Check size={15}/>{editData?'Update':'Add Expense'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}