const { AppError } = require('../utils/response')

// Mos yo'l topilmasa
const notFound = (req, res, next) => {
  next(new AppError(404, `Yo'l topilmadi: ${req.method} ${req.originalUrl}`))
}

// Barcha xatolar shu yerga keladi: server hech qachon qulab tushmaydi
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err)

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: "Noto'g'ri JSON. Qo'shtirnoq (\") va vergullarni tekshiring",
    })
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: "Yuborilgan ma'lumot juda katta" })
  }

  if (err.status) {
    const body = { success: false, message: err.message }
    if (err.errors) body.errors = err.errors
    return res.status(err.status).json(body)
  }

  console.error('Kutilmagan xato:', err)
  res.status(500).json({ success: false, message: 'Serverda xatolik yuz berdi' })
}

module.exports = { notFound, errorHandler }
