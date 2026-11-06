const express = require('express')
const controller = require('../controller/product.controller')
const { verifyToken } = require('../middleware/auth.middleware')
const { checkProductOwner } = require('../middleware/owner.middleware')
const { validateBody } = require('../middleware/validate.middleware')
const { productSchema } = require('../utils/schemas')

const router = express.Router()

// Ochiq yo'llar (token shart emas)
router.get('/', controller.getProducts)
router.get('/:id', controller.getProduct)

// Token kerak
router.post('/', verifyToken, validateBody(productSchema), controller.createProduct)

// Token + faqat egasi yoki admin
router.put('/:id', verifyToken, checkProductOwner, validateBody(productSchema), controller.updateProduct)
router.patch('/:id', verifyToken, checkProductOwner, validateBody(productSchema, { partial: true }), controller.patchProduct)
router.delete('/:id', verifyToken, checkProductOwner, controller.deleteProduct)

module.exports = router
