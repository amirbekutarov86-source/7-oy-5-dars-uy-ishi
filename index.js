require('dotenv').config({ quiet: true })
const express = require('express')

const authRoutes = require('./router/auth.routes')
const productRoutes = require('./router/product.routes')
const { notFound, errorHandler } = require('./middleware/error.middleware')

const app = express()

app.set('json spaces', 2) // Postman'da chiroyli ko'rinadi
app.use(express.json({ limit: '100kb' }))

// Har bir so'rovni terminalga yozish: GET /api/products 200
app.use((req, res, next) => {
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode}`))
  next()
})

// Bosh sahifa: API haqida ma'lumot
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '4-dars API ishlayapti',
    endpoints: {
      auth: {
        'POST /api/auth/register': "ro'yxatdan o'tish (accessToken + refreshToken beradi)",
        'POST /api/auth/login': 'kirish (accessToken + refreshToken beradi)',
        'POST /api/auth/refresh': 'refreshToken bilan yangi tokenlar olish',
        'POST /api/auth/logout': 'tizimdan chiqish (token kerak)',
        'GET /api/auth/profile': 'profil (token kerak)',
        'PUT /api/auth/change-password': "parolni o'zgartirish (token kerak)",
        'GET /api/auth/users': "foydalanuvchilar ro'yxati (faqat admin)",
        'PATCH /api/auth/users/:id/role': "rolni o'zgartirish (faqat admin)",
      },
      products: {
        'GET /api/products': "ro'yxat (?search= ?category= ?minPrice= ?maxPrice= ?sort= ?order= ?page= ?limit=)",
        'GET /api/products/:id': 'bitta mahsulot',
        'POST /api/products': "qo'shish (token kerak)",
        'PUT /api/products/:id': "to'liq yangilash (egasi yoki admin)",
        'PATCH /api/products/:id': 'qisman yangilash (egasi yoki admin)',
        'DELETE /api/products/:id': "o'chirish (egasi yoki admin)",
      },
    },
  })
})

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: Math.round(process.uptime()) })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)

app.use(notFound)
app.use(errorHandler)

// ---------- Serverni xatosiz ishga tushirish ----------
const MAX_TRIES = 10 // port band bo'lsa, keyingi portlarni sinaydi
let port = Number(process.env.PORT) || 3000
let tries = 0

const server = app.listen(port)

server.on('listening', () => {
  console.log(`Server ${port}-Portda ishladi`)
  console.log(`http://localhost:${port}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && tries < MAX_TRIES) {
    console.log(`${port}-port band, ${port + 1}-port sinab ko'rilmoqda...`)
    tries++
    port++
    setTimeout(() => server.listen(port), 100)
  } else {
    console.error('Server xatosi:', err.message)
    process.exit(1)
  }
})

// Ctrl + C bosilganda portni to'g'ri bo'shatish
const shutdown = () => {
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 500)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Kutilmagan xatolar serverni o'chirib qo'ymasligi uchun
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err))
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err))
