const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// schema bo'yicha tekshiradi, noma'lum maydonlarni tashlab yuboradi.
// partial=true bo'lsa (PATCH), majburiy maydonlar shart emas.
const validate = (schema, body, { partial = false } = {}) => {
  const errors = []
  const value = {}

  for (const [key, rule] of Object.entries(schema)) {
    let v = body[key]

    if (v === undefined || v === null) {
      if (rule.required && !partial) errors.push({ field: key, message: `${key} majburiy` })
      continue
    }

    if (rule.type === 'string') {
      if (typeof v !== 'string') {
        errors.push({ field: key, message: `${key} matn bo'lishi kerak` })
        continue
      }
      if (rule.trim !== false) v = v.trim() // parolga trim qo'llanmaydi
      if (rule.required && v === '') {
        errors.push({ field: key, message: `${key} bo'sh bo'lmasligi kerak` })
        continue
      }
      if (rule.min && v.length < rule.min) {
        errors.push({ field: key, message: `${key} kamida ${rule.min} ta belgi bo'lishi kerak` })
        continue
      }
      if (rule.max && v.length > rule.max) {
        errors.push({ field: key, message: `${key} ${rule.max} ta belgidan oshmasligi kerak` })
        continue
      }
      if (rule.email && !EMAIL_RE.test(v)) {
        errors.push({ field: key, message: `${key} noto'g'ri formatda (masalan: ali@example.com)` })
        continue
      }
      if (rule.enum && !rule.enum.includes(v)) {
        errors.push({ field: key, message: `${key} quyidagilardan biri bo'lishi kerak: ${rule.enum.join(', ')}` })
        continue
      }
      if (rule.lowercase) v = v.toLowerCase()
    }

    if (rule.type === 'number') {
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        errors.push({ field: key, message: `${key} son bo'lishi kerak` })
        continue
      }
      if (rule.integer && !Number.isInteger(v)) {
        errors.push({ field: key, message: `${key} butun son bo'lishi kerak` })
        continue
      }
      if (rule.min !== undefined && v < rule.min) {
        errors.push({ field: key, message: `${key} kamida ${rule.min} bo'lishi kerak` })
        continue
      }
    }

    value[key] = v
  }

  return { errors, value }
}

module.exports = { validate }
