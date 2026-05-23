# PASO 1 — ABRIR PGADMIN

En el panel izquierdo deberías ver algo parecido a:

Servers

Haz clic ahí.

SI TE PIDE PASSWORD

Pon la contraseña que elegiste cuando instalaste PostgreSQL.

Ejemplo:

123456

(la que tú hayas puesto)

# PASO 2 — CREAR LA BASE DE DATOS

Dentro de:

Databases

clic derecho:

Create > Database

Nombre:

ferreteria_july

Guardar.

# PASO 3 — CONFIGURAR .ENV

Ahora en VSCode:

Ir a:

backend/.env
COLOCAR ESTO
PORT=3000

JWT_SECRET=ferreteria_july_secret

DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/ferreteria_july?schema=public"
