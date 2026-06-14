const cors = require("cors");
const express = require("express");

const { env } = require("./config/env");
const authRoutes = require("./modules/auth/auth.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const inventarioRoutes = require("./modules/inventario/inventario.routes");
const productosRoutes = require("./modules/productos/productos.routes");
const reportesRoutes = require("./modules/reportes/reportes.routes");
const usuariosRoutes = require("./modules/usuarios/usuarios.routes");
const ventasRoutes = require("./modules/ventas/ventas.routes");
const {
  errorHandler,
  notFound,
} = require("./shared/middlewares/error.middleware");
const categoriasRoutes = require("./modules/categorias/categorias.routes");
const notificationsRoutes = require("./modules/notifications/notifications.routes");
const chatbotRoutes = require("./modules/chatbot/chatbot.routes");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Ferreteria July API is running",
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/chatbot", chatbotRoutes);
app.use("/api/v1/notificaciones", notificationsRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/productos", productosRoutes);
app.use("/api/v1/inventario", inventarioRoutes);
app.use("/api/v1/ventas", ventasRoutes);
app.use("/api/v1/reportes", reportesRoutes);
app.use("/api/v1/usuarios", usuariosRoutes);
app.use("/api/v1/categorias", categoriasRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
