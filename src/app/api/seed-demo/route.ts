import { NextResponse } from 'next/server'
import { getFirebaseDb } from '@/infrastructure/config/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

const USUARIOS = 'usuarios'
const ANIMALES = 'animales'

const DEMO_USUARIOS = [
  { id: 'demo_1', nombre: 'Juan', apellido: 'Pérez', email: 'juan.perez@demo.com', telefono: '3001234567', rancho: 'Rancho El Roble', rancho_hectareas: 150, rancho_pais: 'CO', rancho_ciudad: 'Villavicencio', rancho_direccion: 'Vereda El Porvenir Km 5', rancho_descripcion: 'Ganadería bovina de cría y levante', moneda: 'COP' },
  { id: 'demo_2', nombre: 'María', apellido: 'García', email: 'maria.garcia@demo.com', telefono: '3109876543', rancho: 'Hacienda San José', rancho_hectareas: 320, rancho_pais: 'MX', rancho_ciudad: 'Monterrey', rancho_direccion: 'Carretera a Saltillo Km 12', rancho_descripcion: 'Ganadería extensiva, raza Charolais', moneda: 'MXN' },
  { id: 'demo_3', nombre: 'Carlos', apellido: 'Rodríguez', email: 'carlos.rodriguez@demo.com', telefono: '3155551234', rancho: 'Finca La Esperanza', rancho_hectareas: 85, rancho_pais: 'CO', rancho_ciudad: 'Medellín', rancho_direccion: 'Vereda San Pablo', rancho_descripcion: 'Doble propósito, Brahman y Gyr', moneda: 'COP' },
  { id: 'demo_4', nombre: 'Ana', apellido: 'Martínez', email: 'ana.martinez@demo.com', telefono: '3204445678', rancho: 'Estancia Los Álamos', rancho_hectareas: 500, rancho_pais: 'AR', rancho_ciudad: 'Buenos Aires', rancho_direccion: 'Ruta 2 Km 180', rancho_descripcion: 'Cría de Hereford y Angus', moneda: 'ARS' },
]

const DEMO_ANIMALES = [
  { id: 'demo_animal_1', usuario_id: 'demo_1', nombre: 'Betsy', numero_identificacion: 'BOV-001', especie: 'Bovino', raza: 'Angus', fecha_nacimiento: '2022-03-15', sexo: 'H', estado: 'Excelente', en_venta: true, precio_venta: 2500000, vistas: 0 },
  { id: 'demo_animal_2', usuario_id: 'demo_1', nombre: 'Torito', numero_identificacion: 'BOV-002', especie: 'Bovino', raza: 'Brahman', fecha_nacimiento: '2021-08-20', sexo: 'M', estado: 'Bueno', en_venta: true, precio_venta: 3200000, vistas: 0 },
  { id: 'demo_animal_3', usuario_id: 'demo_1', nombre: 'Luna', numero_identificacion: 'BOV-003', especie: 'Bovino', raza: 'Gyr', fecha_nacimiento: '2023-01-10', sexo: 'H', estado: 'Excelente', en_venta: true, precio_venta: 1800000, vistas: 0 },
  { id: 'demo_animal_4', usuario_id: 'demo_2', nombre: 'Carlos', numero_identificacion: 'BOV-101', especie: 'Bovino', raza: 'Charolais', fecha_nacimiento: '2020-05-12', sexo: 'M', estado: 'Excelente', en_venta: true, precio_venta: 45000, vistas: 0 },
  { id: 'demo_animal_5', usuario_id: 'demo_2', nombre: 'Blanca', numero_identificacion: 'BOV-102', especie: 'Bovino', raza: 'Charolais', fecha_nacimiento: '2022-11-08', sexo: 'H', estado: 'Bueno', en_venta: true, precio_venta: 38000, vistas: 0 },
  { id: 'demo_animal_6', usuario_id: 'demo_2', nombre: 'Bravo', numero_identificacion: 'BOV-103', especie: 'Bovino', raza: 'Simmental', fecha_nacimiento: '2021-07-22', sexo: 'M', estado: 'Excelente', en_venta: true, precio_venta: 52000, vistas: 0 },
  { id: 'demo_animal_7', usuario_id: 'demo_3', nombre: 'Manchita', numero_identificacion: 'BOV-201', especie: 'Bovino', raza: 'Brahman', fecha_nacimiento: '2022-04-18', sexo: 'H', estado: 'Bueno', en_venta: true, precio_venta: 2100000, vistas: 0 },
  { id: 'demo_animal_8', usuario_id: 'demo_3', nombre: 'Gordo', numero_identificacion: 'BOV-202', especie: 'Bovino', raza: 'Gyr', fecha_nacimiento: '2020-12-05', sexo: 'M', estado: 'Excelente', en_venta: true, precio_venta: 2800000, vistas: 0 },
  { id: 'demo_animal_9', usuario_id: 'demo_4', nombre: 'Ringo', numero_identificacion: 'BOV-301', especie: 'Bovino', raza: 'Hereford', fecha_nacimiento: '2021-09-30', sexo: 'M', estado: 'Excelente', en_venta: true, precio_venta: 850000, vistas: 0 },
  { id: 'demo_animal_10', usuario_id: 'demo_4', nombre: 'Dulce', numero_identificacion: 'BOV-302', especie: 'Bovino', raza: 'Angus', fecha_nacimiento: '2023-02-14', sexo: 'H', estado: 'Bueno', en_venta: true, precio_venta: 720000, vistas: 0 },
]

async function seedData() {
  const db = getFirebaseDb()

  for (const u of DEMO_USUARIOS) {
    const { id, ...data } = u
    await setDoc(doc(db, USUARIOS, id), {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  for (const a of DEMO_ANIMALES) {
    const { id, ...data } = a
    await setDoc(doc(db, ANIMALES, id), {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }
}

export async function GET() {
  try {
    const db = getFirebaseDb()
    const demoUserSnap = await getDoc(doc(db, USUARIOS, 'demo_1'))
    if (demoUserSnap.exists()) {
      return NextResponse.json({ message: 'Datos demo ya existen', seeded: false })
    }
    await seedData()
    return NextResponse.json({ message: 'Datos de ejemplo cargados automáticamente', seeded: true })
  } catch (error: any) {
    console.error('Error seeding:', error)
    return NextResponse.json({ error: error.message || 'Error al cargar datos' }, { status: 500 })
  }
}

export async function POST() {
  try {
    await seedData()
    return NextResponse.json({ message: 'Datos de ejemplo cargados correctamente', usuarios: 4, animales: 10 })
  } catch (error: any) {
    console.error('Error seeding:', error)
    return NextResponse.json({ error: error.message || 'Error al cargar datos de ejemplo' }, { status: 500 })
  }
}
