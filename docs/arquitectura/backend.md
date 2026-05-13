# BACKEND (Node + Express + JS)

backend/
│
├── src/
│ │
│ ├── config/
│ │ ├── env.js
│ │ ├── database.js
│ │ └── jwt.js
│ │
│ ├── modules/
│ │ │
│ │ ├── auth/
│ │ │ ├── auth.routes.js
│ │ │ ├── auth.controller.js
│ │ │ ├── auth.service.js
│ │ │ ├── auth.repository.js
│ │ │ └── auth.schema.js
│ │ │
│ │ ├── dashboard/
│ │ │ ├── dashboard.routes.js
│ │ │ ├── dashboard.controller.js
│ │ │ ├── dashboard.service.js
│ │ │ └── dashboard.repository.js
│ │ │
│ │ ├── productos/
│ │ │ ├── productos.routes.js
│ │ │ ├── productos.controller.js
│ │ │ ├── productos.service.js
│ │ │ ├── productos.repository.js
│ │ │ └── productos.schema.js
│ │ │
│ │ ├── ventas/
│ │ │ ├── ventas.routes.js
│ │ │ ├── ventas.controller.js
│ │ │ ├── ventas.service.js
│ │ │ ├── ventas.repository.js
│ │ │ └── ventas.schema.js
│ │ │
│ │ ├── inventario/
│ │ │ ├── inventario.routes.js
│ │ │ ├── inventario.controller.js
│ │ │ ├── inventario.service.js
│ │ │ └── inventario.repository.js
│ │ │
│ │ ├── usuarios/
│ │ │ ├── usuarios.routes.js
│ │ │ ├── usuarios.controller.js
│ │ │ ├── usuarios.service.js
│ │ │ ├── usuarios.repository.js
│ │ │ └── usuarios.schema.js
│ │ │
│ │ └── reportes/
│ │ ├── reportes.routes.js
│ │ ├── reportes.controller.js
│ │ ├── reportes.service.js
│ │ └── reportes.repository.js
│ │
│ ├── shared/
│ │ ├── middlewares/
│ │ │ ├── auth.middleware.js
│ │ │ └── error.middleware.js
│ │ │
│ │ ├── helpers/
│ │ │ ├── generarToken.js
│ │ │ └── formatearFecha.js
│ │ │
│ │ ├── utils/
│ │ │
│ │ └── errors/
│ │
│ ├── app.js
│ └── server.js
│
├── prisma/
│ ├── schema.prisma
│ └── seed.js
│
├── .env
├── package.json
├── package-lock.json
└── nodemon.json

# ¿POR QUÉ ESTA ARQUITECTURA ES BUENA?

Porque:

✔ modular
✔ escalable
✔ limpia
✔ simple
✔ profesional
✔ fácil mantener
✔ lista para crecer

SIN sobreingeniería.
