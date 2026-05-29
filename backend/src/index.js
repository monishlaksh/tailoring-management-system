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

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    if (
      origin === 'http://localhost:3000' ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}

// Apply CORS before everything else
app.use(cors(corsOptions))

// This handles preflight — must be BEFORE routes, no wildcard
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

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