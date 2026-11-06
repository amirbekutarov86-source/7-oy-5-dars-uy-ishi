// Har bir so'rov uchun maydon qoidalari (validate.middleware.js ishlatadi)

const registerSchema = {
  name: { type: 'string', required: true, min: 2, max: 50 },
  email: { type: 'string', required: true, email: true, max: 100, lowercase: true },
  password: { type: 'string', required: true, min: 6, max: 100, trim: false },
}

const loginSchema = {
  email: { type: 'string', required: true, email: true, lowercase: true },
  password: { type: 'string', required: true, trim: false },
}

const refreshSchema = {
  refreshToken: { type: 'string', required: true, trim: false },
}

const logoutSchema = {
  refreshToken: { type: 'string', trim: false },
}

const changePasswordSchema = {
  oldPassword: { type: 'string', required: true, trim: false },
  newPassword: { type: 'string', required: true, min: 6, max: 100, trim: false },
}

const roleSchema = {
  role: { type: 'string', required: true, enum: ['user', 'admin'] },
}

const productSchema = {
  name: { type: 'string', required: true, min: 2, max: 100 },
  price: { type: 'number', required: true, min: 0 },
  category: { type: 'string', max: 50 },
  description: { type: 'string', max: 500 },
  stock: { type: 'number', integer: true, min: 0 },
}

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  changePasswordSchema,
  roleSchema,
  productSchema,
}
