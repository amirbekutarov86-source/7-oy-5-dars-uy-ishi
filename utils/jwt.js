const jwt = require('jsonwebtoken')

const accessSecret = () => process.env.JWT_SECRET || 'dev-access-secret-faqat-sinov-uchun'
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-faqat-sinov-uchun'

// Access token: qisqa muddatli, har bir so'rovda ishlatiladi
const signAccess = (payload, jti) =>
  jwt.sign({ ...payload, type: 'access' }, accessSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
    jwtid: jti,
  })

// Refresh token: uzoq muddatli, faqat yangi access token olish uchun
const signRefresh = (payload, jti) =>
  jwt.sign({ ...payload, type: 'refresh' }, refreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    jwtid: jti,
  })

const verifyAccess = (token) => {
  const payload = jwt.verify(token, accessSecret())
  if (payload.type !== 'access') throw new jwt.JsonWebTokenError('token turi noto\'g\'ri')
  return payload
}

const verifyRefresh = (token) => {
  const payload = jwt.verify(token, refreshSecret())
  if (payload.type !== 'refresh') throw new jwt.JsonWebTokenError('token turi noto\'g\'ri')
  return payload
}

const decode = (token) => jwt.decode(token)

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, decode }
