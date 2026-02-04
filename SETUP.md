# Configuración de Cownect Web

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Las credenciales de Supabase ya están configuradas en `src/infrastructure/config/supabase.ts`

## Estructura de la Base de Datos

El sistema espera las siguientes tablas en Supabase:

### Tabla: `usuarios`
- `id` (uuid, primary key, referencia a auth.users)
- `email` (text)
- `nombre` (text, opcional)
- `apellido` (text, opcional)
- `telefono` (text, opcional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Tablas adicionales (para funcionalidades futuras):
- `animales` - Gestión de animales
- `vacunaciones` - Historial de vacunaciones
- `pesos` - Registro de pesos
- `tratamientos` - Tratamientos veterinarios

## Ejecutar el proyecto

```bash
npm run dev
```

## Rutas disponibles

- `/` - Landing page
- `/register` - Registro de usuarios
- `/login` - Iniciar sesión
- `/dashboard` - Dashboard principal (requiere autenticación)

## APIs creadas

- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
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
│   ├── config/      # Configuración (Supabase)
│   └── repositories/ # Implementación de repositorios
└── presentation/    # Interfaz de usuario
    ├── components/  # Componentes React
    └── pages/       # Páginas
```

## Notas importantes

1. **Autenticación**: Usa Supabase Auth para autenticación
2. **Seguridad**: Las credenciales están en el código (para desarrollo). En producción, usar variables de entorno
3. **Imágenes**: Colocar `logo_verde.jpeg` y `fondo_verde.jpg` en `public/images/`

