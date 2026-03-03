# Cownect Web

Sistema de gestión ganadera - Landing Page

## Estructura del Proyecto

Este proyecto sigue una arquitectura limpia (Clean Architecture) con las siguientes capas:

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout principal
│   └── page.tsx            # Página principal
├── domain/                 # Capa de dominio (lógica de negocio)
├── infrastructure/         # Capa de infraestructura (APIs, DB, etc.)
└── presentation/           # Capa de presentación
    ├── components/         # Componentes React
    │   ├── sections/      # Secciones de la landing page
    │   └── ui/            # Componentes UI reutilizables
    ├── pages/             # Páginas
    └── styles/            # Estilos globales
```

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Imagen de Fondo

Coloca la imagen de fondo con el nombre `fondo_verde.jpg` en la carpeta `public/` del proyecto.

## Tecnologías

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

