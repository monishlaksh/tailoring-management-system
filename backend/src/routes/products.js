const express = require('express')
const Product = require('../models/Product')
const { protect, protectAdminOrEmployee } = require('../middleware/auth')
const router  = express.Router()

const getNextProductID = async () => {
  const last = await Product.findOne().sort({ productID:-1 }).select('productID').lean()
  if (!last || !last.productID) return 'PRD000001'
  const num  = parseInt(last.productID.replace('PRD',''), 10)
  const next = isNaN(num) ? 1 : num + 1
  let newID  = `PRD${String(next).padStart(6,'0')}`
  let exists = await Product.findOne({ productID:newID }).lean()
  let counter = next
  while (exists) {
    counter++
    newID  = `PRD${String(counter).padStart(6,'0')}`
    exists = await Product.findOne({ productID:newID }).lean()
  }
  return newID
}

// GET all products
router.get('/', protectAdminOrEmployee, async (req, res) => {
  try {
    const { search, category, lowStock } = req.query
    let query = { isActive:true }

    if (category) query.category = category
    if (search) {
      query.$or = [
        { name:       { $regex:search, $options:'i' } },
        { productID:  { $regex:search, $options:'i' } },
        { category:   { $regex:search, $options:'i' } },
      ]
    }

    let products = await Product.find(query).sort({ name:1 }).lean()

    if (lowStock === 'true') {
      products = products.filter(p => p.stock <= p.lowStockAlert)
    }

    products = products.map(p => ({
      ...p,
      revenuePerUnit: (p.customerPrice||0) - (p.purchasePrice||0),
      stockValue:     (p.stock||0) * (p.purchasePrice||0),
      isLowStock:     p.stock <= p.lowStockAlert,
    }))

    res.json({ success:true, count:products.length, products })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET summary stats — revenue based on ACTUAL SALES only
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const products = await Product.find({ isActive:true }).lean()

    const totalProducts   = products.length
    const totalStockValue = products.reduce((s,p) => s + (p.stock||0)*(p.purchasePrice||0), 0)

    // Revenue ONLY from actual sales, not unsold stock
    const totalRevenue = products.reduce((s,p) => s + (p.totalRevenue||0), 0)
    const totalUnitsSold = products.reduce((s,p) => s + (p.totalSold||0), 0)
    const totalSalesValue = products.reduce((s,p) =>
      s + (p.totalSold||0) * (p.customerPrice||0), 0)

    const lowStockCount   = products.filter(p => p.stock <= p.lowStockAlert).length
    const outOfStockCount = products.filter(p => p.stock === 0).length

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalStockValue,
        totalRevenue,       // actual profit earned from sales
        totalUnitsSold,
        totalSalesValue,    // total ₹ collected from customers
        lowStockCount,
        outOfStockCount,
      },
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET single product with sales history
router.get('/:productID', protectAdminOrEmployee, async (req, res) => {
  try {
    const product = await Product.findOne({ productID:req.params.productID })
    if (!product)
      return res.status(404).json({ success:false, message:'Product not found' })
    res.json({ success:true, product })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST create product
router.post('/', protect, async (req, res) => {
  try {
    const { name, nameTa, category, unit, purchasePrice, customerPrice, stock, lowStockAlert, notes } = req.body
    if (!name?.trim())
      return res.status(400).json({ success:false, message:'Name required' })
    if (purchasePrice === undefined || customerPrice === undefined)
      return res.status(400).json({ success:false, message:'Purchase price and customer price required' })

    const productID = await getNextProductID()
    const initialStock = parseFloat(stock) || 0

    const product = await Product.create({
      productID,
      name:          name.trim(),
      nameTa:        nameTa || '',
      category:      category || '',
      unit:          unit || 'pcs',
      purchasePrice: parseFloat(purchasePrice) || 0,
      customerPrice: parseFloat(customerPrice) || 0,
      stock:         initialStock,
      lowStockAlert: parseFloat(lowStockAlert) || 5,
      notes:         notes || '',
      history: initialStock > 0 ? [{
        type: 'purchase', quantity: initialStock, note: 'Initial stock',
      }] : [],
    })

    res.status(201).json({ success:true, message:'Product created', product })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update product details (not stock)
router.put('/:productID', protect, async (req, res) => {
  try {
    const { name, nameTa, category, unit, purchasePrice, customerPrice, lowStockAlert, notes, isActive } = req.body
    const product = await Product.findOne({ productID:req.params.productID })
    if (!product)
      return res.status(404).json({ success:false, message:'Product not found' })

    if (name)                          product.name          = name.trim()
    if (nameTa !== undefined)          product.nameTa         = nameTa
    if (category !== undefined)        product.category       = category
    if (unit)                          product.unit           = unit
    if (purchasePrice !== undefined)   product.purchasePrice  = parseFloat(purchasePrice) || 0
    if (customerPrice !== undefined)   product.customerPrice  = parseFloat(customerPrice) || 0
    if (lowStockAlert !== undefined)   product.lowStockAlert  = parseFloat(lowStockAlert) || 5
    if (notes !== undefined)           product.notes          = notes
    if (typeof isActive === 'boolean') product.isActive       = isActive

    await product.save()
    res.json({ success:true, message:'Product updated', product })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST add stock (purchase) — does NOT affect revenue
router.post('/:productID/stock/add', protect, async (req, res) => {
  try {
    const { quantity, note } = req.body
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0)
      return res.status(400).json({ success:false, message:'Valid quantity required' })

    const product = await Product.findOne({ productID:req.params.productID })
    if (!product)
      return res.status(404).json({ success:false, message:'Product not found' })

    product.stock += qty
    product.history.push({ type:'purchase', quantity:qty, note:note||'Stock added' })
    await product.save()

    res.json({ success:true, message:`Added ${qty} ${product.unit}`, product })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST SELL product — this is what generates revenue
router.post('/:productID/sell', protect, async (req, res) => {
  try {
    const { quantity, customerName, note } = req.body
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0)
      return res.status(400).json({ success:false, message:'Valid quantity required' })

    const product = await Product.findOne({ productID:req.params.productID })
    if (!product)
      return res.status(404).json({ success:false, message:'Product not found' })

    if (product.stock < qty)
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} ${product.unit} available`,
      })

    const revenueEarned = qty * (product.customerPrice - product.purchasePrice)
    const saleValue      = qty * product.customerPrice

    product.stock        -= qty
    product.totalSold     = (product.totalSold || 0) + qty
    product.totalRevenue  = (product.totalRevenue || 0) + revenueEarned

    product.history.push({
      type:         'sale',
      quantity:     -qty,
      unitPrice:    product.customerPrice,
      revenue:      revenueEarned,
      customerName: customerName || '',
      note:         note || '',
    })

    await product.save()

    res.json({
      success: true,
      message: `Sold ${qty} ${product.unit} — ₹${revenueEarned.toFixed(2)} revenue`,
      product,
      sale: { quantity:qty, saleValue, revenueEarned },
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST reduce stock without sale (e.g. damage, internal use) — no revenue
router.post('/:productID/stock/reduce', protect, async (req, res) => {
  try {
    const { quantity, note } = req.body
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0)
      return res.status(400).json({ success:false, message:'Valid quantity required' })

    const product = await Product.findOne({ productID:req.params.productID })
    if (!product)
      return res.status(404).json({ success:false, message:'Product not found' })

    if (product.stock < qty)
      return res.status(400).json({ success:false, message:`Only ${product.stock} ${product.unit} available` })

    product.stock -= qty
    product.history.push({ type:'adjustment', quantity:-qty, note:note||'Stock removed (no sale)' })
    await product.save()

    res.json({ success:true, message:`Removed ${qty} ${product.unit}`, product })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST sell multiple products at once (cart-style)
router.post('/sell-multiple', protect, async (req, res) => {
  try {
    const { items, customerName, note } = req.body
    // items = [{ productID, quantity }, ...]

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success:false, message:'No items provided' })

    // First pass — validate all items have enough stock before committing any
    const productsToUpdate = []
    for (const item of items) {
      const qty = parseFloat(item.quantity)
      if (!qty || qty <= 0)
        return res.status(400).json({ success:false, message:`Invalid quantity for ${item.productID}` })

      const product = await Product.findOne({ productID:item.productID })
      if (!product)
        return res.status(404).json({ success:false, message:`Product ${item.productID} not found` })

      if (product.stock < qty)
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} ${product.unit} available for "${product.name}"`,
        })

      productsToUpdate.push({ product, qty })
    }

    // Second pass — commit all sales
    const results = []
    let totalRevenue = 0
    let totalSaleValue = 0

    for (const { product, qty } of productsToUpdate) {
      const revenueEarned = qty * (product.customerPrice - product.purchasePrice)
      const saleValue      = qty * product.customerPrice

      product.stock        -= qty
      product.totalSold     = (product.totalSold || 0) + qty
      product.totalRevenue  = (product.totalRevenue || 0) + revenueEarned

      product.history.push({
        type:         'sale',
        quantity:     -qty,
        unitPrice:    product.customerPrice,
        revenue:      revenueEarned,
        customerName: customerName || '',
        note:         note || '',
      })

      await product.save()

      results.push({
        productID:    product.productID,
        name:         product.name,
        quantity:     qty,
        unit:         product.unit,
        saleValue,
        revenueEarned,
      })

      totalRevenue   += revenueEarned
      totalSaleValue += saleValue
    }

    res.json({
      success: true,
      message: `Sold ${results.length} product(s) — ₹${totalRevenue.toFixed(2)} total revenue`,
      items:   results,
      totalRevenue,
      totalSaleValue,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})



// DELETE (soft) product
router.delete('/:productID', protect, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productID:req.params.productID },
      { isActive:false },
      { new:true }
    )
    if (!product)
      return res.status(404).json({ success:false, message:'Product not found' })
    res.json({ success:true, message:'Product deactivated' })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router