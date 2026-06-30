'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, Search, TrendingUp, Package, AlertTriangle } from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'
import NumInput from '../../../components/NumInput'

const UNITS = ['pcs','meters','kg','rolls','sets','dozens']

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [msg, setMsg]           = useState({ text:'', err:false })

  // Modal states
  const [modal, setModal]       = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({
    name:'', nameTa:'', category:'', unit:'pcs',
    purchasePrice:0, customerPrice:0, stock:0, lowStockAlert:5, notes:'',
  })
  const [saving, setSaving] = useState(false)

  // Stock adjustment modal
  const [stockModal, setStockModal] = useState(null) // { product, type }
  const [stockQty, setStockQty]     = useState(0)
  const [stockNote, setStockNote]   = useState('')
  const [stockSaving, setStockSaving] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [prodRes, statsRes] = await Promise.all([
        API.get('/api/products'),
        API.get('/api/products/stats/summary'),
      ])
      setProducts(prodRes.data.products)
      setStats(statsRes.data.stats)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const showMsg = (text, err=false) => {
    setMsg({ text, err })
    setTimeout(() => setMsg({ text:'', err:false }), 3000)
  }

  const openAdd = () => {
    setEditData(null)
    setForm({ name:'', nameTa:'', category:'', unit:'pcs', purchasePrice:0, customerPrice:0, stock:0, lowStockAlert:5, notes:'' })
    setModal(true)
  }

  const openEdit = (p) => {
    setEditData(p)
    setForm({
      name:p.name, nameTa:p.nameTa||'', category:p.category||'', unit:p.unit||'pcs',
      purchasePrice:p.purchasePrice||0, customerPrice:p.customerPrice||0,
      stock:p.stock||0, lowStockAlert:p.lowStockAlert||5, notes:p.notes||'',
    })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { showMsg('Name required', true); return }
    setSaving(true)
    try {
      if (editData) {
        await API.put(`/api/products/${editData.productID}`, form)
      } else {
        await API.post('/api/products', form)
      }
      setModal(false)
      fetchData()
      showMsg(editData ? 'Product updated!' : 'Product added!')
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed', true)
    } finally { setSaving(false) }
  }

  const handleDelete = async (productID, name) => {
    if (!confirm(`Remove "${name}"?`)) return
    try {
      await API.delete(`/api/products/${productID}`)
      fetchData()
      showMsg('Product removed')
    } catch (e) { showMsg('Failed', true) }
  }

  const openStockModal = (product, type) => {
    setStockModal({ product, type })
    setStockQty(0)
    setStockNote('')
  }

  const handleStockUpdate = async () => {
    if (!stockQty || stockQty <= 0) { showMsg('Enter valid quantity', true); return }
    setStockSaving(true)
    try {
      const endpoint = stockModal.type === 'add' ? 'add' : 'reduce'
      await API.post(`/api/products/${stockModal.product.productID}/stock/${endpoint}`, {
        quantity: stockQty, note: stockNote,
      })
      setStockModal(null)
      fetchData()
      showMsg(`Stock ${stockModal.type === 'add' ? 'added' : 'reduced'}!`)
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed', true)
    } finally { setStockSaving(false) }
  }

  const filtered = products.filter(p => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.productID.toLowerCase().includes(search.toLowerCase()) ||
      (p.category||'').toLowerCase().includes(search.toLowerCase())
    const matchesLowStock = !filterLowStock || p.isLowStock
    return matchesSearch && matchesLowStock
  })

  const inputStyle = {
    width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.9)',
    border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10,
    fontFamily:'Poppins,sans-serif', fontSize:'0.88rem', color:'#1E1B4B', outline:'none',
  }

  return (
    <main style={{ minHeight:'100vh', padding:'24px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div className="glass" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', display:'flex' }}>
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:700, color:'#1E1B4B' }}>Product Management</h1>
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>Stock, pricing & revenue tracking</p>
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ padding:'9px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={15}/> Add Product
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

      {/* Stats */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
          {[
            { label:'Total Products',    value:stats.totalProducts, color:'#4F46E5', bg:'rgba(79,70,229,0.07)', icon:<Package size={20}/> },
            { label:'Stock Value (Cost)',value:`₹${stats.totalStockValue.toLocaleString('en-IN')}`, color:'#D97706', bg:'rgba(245,158,11,0.07)', icon:<TrendingUp size={20}/> },
            { label:'Potential Revenue', value:`₹${stats.totalPotentialRevenue.toLocaleString('en-IN')}`, color:'#059669', bg:'rgba(16,185,129,0.07)', icon:<TrendingUp size={20}/> },
            { label:'Low Stock Items',   value:stats.lowStockCount, color:'#DC2626', bg:'rgba(239,68,68,0.07)', icon:<AlertTriangle size={20}/> },
          ].map((s,i) => (
            <div key={i} className="glass" style={{ padding:'16px' }}>
              <div style={{ color:s.color, marginBottom:8 }}>{s.icon}</div>
              <p style={{ fontSize:'0.7rem', color:'#6B7280', fontWeight:500, marginBottom:4 }}>{s.label}</p>
              <p style={{ fontSize:'1.3rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + filter */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
          <input type="text" placeholder="Search products..." value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft:36 }} />
        </div>
        <button onClick={()=>setFilterLowStock(!filterLowStock)}
          style={{ padding:'10px 18px', borderRadius:10,
            border:`1.5px solid ${filterLowStock?'#DC2626':'rgba(79,70,229,0.2)'}`,
            background: filterLowStock?'rgba(239,68,68,0.08)':'white',
            color: filterLowStock?'#DC2626':'#6B7280',
            fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:'0.82rem', cursor:'pointer',
            display:'flex', alignItems:'center', gap:6 }}>
          <AlertTriangle size={14}/> Low Stock Only
        </button>
      </div>

      {/* Products table */}
      {loading ? (
        <p style={{ textAlign:'center', color:'#9CA3AF', padding:'40px 0' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ textAlign:'center', padding:48 }}>
          <p style={{ fontSize:'2.5rem', marginBottom:12 }}>📦</p>
          <p style={{ color:'#6B7280', marginBottom:16 }}>No products found.</p>
          <button onClick={openAdd} className="btn-primary" style={{ padding:'10px 24px' }}>+ Add First Product</button>
        </div>
      ) : (
        <div style={{ display:'grid', gap:10 }}>
          {filtered.map(p => (
            <div key={p.productID} className="glass" style={{
              padding:'16px 20px', display:'flex', alignItems:'center',
              justifyContent:'space-between', flexWrap:'wrap', gap:14,
              border: p.isLowStock ? '1.5px solid rgba(239,68,68,0.25)' : '1.5px solid rgba(255,255,255,0.8)',
            }}>
              {/* Left — product info */}
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                  <p style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.92rem' }}>{p.name}</p>
                  {p.nameTa && <span style={{ fontSize:'0.78rem', color:'#6B7280' }}>{p.nameTa}</span>}
                  {p.category && (
                    <span style={{ fontSize:'0.68rem', padding:'2px 8px', borderRadius:999, background:'rgba(79,70,229,0.08)', color:'#4F46E5', fontWeight:600 }}>
                      {p.category}
                    </span>
                  )}
                  {p.isLowStock && (
                    <span style={{ fontSize:'0.68rem', padding:'2px 8px', borderRadius:999, background:'rgba(239,68,68,0.1)', color:'#DC2626', fontWeight:700 }}>
                      ⚠️ Low Stock
                    </span>
                  )}
                </div>
                <p style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>{p.productID}</p>
              </div>

              {/* Middle — pricing */}
              <div style={{ display:'flex', gap:18, flexWrap:'wrap' }}>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600 }}>STOCK</p>
                  <p style={{ fontSize:'1.05rem', fontWeight:800, color:p.isLowStock?'#DC2626':'#1E1B4B' }}>
                    {p.stock} <span style={{ fontSize:'0.68rem', fontWeight:500, color:'#9CA3AF' }}>{p.unit}</span>
                  </p>
                </div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600 }}>PURCHASE</p>
                  <p style={{ fontSize:'1.05rem', fontWeight:700, color:'#D97706' }}>₹{p.purchasePrice}</p>
                </div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600 }}>CUST. PRICE</p>
                  <p style={{ fontSize:'1.05rem', fontWeight:700, color:'#2563EB' }}>₹{p.customerPrice}</p>
                </div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600 }}>REVENUE/UNIT</p>
                  <p style={{ fontSize:'1.05rem', fontWeight:800, color:'#059669' }}>₹{p.revenuePerUnit}</p>
                </div>
              </div>

              {/* Right — actions */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <button onClick={()=>openStockModal(p,'add')}
                  style={{ padding:'6px 12px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, color:'#059669', fontSize:'0.76rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                  + Stock
                </button>
                <button onClick={()=>openStockModal(p,'reduce')}
                  style={{ padding:'6px 12px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, color:'#D97706', fontSize:'0.76rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                  − Stock
                </button>
                <button onClick={()=>openEdit(p)}
                  style={{ padding:'6px 10px', background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:8, color:'#4F46E5', cursor:'pointer', display:'flex', alignItems:'center' }}>
                  <Edit2 size={13}/>
                </button>
                <button onClick={()=>handleDelete(p.productID, p.name)}
                  style={{ padding:'6px 10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#DC2626', cursor:'pointer', display:'flex', alignItems:'center' }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(30,27,75,0.3)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div className="glass" style={{ width:'100%', maxWidth:540, padding:32, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1.1rem' }}>
                {editData ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>
                <X size={20}/>
              </button>
            </div>

            <div style={{ display:'grid', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="input-label">NAME (English) *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
                    placeholder="e.g. Cotton Thread" style={inputStyle} />
                </div>
                <div>
                  <label className="input-label">பெயர் (Tamil)</label>
                  <input value={form.nameTa} onChange={e=>setForm({...form,nameTa:e.target.value})}
                    placeholder="e.g. நூல்" style={inputStyle} />
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="input-label">CATEGORY</label>
                  <input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                    placeholder="e.g. Thread, Button, Fabric" style={inputStyle} />
                </div>
                <div>
                  <label className="input-label">UNIT</label>
                  <select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} style={inputStyle}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="input-label">PURCHASE PRICE (₹) *</label>
                  <NumInput prefix="₹" value={form.purchasePrice}
                    onChange={val=>setForm({...form,purchasePrice:val})}
                    style={{ border:'1.5px solid rgba(245,158,11,0.25)' }} />
                </div>
                <div>
                  <label className="input-label">CUSTOMER PRICE (₹) *</label>
                  <NumInput prefix="₹" value={form.customerPrice}
                    onChange={val=>setForm({...form,customerPrice:val})}
                    style={{ border:'1.5px solid rgba(37,99,235,0.25)' }} />
                </div>
              </div>

              {/* Revenue preview */}
              <div style={{ padding:'10px 14px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10 }}>
                <p style={{ fontSize:'0.82rem', color:'#059669', fontWeight:600 }}>
                  Revenue per unit: ₹{(form.customerPrice - form.purchasePrice).toFixed(2)}
                </p>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="input-label">
                    {editData ? 'CURRENT STOCK (use +/- buttons to change)' : 'INITIAL STOCK'}
                  </label>
                  <NumInput value={form.stock}
                    onChange={val=>setForm({...form,stock:val})}
                    disabled={!!editData}
                    style={{ border:'1.5px solid rgba(79,70,229,0.2)', opacity:editData?0.6:1 }} />
                </div>
                <div>
                  <label className="input-label">LOW STOCK ALERT AT</label>
                  <NumInput value={form.lowStockAlert}
                    onChange={val=>setForm({...form,lowStockAlert:val})}
                    style={{ border:'1.5px solid rgba(239,68,68,0.2)' }} />
                </div>
              </div>

              <div>
                <label className="input-label">NOTES</label>
                <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
                  rows={2} placeholder="Any additional notes..."
                  style={{ ...inputStyle, resize:'vertical' }} />
              </div>
            </div>

            <div style={{ display:'flex', gap:10, marginTop:24 }}>
              <button onClick={()=>setModal(false)} className="btn-ghost" style={{ flex:1 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary"
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {saving ? <><div className="spinner"/>Saving...</> : <><Check size={16}/>{editData?'Update':'Add Product'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {stockModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(30,27,75,0.3)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div className="glass" style={{ width:'100%', maxWidth:420, padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1.05rem' }}>
                {stockModal.type === 'add' ? '+ Add Stock' : '− Reduce Stock'}
              </h2>
              <button onClick={()=>setStockModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>
                <X size={18}/>
              </button>
            </div>

            <p style={{ fontSize:'0.85rem', color:'#6B7280', marginBottom:16 }}>
              {stockModal.product.name} — Current: <strong>{stockModal.product.stock} {stockModal.product.unit}</strong>
            </p>

            <label className="input-label">QUANTITY *</label>
            <NumInput value={stockQty} onChange={setStockQty} placeholder="0"
              style={{ marginBottom:14, border:'1.5px solid rgba(79,70,229,0.2)' }} />

            <label className="input-label">NOTE (OPTIONAL)</label>
            <input value={stockNote} onChange={e=>setStockNote(e.target.value)}
              placeholder={stockModal.type==='add' ? 'e.g. Purchased from supplier' : 'e.g. Used in order ORD000012'}
              style={{ ...inputStyle, marginBottom:20 }} />

            <button onClick={handleStockUpdate} disabled={stockSaving}
              style={{ width:'100%', padding:'12px',
                background: stockModal.type==='add'
                  ? 'linear-gradient(135deg,#10B981,#059669)'
                  : 'linear-gradient(135deg,#F59E0B,#D97706)',
                color:'white', border:'none', borderRadius:10,
                fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'0.88rem', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {stockSaving ? <><div className="spinner"/>Saving...</> :
                stockModal.type === 'add' ? <><Plus size={15}/>Add Stock</> : <>− Reduce Stock</>}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}