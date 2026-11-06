const { read_file } = require('../fs/file-sys')
const { AppError, parseId } = require('../utils/response')

// Mahsulotni faqat uni yaratgan foydalanuvchi yoki admin o'zgartira/o'chira oladi
const checkProductOwner = (req, res, next) => {
  const id = parseId(req.params.id)
  const product = read_file('product.json').find((p) => p.id === id)

  if (!product) throw new AppError(404, `Mahsulot topilmadi (id: ${id})`)

  const isOwner = product.createdBy === req.user.id
  if (!isOwner && req.user.role !== 'admin') {
    throw new AppError(403, 'Bu mahsulot sizniki emas, uni faqat egasi yoki admin o\'zgartira oladi')
  }

  req.product = product
  next()
}

module.exports = { checkProductOwner }
