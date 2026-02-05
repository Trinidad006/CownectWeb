# Configuración de Firebase Storage para Subida de Imágenes

## Problema
Si no puedes subir imágenes, es probable que las reglas de seguridad de Firebase Storage no estén configuradas correctamente.

## Solución

### Paso 1: Ir a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **cownect-6956b**
3. En el menú lateral, haz clic en **Storage**

### Paso 2: Configurar las Reglas de Seguridad
1. Haz clic en la pestaña **Rules** (Reglas)
2. Reemplaza las reglas existentes con el siguiente código:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura y escritura a usuarios autenticados en su propia carpeta
    match /documentos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Permitir lectura pública de imágenes (opcional, para marketplace)
    match /documentos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Paso 3: Publicar las Reglas
1. Haz clic en **Publish** (Publicar)
2. Espera a que se confirme la publicación

### Paso 4: Verificar
1. Intenta subir una imagen en la aplicación
2. Si aún no funciona, revisa la consola del navegador (F12) para ver el error específico

## Notas Importantes
- Las reglas permiten que usuarios autenticados suban archivos solo en su propia carpeta (`documentos/{userId}/...`)
- Los archivos son públicos para lectura (para que se puedan ver en el marketplace)
- Solo usuarios autenticados pueden escribir archivos

## Si el Problema Persiste
1. Verifica que estés autenticado en la aplicación
2. Verifica que las variables de entorno en `.env.local` estén correctas
3. Revisa la consola del navegador para ver errores específicos
4. Asegúrate de que Firebase Storage esté habilitado en tu proyecto

