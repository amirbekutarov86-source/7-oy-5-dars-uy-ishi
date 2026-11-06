const { AppError, getBody } = require('../utils/response')
const { validate } = require('../utils/validator')

// validateBody(schema)                    - hamma majburiy maydonlar kerak
// validateBody(schema, { partial: true }) - qisman (PATCH)
// validateBody(schema, { optional: true })- body umuman bo'lmasa ham bo'ladi
const validateBody = (schema, { partial = false, optional = false } = {}) => {
  return (req, res, next) => {
    const body = optional && (req.body === undefined || req.body === null) ? {} : getBody(req)
    const { errors, value } = validate(schema, body, { partial })

    if (errors.length) throw new AppError(400, 'Validatsiya xatosi', errors)

    req.body = value // faqat tekshirilgan va tozalangan maydonlar qoladi
    next()
  }
}

module.exports = { validateBody }
