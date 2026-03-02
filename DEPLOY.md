# Guía de despliegue: FlorteApp en Vercel + Railway

Esta guía detalla los pasos para desplegar el frontend en Vercel y el backend en Railway.

---

## Resumen de la arquitectura

```
┌─────────────────┐         ┌─────────────────────────────┐
│  Vercel         │         │  Railway                    │
│  (Frontend)     │  ────►  │  Backend (Express) + MySQL   │
│  React SPA      │  API    │  uploads/ (efímero)         │
└─────────────────┘         └─────────────────────────────┘
```

---

## Paso 1: Desplegar el backend en Railway

### 1.1 Crear cuenta y proyecto

1. Ve a [railway.app](https://railway.app) y regístrate con GitHub.
2. Clic en **"New Project"**.
3. Selecciona **"Deploy from GitHub repo"**.
4. Conecta tu repositorio de FlorteApp (autoriza Railway si es necesario).
5. En **"Root Directory"**, selecciona o escribe: `server`.
6. Railway detectará Node.js automáticamente.

### 1.2 Añadir base de datos MySQL

1. En el proyecto, clic en **"New"**.
2. Elige **"Database"** > **"Add MySQL"**.
3. Railway creará la base de datos y expondrá variables como `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`.

### 1.3 Vincular MySQL al servicio del backend

1. Haz clic en el servicio del backend (el que desplegaste desde `server/`).
2. Ve a **"Variables"**.
3. Railway permite referenciar variables de otros servicios. Añade las variables necesarias:

| Variable | Valor (usa la referencia de Railway si aplica) |
|----------|------------------------------------------------|
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://tu-app.vercel.app` (actualiza después del paso 2) |
| `JWT_ACCESS_SECRET` | Genera uno: `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Genera otro distinto: `openssl rand -hex 32` |
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` o el valor de MYSQLHOST |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` o `3306` |
| `DB_USER` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `DB_NAME` | `${{MySQL.MYSQLDATABASE}}` |

**Nota:** El servidor también acepta `MYSQLHOST`, `MYSQLUSER`, etc. directamente si Railway las inyecta en el mismo servicio.

### 1.4 Inicializar el esquema de la base de datos

El servidor crea las tablas automáticamente al iniciar (`initDb`). Tras el primer deploy, las tablas se crearán solas.

Si prefieres usar el script manual:

```bash
mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p<MYSQLPASSWORD> <MYSQLDATABASE> < database/schema.sql
```

### 1.5 Obtener la URL pública del backend

1. En el servicio del backend, ve a **"Settings"** > **"Networking"**.
2. Clic en **"Generate Domain"** para crear una URL pública.
3. Anota la URL (ej: `https://florteapp-server-production.up.railway.app`).
4. La API estará en: `https://tu-url.railway.app/api`.

---

## Paso 2: Desplegar el frontend en Vercel

### 2.1 Conectar el repositorio

1. Ve a [vercel.com](https://vercel.com) y regístrate con GitHub.
2. Clic en **"Add New"** > **"Project"**.
3. Importa el repositorio de FlorteApp.

### 2.2 Configurar el proyecto

En la pantalla de configuración:

- **Root Directory:** Deja en `.` (raíz) o selecciona la raíz del repo.
- **Framework Preset:** Vercel detectará la configuración desde `vercel.json`.
- **Build Command:** Se usa el de `vercel.json` (`cd client && npm ci && npm run build`).
- **Output Directory:** `client/dist` (definido en `vercel.json`).

### 2.3 Variables de entorno

En **Settings** > **Environment Variables**, añade:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `VITE_API_URL` | `https://tu-url.railway.app/api` | Production, Preview |

Sustituye `tu-url.railway.app` por la URL real de Railway del paso 1.5.

### 2.4 Desplegar

1. Clic en **"Deploy"**.
2. Espera a que termine el build.
3. Anota la URL de tu app (ej: `https://florteapp.vercel.app`).

---

## Paso 3: Completar la integración

### 3.1 Actualizar CLIENT_URL en Railway

1. Vuelve a Railway > servicio del backend > **Variables**.
2. Actualiza `CLIENT_URL` con la URL final de Vercel:

   ```
   CLIENT_URL=https://florteapp.vercel.app
   ```

3. Railway redesplegará automáticamente con la nueva variable.

### 3.2 Probar la aplicación

1. Abre la URL de Vercel.
2. Regístrate o inicia sesión.
3. Prueba subir avatar, crear publicaciones, chats, etc.
4. Si hay errores de CORS, verifica que `CLIENT_URL` coincida exactamente con la URL de Vercel (incluyendo `https://`).

---

## Consideraciones importantes

### Archivos subidos (uploads)

Railway usa un sistema de archivos **efímero**. Los archivos subidos (avatares, covers, feed, etc.) se pierden al reiniciar o redesplegar el servicio. Para producción seria, considera:

- **Vercel Blob** o **AWS S3** / **Cloudinary** para almacenar archivos.
- Modificar `server/src/config/storage.ts` para usar almacenamiento externo.

### Base de datos

- Railway MySQL tiene plan gratuito limitado.
- Asegúrate de ejecutar el script de esquema antes de usar la app.

### Dominios personalizados

- En Vercel: Settings > Domains.
- En Railway: Settings > Networking > Custom Domain.
- Actualiza `CLIENT_URL` y `VITE_API_URL` si usas dominios propios.

---

## Resumen de URLs

| Servicio | URL ejemplo |
|----------|-------------|
| Frontend (Vercel) | `https://florteapp.vercel.app` |
| Backend API (Railway) | `https://florteapp-server.up.railway.app/api` |
| API Docs (Swagger) | `https://florteapp-server.up.railway.app/api-docs` |
