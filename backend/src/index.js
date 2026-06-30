const express               = require('express')
const cors                  = require('cors')
const dotenv                = require('dotenv')
const connectDB             = require('./config/db')
const seedClothTypes        = require('./config/seedClothTypes')
const seedAlterationOptions = require('./config/seedAlterationOptions')

const authRoutes        = require('./routes/auth')
const customerRoutes    = require('./routes/customers')
const orderRoutes       = require('./routes/orders')
const deliveryRoutes    = require('./routes/delivery')
const employeeRoutes    = require('./routes/employees')
const clothTypeRoutes   = require('./routes/clothTypes')
const alterationRoutes  = require('./routes/alterationOptions')
const allotmentRoutes   = require('./routes/allotment')
const scanRoutes        = require('./routes/scan')

const salaryRoutes = require('./routes/salary')
const salesRoutes  = require('./routes/sales')
const productRoutes = require('./routes/products')

// whatsapp.js exports { router, sendWA } — we need only router here
const { router: whatsappRoutes } = require('./routes/whatsapp')

dotenv.config()
const app = express()

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    if (origin === 'http://localhost:3000' || origin.endsWith('.vercel.app'))
      return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials:    true,
  methods:        ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}

app.use(cors(corsOptions))
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin',      req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods',     'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers',     'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.use(express.json({ limit:'10mb' }))

app.use('/api/auth',               authRoutes)
app.use('/api/customers',          customerRoutes)
app.use('/api/orders',             orderRoutes)
app.use('/api/delivery',           deliveryRoutes)
app.use('/api/employees',          employeeRoutes)
app.use('/api/cloth-types',        clothTypeRoutes)
app.use('/api/alteration-options', alterationRoutes)
app.use('/api/allotment',          allotmentRoutes)
app.use('/api/scan',               scanRoutes)
app.use('/api/whatsapp',           whatsappRoutes)
app.use('/api/salary', salaryRoutes)
app.use('/api/sales',  salesRoutes)
app.use('/api/products', productRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status:'ok', message:'✂️ Tailoring API running' })
})

const startServer = async () => {
  await connectDB()
  await seedClothTypes()
  await seedAlterationOptions()
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
}

startServer()