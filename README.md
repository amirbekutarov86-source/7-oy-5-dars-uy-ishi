# 4-dars: Express + JWT (auth, rollar, refresh token, product API)

## Ishga tushirish

```bash
npm install
npm run dev
```

`npm run dev` nodemon bilan ishlaydi. Port band bo'lsa, server o'zi keyingi portni oladi va terminalda yozadi.

## Papkalar

```
4-dars/
├── controller/    auth.controller.js, product.controller.js
├── data/          auth.json, product.json, refresh.json, blacklist.json
├── fs/            file-sys.js  (read_file, write_file)
├── middleware/
│   ├── auth.middleware.js      token tekshirish (verifyToken)
│   ├── role.middleware.js      rol tekshirish (allowRoles)
│   ├── owner.middleware.js     mahsulot egasini tekshirish
│   ├── validate.middleware.js  so'rov tanasini tekshirish (validateBody)
│   └── error.middleware.js     404 va xatolarni boshqarish
├── router/        auth.routes.js, product.routes.js
├── utils/         jwt.js, response.js, schemas.js, validator.js
├── .env
└── index.js
```

## Postman

1. **Import** -> `4-dars.postman_collection.json` (eski collection'ni o'chirib, shuni qo'shing)
2. `auth` -> **Login ADMIN** yoki **Login USER** -> Send. Tokenlar avtomatik saqlanadi.
3. Boshqa so'rovlar tokenni o'zi oladi.
4. Access token tugasa (30 daqiqa) -> **Refresh** -> Send.

Namuna foydalanuvchilar (parol: `123456`):

| Email | Rol |
|---|---|
| ali@example.com | admin |
| vali@example.com | user |

## Yo'llar

| Metod | Manzil | Kim uchun |
|---|---|---|
| POST | /api/auth/register | hamma |
| POST | /api/auth/login | hamma |
| POST | /api/auth/refresh | hamma (refreshToken bilan) |
| POST | /api/auth/logout | token kerak |
| GET | /api/auth/profile | token kerak |
| PUT | /api/auth/change-password | token kerak |
| GET | /api/auth/users | faqat admin |
| PATCH | /api/auth/users/:id/role | faqat admin |
| GET | /api/products, /api/products/:id | hamma |
| POST | /api/products | token kerak |
| PUT, PATCH, DELETE | /api/products/:id | mahsulot egasi yoki admin |

## Tokenlar qanday ishlaydi

- **accessToken** (30 daqiqa): har bir himoyalangan so'rovda `Authorization: Bearer <accessToken>` bilan yuboriladi.
- **refreshToken** (7 kun): faqat `/api/auth/refresh` ga yuboriladi. Har safar yangi juftlik beriladi, eskisi o'chadi (qayta ishlatib bo'lmaydi).
- **Logout:** access token qora ro'yxatga tushadi, refresh token o'chiriladi.
- **Parol o'zgarsa:** eski hamma tokenlar bekor bo'ladi, yangi juftlik beriladi.
- Rol har doim bazadan olinadi: admin rolni o'zgartirsa, darrov kuchga kiradi.
- Ro'yxatdan o'tganda rol doim `user`. Rolni faqat admin o'zgartiradi.

## Xato kodlari

| Kod | Ma'nosi |
|---|---|
| 400 | noto'g'ri JSON, validatsiya xatosi, noto'g'ri id |
| 401 | token yo'q/noto'g'ri/muddati tugagan/bekor qilingan, yoki login xato |
| 403 | ruxsat yo'q (rol yoki egalik) |
| 404 | mahsulot, foydalanuvchi yoki yo'l topilmadi |
| 409 | email takrorlangan |
| 500 | kutilmagan server xatosi (server o'chmaydi) |
