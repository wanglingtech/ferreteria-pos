# REQUERIMIENTOS FUNCIONALES

## Proyecto

Desarrollo de una Aplicación Móvil para la Gestión Integral de Ventas, Inventario y Métricas Empresariales en la Ferretería July.

---

# RF01 — Autenticación empresarial

El sistema deberá permitir el acceso únicamente a usuarios autorizados mediante credenciales asignadas internamente por el administrador.

---

# RF02 — Control de acceso por roles

El sistema deberá restringir funcionalidades según el rol del usuario:

- Administrador
- Vendedor

Cada rol contará con permisos específicos dentro del sistema.

---

# RF03 — Inicio y cierre de sesión

El sistema deberá permitir:

- iniciar sesión,
- mantener sesiones seguras,
- cerrar sesión correctamente.

---

# RF04 — Gestión de usuarios

El sistema deberá permitir al administrador:

- registrar usuarios,
- editar usuarios,
- cambiar estados (activo/inactivo),
- restablecer contraseñas,
- asignar roles.

---

# RF05 — Gestión de productos

El sistema deberá permitir:

- registrar productos,
- editar productos,
- eliminar productos,
- activar o desactivar productos,
- visualizar productos disponibles.

---

# RF06 — Búsqueda y filtrado de productos

El sistema deberá permitir buscar y filtrar productos mediante:

- nombre,
- código SKU,
- categoría,
- estado del producto.

---

# RF07 — Gestión de categorías

El sistema deberá permitir organizar productos por categorías:

- herramientas,
- pinturas,
- electricidad,
- gasfitería,
  u otras definidas por el administrador.

---

# RF08 — Control de inventario

El sistema deberá:

- visualizar stock disponible,
- actualizar stock en tiempo real,
- mostrar productos con stock bajo,
- mostrar productos agotados.

---

# RF09 — Stock mínimo configurable

El sistema deberá permitir configurar un stock mínimo por producto para generar alertas automáticas de reabastecimiento.

---

# RF10 — Registro de ventas

El sistema deberá permitir registrar ventas en tiempo real mediante:

- búsqueda de productos,
- selección de productos,
- modificación de cantidades,
- cálculo automático de subtotal,
- cálculo automático de IGV,
- cálculo automático del total final.

---

# RF11 — Validación de stock

El sistema deberá validar la disponibilidad de stock antes de confirmar una venta.

---

# RF12 — Actualización automática de inventario

El sistema deberá descontar automáticamente el stock de productos una vez finalizada una venta.

---

# RF13 — Gestión del carrito de venta

El sistema deberá permitir:

- agregar productos,
- eliminar productos,
- modificar cantidades,
- visualizar subtotales y totales acumulados.

---

# RF14 — Identificación opcional de clientes

El sistema deberá permitir asociar opcionalmente una venta a un cliente específico.

---

# RF15 — Generación de detalle de venta

El sistema deberá generar un resumen detallado de cada venta incluyendo:

- número de venta,
- fecha y hora,
- vendedor responsable,
- cliente,
- productos vendidos,
- cantidades,
- precios,
- subtotal,
- IGV,
- total final.

---

# RF16 — Emisión y compartición de comprobantes

El sistema deberá permitir:

- imprimir comprobantes,
- compartir comprobantes digitales.

---

# RF17 — Dashboard empresarial

El sistema deberá proporcionar un panel centralizado con métricas operativas y comerciales en tiempo real.

---

# RF18 — Visualización de métricas

El dashboard deberá mostrar:

- ventas diarias,
- ventas semanales,
- ventas mensuales,
- número de órdenes,
- productos registrados,
- productos con stock bajo,
- ingresos totales,
- ticket promedio,
- productos más vendidos.

---

# RF19 — Visualización gráfica estadística

El sistema deberá mostrar gráficos estadísticos dinámicos para facilitar el análisis de:

- ventas,
- ingresos,
- comportamiento comercial,
- inventario.

---

# RF20 — Generación de reportes

El sistema deberá generar reportes de:

- ventas,
- productos,
- inventario,
- ingresos,
- usuarios,
- productos más vendidos.

---

# RF21 — Filtro de reportes

El sistema deberá permitir filtrar reportes por:

- fechas,
- periodos,
- categorías,
- usuarios.

---

# RF22 — Navegación intuitiva

El sistema deberá proporcionar:

- menú inferior,
- menú lateral,
- accesos rápidos,
- navegación fluida entre módulos.

---

# RF23 — Persistencia de datos

El sistema deberá almacenar toda la información operativa en una base de datos PostgreSQL.

---

# RF24 — Integridad de información

El sistema deberá mantener consistencia entre:

- ventas,
- inventario,
- usuarios,
- reportes.

---

# RF25 — Registro histórico

El sistema deberá conservar historial de:

- ventas,
- movimientos de inventario,
- acciones relevantes del sistema.

| ID   | Requerimiento         | Estado | Módulo / Evidencia                        |
| ---- | --------------------- | ------ | ----------------------------------------- |
| RF01 | Autenticación JWT     | ✅     | `auth.middleware.js`                      |
| RF02 | Roles ADMIN/SELLER    | ✅     | `authorizeRoles`                          |
| RF03 | Login/Logout          | ✅     | `auth` endpoints + frontend               |
| RF04 | CRUD usuarios         | ✅     | `usuarios` módulo                         |
| RF05 | CRUD productos        | ✅     | `productos` módulo                        |
| RF06 | Búsqueda productos    | ✅     | Filtros en `productos.repository`         |
| RF07 | CRUD categorías       | ✅     | `categorias` módulo                       |
| RF08 | Control stock         | ✅     | `inventario` y `dashboard` KPIs           |
| RF09 | Stock mínimo          | ✅     | Campo `minStock` en Product               |
| RF10 | POS con cálculos      | ✅     | `ventas` página + carrito                 |
| RF11 | Validación stock      | ✅     | Lógica en `ventas.service`                |
| RF12 | Descuento automático  | ✅     | Transacción Prisma en `ventas.repository` |
| RF13 | Carrito venta         | ✅     | Frontend `ventas.page`                    |
| RF14 | Cliente opcional      | ✅     | Campo `customerName`                      |
| RF15 | Detalle venta         | ✅     | PDF/Imagen con `html2canvas`              |
| RF16 | Compartir comprobante | ✅     | Botones en ventas y reportes              |
| RF17 | Dashboard             | ✅     | `dashboard` página                        |
| RF18 | KPIs varios           | ✅     | KPIs en dashboard e inventario            |
| RF19 | Gráficos              | ✅     | Chart.js en `reportes`                    |
| RF20 | Reportes CSV/PDF      | ✅     | `reportes-export.service`                 |
| RF21 | Filtro fechas         | ✅     | Filtros en `reportes`                     |
| RF22 | Navegación            | ✅     | Sidebar + Tab-bar                         |
| RF23 | PostgreSQL            | ✅     | Prisma schema                             |
| RF24 | Integridad            | ✅     | Transacciones Prisma                      |
| RF25 | Historial             | ✅     | `StockMovement` y ventas                  |
