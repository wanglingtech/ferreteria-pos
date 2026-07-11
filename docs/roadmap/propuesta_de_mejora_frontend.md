# 🚀 Roadmap de mejora - Frontend (Ferretería July POS)

**Objetivo:** Transformar el frontend actual en una aplicación robusta, segura, de alto rendimiento y fácilmente mantenible, corrigiendo las deficiencias identificadas en el análisis de código.

---

## Fase 1: Corrección y Estabilización (Corto Plazo - Prioridad Alta)

_Enfocado en seguridad inmediata, corrección de pruebas y optimizaciones básicas de rendimiento._

- [ ] **📝 Actualizar todas las pruebas unitarias (`*.spec.ts`)**:
  - Ajustar los `mocks` de servicios (añadir métodos faltantes como `cargarNotificaciones`).
  - Corregir referencias a propiedades obsoletas (ej. `loginForm` → `form`, `cargarDatos` → `cargarDashboard`).
  - Añadir pruebas básicas para **señales (`signal`, `computed`, `effect`)**.
  - Configurar correctamente `TestBed` para componentes standalone (usar `provideHttpClientTesting` y `provideRouter`).
- [ COMPLETED ] **🔒 Sanitizar `innerHTML` en el Chatbot**:
  - Utilizar `DomSanitizer.sanitize(SecurityContext.HTML, value)` en `chatbot.component.ts` para prevenir ataques XSS, ya que el backend podría devolver HTML malicioso en el mensaje.
- [ ] **⚡ Aplicar `ChangeDetectionStrategy.OnPush`**:
  - Implementar en **todos** los componentes posibles para reducir la detección de cambios innecesaria y mejorar el rendimiento general.
- [ ] **🏷️ Agregar `trackBy`**:
  - Añadir funciones `trackBy` en todos los `*ngFor` (productos, ventas, notificaciones, usuarios, etc.) para optimizar el renderizado de listas.
- [ COMPLETED ] **⏳ Implementar `debounceTime` en búsquedas**:
  - Añadir `Subject` con `debounceTime(500ms)` en las búsquedas de **Productos** y **Ventas** (similar a como ya se hizo en Reportes) para reducir peticiones al backend al escribir.
- [ ] **🖼️ Lazy loading de imágenes**:
  - Añadir el atributo `loading="lazy"` a todas las etiquetas `<img>` de productos y avatares.
  - Usar un placeholder (ej. `assets/default-product.png`) mientras se carga la imagen real.
- [ ] **🧩 Centralizar validadores de formularios**:
  - Extraer los validadores personalizados (`usernameValidator`, `fullNameValidator`, `passwordValidator`, `identifierValidator`) a archivos compartidos en `src/app/shared/validators/` para reutilizarlos en todos los formularios.
- [ ] **📦 Extraer lógica de gráficos**:
  - Mover la creación y actualización de gráficos (Chart.js) de `dashboard.page.ts` y `reportes.page.ts` a servicios específicos (`ChartService`) para limpiar los componentes.

---

## Fase 2: Experiencia de Usuario y Rendimiento (Medio Plazo)

_Mejoras sustanciales en la interacción, velocidad percibida y actualización de datos._

- [ ] **🔄 Skeleton Loaders**:
  - Agregar esqueletos de carga (shimmers) para listas (Productos, Ventas, Usuarios, Notificaciones) y tarjetas de KPIs, eliminando los molestos "saltos" de contenido.
- [ ] **🗄️ Cache de datos estáticos**:
  - Usar `shareReplay(1)` en los servicios de `CategoriasApiService` y `ProductosApiService` para cachear datos que cambian poco y evitar peticiones redundantes al cargar múltiples páginas.
- [ ] **📡 WebSockets en lugar de Polling**:
  - Reemplazar el polling de notificaciones (cada 30s) con **Socket.IO** (ya incluido en el backend) para recibir notificaciones y actualizaciones de stock/ventas en **tiempo real** sin retrasos.
- [ ] **📱 Configurar Service Worker (PWA)**:
  - Habilitar el soporte PWA para permitir la instalación de la aplicación en móviles y escritorio, y añadir estrategias de caché para funcionamiento offline parcial.
- [ ] **🌐 Manejo de errores de red**:
  - Mostrar un toast o banner específico cuando el usuario pierda la conexión a internet, indicando que los datos pueden estar desactualizados.
- [ ] **🧩 Componente reutilizable de errores de formulario**:
  - Crear un componente (ej. `app-field-error`) que estandarice la visualización de mensajes de error (requerido, mínimo, patrón, etc.) en todos los formularios, reduciendo código repetitivo en los templates.
- [ ] **📊 Optimización del Bundle**:
  - Analizar el tamaño del bundle con `webpack-bundle-analyzer`.
  - Eliminar dependencias no utilizadas y aplicar importaciones dinámicas para módulos pesados (como `html2canvas` o `jspdf` que solo se usan en ventas/reportes).
- [ ] **⏳ Refinar tiempos de espera**:
  - Ajustar los tiempos de `setTimeout` para el enfoque de inputs y transiciones para que la UI se sienta más receptiva.

---

## Fase 3: Escalabilidad y Arquitectura (Largo Plazo)

_Para preparar el proyecto para crecimiento en funcionalidades y número de usuarios._

- [ ] **🏗️ Migrar a un Store Centralizado (Estado Global)**:
  - Implementar **NgRx Signals** o un servicio central (usando señales) para manejar el estado global (usuario actual, notificaciones, configuración del tema) y compartirlo fácilmente entre componentes sin necesidad de inputs/outputs excesivos.
- [ ] **🧪 Pruebas de Integración (E2E)**:
  - Configurar **Cypress** o **Playwright** para escribir pruebas de flujos completos (ej. login → crear producto → realizar venta → ver reporte), asegurando que la integración entre componentes y servicios funcione correctamente.
- [ ] **📖 Documentación de Componentes (Storybook)**:
  - Integrar **Storybook** para documentar los componentes reutilizables (Header, BottomNav, Modales, Inputs) de forma aislada, facilitando el desarrollo y onboarding de nuevos desarrolladores.
- [ ] **📝 Logging de errores en Frontend**:
  - Integrar un servicio como **Sentry** para capturar errores no controlados en producción y recibir alertas con el stack trace y contexto del usuario.
- [ ] **🧩 Refactorización de Modales y Formularios**:
  - Aplicar el patrón **Presentacional/Contenedor** a los modales complejos (Productos, Usuarios) para separar la lógica de negocio de la presentación visual.
- [ ] **🤖 Internacionalización (i18n)**:
  - Preparar la aplicación para soportar múltiples idiomas usando `@angular/localize` en caso de que se requiera en el futuro.
- [ ] **🔄 Dependabot**:
  - Activar Dependabot en el repositorio para mantener las dependencias (Angular, Ionic, Chart.js, etc.) actualizadas y parchear vulnerabilidades automáticamente.
- [ ] **🧹 Limpieza de deuda técnica**:
  - Revisar y eliminar código comentado, archivos `.spec.ts` que ya no sean útiles y estilos CSS duplicados.

---

## ✨ Consideraciones Adicionales

- **Mantener la consistencia en nombres**: Usar siempre `onXxx` para eventos del usuario, `loadXxx` para cargas de datos y `handleXxx` para manejadores internos.
- **Usar `inject()` en lugar de constructores**: Ya se está aplicando en varios lugares, pero estandarizar para todos los servicios y componentes nuevos.
- **Asegurar la accesibilidad**: Revisar etiquetas `aria-label`, roles y navegación por teclado en los componentes interactivos (modales, menús, botones).

---

**Próximo paso**: Comienza con la **Fase 1** para estabilizar la base y corregir las pruebas. Una vez completada, tendrás una plataforma sólida para implementar las mejoras de experiencia de usuario y rendimiento de la Fase 2. ¡Éxito con el proyecto! 🎉
