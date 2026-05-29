const express        = require('express')
const cors           = require('cors')
const dotenv         = require('dotenv')
const connectDB      = require('./config/db')
const authRoutes     = require('./routes/auth')
const customerRoutes = require('./routes/customers')
const orderRoutes    = require('./routes/orders')
const deliveryRoutes = require('./routes/delivery')

dotenv.config()
const app = express()
connectDB()

// ── CORS — allow all Vercel deployments + localhost ──────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://tailoring-management-system-c5twaws54-tailoring-mgm.vercel.app',
]

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    // also allow ANY vercel.app subdomain for this project
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))

// Handle preflight requests for ALL routes
app.options('*', cors())

app.use(express.json({ limit: '10mb' }))

app.use('/api/auth',      authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/orders',    orderRoutes)
app.use('/api/delivery',  deliveryRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '✂️ Tailoring API running' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Server → http://localhost:${PORT}`))