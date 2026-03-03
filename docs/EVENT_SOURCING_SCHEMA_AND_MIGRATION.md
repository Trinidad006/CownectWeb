# Reingeniería Event-Sourcing – Esquema y Migración (Cownect)

## 1. Principio: Estado como Consecuencia

- **Prohibido** guardar estados manuales en `animales`: `estado`, `activo`, `razon_inactivo`, `fecha_inactivo`.
- El estado actual del animal se **deriva** del último evento relevante en su historial.
- **Regla de oro:** no guardar "estado", guardar "eventos". No borrar eventos; ante errores, registrar evento de corrección o anulación.

---

## 2. Esquema Actual (resumen)

### Colección `animales` (Firestore)

| Campo | Tipo | Uso actual | Acción en migración |
|-------|------|------------|---------------------|
| usuario_id | string | Dueño | Mantener |
| nombre, numero_identificacion, especie, raza, fecha_nacimiento, sexo | - | Identidad/datos fijos | Mantener |
| **estado** | string (texto libre) | "Cría", "Vaca Ordeña", "Muerto", etc. | **Eliminar** → derivar de eventos |
| **activo** | boolean | true/false (inactivo = muerto/robado/eliminado) | **Eliminar** → derivar de último evento de cierre |
| **razon_inactivo** | string (texto libre) | Motivo inactividad | **Eliminar** → usar evento + motivo_id (catálogo) |
| **fecha_inactivo** | string (ISO) | Cuándo se inactivó | **Eliminar** → usar fecha_evento del evento |
| madre_id | string | Genética | Mantener (y reforzar en NACIMIENTO) |
| documento_* | URLs | Documentos venta | Mantener |
| observaciones | string | Notas | Mantener (opcional); eventos tienen su propio observaciones |
| created_at, updated_at | string | Auditoría | Mantener |

### Otras colecciones

- `pesos`: por animal, fecha_registro; **se mantiene** (puede considerarse evento de tipo PESO si se unifica después).
- `vacunaciones`: por animal; **se mantiene** (o eventualmente evento VACUNACION).
- No existe hoy una tabla/colección de "eventos" de vida del animal.

---

## 3. Nuevo modelo: Colección `eventos_animal`

Cada documento representa un **evento** en la línea de vida del animal.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| animal_id | string | Sí | Referencia a `animales/{id}` |
| tipo_evento | string | Sí | Catálogo cerrado (ver abajo) |
| fecha_evento | string (ISO 8601) | Sí | Timestamp del hecho; sin fecha no hay línea de tiempo |
| motivo_id | string | Condicional | Referencia a catálogo de motivos (según tipo_evento) |
| usuario_id | string | Sí | Quién registró (auditoría) |
| observaciones | string | No | Texto libre opcional |
| madre_id | string | Solo NACIMIENTO | Obligatorio en eventos de nacimiento (cría) |
| cria_id | string | Solo PARTO/ABORTO | ID del animal cría si aplica |
| created_at | string (ISO) | Sí | Alta del registro en sistema |

### Catálogo cerrado: `tipo_evento`

```
NACIMIENTO
SERVICIO
DIAGNOSTICO_GESTACION
PARTO
ABORTO
DESTETE
MUERTE
VENTA
ROBO
DESCARTE
```

(Opcional para una fase 2: PESO, VACUNACION como eventos.)

### Catálogo cerrado: `motivo` (por tipo_evento)

Se recomienda una **colección** `catalogos_motivos` con documentos por tipo, o un mapa estático en código.

Ejemplo para **MUERTE**:

| motivo_id | etiqueta |
|-----------|----------|
| NATURAL | Natural |
| ENFERMEDAD | Enfermedad |
| ACCIDENTE | Accidente |
| SACRIFICIO | Sacrificio |

Para **VENTA/ROBO/DESCARTE** se puede tener motivos como: VENTA_NORMAL, ROBO_PARCIAL, DESCARTE_BAJA_PRODUCCION, etc.

Para **DIAGNOSTICO_GESTACION** (resultado): POSITIVO, NEGATIVO.

Los motivos se almacenan en un catálogo (doc o subcolección) para evitar texto libre y permitir reportes agregados.

---

## 4. Migraciones propuestas (Firestore)

### Migración 1: Crear colección `eventos_animal` y catálogos

- Crear colección `eventos_animal` (índices sugeridos: `animal_id` + `fecha_evento`, `usuario_id` + `fecha_evento`).
- Crear documento o colección de catálogos, por ejemplo:
  - `catalogos/tipos_evento`: lista de los 10 tipos.
  - `catalogos/motivos`: documento por tipo (motivos_muerte, motivos_venta, etc.) o subcolección `catalogos/motivos/{tipo_evento}`.

### Migración 2: Generar eventos desde datos actuales de `animales`

Para cada animal existente:

1. **NACIMIENTO**  
   Si tiene `fecha_nacimiento`, crear evento:
   - animal_id, tipo_evento: NACIMIENTO, fecha_evento: fecha_nacimiento, madre_id si existe, usuario_id (ej. sistema o primer usuario), observaciones: "Migrado desde animales".

2. **Cierre de vida (MUERTE / VENTA / ROBO / DESCARTE)**  
   Si `activo === false` o `estado` indica muerto/robado:
   - Determinar tipo_evento según `estado` (Muerto → MUERTE, Robado → ROBO; si solo "inactivo" sin estado → DESCARTE o motivo por defecto).
   - motivo_id: mapear `razon_inactivo` a un motivo del catálogo si existe; si no, usar motivo genérico "MIGRACION" o "SIN_ESPECIFICAR".
   - fecha_evento: `fecha_inactivo` si existe, si no `updated_at` o created_at.

3. **No crear eventos** para "estado productivo" (Cría, Vaca Ordeña, etc.) si no hay datos de SERVICIO/PARTO/DESTETE en el sistema actual; esos estados quedarán "Vacía" o sin clasificación hasta que se registren eventos nuevos.

### Migración 3: Deprecar campos en `animales`

- Dejar de escribir en: `estado`, `activo`, `razon_inactivo`, `fecha_inactivo`.
- En código: leer estado "actual" desde una función que consulte eventos (último evento de cierre → activo/muerto/venta/robo; último PARTO/DESTETE/DIAGNOSTICO → gestante/lactando/vacía).
- Opcional: script que borre o limpie esos campos después de validar que los eventos generados son correctos (o mantenerlos un tiempo como respaldo de solo lectura).

### Migración 4: Índices Firestore

Crear `firestore.indexes.json` en la raíz del proyecto (o configurar en Firebase Console):

```json
{
  "indexes": [
    {
      "collectionGroup": "eventos_animal",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "animal_id", "order": "ASCENDING" },
        { "fieldPath": "fecha_evento", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "eventos_animal",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "usuario_id", "order": "ASCENDING" },
        { "fieldPath": "fecha_evento", "order": "ASCENDING" }
      ]
    }
  ]
}
```

- Primer índice: consultas por animal ordenadas por fecha (últimos eventos).
- Segundo: consultas por usuario en rango de fechas (KPIs).

---

## 5. Validaciones de integridad temporal

Aplicar al **registrar** un nuevo evento:

1. **PARTO** no puede ocurrir antes de un **SERVICIO** (para ese animal).
2. No puede haber dos **PARTOS** consecutivos sin un **SERVICIO** (o DIAGNOSTICO_GESTACION) intermedio.
3. No permitir **ningún evento** nuevo si el animal ya tiene un evento de **MUERTE**, **VENTA** o **ROBO** (el animal está "cerrado").
4. **NACIMIENTO**: madre_id obligatorio; validar que madre existe y no está cerrada (sin evento MUERTE/VENTA/ROBO posterior a la fecha del parto).
5. **fecha_evento**: no puede ser futura (opcional: no mayor a fecha del sistema).

---

## 6. Lógica reproductiva (derivada de eventos)

- **Gestante:** existe un **DIAGNOSTICO_GESTACION** positivo y no existe **PARTO** ni **ABORTO** posterior para ese animal.
- **Lactando:** existe un **PARTO** reciente y no existe **DESTETE** posterior.
- **Vacía:** diagnóstico negativo o periodo post-**DESTETE** sin nueva gestación confirmada.

Esto se implementa como funciones/hooks que lean la secuencia de eventos del animal y devuelvan el estado reproductivo actual.

---

## 7. KPIs desde eventos (queries/helpers)

- **Intervalo entre partos:** tiempo entre dos eventos **PARTO** consecutivos de la misma hembra (por animal_id).
- **Días abiertos:** días desde el último **PARTO** hasta hoy (o hasta **DIAGNOSTICO_GESTACION** positivo); si no hay PARTO, indefinido o N/A.
- **Tasa mortalidad/descarte:** contar eventos **MUERTE** y **DESCARTE** por motivo_id y tipo_evento en un rango de fechas; dividir por población expuesta si se define.
- **Eficiencia genética:** cruce madre_id → crías (eventos NACIMIENTO con madre_id, o PARTO con cria_id) → eventos de salud o defectos en crías. Para rastrear líneas maternas defectuosas, registrar en la cría un evento de tipo "CONDICION_SALUD" o "DEFECTO" (ampliar catálogo si se requiere) con motivo_id en catálogo cerrado; las consultas agrupan por madre_id y cuentan condiciones en crías.

---

## 8. Resumen de prioridad

| Prioridad | Acción |
|-----------|--------|
| 1 | Crear colección `eventos_animal` y catálogos cerrados (tipo_evento, motivos). |
| 2 | Script de migración: desde `animales` actuales generar eventos NACIMIENTO y eventos de cierre (MUERTE/ROBO/DESCARTE). |
| 3 | Implementar validaciones de integridad temporal al insertar eventos. |
| 4 | Sustituir lectura de estado en UI y reportes por estado derivado de eventos. |
| 5 | Eliminar escritura y deprecar campos estado, activo, razon_inactivo, fecha_inactivo en `animales`. |

Este documento sirve como contrato del modelo y guía para las migraciones y el código que se implemente a continuación.

---

## 9. Script de migración y API (implementados)

### Ejecutar migración de datos

Desde la raíz del proyecto, con `.env.local` configurado (Firebase Admin):

```bash
node scripts/migrate-eventos-from-animales.mjs        # ejecuta migración
node scripts/migrate-eventos-from-animales.mjs --dry-run   # solo simula
```

El script crea en `eventos_animal`:
- Un evento **NACIMIENTO** por cada animal con `fecha_nacimiento` (y `madre_id` si existe).
- Un evento **MUERTE/ROBO/VENTA/DESCARTE** por cada animal con `activo === false`, usando `estado` y `razon_inactivo` para tipo y motivo.

### API de eventos

- **GET /api/eventos-animal?animal_id=xxx&userId=xxx&orden=asc|desc**  
  Devuelve la lista de eventos del animal (orden por defecto: más reciente primero).

- **POST /api/eventos-animal**  
  Registra un evento. Body (JSON):
  - `userId` (string, obligatorio)
  - `animal_id` (string, obligatorio)
  - `tipo_evento` (obligatorio: uno de NACIMIENTO, SERVICIO, DIAGNOSTICO_GESTACION, PARTO, ABORTO, DESTETE, MUERTE, VENTA, ROBO, DESCARTE)
  - `fecha_evento` (string ISO 8601, obligatorio)
  - `motivo_id` (opcional, según catálogo del tipo)
  - `observaciones`, `madre_id` (obligatorio si tipo_evento === NACIMIENTO), `cria_id` (opcional)

  Se valida integridad temporal antes de guardar (animal no cerrado, PARTO tras SERVICIO, etc.).
