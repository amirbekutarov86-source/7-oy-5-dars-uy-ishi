// Oldindan ma'lum xatolar uchun (400, 401, 403, 404, 409 ...)
class AppError extends Error {
  constructor(status, message, errors) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

// Hamma javoblar bir xil ko'rinishda qaytadi
const ok = (res, data, message = 'OK', status = 200, meta) => {
  const body = { success: true, message, data }
  if (meta) body.meta = meta
  return res.status(status).json(body)
}

const getBody = (req) => {
  const body = req.body
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, "Body JSON bo'lishi kerak (Postman: Body -> raw -> JSON)")
  }
  return body
}

const parseId = (value) => {
  if (!/^\d+$/.test(value)) throw new AppError(400, "id musbat butun son bo'lishi kerak")
  return Number(value)
}

// Parol va ichki maydonlarni javobdan olib tashlaydi
const publicUser = (user) => {
  const { password, tokenVersion, ...safe } = user
  return safe
}

module.exports = { AppError, ok, getBody, parseId, publicUser }
