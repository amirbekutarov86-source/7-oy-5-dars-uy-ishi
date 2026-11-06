const { AppError } = require('../utils/response')

// allowRoles('admin')  yoki  allowRoles('admin', 'user')
// verifyToken'dan KEYIN ishlatiladi
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) throw new AppError(401, 'Avval login qiling')

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, `Bu amal uchun ruxsat yo'q. Kerakli rol: ${roles.join(' yoki ')}`)
    }
    next()
  }
}

module.exports = { allowRoles }
