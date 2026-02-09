# Configuración de PayPal (Cownect)

Para que los compradores puedan pagar con PayPal en el marketplace:

## 1. Crear una app en PayPal Developer

1. Entra a [developer.paypal.com](https://developer.paypal.com) e inicia sesión.
2. En **Dashboard** → **My Apps & Credentials**.
3. Crea una app (o usa la que ya tengas).
4. En **Sandbox** verás **Client ID** y **Secret**. Para producción, cambia a **Live** y usa esas credenciales.

## 2. Variables de entorno

En `.env.local` añade:

```env
# Cliente (público, para el botón en el navegador)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=tu-client-id-de-paypal

# Secret (solo servidor, NUNCA lo subas al repo)
PAYPAL_CLIENT_SECRET=tu-secret-de-paypal

# true = pruebas (sandbox), quitar o false = producción
PAYPAL_SANDBOX=true
```

## 3. Monedas

PayPal acepta varias monedas (USD, EUR, MXN, BRL, etc.). La app usa la moneda del país del vendedor. Si la moneda no es soportada por PayPal, en el modal se puede mostrar error; en ese caso conviene que el vendedor use un país con moneda soportada (por ejemplo USD) o configurar conversión a USD en tu lógica.

## 4. Flujo de pago

1. El comprador elige un animal y hace clic en comprar.
2. Se abre el modal con el importe y el botón de PayPal.
3. Al hacer clic en PayPal, se crea una orden en PayPal y el usuario paga en la ventana de PayPal.
4. Tras aprobar el pago, se captura el dinero y se registra la compra en Firestore (animal en proceso de venta).
5. Comprador y vendedor pueden completar o cancelar la venta desde el Dashboard como hasta ahora.

## 5. Firestore

La API guarda órdenes pendientes en la colección `paypal_pending_orders` (documento por `orderID`). Asegúrate de que tu proyecto Firebase permita a la app de Next.js (o al usuario que ejecuta la API) leer y escribir en esa colección si usas reglas de seguridad.
