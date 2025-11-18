# FlorteApp

Aplicativo web de interacción social para aprendices del SENA, construido con React + TypeScript en el cliente y Node.js + Express + MySQL en el servidor. Incluye autenticación JWT, modo claro/oscuro, gestión de perfiles, chats, biblioteca colaborativa, grupos, proyectos y un módulo de moderación con roles.

## Características principales

- **Autenticación JWT** con registro, inicio de sesión, recuperación y restablecimiento de contraseña.
- **Roles y moderación**: administradores, instructores y aprendices. Los administradores controlan el estado y rol de cada usuario desde el panel de moderación y pueden suspender cuentas.
- **Gestión de perfiles** con edición de datos y carga de avatar.
- **Panel principal** con resumen de chats, grupos, proyectos y recursos recientes.
- **Chats** privados o grupales con experiencia lista para integrar sockets en tiempo real.
- **Biblioteca de recursos** colaborativa con filtros y etiquetas.
- **Gestión de grupos y proyectos** para coordinar iniciativas académicas.
- **Diseño moderno** inspirado en el color institucional del SENA (`#39A900`) con soporte para video de fondo en pantallas de autenticación.

## Requisitos previos

- Node.js >= 18.17
- MySQL 8 o superior
- Gestor de paquetes (npm / pnpm / yarn)

## Configuración de la base de datos

1. Ejecuta el script de estructura:

   ```sql
   mysql -u <usuario> -p < database/schema.sql
   ```

2. Verifica que las tablas `users`, `user_sessions`, `chats`, `messages`, `study_groups`, `projects`, `library_resources`, etc., se hayan creado correctamente.

## Backend (`server/`)

```bash
cd server
cp .env.example .env      # Ajusta las variables a tu entorno
npm install
npm run dev               # Inicia el servidor en modo desarrollo (http://localhost:4000)
```

### Variables clave (`server/.env`)

| Variable             | Descripción                                           |
| -------------------- | ----------------------------------------------------- |
| `PORT`               | Puerto del servidor Express (por defecto 4000)        |
| `CLIENT_URL`         | URL del cliente autorizada para CORS                  |
| `DB_*`               | Credenciales y conexión a MySQL                       |
| `JWT_ACCESS_SECRET`  | Secreto para firmar los tokens de acceso              |
| `JWT_REFRESH_SECRET` | Secreto para tokens de refresco                       |
| `JWT_ACCESS_EXPIRY`  | Expiración del access token (ej. `15m`)               |
| `JWT_REFRESH_EXPIRY` | Expiración del refresh token (ej. `7d`)               |

Endpoints destacados bajo `/api`:

- `/auth/*`: registro, login, refresh, logout, recuperación de contraseña.
- `/profile/*`: consulta y actualización del perfil, avatar incluido.
- `/chats`, `/groups`, `/projects`, `/library`: recursos colaborativos.
- `/admin/users`: listado de usuarios, cambio de roles y activación/suspensión (solo administradores).

## Frontend (`client/`)

```bash
cd client
cp .env.example .env      # Ajusta la URL de la API
npm install
npm run dev               # Inicia Vite en http://localhost:5173
```

### Variables (`client/.env`)

| Variable              | Descripción                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `VITE_API_URL`        | URL base de la API (por defecto `http://localhost:4000/api`)     |
| `VITE_AUTH_VIDEO_URL` | (Opcional) Video MP4/WEBM para el fondo de las pantallas de auth |

## Arquitectura

- **`server/src`**
  - `config/`: entorno y pool MySQL.
  - `controllers/`, `services/`, `repositories/`: separación en capas.
  - `middleware/`: autenticación, control de errores y verificación de roles.
  - `validators/`: esquemas Zod para sanitizar la entrada.
- **`client/src`**
  - `components/`: UI reutilizable (botones, inputs, layout, toggles).
  - `pages/`: login, registro, recuperación, dashboard, perfil, chats, biblioteca, grupos, proyectos, moderación.
  - `services/`: cliente Axios con refresh automático de JWT.
  - `contexts/`: administración de sesión (`AuthContext`) y tema (`ThemeProvider`).

## Flujo de autenticación

1. Al iniciar sesión o registrarse se entregan tokens de acceso y refresco.
2. El cliente guarda la sesión en `localStorage` y envía el token en el header `Authorization`.
3. Cuando expira el access token, el cliente solicita uno nuevo usando el refresh token.
4. Los administradores pueden suspender usuarios; cuentas suspendidas no pueden autenticarse.

## Próximos pasos sugeridos

1. **Notificaciones en tiempo real**: integrar Socket.IO para mensajería instantánea y alertas.
2. **Almacenamiento externo**: conectar S3/Cloudinary para recursos y avatares.
3. **Pruebas automatizadas**: añadir suites unitarias e integraciones (Jest, Testing Library).
4. **CI/CD**: pipelines para despliegues y verificación continua.
5. **Internacionalización**: preparar la interfaz para varios idiomas.

## Licencia

Proyecto con fines educativos. Ajusta la licencia según las políticas de tu institución si deseas publicarlo.
