'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, Search, TrendingUp, Package, AlertTriangle, ShoppingCart } from 'lucide-react'
import { adminAPI as API } from '../../../lib/api'
import NumInput from '../../../components/NumInput'

const UNITS = ['pcs','meters','kg','rolls','sets','dozens']

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({
  totalRevenue:  0,
  totalSalary:   0,
  totalExpenses: 0,
  netProfit:     0,
  chartData:     [],
})
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [msg, setMsg]           = useState({ text:'', err:false })

  // Add near other state declarations
const [cartModal, setCartModal] = useState(false)
const [cart, setCart]           = useState([]) // [{ productID, name, unit, stock, customerPrice, purchasePrice, quantity }]
const [cartCustomer, setCartCustomer] = useState('')
const [cartNote, setCartNote]   = useState('')
const [cartSaving, setCartSaving] = useState(false)
const [cartSearch, setCartSearch] = useState('')

  const [modal, setModal]       = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({
    name:'', nameTa:'', category:'', unit:'pcs',
    purchasePrice:0, customerPrice:0, stock:0, lowStockAlert:5, notes:'',
  })
  const [saving, setSaving] = useState(false)

  // Sell modal
  const [sellModal, setSellModal]   = useState(null)
  const [sellQty, setSellQty]       = useState(1)
  const [sellCustomer, setSellCustomer] = useState('')
  const [sellNote, setSellNote]     = useState('')
  const [sellSaving, setSellSaving] = useState(false)

  // Add stock modal (purchase only)
  const [addStockModal, setAddStockModal] = useState(null)
  const [addQty, setAddQty]   = useState(0)
  const [addNote, setAddNote] = useState('')
  const [addSaving, setAddSaving] = useState(false)

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

  const openCart = () => {
  setCart([])
  setCartCustomer('')
  setCartNote('')
  setCartSearch('')
  setCartModal(true)
}

const addToCart = (product) => {
  if (cart.find(c => c.productID === product.productID)) {
    showMsg('Already in cart', true)
    return
  }
  if (product.stock <= 0) {
    showMsg('Out of stock', true)
    return
  }
  setCart(prev => [...prev, {
    productID:     product.productID,
    name:          product.name,
    unit:          product.unit,
    stock:         product.stock,
    customerPrice: product.customerPrice,
    purchasePrice: product.purchasePrice,
    quantity:      1,
  }])
}

const removeFromCart = (productID) => {
  setCart(prev => prev.filter(c => c.productID !== productID))
}

const updateCartQty = (productID, qty) => {
  setCart(prev => prev.map(c =>
    c.productID === productID ? { ...c, quantity: Math.max(1, Math.min(qty, c.stock)) } : c
  ))
}

const cartTotalRevenue = cart.reduce((s,c) =>
  s + c.quantity * (c.customerPrice - c.purchasePrice), 0)
const cartTotalSaleValue = cart.reduce((s,c) =>
  s + c.quantity * c.customerPrice, 0)

const handleCartCheckout = async () => {
  if (cart.length === 0) { showMsg('Cart is empty', true); return }
  setCartSaving(true)
  try {
    const res = await API.post('/api/products/sell-multiple', {
      items: cart.map(c => ({ productID:c.productID, quantity:c.quantity })),
      customerName: cartCustomer,
      note: cartNote,
    })
    setCartModal(false)
    fetchData()
    showMsg(`✅ Sold ${res.data.items.length} products — ₹${res.data.totalRevenue.toFixed(2)} revenue earned!`)
  } catch (e) {
    showMsg(e.response?.data?.message || 'Failed', true)
  } finally { setCartSaving(false) }
}

  const showMsg = (text, err=false) => {
    setMsg({ text, err })
    setTimeout(() => setMsg({ text:'', err:false }), 3500)
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
      if (editData) await API.put(`/api/products/${editData.productID}`, form)
      else await API.post('/api/products', form)
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

  // ── Sell flow ──
  const openSellModal = (product) => {
    setSellModal(product)
    setSellQty(1)
    setSellCustomer('')
    setSellNote('')
  }

  const handleSell = async () => {
    if (!sellQty || sellQty <= 0) { showMsg('Enter valid quantity', true); return }
    if (sellQty > sellModal.stock) { showMsg(`Only ${sellModal.stock} available`, true); return }
    setSellSaving(true)
    try {
      const res = await API.post(`/api/products/${sellModal.productID}/sell`, {
        quantity: sellQty, customerName: sellCustomer, note: sellNote,
      })
      setSellModal(null)
      fetchData()
      showMsg(`✅ Sold ${sellQty} ${sellModal.unit} — ₹${res.data.sale.revenueEarned.toFixed(2)} revenue earned!`)
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed', true)
    } finally { setSellSaving(false) }
  }

  // ── Add stock (purchase) flow ──
  const openAddStockModal = (product) => {
    setAddStockModal(product)
    setAddQty(0)
    setAddNote('')
  }

  const handleAddStock = async () => {
    if (!addQty || addQty <= 0) { showMsg('Enter valid quantity', true); return }
    setAddSaving(true)
    try {
      await API.post(`/api/products/${addStockModal.productID}/stock/add`, {
        quantity: addQty, note: addNote,
      })
      setAddStockModal(null)
      fetchData()
      showMsg('Stock added!')
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed', true)
    } finally { setAddSaving(false) }
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
            <p style={{ fontSize:'0.72rem', color:'#6B7280' }}>Stock, pricing & sales revenue</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
        <button onClick={openCart} className="btn-primary"
            style={{ padding:'9px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6,
            background:'linear-gradient(135deg,#10B981,#059669)' }}>
            <ShoppingCart size={15}/> Sell Multiple
        </button>
        <button onClick={openAdd} className="btn-primary"
            style={{ padding:'9px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
            <Plus size={15}/> Add Product
        </button>
        </div>
      </div>

      {msg.text && (
        <div style={{ padding:'11px 16px', marginBottom:16, borderRadius:10,
          background:msg.err?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)',
          border:`1.5px solid ${msg.err?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}`,
          color:msg.err?'#DC2626':'#059669', fontSize:'0.87rem' }}>
          {msg.text}
        </div>
      )}

      {/* Stats — revenue based on SALES only */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
          {[
            { label:'Total Products',     value:stats.totalProducts, color:'#4F46E5', bg:'rgba(79,70,229,0.07)', icon:<Package size={20}/> },
            { label:'Stock Value (Cost)', value:`₹${stats.totalStockValue.toLocaleString('en-IN')}`, color:'#D97706', bg:'rgba(245,158,11,0.07)', icon:<TrendingUp size={20}/> },
            { label:'Revenue (from sales)',value:`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, color:'#059669', bg:'rgba(16,185,129,0.07)', icon:<ShoppingCart size={20}/> },
            { label:'Units Sold',          value:stats.totalUnitsSold, color:'#2563EB', bg:'rgba(37,99,235,0.07)', icon:<ShoppingCart size={20}/> },
            { label:'Low Stock Items',     value:stats.lowStockCount, color:'#DC2626', bg:'rgba(239,68,68,0.07)', icon:<AlertTriangle size={20}/> },
          ].map((s,i) => (
            <div key={i} className="glass" style={{ padding:'16px' }}>
              <div style={{ color:s.color, marginBottom:8 }}>{s.icon}</div>
              <p style={{ fontSize:'0.7rem', color:'#6B7280', fontWeight:500, marginBottom:4 }}>{s.label}</p>
              <p style={{ fontSize:'1.3rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize:'0.74rem', color:'#9CA3AF', marginBottom:16 }}>
        💡 Revenue counts only what's actually sold via the "Sell" button — not unsold stock value.
      </p>

      {/* Search + filter */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
          <input type="text" placeholder="Search products..." value={search}
            onChange={e=>setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft:36 }} />
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
                  <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600 }}>SOLD</p>
                  <p style={{ fontSize:'1.05rem', fontWeight:700, color:'#7C3AED' }}>{p.totalSold||0}</p>
                </div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:600 }}>REVENUE EARNED</p>
                  <p style={{ fontSize:'1.05rem', fontWeight:800, color:'#059669' }}>₹{(p.totalRevenue||0).toFixed(0)}</p>
                </div>
              </div>

              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <button onClick={()=>openSellModal(p)} disabled={p.stock<=0}
                  style={{ padding:'7px 14px', background:p.stock<=0?'#E5E7EB':'linear-gradient(135deg,#10B981,#059669)',
                    border:'none', borderRadius:8, color:p.stock<=0?'#9CA3AF':'white', fontSize:'0.78rem', fontWeight:700,
                    cursor:p.stock<=0?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif',
                    display:'flex', alignItems:'center', gap:5 }}>
                  <ShoppingCart size={13}/> Sell
                </button>
                <button onClick={()=>openAddStockModal(p)}
                  style={{ padding:'7px 12px', background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:8, color:'#4F46E5', fontSize:'0.76rem', fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                  + Purchase
                </button>
                <button onClick={()=>openEdit(p)}
                  style={{ padding:'7px 10px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, color:'#D97706', cursor:'pointer', display:'flex', alignItems:'center' }}>
                  <Edit2 size={13}/>
                </button>
                <button onClick={()=>handleDelete(p.productID, p.name)}
                  style={{ padding:'7px 10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#DC2626', cursor:'pointer', display:'flex', alignItems:'center' }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Modal */}
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
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Cotton Thread" style={inputStyle} />
                </div>
                <div>
                  <label className="input-label">பெயர் (Tamil)</label>
                  <input value={form.nameTa} onChange={e=>setForm({...form,nameTa:e.target.value})} placeholder="e.g. நூல்" style={inputStyle} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="input-label">CATEGORY</label>
                  <input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="e.g. Thread, Button" style={inputStyle} />
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
                  <NumInput prefix="₹" value={form.purchasePrice} onChange={val=>setForm({...form,purchasePrice:val})} style={{ border:'1.5px solid rgba(245,158,11,0.25)' }} />
                </div>
                <div>
                  <label className="input-label">CUSTOMER PRICE (₹) *</label>
                  <NumInput prefix="₹" value={form.customerPrice} onChange={val=>setForm({...form,customerPrice:val})} style={{ border:'1.5px solid rgba(37,99,235,0.25)' }} />
                </div>
              </div>
              <div style={{ padding:'10px 14px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10 }}>
                <p style={{ fontSize:'0.82rem', color:'#059669', fontWeight:600 }}>
                  Revenue per unit sold: ₹{(form.customerPrice - form.purchasePrice).toFixed(2)}
                </p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="input-label">{editData ? 'STOCK (use Purchase/Sell to change)' : 'INITIAL STOCK'}</label>
                  <NumInput value={form.stock} onChange={val=>setForm({...form,stock:val})} disabled={!!editData} style={{ border:'1.5px solid rgba(79,70,229,0.2)', opacity:editData?0.6:1 }} />
                </div>
                <div>
                  <label className="input-label">LOW STOCK ALERT AT</label>
                  <NumInput value={form.lowStockAlert} onChange={val=>setForm({...form,lowStockAlert:val})} style={{ border:'1.5px solid rgba(239,68,68,0.2)' }} />
                </div>
              </div>
              <div>
                <label className="input-label">NOTES</label>
                <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} style={{ ...inputStyle, resize:'vertical' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24 }}>
              <button onClick={()=>setModal(false)} className="btn-ghost" style={{ flex:1 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {saving ? <><div className="spinner"/>Saving...</> : <><Check size={16}/>{editData?'Update':'Add Product'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELL MULTIPLE (Cart) Modal */}
        {cartModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(30,27,75,0.3)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
            <div className="glass" style={{ width:'100%', maxWidth:680, padding:28, maxHeight:'88vh', overflowY:'auto' }}>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1.1rem', display:'flex', alignItems:'center', gap:8 }}>
                <ShoppingCart size={19} color="#059669"/> Sell Multiple Products
                </h2>
                <button onClick={()=>setCartModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>
                <X size={20}/>
                </button>
            </div>

            {/* Product picker */}
            <div style={{ marginBottom:16 }}>
                <label className="input-label">SEARCH & ADD PRODUCTS</label>
                <div style={{ position:'relative', marginBottom:8 }}>
                <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
                <input type="text" placeholder="Search products to add..." value={cartSearch}
                    onChange={e=>setCartSearch(e.target.value)}
                    style={{ width:'100%', padding:'10px 14px 10px 36px', background:'rgba(255,255,255,0.9)',
                    border:'1.5px solid rgba(16,185,129,0.25)', borderRadius:10, fontFamily:'Poppins,sans-serif',
                    fontSize:'0.88rem', color:'#1E1B4B', outline:'none' }} />
                </div>

                {cartSearch && (
                <div style={{ maxHeight:160, overflowY:'auto', border:'1px solid rgba(79,70,229,0.1)', borderRadius:10, background:'rgba(255,255,255,0.6)' }}>
                    {products
                    .filter(p => p.stock > 0 &&
                        (p.name.toLowerCase().includes(cartSearch.toLowerCase()) ||
                        p.productID.toLowerCase().includes(cartSearch.toLowerCase())) &&
                        !cart.find(c => c.productID === p.productID))
                    .slice(0, 8)
                    .map(p => (
                        <div key={p.productID} onClick={() => { addToCart(p); setCartSearch('') }}
                        style={{ padding:'10px 14px', cursor:'pointer', display:'flex',
                            justifyContent:'space-between', alignItems:'center',
                            borderBottom:'1px solid rgba(79,70,229,0.06)' }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <div>
                            <p style={{ fontSize:'0.85rem', fontWeight:600, color:'#1E1B4B' }}>{p.name}</p>
                            <p style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>{p.stock} {p.unit} available · ₹{p.customerPrice}/{p.unit}</p>
                        </div>
                        <Plus size={16} color="#059669" />
                        </div>
                    ))}
                    {products.filter(p => p.stock > 0 &&
                    (p.name.toLowerCase().includes(cartSearch.toLowerCase()) ||
                    p.productID.toLowerCase().includes(cartSearch.toLowerCase())) &&
                    !cart.find(c => c.productID === p.productID)).length === 0 && (
                    <p style={{ padding:'14px', fontSize:'0.82rem', color:'#9CA3AF', textAlign:'center' }}>
                        No matching products with stock available.
                    </p>
                    )}
                </div>
                )}
            </div>

            {/* Cart items */}
            <div style={{ marginBottom:16 }}>
                <label className="input-label">CART ({cart.length} item{cart.length!==1?'s':''})</label>
                {cart.length === 0 ? (
                <div style={{ padding:'30px', textAlign:'center', background:'rgba(79,70,229,0.03)', borderRadius:10, border:'1.5px dashed rgba(79,70,229,0.15)' }}>
                    <p style={{ color:'#9CA3AF', fontSize:'0.85rem' }}>🛒 Cart is empty. Search and add products above.</p>
                </div>
                ) : (
                <div style={{ display:'grid', gap:8 }}>
                    {cart.map(item => (
                    <div key={item.productID} style={{ display:'grid',
                        gridTemplateColumns:'1fr 90px 90px auto', gap:10, alignItems:'center',
                        padding:'10px 14px', background:'rgba(16,185,129,0.04)',
                        border:'1px solid rgba(16,185,129,0.15)', borderRadius:10 }}>
                        <div>
                        <p style={{ fontSize:'0.85rem', fontWeight:600, color:'#1E1B4B' }}>{item.name}</p>
                        <p style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>
                            Max {item.stock} {item.unit} · ₹{item.customerPrice}/{item.unit}
                        </p>
                        </div>
                        <input type="number" min="1" max={item.stock} value={item.quantity}
                        onChange={e => updateCartQty(item.productID, parseFloat(e.target.value)||1)}
                        style={{ width:'100%', padding:'7px 10px', background:'white',
                            border:'1.5px solid rgba(16,185,129,0.25)', borderRadius:8,
                            fontFamily:'Poppins,sans-serif', fontSize:'0.85rem', textAlign:'center', outline:'none' }} />
                        <p style={{ fontSize:'0.85rem', fontWeight:700, color:'#059669', textAlign:'right' }}>
                        ₹{(item.quantity*(item.customerPrice-item.purchasePrice)).toFixed(0)}
                        </p>
                        <button onClick={()=>removeFromCart(item.productID)}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', display:'flex' }}>
                        <X size={16}/>
                        </button>
                    </div>
                    ))}
                </div>
                )}
            </div>

            {cart.length > 0 && (
                <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                    <div>
                    <label className="input-label">CUSTOMER NAME (OPTIONAL)</label>
                    <input value={cartCustomer} onChange={e=>setCartCustomer(e.target.value)}
                        placeholder="Walk-in or name"
                        style={{ width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.9)',
                        border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10,
                        fontFamily:'Poppins,sans-serif', fontSize:'0.88rem', outline:'none' }} />
                    </div>
                    <div>
                    <label className="input-label">NOTE (OPTIONAL)</label>
                    <input value={cartNote} onChange={e=>setCartNote(e.target.value)}
                        placeholder="e.g. With order ORD000012"
                        style={{ width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.9)',
                        border:'1.5px solid rgba(79,70,229,0.2)', borderRadius:10,
                        fontFamily:'Poppins,sans-serif', fontSize:'0.88rem', outline:'none' }} />
                    </div>
                </div>

                {/* Totals */}
                <div style={{ padding:'14px 16px', background:'rgba(79,70,229,0.05)', borderRadius:12, marginBottom:18 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:'0.85rem', color:'#6B7280' }}>Total sale value:</span>
                    <span style={{ fontSize:'0.9rem', fontWeight:700, color:'#2563EB' }}>
                        ₹{cartTotalSaleValue.toLocaleString('en-IN')}
                    </span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'0.85rem', color:'#6B7280' }}>Total revenue earned:</span>
                    <span style={{ fontSize:'1.05rem', fontWeight:800, color:'#059669' }}>
                        ₹{cartTotalRevenue.toLocaleString('en-IN')}
                    </span>
                    </div>
                </div>

                <button onClick={handleCartCheckout} disabled={cartSaving}
                    style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#10B981,#059669)',
                    color:'white', border:'none', borderRadius:12, fontFamily:'Poppins,sans-serif',
                    fontWeight:700, fontSize:'0.92rem', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    {cartSaving
                    ? <><div className="spinner"/>Processing sale...</>
                    : <><ShoppingCart size={17}/>Checkout — Sell {cart.length} Product{cart.length!==1?'s':''}</>}
                </button>
                </>
            )}
            </div>
        </div>
        )}

      {/* SELL Modal */}
      {sellModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(30,27,75,0.3)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div className="glass" style={{ width:'100%', maxWidth:420, padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1.05rem', display:'flex', alignItems:'center', gap:8 }}>
                <ShoppingCart size={18} color="#059669"/> Sell Product
              </h2>
              <button onClick={()=>setSellModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>
                <X size={18}/>
              </button>
            </div>

            <div style={{ padding:'12px 14px', background:'rgba(16,185,129,0.05)', borderRadius:10, marginBottom:16 }}>
              <p style={{ fontWeight:700, color:'#1E1B4B', fontSize:'0.92rem' }}>{sellModal.name}</p>
              <p style={{ fontSize:'0.78rem', color:'#6B7280' }}>
                Available: <strong>{sellModal.stock} {sellModal.unit}</strong> · Price: ₹{sellModal.customerPrice}/{sellModal.unit}
              </p>
            </div>

            <label className="input-label">QUANTITY *</label>
            <NumInput value={sellQty} onChange={setSellQty} min={1}
              style={{ marginBottom:14, border:'1.5px solid rgba(16,185,129,0.25)' }} />

            <label className="input-label">CUSTOMER NAME (OPTIONAL)</label>
            <input value={sellCustomer} onChange={e=>setSellCustomer(e.target.value)}
              placeholder="Walk-in customer or name" style={{ ...inputStyle, marginBottom:14 }} />

            <label className="input-label">NOTE (OPTIONAL)</label>
            <input value={sellNote} onChange={e=>setSellNote(e.target.value)}
              placeholder="e.g. Sold with order ORD000012" style={{ ...inputStyle, marginBottom:16 }} />

            {/* Preview */}
            <div style={{ padding:'12px 14px', background:'rgba(79,70,229,0.04)', borderRadius:10, marginBottom:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:'0.8rem', color:'#6B7280' }}>Sale value:</span>
                <span style={{ fontSize:'0.85rem', fontWeight:700, color:'#2563EB' }}>
                  ₹{(sellQty * sellModal.customerPrice).toFixed(2)}
                </span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:'0.8rem', color:'#6B7280' }}>Revenue earned:</span>
                <span style={{ fontSize:'0.9rem', fontWeight:800, color:'#059669' }}>
                  ₹{(sellQty * (sellModal.customerPrice - sellModal.purchasePrice)).toFixed(2)}
                </span>
              </div>
            </div>

            <button onClick={handleSell} disabled={sellSaving}
              style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#10B981,#059669)',
                color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif',
                fontWeight:700, fontSize:'0.9rem', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {sellSaving ? <><div className="spinner"/>Processing...</> : <><ShoppingCart size={16}/>Confirm Sale</>}
            </button>
          </div>
        </div>
      )}

      {/* ADD STOCK (Purchase) Modal */}
      {addStockModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(30,27,75,0.3)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div className="glass" style={{ width:'100%', maxWidth:400, padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontWeight:700, color:'#1E1B4B', fontSize:'1.05rem' }}>+ Add Purchase Stock</h2>
              <button onClick={()=>setAddStockModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>
                <X size={18}/>
              </button>
            </div>
            <p style={{ fontSize:'0.85rem', color:'#6B7280', marginBottom:16 }}>
              {addStockModal.name} — Current: <strong>{addStockModal.stock} {addStockModal.unit}</strong>
            </p>
            <label className="input-label">QUANTITY TO ADD *</label>
            <NumInput value={addQty} onChange={setAddQty}
              style={{ marginBottom:14, border:'1.5px solid rgba(79,70,229,0.2)' }} />
            <label className="input-label">NOTE</label>
            <input value={addNote} onChange={e=>setAddNote(e.target.value)}
              placeholder="e.g. Purchased from supplier" style={{ ...inputStyle, marginBottom:20 }} />
            <button onClick={handleAddStock} disabled={addSaving}
              style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#4F46E5,#6366F1)',
                color:'white', border:'none', borderRadius:10, fontFamily:'Poppins,sans-serif',
                fontWeight:700, fontSize:'0.88rem', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {addSaving ? <><div className="spinner"/>Saving...</> : <><Plus size={15}/>Add Stock</>}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}