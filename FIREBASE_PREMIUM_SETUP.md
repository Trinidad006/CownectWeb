# Plan Premium en Firebase (Cownect)

## Estructura en Firestore

### Colección `usuarios`

Cada documento de usuario puede tener estos campos relacionados con el plan premium:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `plan` | string | `'gratuito'` o `'premium'` |
| `suscripcion_activa` | boolean | `true` si el usuario tiene suscripción activa |
| `suscripcion_fecha` | string | ISO date de cuándo se activó (ej: `2025-02-09T...`) |

### Colección `paypal_pending_subscriptions`

Órdenes de suscripción pendientes de capturar. La API crea un documento por `orderID` con:

- `userId`: ID del usuario
- `amount`: valor de la suscripción
- `currency`: moneda (USD)
- `createdAt`: timestamp

Tras capturar el pago, la API actualiza `usuarios/{userId}` con `plan: 'premium'` y `suscripcion_activa: true`, y elimina el documento pendiente.

## Desplegar reglas

1. Instala Firebase CLI: `npm install -g firebase-tools`
2. Inicia sesión: `firebase login`
3. En la raíz del proyecto, crea `firebase.json` si no existe:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

4. Despliega: `firebase deploy --only firestore`

## Firebase Admin SDK (recomendado para producción)

Las rutas API de PayPal usan **Firebase Admin SDK** cuando hay credenciales configuradas. Esto bypasea las reglas de Firestore y permite actualizar `usuarios` desde el servidor.

**Configuración en `.env.local`** (desde Firebase Console → Configuración → Cuentas de servicio → Generar nueva clave privada):

```
FIREBASE_PROJECT_ID=tu-project-id
# o usa NEXT_PUBLIC_FIREBASE_PROJECT_ID si ya lo tienes

FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Copia `project_id`, `client_email` y `private_key` del JSON de la cuenta de servicio. En `FIREBASE_PRIVATE_KEY`, conserva los `\n` literales (o escríbelos como saltos de línea reales).

Si no configuras Admin, las rutas usan el SDK cliente (puede fallar con reglas estrictas).
