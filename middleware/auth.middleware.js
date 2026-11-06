const { read_file } = require('../fs/file-sys')
const { AppError, publicUser } = require('../utils/response')
const { verifyAccess } = require('../utils/jwt')

// Himoyalangan yo'llar uchun: Authorization: Bearer <accessToken>
const verifyToken = (req, res, next) => {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')

  if (type !== 'Bearer' || !token) {
    throw new AppError(401, 'Token kerak (Authorization: Bearer <accessToken>)')
  }

  let payload
  try {
    payload = verifyAccess(token)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError(401, 'Token muddati tugagan. /api/auth/refresh orqali yangilang yoki qaytadan login qiling')
    }
    throw new AppError(401, "Token noto'g'ri")
  }

  // logout qilingan token
  if (read_file('blacklist.json').some((b) => b.jti === payload.jti)) {
    throw new AppError(401, 'Token bekor qilingan (logout qilingan), qaytadan login qiling')
  }

  const user = read_file('auth.json').find((u) => u.id === payload.id)
  if (!user) throw new AppError(401, 'Foydalanuvchi topilmadi, qaytadan login qiling')

  // parol o'zgartirilgan bo'lsa, eski tokenlar ishlamaydi
  if ((user.tokenVersion || 0) !== (payload.tv || 0)) {
    throw new AppError(401, "Token eskirgan (parol o'zgartirilgan), qaytadan login qiling")
  }

  req.user = publicUser(user) // rol har doim bazadan olinadi
  req.tokenPayload = payload
  next()
}

module.exports = { verifyToken }
