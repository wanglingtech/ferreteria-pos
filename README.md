<p align="center">
  <img src="frontend/ferreteriaApp/src/assets/logo/logo_ferreteria.png" alt="Ferretería July Logo" width="120">
</p>

<h1 align="center">🛠️ Ferretería July POS</h1>
<p align="center">
  <strong>Sistema de Punto de Venta y Gestión Empresarial Integral</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Estado-Académico%20(Activo)-blue" alt="Estado: Proyecto Académico (Activo)">
  <img src="https://img.shields.io/badge/versión-1.0.0-blue" alt="Versión 1.0.0">
  <img src="https://img.shields.io/badge/Licencia-MIT-green" alt="Licencia MIT">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stack-Angular%20%7C%20Ionic%20%7C%20Node.js%20%7C%20Express%20%7C%20Prisma%20%7C%20PostgreSQL-333333" alt="Tech Stack">
  <img src="https://img.shields.io/badge/Type-ERP%20%26%20POS-5C2D91" alt="Tipo: ERP y POS">
</p>

---

## 📖 **Descripción General**

**Ferretería July** es un sistema empresarial completo, diseñado para optimizar la gestión de ventas, inventario y operaciones de una ferretería. Es un proyecto académico desarrollado como parte del curso de Programación de Aplicaciones Móviles, tomando como caso de estudio una ferretería para diseñar e implementar una solución integral de gestión empresarial, este software busca resolver problemas cotidianos como la falta de control de stock, la gestión manual de ventas y la ausencia de métricas en tiempo real.

El sistema ofrece una experiencia unificada: desde un **Punto de Venta (POS)** ágil e intuitivo hasta un potente **panel de control** con gráficos y alertas automatizadas, todo construido sobre una arquitectura moderna y escalable.

---

## ✨ **Funcionalidades Principales**

- **📈 Dashboard Ejecutivo**: Visualiza en tiempo real las métricas más importantes del negocio: ventas del día, ticket promedio, y productos más vendidos.
- **🧾 Punto de Venta (POS)**: Interfaz rápida para registrar ventas, gestionar carrito de compras, administrar clientes y generar comprobantes descargables en PDF o imagen con un solo clic.
- **🏷️ Gestión de Inventario**: Controla el stock con alertas automáticas de bajo inventario, gestiona categorías y productos, y lleva un historial de movimientos.
- **👥 Gestión de Usuarios y Roles**: Sistema de autenticación seguro con roles de `Administrador` y `Vendedor`, permitiendo control granular de accesos y permisos.
- **📊 Centro de Reportes y Análisis**: Genera reportes de ventas por fechas, visualiza gráficos de evolución, exporta a CSV/PDF y consulta los productos más vendidos.
- **🤖 Asistente Inteligente (Chatbot)**: Desarrollo de un chatbot basado en reglas y procesamiento de comandos, capaz de responder consultas relacionadas con ventas, inventario, clientes, reportes y métricas del sistema utilizando información almacenada en la base de datos.
- **🔄 Actualizaciones en Tiempo Real**: La información de inventario, ventas y reportes se actualiza de manera automática, reflejando cambios sin necesidad de recargar la página.

---

## 🛠️ **Tecnologías Utilizadas**

### **Frontend**

- **Angular 18** con **Ionic 8**: Para una aplicación web/móvil híbrida de alto rendimiento.
- **Chart.js**: Para visualización de datos y gráficos analíticos.
- **SCSS**: Estilos avanzados con diseño responsivo y temas personalizados.

### **Backend**

- **Node.js** con **Express**: API REST robusta y escalable.
- **Prisma ORM**: Para una interacción segura y tipada con la base de datos.
- **PostgreSQL**: Base de datos relacional confiable y potente.
- **JWT (JSON Web Tokens)**: Para autenticación segura de usuarios.

### **Funcionalidades Extra**

- **WebSockets (Socket.IO)**: Para comunicación en tiempo real y actualizaciones automáticas.
- **JSPDF & HTML2Canvas**: Para la generación de reportes y facturas en PDF e imagen.
- **TypeScript**: Tipado estático y código más mantenible.

---

## 🚀 **Instalación y Configuración**

Sigue estos pasos para levantar el proyecto en tu entorno local.

### **Prerrequisitos**

- Node.js (versión 18+)
- npm o yarn
- PostgreSQL (versión 14+)

### **1. Clonar el repositorio**

```bash
git clone https://github.com/wangling941/ferreteria-july.git
cd ferreteria-july
```

# 1. Configurar la Base de Datos

Crea una base de datos PostgreSQL llamada ferreteria_july_db.

Copia el archivo de entorno y configura las variables:
cp backend/.env.example backend/.env

# Edita el archivo `.env` con tus credenciales de base de datos.

# 2. Instalar Dependencias e Inicializar la Base de Datos

bash

# Instalar dependencias del backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
```

# Instalar dependencias del frontend

```bash
cd ../frontend/ferreteriaApp
npm install
```

# 3.Iniciar la Aplicación

# Iniciar el backend:

```bash

cd backend
npm run dev
```

# Iniciar el frontend:

```bash
cd frontend/ferreteriaApp
ionic serve
```

# 🏗️ Arquitectura del Proyecto

El sistema está construido bajo una Screaming Architecture y Clean Architecture Simplificada, separando el código en capas bien definidas para garantizar mantenibilidad y escalabilidad. Mientras que Clean Architecture provee las reglas técnicas de desacoplamiento y dirección de dependencias, Screaming Architecture define cómo debe organizarse visualmente el proyecto para que la estructura de carpetas refleje el negocio (las intenciones del sistema) y no las herramientas técnicas.

## 🤝 Contribuciones

¡Gracias por tu interés en este proyecto!

Si encuentras un error, tienes una sugerencia o deseas proponer una mejora, puedes:

- Abrir un **Issue** describiendo el problema o la idea.
- Hacer un **Fork** del repositorio y enviar un **Pull Request** con tus cambios.

Todas las contribuciones serán revisadas antes de ser integradas al proyecto.

Si este proyecto te resultó útil o te sirvió como referencia, considera darle una ⭐ al repositorio. ¡Gracias por tu apoyo!

### **📸 Capturas de Pantalla**

<div align="center">

Login Principal

<img src="frontend\ferreteriaApp\src\assets\screenshots\login.webp" width="800" alt="Login principal">

Dashboard Principal de la Ferreteria

<img src="frontend\ferreteriaApp\src\assets\screenshots\dashboard.webp" width="800" alt="Dashboard principal">

Siderbar

<img src="frontend\ferreteriaApp\src\assets\screenshots\siderbar.webp" width="800" alt="Interfaz Reportes">

Chatbot Ferreteria

<img src="frontend\ferreteriaApp\src\assets\screenshots\chatbot.webp" width="800" alt="ChatBot">

Interfaz Inventario

<img src="frontend\ferreteriaApp\src\assets\screenshots\inventario.webp" width="800" alt="Interfaz Inventario">

Interfaz Productos

<img src="frontend\ferreteriaApp\src\assets\screenshots\productos.webp" width="800" alt="Interfaz Productos">

Interfaz Reportes

<img src="frontend\ferreteriaApp\src\assets\screenshots\reportes.webp" width="800" alt="Interfaz Reportes">

Interfaz Venta

<img src="frontend\ferreteriaApp\src\assets\screenshots\reportes.webp" width="800" alt="Interfaz Reportes">

</div>

## 👨‍💻 **Desarrollador**

<p align="center">
  <br>
  <img src="/frontend/ferreteriaApp/src/assets/icon/wangling.jpg" alt="Foto de perfil" width="120" style="border-radius: 50%;">
  <br>
  <strong>WangLing</strong>
  <br>
  <em>Desarrollador Full-Stack | Apasionado por la tecnología y las soluciones empresariales</em>
</p>

<p align="center">
  <a href="https://github.com/wangling941">
    <img src="https://img.shields.io/badge/GitHub-wangling941-181717?style=for-the-badge&logo=github" alt="GitHub">
  </a>
  &nbsp;
  <a href="mailto:kevinvillegas.dev@gmail.com">
    <img src="https://img.shields.io/badge/Email-Contacto-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email">
  </a>
  &nbsp;
  <a href="https://www.linkedin.com/in/kevin-villegas-solis-7b0038366/">
    <img src="https://img.shields.io/badge/LinkedIn-Kevin%20Villegas%20Solis-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
</p>

<p align="center">
  Hecho con ❤️ para Ferretería July.
</p>
