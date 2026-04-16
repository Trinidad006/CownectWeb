# 🌾 Script de Seed - Razas

Este documento explica cómo ejecutar el script para poblar la base de datos con todas las razas de ganado.

## 📋 Requisitos Previos

1. **Firebase Admin SDK Inicializado**
   - Debes tener credenciales de Firebase Admin SDK
   - Las variables de entorno deben estar configuradas en `.env.local`

2. **Variables de Entorno Requeridas**
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=tu_clave
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_dominio
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
   
   # Para Firebase Admin (si usas servidor)
   FIREBASE_ADMIN_SDK_JSON=path/to/serviceAccountKey.json
   ```

3. **Dependencias Instaladas**
   ```bash
   npm install
   ```

## 🚀 Cómo Ejecutar

### Opción 1: Usar npm script (RECOMENDADO)

```bash
npm run seed:razas
```

### Opción 2: Ejecutar directamente con Node.js

```bash
node --require dotenv/config scripts/seed-razas.mjs
```

### Opción 3: Ejecutar con npx

```bash
npx ts-node scripts/seed-razas.mjs
```

## ⚠️ IMPORTANTE

1. **Ejecuta UNA SOLA VEZ**: El script insertará todos los registros. Si lo ejecutas múltiples veces, **insertará duplicados**.

2. **Si necesitas empezar de nuevo**:
   ```bash
   # Elimina la colección 'razas' de Firestore Console
   # O usa este comando si tienes un script de cleanup:
   npm run cleanup:razas
   ```

3. **Verifica el éxito**: Después de ejecutar, deberías ver:
   ```
   🌾 Iniciando siembra de razas en Firestore...
   ✅ 71 razas insertadas exitosamente en la colección 'razas'
   ```

## 📊 Qué se Inserta

El script crea **71 razas** en la colección `razas` con la estructura:

```json
{
  "id": "auto-generado",
  "nombre": "Holstein",
  "aptitud": "Lechera",
  "especie": "Bos taurus",
  "clima_ideal": "Templado",
  "origen": "Países Bajos",
  "composicion": null,
  "activa": true,
  "created_at": "2024-04-16T...",
  "updated_at": "2024-04-16T..."
}
```

## 🔍 Verificar en Firestore

1. Abre [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **razas**
4. Deberías ver 71 documentos

## 🐛 Solución de Problemas

### Error: "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### Error: "Permission denied"
Asegúrate de que tu credencial de Firebase Admin tiene permisos de escritura en Firestore.

### Error: "Collection not found"
Es normal. Firestore creará la colección automáticamente al insertar el primer documento.

### Las razas no aparecen en la app
1. Verifica que el script completó sin errores
2. Abre el navegador en DevTools → Network
3. Confirma que la query a Firestore se ejecuta correctamente

## 📝 Próximos Pasos

Después de ejecutar el seed:

1. **Usar en Formularios**: Importa `RazaSelector` en tus componentes
   ```tsx
   import RazaSelector from '@/presentation/components/ui/RazaSelector'
   ```

2. **Acceder en Código**: Usa los hooks o servicios
   ```tsx
   import { useRazas } from '@/presentation/hooks/useRazas'
   const { razas } = useRazas()
   ```

3. **Actualizar Animales**: Los nuevos animales ahora pueden usar `raza_id` en lugar de `raza` (texto)

## 🔧 Agregar Más Razas Después

Si necesitas agregar nuevas razas más adelante:

```typescript
import { firestoreService } from '@/infrastructure/services/firestoreService'

await firestoreService.createRaza({
  nombre: 'Nueva Raza',
  aptitud: 'Lechera',
  especie: 'Bos taurus',
  clima_ideal: 'Templado',
  origen: 'País'
})
```

## 📞 Soporte

Si tienes problemas:
1. Revisa la sección de "Solución de Problemas" arriba
2. Verifica que Firestore está habilitado en tu proyecto
3. Asegúrate que tu IP está autorizada en Firebase Security Rules

---

**Última actualización**: Abril 2026  
**Estado**: ✅ Listo para usar
