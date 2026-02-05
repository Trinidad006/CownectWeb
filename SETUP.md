# Configuración de Cownect Web (Firebase)

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar Firebase:
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
   - Activa **Authentication** > Sign-in method > **Email/Password**
   - Activa **Firestore Database** (modo producción o prueba)
   - En Configuración del proyecto > Tus apps, añade una app web y copia el objeto `firebaseConfig`
   - Crea un archivo `.env.local` en la raíz con (usa `.env.example` como plantilla):

```
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

## Estructura de Firestore

Las colecciones se crean automáticamente al usar la app:

- **usuarios** (document id = Firebase Auth UID): `email`, `nombre`, `apellido`, `telefono`, `created_at`, `updated_at`
- **animales**: `usuario_id`, `nombre`, `numero_identificacion`, `especie`, `raza`, `fecha_nacimiento`, `sexo`, `estado`, `en_venta`, `precio_venta`, `created_at`, `updated_at`
- **pesos**: `animal_id`, `usuario_id`, `peso`, `fecha_registro`, `observaciones`, `created_at`, `updated_at`
- **vacunaciones**: `animal_id`, `usuario_id`, `tipo_vacuna`, `fecha_aplicacion`, `proxima_dosis`, `observaciones`, `created_at`, `updated_at`

### Índices compuestos en Firestore

En la primera ejecución, Firestore puede pedir crear índices. Si aparece un enlace en la consola del navegador o en los logs, ábrelo y crea el índice. Alternativamente, en Firebase Console > Firestore > Índices, crea:

- Colección `animales`: campos `usuario_id` (Ascending), `created_at` (Descending)
- Colección `animales`: campos `en_venta` (Ascending), `created_at` (Descending)
- Colección `pesos`: campos `usuario_id` (Ascending), `fecha_registro` (Descending)
- Colección `vacunaciones`: campos `usuario_id` (Ascending), `fecha_aplicacion` (Descending)

## Ejecutar el proyecto

```bash
npm run dev
```

## Rutas disponibles

- `/` - Landing page
- `/register` - Registro de usuarios
- `/login` - Iniciar sesión
- `/dashboard` - Dashboard principal (requiere autenticación)

## APIs

- `POST /api/auth/register` - Registro (también se usa registro en cliente)
- `POST /api/auth/login` - Login (la app usa autenticación en el cliente con Firebase Auth)
- `POST /api/auth/logout` - Cerrar sesión

## Arquitectura

El proyecto sigue Clean Architecture:

```
src/
├── domain/          # Lógica de negocio
│   ├── entities/    # Entidades del dominio
│   ├── repositories/ # Interfaces de repositorios
│   └── use-cases/   # Casos de uso
├── infrastructure/  # Implementaciones técnicas
│   ├── config/      # Configuración (Firebase)
│   ├── repositories/ # Implementación (Firebase)
│   ├── services/    # Servicios Firestore (pesos, vacunaciones)
│   └── utils/       # Utilidades de auth
└── presentation/    # Interfaz de usuario
    ├── components/  # Componentes React
    └── pages/       # Páginas
```

## Notas

1. **Autenticación**: Firebase Auth (Email/Password). La sesión se gestiona en el cliente.
2. **Seguridad**: Usa siempre variables de entorno para las credenciales de Firebase (`.env.local`).
3. **Imágenes**: Colocar `logo_verde.jpeg` y `fondo_verde.jpg` en `public/images/`
