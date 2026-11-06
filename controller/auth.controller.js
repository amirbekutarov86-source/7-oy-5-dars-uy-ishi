const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { read_file, write_file, next_id } = require('../fs/file-sys')
const { AppError, ok, parseId, publicUser } = require('../utils/response')
const { signAccess, signRefresh, verifyRefresh, decode } = require('../utils/jwt')

const USERS = 'auth.json'
const REFRESH = 'refresh.json'
const BLACKLIST = 'blacklist.json'

// Foydalanuvchi topilmasa ham bcrypt.compare ishlaydi: javob vaqti bir xil bo'ladi
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10)

// Yangi access + refresh token juftligi yaratadi, refresh'ni bazaga yozadi
const issueTokens = (user) => {
  const accessToken = signAccess(
    { id: user.id, email: user.email, tv: user.tokenVersion || 0 },
    crypto.randomUUID(),
  )

  const refreshJti = crypto.randomUUID()
  const refreshToken = signRefresh({ id: user.id }, refreshJti)

  const now = Date.now()
  const stored = read_file(REFRESH).filter((t) => t.expiresAt > now) // muddati o'tganlarini tozalaydi
  stored.push({
    jti: refreshJti,
    userId: user.id,
    expiresAt: decode(refreshToken).exp * 1000,
    createdAt: new Date().toISOString(),
  })
  write_file(REFRESH, stored)

  return { accessToken, refreshToken }
}

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password } = req.body
  const users = read_file(USERS)

  if (users.some((u) => u.email === email)) {
    throw new AppError(409, "Bu email allaqachon ro'yxatdan o'tgan", [
      { field: 'email', message: 'email takrorlanmasligi kerak' },
    ])
  }

  const user = {
    id: next_id(users),
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role: 'user', // rolni foydalanuvchi o'zi tanlay olmaydi
    tokenVersion: 0,
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  write_file(USERS, users)

  ok(res, { user: publicUser(user), ...issueTokens(user) }, "Ro'yxatdan o'tdingiz", 201)
}

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body

  const user = read_file(USERS).find((u) => u.email === email)
  const match = await bcrypt.compare(password, user ? user.password : DUMMY_HASH)

  if (!user || !match) throw new AppError(401, "Email yoki parol noto'g'ri")

  ok(res, { user: publicUser(user), ...issueTokens(user) }, 'Muvaffaqiyatli kirdingiz')
}

// POST /api/auth/refresh  { "refreshToken": "..." }
const refresh = (req, res) => {
  let payload
  try {
    payload = verifyRefresh(req.body.refreshToken)
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new AppError(401, 'Refresh token muddati tugagan, qaytadan login qiling')
    throw new AppError(401, "Refresh token noto'g'ri")
  }

  const stored = read_file(REFRESH)
  const record = stored.find((t) => t.jti === payload.jti && t.userId === payload.id)
  if (!record) throw new AppError(401, 'Refresh token yaroqsiz yoki allaqachon ishlatilgan, qaytadan login qiling')

  const user = read_file(USERS).find((u) => u.id === payload.id)
  if (!user) throw new AppError(401, 'Foydalanuvchi topilmadi')

  // eski refresh token o'chiriladi (har safar yangisi beriladi)
  write_file(REFRESH, stored.filter((t) => t.jti !== payload.jti))

  ok(res, issueTokens(user), 'Tokenlar yangilandi')
}

// POST /api/auth/logout  (token kerak)  { "refreshToken": "..." } - ixtiyoriy
const logout = (req, res) => {
  const { refreshToken } = req.body

  if (refreshToken) {
    try {
      const payload = verifyRefresh(refreshToken)
      if (payload.id === req.user.id) {
        write_file(REFRESH, read_file(REFRESH).filter((t) => t.jti !== payload.jti))
      }
    } catch {
      // yaroqsiz refresh token bo'lsa ham, logout davom etadi
    }
  }

  // joriy access token qora ro'yxatga tushadi
  const now = Date.now()
  const list = read_file(BLACKLIST).filter((b) => b.exp * 1000 > now)
  list.push({ jti: req.tokenPayload.jti, exp: req.tokenPayload.exp })
  write_file(BLACKLIST, list)

  ok(res, null, 'Tizimdan chiqdingiz')
}

// GET /api/auth/profile  (token kerak)
const profile = (req, res) => {
  ok(res, req.user, 'Profil')
}

// PUT /api/auth/change-password  (token kerak)
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body

  const users = read_file(USERS)
  const index = users.findIndex((u) => u.id === req.user.id)
  if (index === -1) throw new AppError(401, 'Foydalanuvchi topilmadi')

  if (!(await bcrypt.compare(oldPassword, users[index].password))) {
    throw new AppError(400, "Eski parol noto'g'ri", [{ field: 'oldPassword', message: "eski parol noto'g'ri" }])
  }
  if (oldPassword === newPassword) {
    throw new AppError(400, "Yangi parol eskisidan farq qilishi kerak", [
      { field: 'newPassword', message: 'yangi parol eski parol bilan bir xil' },
    ])
  }

  users[index].password = await bcrypt.hash(newPassword, 10)
  users[index].tokenVersion = (users[index].tokenVersion || 0) + 1 // barcha eski access tokenlar bekor
  write_file(USERS, users)

  // barcha qurilmalardagi refresh tokenlar o'chiriladi
  write_file(REFRESH, read_file(REFRESH).filter((t) => t.userId !== req.user.id))

  ok(res, issueTokens(users[index]), "Parol o'zgartirildi. Boshqa qurilmalardan chiqarildingiz")
}

// GET /api/auth/users  (faqat admin)
const getUsers = (req, res) => {
  const users = read_file(USERS).map(publicUser)
  ok(res, users, "Foydalanuvchilar ro'yxati", 200, { total: users.length })
}

// PATCH /api/auth/users/:id/role  (faqat admin)  { "role": "admin" | "user" }
const setRole = (req, res) => {
  const id = parseId(req.params.id)
  const { role } = req.body

  const users = read_file(USERS)
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) throw new AppError(404, `Foydalanuvchi topilmadi (id: ${id})`)

  const admins = users.filter((u) => u.role === 'admin').length
  if (users[index].role === 'admin' && role !== 'admin' && admins === 1) {
    throw new AppError(400, "Oxirgi adminning rolini o'zgartirib bo'lmaydi")
  }

  users[index].role = role
  write_file(USERS, users)

  ok(res, publicUser(users[index]), `Rol o'zgartirildi: ${role}`)
}

module.exports = { register, login, refresh, logout, profile, changePassword, getUsers, setRole }
