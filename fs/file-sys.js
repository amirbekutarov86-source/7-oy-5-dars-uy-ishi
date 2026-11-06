const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'data')
const file_path = (file_name) => path.join(DATA_DIR, file_name)

// data/ ichidagi JSON faylni o'qiydi. Fayl yo'q bo'lsa, bo'sh ro'yxat qaytaradi.
const read_file = (file_name) => {
  try {
    const data = JSON.parse(fs.readFileSync(file_path(file_name), 'utf-8'))
    return Array.isArray(data) ? data : []
  } catch (err) {
    if (err.code === 'ENOENT') return []
    // fayl buzilgan bo'lsa, ma'lumot ustidan yozib yubormaslik uchun xato beramiz
    throw new Error(`${file_name} faylini o'qib bo'lmadi: ${err.message}`)
  }
}

// Avval vaqtinchalik faylga yozib, keyin almashtiradi: fayl buzilib qolmaydi
const write_file = (file_name, data) => {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const tmp = file_path(file_name) + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, file_path(file_name))
}

const next_id = (items) => (items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1)

module.exports = { read_file, write_file, next_id }
