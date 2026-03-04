# Guía de despliegue: FlorteApp en Vercel + Railway

Esta guía detalla los pasos para desplegar el frontend en Vercel y el backend en Railway.

---

## Resumen de la arquitectura

```
┌─────────────────┐         ┌─────────────────────────────┐         ┌─────────────────┐
│  Vercel         │         │  Railway                    │         │  Cloudinary     │
│  (Frontend)     │  ────►  │  Backend (Express) + MySQL   │  ────►  │  (Imágenes CDN) │
│  React SPA      │  API    │                             │  upload │  Avatares, feed │
└─────────────────┘         └─────────────────────────────┘         └─────────────────┘
```

---

# PARTE A: RAILWAY (Backend)

## Paso A1: Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión con GitHub.
2. Clic en **"New Project"**.
3. Selecciona **"Deploy from GitHub repo"**.
4. Elige el repositorio **FlorteApp**.
5. Railway creará un servicio automáticamente.

---

## Paso A2: Configurar Root Directory

1. Haz clic en el servicio **FlorteApp** (icono de GitHub).
2. Ve a **Settings** (icono de engranaje).
3. Busca la sección **Source**.
4. En **Root Directory**, escribe: `server`.
5. Guarda. Railway redesplegará.

---

## Paso A3: Añadir MySQL

1. En el panel del proyecto, clic en **"+ New"**.
2. Elige **"Database"**.
3. Selecciona **"Add MySQL"**.
4. Espera a que el servicio MySQL esté **Online**.

---

## Paso A4: Conectar MySQL al backend (IMPORTANTE)

Railway debe inyectar las variables de MySQL en tu backend. Hay dos formas:

### Opción 1: Conectar servicios (recomendada)

1. Haz clic en el servicio **FlorteApp** (backend).
2. Ve a **Variables**.
3. Busca **"Add Variable"** o **"Connect"**.
4. Si ves **"Add Reference"** o **"Connect to MySQL"**, úsala para vincular el servicio MySQL.
5. Railway inyectará automáticamente `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`.

### Opción 2: Copiar valores manualmente

Si la Opción 1 no está disponible o no funciona:

1. Haz clic en el servicio **MySQL**.
2. Ve a **Variables** o **Connect**.
3. Copia los valores reales de:
   - `MYSQLHOST` (ej: `mysql.railway.internal` o `monorail.proxy.rlwy.net`)
   - `MYSQLPORT` (normalmente `3306`)
   - `MYSQLUSER` (ej: `root`)
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE` (ej: `railway`)

4. Haz clic en el servicio **FlorteApp** (backend).
5. Ve a **Variables**.
6. Añade o edita estas variables con los valores copiados:

| Variable     | Valor (pega el valor real de MySQL) |
|-------------|--------------------------------------|
| `DB_HOST`   | Valor de MYSQLHOST (ej: `mysql.railway.internal`) |
| `DB_PORT`   | `3306` |
| `DB_USER`   | Valor de MYSQLUSER (ej: `root`) |
| `DB_PASSWORD` | Valor de MYSQLPASSWORD |
| `DB_NAME`   | Valor de MYSQLDATABASE (ej: `railway`) |

**No uses `${{...}}`** — pega los valores directos.

---

## Paso A5: Añadir el resto de variables del backend

En el servicio **FlorteApp** → **Variables**, asegúrate de tener:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://tu-app.vercel.app` (cambiarás esto después con la URL real de Vercel) |
| `JWT_ACCESS_SECRET` | Ejecuta `openssl rand -hex 32` en tu terminal y pega el resultado |
| `JWT_REFRESH_SECRET` | Ejecuta de nuevo `openssl rand -hex 32` y pega un valor distinto |

**No añadas `PORT`** — Railway lo asigna automáticamente.

---

## Paso A5b: Configurar Cloudinary (IMPORTANTE para imágenes)

Las fotos de perfil, publicaciones, historias y adjuntos se almacenan en **Cloudinary** (CDN global, persistente, escalable).

1. Crea cuenta gratis en [cloudinary.com](https://cloudinary.com).
2. En el Dashboard → **Settings** → **API Keys** copia:
   - **Cloud name**
   - **API Key**
   - **API Secret**
3. En Railway → servicio **FlorteApp** → **Variables** añade:

| Variable | Valor |
|----------|-------|
| `CLOUDINARY_CLOUD_NAME` | Tu Cloud name |
| `CLOUDINARY_API_KEY` | Tu API Key |
| `CLOUDINARY_API_SECRET` | Tu API Secret |

Sin estas variables, las subidas de imágenes fallarán en producción.

---

## Paso A6: Generar dominio público

1. Con el servicio **FlorteApp** seleccionado (no MySQL), ve a **Settings**.
2. Busca **Networking** o **Public Networking**.
3. Clic en **"Generate Domain"**.
4. Copia la URL generada (ej: `https://florteapp-production-xxxx.up.railway.app`).
5. La API estará en: `https://tu-url.railway.app/api`.

---

## Paso A7: Verificar el backend

1. Espera a que el deploy termine (estado **Active** o **Running**).
2. Abre en el navegador: `https://tu-url.railway.app/health`
3. Deberías ver: `{"status":"ok","timestamp":"..."}`

**Si falla:** Revisa los logs en **Deployments** → último deploy → **View Logs**. Si ves "Failed to connect to MySQL", vuelve al Paso A4 y asegúrate de que `DB_HOST` tenga el valor correcto (no `localhost`).

---

# PARTE B: VERCEL (Frontend)

## Paso B1: Crear proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. Clic en **"Add New"** → **"Project"**.
3. Importa el repositorio **FlorteApp**.
4. Selecciona la rama **main** (o **Solano** si es tu rama principal).

---

## Paso B2: Configuración del proyecto

En la pantalla de configuración:

- **Root Directory:** `.` (raíz del repo)
- **Framework Preset:** Vite (o "Other" si no lo detecta)
- **Build Command:** `cd client && npm ci && npm run build` (o el de `vercel.json`)
- **Output Directory:** `client/dist`
- **Install Command:** `npm install` (o déjalo por defecto)

El archivo `vercel.json` en la raíz ya define esto; Vercel lo usará automáticamente.

---

## Paso B3: Variables de entorno

Antes de desplegar, en **Environment Variables**:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `VITE_API_URL` | `https://tu-url-railway.app/api` | Production, Preview |

Sustituye `tu-url-railway.app` por la URL real de Railway del Paso A6.

---

## Paso B4: Desplegar

1. Clic en **"Deploy"**.
2. Espera a que termine el build.
3. Copia la URL de tu app (ej: `https://florteapp.vercel.app`).

---

# PARTE C: INTEGRACIÓN FINAL

## Paso C1: Actualizar CLIENT_URL en Railway

1. Vuelve a Railway → servicio **FlorteApp** → **Variables**.
2. Edita `CLIENT_URL` y pon la URL real de Vercel:
   ```
   CLIENT_URL=https://florteapp.vercel.app
   ```
3. Railway redesplegará automáticamente.

---

## Paso C2: Probar la aplicación

1. Abre la URL de Vercel.
2. Regístrate o inicia sesión.
3. Prueba subir avatar, crear publicaciones, chats, etc.
4. Si hay errores de CORS, verifica que `CLIENT_URL` coincida exactamente con la URL de Vercel (incluyendo `https://`).

---

# Resumen de URLs

| Servicio | URL ejemplo |
|----------|-------------|
| Frontend (Vercel) | `https://florteapp.vercel.app` |
| Backend API (Railway) | `https://florteapp-production.up.railway.app/api` |
| Health check | `https://florteapp-production.up.railway.app/health` |
| API Docs (Swagger) | `https://florteapp-production.up.railway.app/api-docs` |

---

# Solución de problemas

## "Failed to connect to MySQL" / ECONNREFUSED en ::1

- **Causa:** `DB_HOST` está vacío o es `localhost`.
- **Solución:** Ve al Paso A4. Copia el valor real de `MYSQLHOST` del servicio MySQL y pégalo en `DB_HOST` del servicio FlorteApp.

## "Failed to respond" al abrir la URL de Railway

- Usa la URL **sin** puerto: `https://tu-url.railway.app` (no `:8080`).
- Verifica que el deploy esté en estado **Active**.
- Prueba primero: `https://tu-url.railway.app/health`.

## Login / Registro no funciona (frontend carga pero auth falla)

**Causa más común:** El frontend no apunta al backend correcto.

1. **VITE_API_URL en Vercel**
   - Las variables `VITE_*` se incluyen en el build. Si no estaban al desplegar, el frontend usa `http://localhost:4000/api`.
   - En Vercel: **Settings** → **Environment Variables** → añade `VITE_API_URL` = `https://tu-url-railway.app/api`.
   - **Importante:** Después de añadir o cambiar variables, haz **Redeploy** (Deployments → ⋮ → Redeploy).

2. **CLIENT_URL en Railway**
   - Debe coincidir con la URL de Vercel (ej: `https://florteapp.vercel.app`).
   - Sin barra final.
   - Si usas preview deployments, puedes poner varias URLs separadas por coma: `https://app.vercel.app,https://app-xxx.vercel.app`.

3. **Comprobar en el navegador**
   - Abre DevTools (F12) → pestaña **Network**.
   - Intenta iniciar sesión.
   - Revisa la petición a `/auth/login`: ¿va a la URL de Railway o a localhost?
   - Si va a localhost, falta o está mal `VITE_API_URL` en Vercel y hay que redesplegar.

## CORS en el frontend

- Verifica que `CLIENT_URL` en Railway sea exactamente la URL de Vercel (con `https://`).
- No añadas barra final: `https://florteapp.vercel.app` (no `https://florteapp.vercel.app/`).

## Imágenes no se ven / Error al subir fotos

**Causa:** Falta la configuración de Cloudinary en Railway.

**Solución – Configurar Cloudinary:**

1. Crea cuenta en [cloudinary.com](https://cloudinary.com) (plan gratuito disponible).
2. Dashboard → **Settings** → **API Keys**: copia Cloud name, API Key y API Secret.
3. En Railway → servicio **FlorteApp** → **Variables** añade:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Railway redesplegará automáticamente.

Las imágenes se sirven desde la CDN de Cloudinary (alta disponibilidad, velocidad global).
