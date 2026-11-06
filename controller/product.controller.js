const { read_file, write_file, next_id } = require('../fs/file-sys')
const { AppError, ok, parseId } = require('../utils/response')

const FILE = 'product.json'
const SORTABLE = ['id', 'name', 'price', 'stock', 'createdAt']

const findIndex = (items, id) => {
  const index = items.findIndex((i) => i.id === id)
  if (index === -1) throw new AppError(404, `Mahsulot topilmadi (id: ${id})`)
  return index
}

// GET /api/products?search=&category=&minPrice=&maxPrice=&sort=&order=&page=&limit=
const getProducts = (req, res) => {
  let items = read_file(FILE)
  const q = req.query

  if (typeof q.category === 'string' && q.category) {
    items = items.filter((i) => String(i.category ?? '').toLowerCase() === q.category.toLowerCase())
  }

  const search = typeof q.search === 'string' ? q.search.trim().toLowerCase() : ''
  if (search) {
    items = items.filter((i) =>
      [i.name, i.category, i.description].some((f) => String(f ?? '').toLowerCase().includes(search)),
    )
  }

  for (const key of ['minPrice', 'maxPrice']) {
    if (q[key] === undefined || q[key] === '') continue
    const n = Number(q[key])
    if (!Number.isFinite(n)) throw new AppError(400, `${key} son bo'lishi kerak`)
    items = items.filter((i) => (key === 'minPrice' ? i.price >= n : i.price <= n))
  }

  const sort = typeof q.sort === 'string' ? q.sort : 'id'
  if (!SORTABLE.includes(sort)) throw new AppError(400, `sort noto'g'ri. Mumkin: ${SORTABLE.join(', ')}`)
  const dir = q.order === 'desc' ? -1 : 1
  items = [...items].sort((a, b) => {
    if (a[sort] === b[sort]) return 0
    if (a[sort] === undefined) return 1
    if (b[sort] === undefined) return -1
    return (a[sort] > b[sort] ? 1 : -1) * dir
  })

  const page = Math.max(1, parseInt(q.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 10))
  const total = items.length

  ok(res, items.slice((page - 1) * limit, page * limit), "Mahsulotlar ro'yxati", 200, {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  })
}

// GET /api/products/:id
const getProduct = (req, res) => {
  const items = read_file(FILE)
  ok(res, items[findIndex(items, parseId(req.params.id))], 'Mahsulot')
}

// POST /api/products  (token kerak)
const createProduct = (req, res) => {
  const items = read_file(FILE)
  const now = new Date().toISOString()

  const product = { id: next_id(items), ...req.body, createdBy: req.user.id, createdAt: now, updatedAt: now }
  items.push(product)
  write_file(FILE, items)

  ok(res, product, "Mahsulot qo'shildi", 201)
}

// PUT /api/products/:id  (token + egasi yoki admin)
const updateProduct = (req, res) => {
  const id = parseId(req.params.id)
  const items = read_file(FILE)
  const index = findIndex(items, id)

  items[index] = {
    id,
    ...req.body,
    createdBy: items[index].createdBy,
    createdAt: items[index].createdAt,
    updatedAt: new Date().toISOString(),
  }
  write_file(FILE, items)

  ok(res, items[index], 'Mahsulot yangilandi')
}

// PATCH /api/products/:id  (token + egasi yoki admin)
const patchProduct = (req, res) => {
  const id = parseId(req.params.id)
  if (!Object.keys(req.body).length) {
    throw new AppError(400, 'Kamida bitta maydon yuboring: name, price, category, description, stock')
  }

  const items = read_file(FILE)
  const index = findIndex(items, id)

  items[index] = { ...items[index], ...req.body, updatedAt: new Date().toISOString() }
  write_file(FILE, items)

  ok(res, items[index], 'Mahsulot yangilandi')
}

// DELETE /api/products/:id  (token + egasi yoki admin)
const deleteProduct = (req, res) => {
  const id = parseId(req.params.id)
  const items = read_file(FILE)
  const [removed] = items.splice(findIndex(items, id), 1)
  write_file(FILE, items)

  ok(res, removed, "Mahsulot o'chirildi")
}

module.exports = { getProducts, getProduct, createProduct, updateProduct, patchProduct, deleteProduct }
