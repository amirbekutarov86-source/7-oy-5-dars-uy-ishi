const express = require('express')
const controller = require('../controller/auth.controller')
const { verifyToken } = require('../middleware/auth.middleware')
const { allowRoles } = require('../middleware/role.middleware')
const { validateBody } = require('../middleware/validate.middleware')
const schemas = require('../utils/schemas')

const router = express.Router()

// Ochiq yo'llar
router.post('/register', validateBody(schemas.registerSchema), controller.register)
router.post('/login', validateBody(schemas.loginSchema), controller.login)
router.post('/refresh', validateBody(schemas.refreshSchema), controller.refresh)

// Token kerak
router.post('/logout', verifyToken, validateBody(schemas.logoutSchema, { optional: true }), controller.logout)
router.get('/profile', verifyToken, controller.profile)
router.put('/change-password', verifyToken, validateBody(schemas.changePasswordSchema), controller.changePassword)

// Faqat admin
router.get('/users', verifyToken, allowRoles('admin'), controller.getUsers)
router.patch('/users/:id/role', verifyToken, allowRoles('admin'), validateBody(schemas.roleSchema), controller.setRole)

module.exports = router
