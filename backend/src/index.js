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

app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
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