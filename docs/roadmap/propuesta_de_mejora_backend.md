# Roadmap de mejora para Backend - Ferretería July Backend

## Fase 1: Seguridad y estabilidad (prioridad alta)

- [ ] Implementar rate limiting (`express-rate-limit`).
- [ ] Añadir Helmet para seguridad de cabeceras.
- [ ] Configurar CORS con lista blanca de dominios.
- [ ] Sanitizar campos de entrada (nombre cliente, fullName, etc.) con `validator`.
- [ ] Mejorar graceful shutdown con `terminus` o timeout.
- [ ] Agregar logging estructurado (Winston) y almacenar logs.
- [ ] Escribir pruebas unitarias para servicios críticos.

## Fase 2: Rendimiento y experiencia de usuario

- [ ] Cachear métricas del dashboard con Redis.
- [ ] Extender paginación a todos los endpoints de listado.
- [ ] Integrar WebSockets para actualizaciones en tiempo real (stock, notificaciones).
- [ ] Crear índices en BD para consultas frecuentes.
- [ ] Activar compresión gzip en respuestas.
- [ ] Mejorar chatbot con NLP básico.

## Fase 3: Escalabilidad y arquitectura

- [ ] Migrar a TypeScript.
- [ ] Evaluar separación en microservicios.
- [ ] Implementar event-driven architecture para desacoplar módulos.
- [ ] Configurar CI/CD con GitHub Actions.
- [ ] Documentar API con Swagger.
- [ ] Realizar pruebas de carga y optimizar consultas.
