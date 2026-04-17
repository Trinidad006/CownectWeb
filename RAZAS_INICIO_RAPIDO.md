# 🎯 TABLA DE RAZAS - GUÍA RÁPIDA DE INICIO

## ✅ ¿QUÉ SE HA IMPLEMENTADO?

Se creó un **sistema completo de gestión de 71 razas de ganado** en Cownect con soporte para:
- ✅ Búsqueda y filtrado por aptitud (Lechera, Cárnica, Doble Propósito)
- ✅ Filtrado por especie (Bos taurus, Bos indicus, Sintéticas)
- ✅ Recomendaciones según clima (Templado, Tropical, Tropical/Adaptado)
- ✅ Componente UI selector interactivo con autocomplete
- ✅ Base de datos Firestore lista

---

## 🚀 PASO 1: Ejecutar el Seed (NECESARIO)

Este paso inserta las 71 razas en tu Firestore. **Ejecutar UNA SOLA VEZ**:

```bash
npm run seed:razas
```

O manualmente:
```bash
node --require dotenv/config scripts/seed-razas.mjs
```

**Esperado:**
```
🌾 Iniciando siembra de razas en Firestore...
✅ 71 razas insertadas exitosamente en la colección 'razas'
```

---

## 📝 PASO 2: Usar en Formularios

### Opción A: Componente RazaSelector (RECOMENDADO)

En tu formulario de registro de animales:

```tsx
'use client'
import { useState } from 'react'
import RazaSelector from '@/presentation/components/ui/RazaSelector'

export default function FormularioAnimal() {
  const [razaId, setRazaId] = useState('')

  return (
    <form>
      <RazaSelector
        value={razaId}
        onChange={(id) => setRazaId(id)}
        label="Selecciona la Raza del Animal"
        required
      />
      {/* Resto del formulario */}
    </form>
  )
}
```

### Opción B: Con Filtros

Si quieres filtrar por aptitud o especie:

```tsx
<RazaSelector
  value={razaId}
  onChange={(id) => setRazaId(id)}
  aptitud="Lechera"           // Solo razas lecheras
  especie="Bos indicus"       // Solo cebuínas
  label="Raza (Lechera Tropical)"
/>
```

### Opción C: Con Hook Personalizado

```tsx
import { useRazas } from '@/presentation/hooks/useRazas'

export function MiComponente() {
  const { razas, loading } = useRazas()
  
  if (loading) return <p>Cargando razas...</p>
  
  return (
    <select>
      {razas.map(r => (
        <option key={r.id} value={r.id}>
          {r.nombre} ({r.aptitud})
        </option>
      ))}
    </select>
  )
}
```

---

## 🎯 PASO 3: Guardar en Base de Datos

Cuando guardes un animal, usa `raza_id` en lugar de `raza`:

```typescript
const animalData = {
  nombre: "Bessy",
  raza_id: razaId,        // ✨ ID de la raza
  especie: "Bovino",
  sexo: "H",
  fecha_nacimiento: "2023-01-15",
  // ... otros campos
}

await firestoreService.addAnimal(animalData)
```

---

## 📚 RAZAS RECOMENDADAS POR REGIÓN

### 🌴 Para Yucatán (Tropical)
```
Mejores opciones:
✅ Brahman Gris (Carne, Máx. adaptación)
✅ Gyr Lechero (Leche, Tropical)
✅ Girolando (Leche, Adaptada)
✅ Criollo Mexicano (Doble propósito, Local)
```

### 🌾 Para Zonas Templadas
```
Mejores opciones:
✅ Holstein (Leche, Máxima producción)
✅ Angus (Carne, Premium)
✅ Hereford (Carne, Rústica)
✅ Jersey (Leche, Alto contenido graso)
```

---

## 🔍 ARCHIVOS CLAVE

| Archivo | Propósito |
|---------|-----------|
| `scripts/seed-razas.mjs` | Script para llenar la BD |
| `src/presentation/components/ui/RazaSelector.tsx` | Componente selector |
| `src/presentation/hooks/useRazas.ts` | Hooks de React |
| `src/infrastructure/repositories/RazaRepository.ts` | Acceso a datos |
| `RAZAS_GUIA.md` | Documentación completa |
| `CATALOGO_RAZAS.md` | Listado de todas las razas |

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### "Las razas no aparecen en el selector"
```bash
# 1. Verifica que ejecutaste el seed
npm run seed:razas

# 2. Abre Firebase Console y verifica:
# Firestore → Colección "razas" → Debes ver 71 documentos
```

### "Error: Cannot find module..."
```bash
# Limpia y reinstala dependencias
rm -r node_modules package-lock.json
npm install
npm run seed:razas
```

### "Module not found: '@/infrastructure/...'"
```bash
# Verifica que los paths en tsconfig.json estén correctos
npm run build
```

---

## 💡 EJEMPLOS DE USO AVANZADO

### Obtener razas recomendadas para el usuario
```typescript
const razasRecomendadas = await firestoreService.getRecommendedRazas(
  'Lechera',           // Aptitud
  'Tropical'           // Clima
)
```

### Filtrar por especie (importante para trópico)
```typescript
const cebuinas = await firestoreService.getRazasByEspecie('Bos indicus')
```

### Obtener información de una raza específica
```typescript
const raza = await firestoreService.getRazaById(razaId)
console.log(`${raza.nombre} - ${raza.aptitud} - Clima: ${raza.clima_ideal}`)
```

---

## 📊 ESTADÍSTICAS RÁPIDAS

```
Total de razas: 71
├─ Lecheras ............ 15 razas
├─ Cárnicas ............ 28 razas
└─ Doble Propósito ..... 28 razas

Por especie:
├─ Bos taurus ......... 32 razas (Europeas)
├─ Bos indicus ........ 11 razas (Cebuínas)
├─ Sintéticas ......... 10 razas (Híbridas)
└─ Criollas ........... 6 razas (Latinoamericanas)
```

---

## ✨ PRÓXIMOS PASOS RECOMENDADOS

1. **✅ Ejecuta el seed**: `npm run seed:razas`
2. **✅ Actualiza tus formularios** con `RazaSelector`
3. **✅ Prueba en desarrollo**: `npm run dev`
4. **⏭️ Agrega validaciones** de premium si es necesario
5. **⏭️ Crea reportes** que usen la información de razas

---

## 📞 REFERENCIAS

- **Guía Completa**: [RAZAS_GUIA.md](RAZAS_GUIA.md)
- **Catálogo**: [CATALOGO_RAZAS.md](CATALOGO_RAZAS.md)
- **Instrucciones Seed**: [SEED_SETUP.md](SEED_SETUP.md)
- **Implementación**: [IMPLEMENTACION_RAZAS.md](IMPLEMENTACION_RAZAS.md)

---

**¿Listo para empezar?**

```bash
npm run seed:razas
npm run dev
```

Abre http://localhost:3000 y verifica que todo funciona correctamente.

---

**Última actualización**: Abril 2026  
**Status**: ✅ Listo para Producción
