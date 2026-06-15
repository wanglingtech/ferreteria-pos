<p align="center">
  <img src="frontend/ferreteriaApp/src/assets/logo/logo_ferreteria.png" alt="Ferretería July Logo" width="120">
</p>

<h1 align="center">🛠️ Ferretería July POS</h1>
<p align="center">
  <strong>Sistema de Punto de Venta y Gestión Empresarial Integral</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Estado-Producción-brightgreen" alt="Estado: Producción">
  <img src="https://img.shields.io/badge/versión-1.0.0-blue" alt="Versión 1.0.0">
  <img src="https://img.shields.io/badge/Licencia-MIT-green" alt="Licencia MIT">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stack-Angular%20%7C%20Ionic%20%7C%20Node.js%20%7C%20Express%20%7C%20Prisma%20%7C%20PostgreSQL-333333" alt="Tech Stack">
  <img src="https://img.shields.io/badge/Type-ERP%20%26%20POS-5C2D91" alt="Tipo: ERP y POS">
</p>

---

## 📖 **Descripción General**

**Ferretería July** es un sistema empresarial completo, diseñado para optimizar la gestión de ventas, inventario y operaciones de una ferretería. Nacido de una colaboración freelance con un negocio real, este software resuelve problemas cotidianos como la falta de control de stock, la gestión manual de ventas y la ausencia de métricas en tiempo real.

El sistema ofrece una experiencia unificada: desde un **Punto de Venta (POS)** ágil e intuitivo hasta un potente **panel de control** con gráficos y alertas automatizadas, todo construido sobre una arquitectura moderna y escalable.

---

## ✨ **Funcionalidades Principales**

- **📈 Dashboard Ejecutivo**: Visualiza en tiempo real las métricas más importantes del negocio: ventas del día, ticket promedio, y productos más vendidos.
- **🧾 Punto de Venta (POS)**: Interfaz rápida para registrar ventas, gestionar carrito de compras, administrar clientes y generar comprobantes descargables en PDF o imagen con un solo clic.
- **🏷️ Gestión de Inventario**: Controla el stock con alertas automáticas de bajo inventario, gestiona categorías y productos, y lleva un historial de movimientos.
- **👥 Gestión de Usuarios y Roles**: Sistema de autenticación seguro con roles de `Administrador` y `Vendedor`, permitiendo control granular de accesos y permisos.
- **📊 Centro de Reportes y Análisis**: Genera reportes de ventas por fechas, visualiza gráficos de evolución, exporta a CSV/PDF y consulta los productos más vendidos.
- **🤖 Asistente Inteligente (Chatbot)**: Integración con OpenAI para un chatbot que responde preguntas sobre ventas, inventario, genera gráficos y ofrece sugerencias, mejorando la experiencia de usuario y el soporte.
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

cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init

# Instalar dependencias del frontend

cd ../frontend/ferreteriaApp
npm install

# 3.Iniciar la Aplicación

-Iniciar el backend:

bash
cd backend
npm run dev

-Iniciar el frontend:

bash
cd frontend/ferreteriaApp
ionic serve

# 🏗️ Arquitectura del Proyecto

El sistema está construido bajo una Arquitectura Limpia, separando el código en capas bien definidas para garantizar mantenibilidad y escalabilidad.
![alt text](image.png)

# 🤝 Contribuciones

Las contribuciones son lo que hacen a la comunidad de código abierto un lugar increíble para aprender, inspirar y crear. ¡Cualquier contribución que hagas será muy apreciada! Si tienes una sugerencia para mejorar esto, por favor, haz un fork del repositorio y crea un pull request. También puedes abrir un issue con la etiqueta "enhancement".

No olvides darle una ⭐ al proyecto si te fue útil.

## 👨‍💻 **Desarrollador**

<p align="center">
  <br>
  <img src="frontend/ferreteriaApp/src/assets/icon/wangling.jpg" alt="Foto de perfil" width="120" style="border-radius: 50%;">
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
  <a href="mailto:kevinvillegassolisxd@gmail.com">
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
