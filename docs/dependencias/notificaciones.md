# Prisma migrate dev en el backend

npx prisma migrate dev --schema=src/prisma/schema.prisma

# Si no queremos poner la ruta, añadimos una clase en el backend

prisma.config.ts

// backend/prisma.config.ts
import { defineConfig } from 'prisma/config';

export default defineConfig({
schema: 'src/prisma/schema.prisma',
});
