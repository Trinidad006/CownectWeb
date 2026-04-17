# 🐄 Guía de Razas en Cownect

## 📋 Resumen

Este documento explica cómo manejar la tabla de razas en la aplicación Cownect, incluyendo cómo poblar la base de datos con las razas disponibles.

## 🗂️ Estructura de Razas

### Entidad Raza

```typescript
interface Raza {
  id?: string
  nombre: string
  aptitud: 'Lechera' | 'Cárnica' | 'Doble Propósito'
  especie: 'Bos taurus' | 'Bos indicus' | 'Sintética (F1)'
  clima_ideal: 'Templado' | 'Tropical' | 'Tropical/Adaptado' | 'Variado'
  composicion?: string // Para razas sintéticas
  origen?: string // País/región de origen
  descripcion?: string
  activa?: boolean
  created_at?: string
  updated_at?: string
}
```

### Categorías de Razas Disponibles

#### 🌾 Razas Bos Taurus (Europeas/Templadas) - 32 razas
- **Lecheras** (8): Holstein, Jersey, Pardo Suizo, Ayrshire, Guernsey, Milking Shorthorn, Kerry, Dexter
- **Cárnicas** (16): Angus, Red Angus, Hereford, Charolais, Limousin, Belgian Blue, Chianina, Shorthorn, Blonde d'Aquitaine, Maine-Anjou, Romagnola, Piedmontese, Galloway, Highland, Wagyu, Salers
- **Doble Propósito** (8): Simmental, Normando, Pardo Suizo (Original), Red Poll, Gelbvieh, Pinzgauer, Tarentaise

#### 🌴 Razas Bos Indicus (Cebuínas - CRÍTICAS PARA TRÓPICO) - 11 razas
- **Cárnicas**: Brahman Gris, Brahman Rojo, Nelore, Indubrasil, Boran
- **Lecheras**: Gyr Lechero, Sahiwal
- **Doble Propósito**: Guzerat, Gyr, Kankrej, Tharparkar

#### 🔗 Razas Sintéticas/Compuestas - 10 razas
- **Cárnicas**: Brangus, Braford, Beefmaster, Santa Gertrudis, Simbrah, Charbray, Senepol
- **Lecheras**: Girolando
- **Doble Propósito**: Tropical Longeño, Siboney

#### 🏜️ Razas Criollas (Latinoamericanas) - 6 razas
- Blanco Orejinegro (BON), Romosinuano, Hartón del Valle, Caracu, Criollo Mexicano, Reyna

## 🚀 Cómo Poblar la Base de Datos

### Requisitos
- Credenciales de Firebase Admin SDK configuradas
- Variables de entorno con acceso a Firestore

### Ejecutar el Script de Seed

```bash
# Opción 1: Con Node.js (requiere firebase-admin inicializado)
node scripts/seed-razas.mjs

# Opción 2: Con npm script (si está configurado en package.json)
npm run seed:razas
```

> **⚠️ IMPORTANTE**: Ejecuta este script **una sola vez** después de crear la base de datos. Si lo ejecutas múltiples veces, insertará duplicados.

### Qué Hace el Script

1. Crea una colección `razas` en Firestore
2. Inserta **71 razas** con información completa:
   - Nombre
   - Aptitud (Lechera, Cárnica, Doble Propósito)
   - Especie (Bos taurus, Bos indicus, Sintética)
   - Clima ideal
   - Composición (para razas sintéticas)
   - Origen geográfico
3. Marca todas como activas (`activa: true`)
4. Registra timestamps de creación/actualización

## 💻 Uso en el Código

### 1. En Componentes React

**Usando el Hook `useRazas`:**

```tsx
import { useRazas, useRazasByAptitud } from '@/presentation/hooks/useRazas'

export function MiComponente() {
  const { razas, loading, error } = useRazas()
  const { razas: razasLecheras } = useRazasByAptitud('Lechera')

  if (loading) return <p>Cargando razas...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <select>
      {razas.map(r => (
        <option key={r.id} value={r.id}>{r.nombre}</option>
      ))}
    </select>
  )
}
```

**Usando el Componente `RazaSelector`:**

```tsx
import RazaSelector from '@/presentation/components/ui/RazaSelector'

export function FormularioAnimal() {
  const [razaId, setRazaId] = useState('')

  return (
    <RazaSelector
      value={razaId}
      onChange={(id) => setRazaId(id)}
      aptitud="Lechera" // Opcional: filtrar por aptitud
      label="Selecciona la Raza"
      required
    />
  )
}
```

### 2. En Servicios

**Usando firestoreService:**

```typescript
import { firestoreService } from '@/infrastructure/services/firestoreService'

// Obtener todas las razas activas
const todasRazas = await firestoreService.getAllRazas()

// Obtener razas por aptitud
const razasLecheras = await firestoreService.getRazasByAptitud('Lechera')

// Obtener razas por especie (importante para climas tropicales)
const cebuinas = await firestoreService.getRazasByEspecie('Bos indicus')

// Obtener recomendaciones para un usuario
const recomendadas = await firestoreService.getRecommendedRazas(
  'Cárnica',
  'Tropical'
)

// Obtener una raza específica por ID
const raza = await firestoreService.getRazaById('razaId123')
```

### 3. En Repositorios

**Usando RazaRepository:**

```typescript
import { razaRepository } from '@/infrastructure/repositories/RazaRepository'

// Todos los métodos disponibles
const razas = await razaRepository.getAllRazas()
const porAptitud = await razaRepository.getRazasByAptitud('Lechera')
const porEspecie = await razaRepository.getRazasByEspecie('Bos indicus')
const porClima = await razaRepository.getRazasByClima('Tropical')
const recomendadas = await razaRepository.getRecommendedRazas('Lechera', 'Tropical')
const single = await razaRepository.getRazaById('id')
```

## 🌡️ Clima y Aptitud - Recomendaciones

### Para Zonas Tropicales (como Yucatán)
✅ **RECOMENDADAS:**
- Bos indicus (Cebuínas): Brahman, Nelore, Guzerat, Gyr
- Sintéticas adaptadas: Girolando (Gyr + Holstein para leche), Brangus, Braford
- Criollas: Criollo Mexicano, Reyna

❌ **NO RECOMENDADAS:**
- Holstein pura (muy susceptible al calor)
- Lecheras europeas sin adaptación

### Para Zonas Templadas
✅ **RECOMENDADAS:**
- Bos taurus europeas: Holstein, Jersey, Angus, Hereford
- Razas de doble propósito: Simmental, Normando

## 📊 Ejemplo: Flujo de Registro de Animal

1. **Seleccionar Especie** → Filtra razas por especie
2. **Seleccionar Aptitud** → Filtra por aptitud dentro de esa especie
3. **Seleccionar Raza** → Muestra info: clima ideal, composición, origen
4. **Guardar Animal** → Almacena `raza_id` en lugar de nombre de raza

```tsx
const [especie, setEspecie] = useState<'Bos taurus' | 'Bos indicus'>('Bos taurus')
const [aptitud, setAptitud] = useState<'Lechera' | 'Cárnica'>('Lechera')
const [razaId, setRazaId] = useState('')

const { razas: razasDisponibles } = useRazasByEspecie(especie)

<RazaSelector
  value={razaId}
  onChange={setRazaId}
  especie={especie}
  aptitud={aptitud}
/>
```

## ⚡ Performance

- Las razas se cachean en el cliente con `useRazas()` hook
- Las queries de Firestore usan índices automáticos
- El componente `RazaSelector` implementa búsqueda local eficiente

## 🔧 Mantenimiento

### Agregar una nueva raza
```typescript
await firestoreService.createRaza({
  nombre: 'Nueva Raza',
  aptitud: 'Lechera',
  especie: 'Bos taurus',
  clima_ideal: 'Templado',
  origen: 'País'
})
```

### Desactivar una raza (sin borrar)
```typescript
await razaRepository.deactivateRaza(razaId)
```

### Actualizar información de raza
```typescript
await razaRepository.updateRaza(razaId, {
  nombre: 'Nombre actualizado',
  descripcion: 'Nueva descripción'
})
```

## 📝 Notas Importantes

1. **No se borran razas**: Usamos soft delete (campo `activa: false`) para mantener integridad referencial
2. **ID vs Nombre**: Siempre almacena `raza_id` (UUID), no el nombre de la raza, para facilitar cambios de nombre
3. **Clima es crítico**: En Yucatán y zonas tropicales, prioriza razas con `clima_ideal: 'Tropical'` o `'Tropical/Adaptado'`
4. **Síntéticas adaptadas**: Son el balance perfecto entre productividad y adaptación al clima tropical

---

**Última actualización**: Abril 2026  
**Total de razas**: 71 (incluyendo adicionales)  
**Próxima revisión**: Cuando se agreguen nuevas razas comercialmente importantes
