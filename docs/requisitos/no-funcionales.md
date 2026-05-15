# REQUERIMIENTOS NO FUNCIONALES

## Proyecto

Desarrollo de una Aplicación Móvil para la Gestión Integral de Ventas, Inventario y Métricas Empresariales en la Ferretería July.

---

# RNF01 — Seguridad de acceso

El sistema deberá implementar autenticación segura mediante:

- JWT,
- contraseñas cifradas con bcrypt,
- control de sesiones.

---

# RNF02 — Protección de información

El sistema deberá proteger los datos almacenados evitando accesos no autorizados.

---

# RNF03 — Arquitectura Screaming + Clean

El sistema deberá implementar una arquitectura basada en los principios de:

- Screaming Architecture,
- Clean Architecture,
- separación de responsabilidades,

con el objetivo de mantener un código organizado, escalable, reutilizable y fácil de mantener.

---

# RNF04 — Escalabilidad

La arquitectura deberá permitir incorporar nuevos módulos y funcionalidades sin afectar el funcionamiento del sistema existente.

---

# RNF05 — Mantenibilidad del sistema

La solución deberá mantener una estructura desacoplada y modular mediante la organización por módulos funcionales:

- ventas,
- productos,
- inventario,
- usuarios,
- reportes,
- dashboard,
- autenticación.

Esto facilitará:

- mantenimiento,
- pruebas,
- reutilización,
- escalabilidad futura.

---

# RNF06 — Rendimiento

El sistema deberá responder de manera rápida y fluida durante operaciones de:

- ventas,
- consultas,
- reportes,
- navegación.

---

# RNF07 — Disponibilidad

La aplicación deberá estar disponible durante el horario operativo de la ferretería.

---

# RNF08 — Usabilidad

La interfaz deberá ser:

- intuitiva,
- moderna,
- clara,
- fácil de utilizar.

---

# RNF09 — Responsive Design

La aplicación deberá adaptarse correctamente a:

- dispositivos móviles Android,
- tablets,
- distintas resoluciones de pantalla.

---

# RNF10 — Compatibilidad

El sistema deberá funcionar correctamente en:

- Android,
- navegadores modernos compatibles con Ionic y Angular.

---

# RNF11 — Integridad de datos

La base de datos deberá garantizar consistencia y confiabilidad en las operaciones realizadas.

---

# RNF12 — Disponibilidad en tiempo real

La información relacionada con:

- ventas,
- inventario,
- métricas,
  deberá actualizarse en tiempo real o casi en tiempo real.

---

# RNF13 — Respaldo de información

El sistema deberá permitir la realización de copias de seguridad de la base de datos.

---

# RNF14 — Reutilización de componentes

El frontend deberá utilizar componentes reutilizables para mejorar:

- mantenibilidad,
- escalabilidad,
- organización visual.

---

# RNF15 — Separación de capas del sistema

La aplicación deberá implementar separación entre:

- frontend móvil,
- backend empresarial,
- lógica de negocio,
- acceso a datos,
- almacenamiento persistente,

siguiendo principios de arquitectura limpia y desacoplamiento entre capas.

---

# RNF16 — Calidad y organización del código

El desarrollo deberá seguir buenas prácticas de ingeniería de software:

- modularidad,
- separación de responsabilidades,
- reutilización,
- nomenclatura clara,
- estructura escalable,
- bajo acoplamiento,
- alta cohesión.

---

# RNF17 — Experiencia de usuario

La aplicación deberá minimizar pasos innecesarios y optimizar los flujos operativos para mejorar la experiencia del usuario.

---

# RNF18 — Escalabilidad futura

La solución deberá permitir futuras integraciones como:

- exportación PDF,
- exportación Excel,
- notificaciones,
- impresión Bluetooth,
- integración con sistemas externos.
