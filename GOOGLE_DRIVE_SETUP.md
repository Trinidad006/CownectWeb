# Configuración de Google Drive para subir imágenes y documentos

Puedes usar **tu carpeta en "Mi unidad"** (cuenta personal, sin Workspace) con **OAuth**, o una **Unidad compartida** con **cuenta de servicio**.

---

## Opción A: OAuth – Carpeta en "Mi unidad" (recomendado si no tienes Workspace)

Las subidas se hacen con **tu cuenta de Google** (gerardoavilesmoreno28@gmail.com). Los archivos se guardan en tu "Mi unidad" y usan tu cuota. No necesitas Workspace.

### 1. Google Cloud Console

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) (mismo proyecto donde tienes la cuenta de servicio, si ya lo creaste).
2. **APIs y servicios** → **Biblioteca** → activa **Google Drive API** si no está activa.
3. **APIs y servicios** → **Credenciales** → **Crear credenciales** → **ID de cliente de OAuth**.
4. Tipo de aplicación: **Aplicación web**.
5. Nombre: por ejemplo `Cownect Drive`.
6. En **URIs de redirección autorizados** añade (según donde corras la app):
   - `http://localhost:3000/api/drive-auth`
   - Si usas otro puerto: `http://localhost:3001/api/drive-auth` (o el que uses).
7. Crear. Copia el **ID de cliente** y el **Secreto de cliente**.

### 2. Carpeta en tu Drive

1. En [Google Drive](https://drive.google.com) con **gerardoavilesmoreno28@gmail.com**, crea una carpeta en **Mi unidad** (ej. **Cownect Subidas**).
2. Abre la carpeta y copia el **ID** de la URL:
   - `https://drive.google.com/drive/folders/XXXXXXXXXXXX` → el ID es `XXXXXXXXXXXX`.

### 3. Obtener el refresh token (una sola vez)

1. En `.env.local` añade (sin el refresh token todavía):

```env
GOOGLE_DRIVE_FOLDER_ID=XXXXXXXXXXXX
GOOGLE_DRIVE_CLIENT_ID=tu-id-de-cliente.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=tu-secreto-de-cliente
```

2. Reinicia la app (`npm run dev`).
3. En el navegador abre: **http://localhost:3000/api/drive-auth** (o el puerto que uses).
4. Inicia sesión con **gerardoavilesmoreno28@gmail.com** y acepta los permisos.
5. Te llevará a una página con un **refresh token**. Cópialo.
6. En `.env.local` añade:

```env
GOOGLE_DRIVE_REFRESH_TOKEN=el-token-que-te-dio-la-pagina
```

7. Reinicia de nuevo la app. A partir de ahí las subidas irán a tu carpeta en "Mi unidad".

---

## Opción B: Cuenta de servicio + Unidad compartida (si tienes Workspace)

Si usas **Unidad compartida** (Shared Drive), la app puede usar una **cuenta de servicio** en lugar de OAuth.

### 1. Proyecto y cuenta de servicio

1. En [Google Cloud Console](https://console.cloud.google.com/): proyecto → **APIs y servicios** → **Biblioteca** → activa **Google Drive API**.
2. **Credenciales** → **Crear credenciales** → **Cuenta de servicio** → crea una (ej. `cownect-upload`) y descarga el JSON.

### 2. Unidad compartida y carpeta

1. En Drive crea una **Unidad compartida** (Nuevo → Unidad compartida).
2. Dentro, crea una carpeta y copia su **ID** de la URL.
3. En la **Unidad compartida** (no solo la carpeta): **Gestionar miembros** y añade el email de la cuenta de servicio (del JSON, `client_email`) como **Administrador de contenido**.

### 3. Configurar la app

En `.env.local`:

```env
GOOGLE_DRIVE_FOLDER_ID=id-de-la-carpeta-dentro-de-la-unidad-compartida
GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH=./google-drive-service-account.json
```

(No uses a la vez OAuth y cuenta de servicio: si está definido `GOOGLE_DRIVE_REFRESH_TOKEN`, se usará OAuth; si no, la cuenta de servicio.)

---

## Resumen

- **Carpeta en "Mi unidad"** (sin Workspace): usa **Opción A (OAuth)**. Solo necesitas crear un cliente OAuth, la carpeta en Mi unidad y obtener el refresh token una vez.
- **Unidad compartida**: usa **Opción B** (cuenta de servicio + Shared Drive).
- Los archivos se suben con permiso "Cualquier persona con el enlace" para que la app pueda mostrar las imágenes.
