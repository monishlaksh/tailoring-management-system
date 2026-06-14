const express               = require('express')
const cors                  = require('cors')
const dotenv                = require('dotenv')
const connectDB             = require('./config/db')
const seedClothTypes        = require('./config/seedClothTypes')
const seedAlterationOptions = require('./config/seedAlterationOptions')
const authRoutes             = require('./routes/auth')
const customerRoutes         = require('./routes/customers')
const orderRoutes            = require('./routes/orders')
const deliveryRoutes         = require('./routes/delivery')
const employeeRoutes         = require('./routes/employees')
const clothTypeRoutes        = require('./routes/clothTypes')
const alterationRoutes       = require('./routes/alterationOptions')
const allotmentRoutes        = require('./routes/allotment')

dotenv.config()
const app = express()

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    if (origin === 'http://localhost:3000' || origin.endsWith('.vercel.app'))
      return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}

app.use(cors(corsOptions))
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Mount allotment routes
app.use('/api/allotment', allotmentRoutes)

// Mount scan as a SEPARATE top-level route to avoid /:orderID conflict
app.get('/api/scan/:orderID', async (req, res) => {
  try {
    const Order     = require('./models/Order')
    const Allotment = require('./models/Allotment')

    const { orderID } = req.params
    const { stage }   = req.query
    const cleanID     = orderID.trim().toUpperCase()

    const order = await Order.findOne({ orderID: cleanID }).lean()
    if (!order)
      return res.status(404).json({
        success: false,
        message: `Order ${cleanID} not found`,
      })

    const allotment = await Allotment.findOne({ orderID: cleanID }).lean()

    const response = {
      success:      true,
      orderID:      order.orderID,
      clothType:    order.clothType,
      quantity:     order.quantity,
      measurements: order.measurements || {},
      fabricNotes:  order.fabricNotes  || '',
      stage:        stage || 'general',
      stageInfo: allotment && stage && allotment[stage]
        ? {
            status:     allotment[stage].status     || 'not_assigned',
            employeeID: allotment[stage].employeeID || '',
            notes:      allotment[stage].notes      || '',
          }
        : { status:'not_assigned', employeeID:'', notes:'' },
      allStages: allotment
        ? {
            cutting:   { status: allotment.cutting?.status   || 'not_assigned' },
            stitching: { status: allotment.stitching?.status || 'not_assigned' },
            finishing: { status: allotment.finishing?.status || 'not_assigned' },
          }
        : {
            cutting:   { status:'not_assigned' },
            stitching: { status:'not_assigned' },
            finishing: { status:'not_assigned' },
          },
    }

    if (stage === 'stitching') {
      response.alteration = order.alteration
    }

    res.json(response)
  } catch (e) {
    console.error('Scan error:', e.message)
    res.status(500).json({ success:false, message:e.message })
  }
})            

app.use(express.json({ limit: '10mb' }))

app.use('/api/auth',               authRoutes)
app.use('/api/customers',          customerRoutes)
app.use('/api/orders',             orderRoutes)
app.use('/api/delivery',           deliveryRoutes)
app.use('/api/employees',          employeeRoutes)
app.use('/api/cloth-types',        clothTypeRoutes)
app.use('/api/alteration-options', alterationRoutes)
app.use('/api/allotment',          allotmentRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '✂️ Tailoring API running' })
})

const startServer = async () => {
  await connectDB()
  await seedClothTypes()
  await seedAlterationOptions()
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => console.log(`🚀 Server → http://localhost:${PORT}`))
}

startServer()