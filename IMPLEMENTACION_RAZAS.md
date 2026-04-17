# ✅ TABLA DE RAZAS - IMPLEMENTACIÓN COMPLETA

## 📋 Resumen de Lo Realizado

Se ha implementado un **sistema completo de gestión de razas** en Cownect con **71 razas de ganado** organizadas por especie, aptitud y clima.

---

## 📁 Archivos Creados y Modificados

### ✨ NUEVOS ARCHIVOS CREADOS

#### 1️⃣ Entidad de Dominio
- **[src/domain/entities/Raza.ts](src/domain/entities/Raza.ts)**
  - Define la interfaz `Raza` con campos: nombre, aptitud, especie, clima, origen, composición
  - Soporta soft delete con campo `activa`

#### 2️⃣ Repositorios
- **[src/infrastructure/repositories/RazaRepository.ts](src/infrastructure/repositories/RazaRepository.ts)**
  - Clase para acceso a datos de razas en Firestore
  - Métodos: `getAllRazas()`, `getRazasByAptitud()`, `getRazasByEspecie()`, `getRazasByClima()`, `getRecommendedRazas()`, etc.

#### 3️⃣ Hooks Personalizados
- **[src/presentation/hooks/useRazas.ts](src/presentation/hooks/useRazas.ts)**
  - `useRazas()` - Obtener todas las razas
  - `useRazasByAptitud()` - Filtrar por aptitud
  - `useRazasByEspecie()` - Filtrar por especie
  - `useRazasByClima()` - Filtrar por clima
  - `useRazaRecommendations()` - Recomendaciones personalizadas

#### 4️⃣ Componentes UI
- **[src/presentation/components/ui/RazaSelector.tsx](src/presentation/components/ui/RazaSelector.tsx)**
  - Componente selector de razas con búsqueda
  - Autocomplete interactivo
  - Muestra información de aptitud, especie, clima
  - Filtros opcionales por aptitud/especie

#### 5️⃣ Scripts de Seed
- **[scripts/seed-razas.mjs](scripts/seed-razas.mjs)**
  - Script para poblar **71 razas** en Firestore
  - Incluye todas las categorías: Bos taurus, Bos indicus, sintéticas, criollas

#### 6️⃣ Documentación
- **[RAZAS_GUIA.md](RAZAS_GUIA.md)** - Guía completa de uso de razas
- **[SEED_SETUP.md](SEED_SETUP.md)** - Instrucciones para ejecutar el seed
- **[CATALOGO_RAZAS.md](CATALOGO_RAZAS.md)** - Catálogo detallado de todas las razas

---

## 🔧 MODIFICACIONES A ARCHIVOS EXISTENTES

### 1. [src/domain/entities/Animal.ts](src/domain/entities/Animal.ts)
```typescript
// AÑADIDO: Campo raza_id para referencia a tabla de razas
raza_id?: string // ID referencia a la colección 'razas'
```

### 2. [src/infrastructure/services/firestoreService.ts](src/infrastructure/services/firestoreService.ts)
**Añadidos 6 nuevos métodos:**
```typescript
async getAllRazas()
async getRazasByAptitud(aptitud: string)
async getRazasByEspecie(especie: string)
async getRazaById(id: string)
async getRazasByClima(clima: string)
async getRecommendedRazas(aptitud?: string, clima?: string)
```

### 3. [package.json](package.json)
**Añadidos scripts npm:**
```json
"seed:razas": "node --require dotenv/config scripts/seed-razas.mjs"
"seed:premium": "node --require dotenv/config scripts/set-premium-user.mjs"
```

### 4. [src/app/api/auth/login-pin/route.ts](src/app/api/auth/login-pin/route.ts)
✅ Corregido import duplicado: `infrastructure/infrastructure` → `infrastructure`

---

## 🐄 RAZAS INCLUIDAS

### Distribución Total
- **Bos taurus (Europeas)**: 32 razas
  - Lecheras: 8
  - Cárnicas: 16
  - Doble Propósito: 8

- **Bos indicus (Cebuínas)**: 11 razas
  - Lecheras: 2
  - Cárnicas: 5
  - Doble Propósito: 4

- **Sintéticas**: 10 razas
  - Girolando, Brangus, Braford, etc.

- **Criollas**: 6 razas
  - Blanco Orejinegro, Criollo Mexicano, etc.

- **Adicionales**: 12 razas

**TOTAL: 71 razas**

---

## 🚀 CÓMO USAR

### 1. Ejecutar el Seed (NECESARIO PRIMERO)

```bash
npm run seed:razas
```

Esto insertará las 71 razas en Firestore. ⚠️ **Ejecutar una sola vez**

### 2. En Componentes

```tsx
import RazaSelector from '@/presentation/components/ui/RazaSelector'
import { useRazas } from '@/presentation/hooks/useRazas'

export function FormularioAnimal() {
  const [razaId, setRazaId] = useState('')
  
  return (
    <RazaSelector
      value={razaId}
      onChange={(id) => setRazaId(id)}
      aptitud="Lechera"
      label="Selecciona la Raza"
      required
    />
  )
}
```

### 3. En Servicios

```typescript
// Obtener todas las razas
const razas = await firestoreService.getAllRazas()

// Obtener razas por aptitud
const razasLecheras = await firestoreService.getRazasByAptitud('Lechera')

// Obtener recomendaciones para trópico
const recomendadas = await firestoreService.getRecommendedRazas('Cárnica', 'Tropical')
```

### 4. Con Hooks

```tsx
const { razas, loading } = useRazas()
const { razas: cebuinas } = useRazasByEspecie('Bos indicus')
```

---

## 🎯 RECOMENDACIONES POR REGIÓN

### Para Yucatán (Tropical Húmedo)
✅ **RECOMENDADAS:**
- Brahman (Gris/Rojo) - Máxima adaptación
- Gyr Lechero - Mejor leche en trópico
- Girolando - Balance leche + adaptación
- Nelore - Carne de calidad
- Criollo Mexicano - Rusticidad local

❌ **EVITAR:**
- Holstein pura (muy susceptible al calor)

### Para Zonas Templadas
✅ **RECOMENDADAS:**
- Holstein - Máxima producción
- Angus - Carne premium
- Hereford - Rústica y productiva
- Jersey - Leche con alto contenido graso

---

## 📊 Estructura de Base de Datos

### Colección: `razas`
```json
{
  "id": "auto-generado",
  "nombre": "Holstein",
  "aptitud": "Lechera",
  "especie": "Bos taurus",
  "clima_ideal": "Templado",
  "origen": "Países Bajos",
  "composicion": null,
  "descripcion": "",
  "activa": true,
  "created_at": "2024-04-16T...",
  "updated_at": "2024-04-16T..."
}
```

### Actualización: Tabla `animales`
Los animales ahora pueden tener:
```json
{
  "raza_id": "uuid-de-raza",  // ✨ NUEVO: Referencia a tabla razas
  "raza": "Holstein",          // Retrocompatible: Nombre de raza
  ...
}
```

---

## ✅ ESTADO DE LA COMPILACIÓN

| Archivo | Estado | Nota |
|---------|--------|------|
| TypeScript | ✅ Compilando | Sin errores de sintaxis |
| Razas | ✅ Implementadas | 71 razas listas |
| Componentes | ✅ Listos | RazaSelector funcional |
| Hooks | ✅ Listos | Todos los hooks implementados |
| Servicios | ✅ Actualizados | Métodos agregados a firestoreService |
| Tests | ⏳ Pendiente | Se pueden agregar tests unitarios |

---

## 📋 PRÓXIMOS PASOS (OPCIONALES)

1. **Ejecutar el seed**
   ```bash
   npm run seed:razas
   ```

2. **Actualizar formularios de registro de animales** para usar `RazaSelector`

3. **Agregar tests** para el nuevo componente y hooks

4. **Crear página admin** para gestionar razas (crear, editar, desactivar)

5. **Implementar recomendaciones automáticas** basadas en ubicación del usuario

---

## 🔐 SEGURIDAD

Las razas son **datos públicos de solo lectura**. En Firestore Rules:
```
match /razas/{document=**} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.admin == true;
}
```

---

## 📞 REFERENCIAS RÁPIDAS

- Guía completa: [RAZAS_GUIA.md](RAZAS_GUIA.md)
- Catálogo de razas: [CATALOGO_RAZAS.md](CATALOGO_RAZAS.md)
- Instrucciones de seed: [SEED_SETUP.md](SEED_SETUP.md)
- Componente selector: [src/presentation/components/ui/RazaSelector.tsx](src/presentation/components/ui/RazaSelector.tsx)

---

**✅ IMPLEMENTACIÓN COMPLETADA - Abril 2026**
