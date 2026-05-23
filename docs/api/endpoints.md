# API ENDPOINTS - FERRETERIA JULY

Base URL:

`/api/v1`

## Health

- `GET /health`

## Auth

- `POST /auth/login`
- `GET /auth/me` (Bearer token)

## Dashboard

- `GET /dashboard` (Bearer token)

## Productos

- `GET /productos` (Bearer token)
  - Query opcional: `search`, `categoryId`, `isActive`
- `GET /productos/:id` (Bearer token)
- `POST /productos` (Bearer token, rol `ADMIN`)
- `PATCH /productos/:id` (Bearer token, rol `ADMIN`)
- `DELETE /productos/:id` (Bearer token, rol `ADMIN`) -> baja lógica (`isActive=false`)

## Inventario

- `GET /inventario/resumen` (Bearer token)

## Ventas

- `GET /ventas` (Bearer token)
- `GET /ventas/:id` (Bearer token)
- `POST /ventas` (Bearer token, rol `ADMIN` o `SELLER`)

## Reportes

- `GET /reportes/resumen` (Bearer token)
  - Query opcional: `from`, `to` (ISO datetime)

## Usuarios

- `GET /usuarios` (Bearer token, rol `ADMIN`)
- `POST /usuarios` (Bearer token, rol `ADMIN`)
- `PATCH /usuarios/:id/status` (Bearer token, rol `ADMIN`)
