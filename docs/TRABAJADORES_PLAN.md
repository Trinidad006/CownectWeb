# Plan: sesión Dueño / Trabajador (solo premium)

Rama de trabajo: `feature/trabajadores-rancho`.

## Objetivo de producto

- Tras iniciar sesión con correo/contraseña (Firebase), los usuarios **premium** eligen sesión: **Dueño de rancho** o **Trabajador**.
- **Dueño**: el panel actual (sin cambios de alcance en esta primera fase).
- **Trabajador**: mismo panel en apariencia, pero **sin editar ni borrar** datos existentes; solo **ver** y **agregar**. Lo agregado por trabajadores queda **pendiente de aprobación** del dueño (pendiente de implementar en fases siguientes).
- El dueño gestiona trabajadores con **usuario + contraseña** (credenciales que él asigna). Puede existir un usuario por defecto `usuario` / `12345` para la primera sesión extra.
- Contraseña aparte del dueño para acciones sensibles (aprobaciones, alta de trabajadores): por defecto igual que la cuenta al configurarse; cambiable en configuración (fase posterior; requiere almacenar hash en Firestore y flujo UI).

## Fases

### Fase 1 (esta rama — base técnica)

- Pantalla `/select-session` solo premium tras login.
- Pantalla `/worker-login`: correo del dueño + usuario trabajador + contraseña.
- Subcolección `usuarios/{ownerUid}/trabajadores/{id}` con `username`, `password_salt`, `password_hash`, `activo`, `created_at`.
- APIs servidor: login (emite **Firebase Custom Token** con claims `tipo: 'trabajador'`, `owner_uid`, `worker_id`), crear trabajador (Bearer ID token del dueño), `setup-default` para crear `usuario`/`12345` si no hay trabajadores.
- `useAuth` y `ProtectedRoute`: sesión trabajador reconoce claims; **no exige email verificado** en Firebase para esa sesión.
- Reglas Firestore: el trabajador puede **leer** datos del rancho (`usuario_id == owner_uid` en claims); **crear** animales/pesos/vacunaciones/eventos asociados al dueño; **no actualizar ni borrar** animales ni editar pesos/vacunaciones/eventos (salvo lo que ya permitía el modelo).

### Fase 2 (en progreso en rama `feature/trabajadores-rancho`)

- **Hecho:** `/dashboard/trabajadores` — listado, alta (usuario/contraseña), activar/desactivar, enlace a predeterminado `usuario`/`12345`. `GET/PATCH` API. Acceso rápido en dashboard (solo dueño premium).
- **Hecho:** Bloqueo UI trabajador en gestión (sin editar animal, marcar inactivo, ordeña/seca), documentación (solo lectura + sin certificados), animales inactivos (sin reactivar).
- **Pendiente:** reset de contraseña desde panel; marcar altas con `creado_por_trabajador_id` y flujo de aprobación del dueño; resto de pantallas si añaden edición (fertilidad, etc.).

### Fase 3

- Bandeja de aprobaciones en panel del dueño; verificación con contraseña de panel (hash guardado; inicialización guiada).
- Notificaciones o contador en header.

### Fase 4

- Auditoría, límites por número de trabajadores, revocación inmediata (desactivar + invalidar sesión).

### Fase 5 (móvil)

- Misma semántica de sesión y custom token o API equivalente según arquitectura Flutter.

## Decisiones de arquitectura

- **Custom Token de Firebase** para que el SDK cliente siga leyendo Firestore con reglas basadas en `request.auth.token`.
- UID sintético: `trabajador_{ownerUid}_{workerDocId}` (caracteres seguros para Auth).
- El objeto `User` en cliente usa `id === ownerUid` para consultas (`usuario_id`), y flags `es_sesion_trabajador`, `trabajador_id` para auditoría y UI.

## Despliegue

- Tras merge, desplegar **reglas Firestore** actualizadas en la consola de Firebase.
- Las rutas API requieren credenciales Admin ya usadas en el proyecto.
