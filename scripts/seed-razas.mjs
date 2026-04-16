import admin from 'firebase-admin';

// Asegúrate de que Firebase Admin SDK está inicializado
const db = admin.firestore();

const RAZAS_DATA = [
  // ========== RAZAS BOS TAURUS (Europeas/Templadas) ==========
  // Lecheras
  { nombre: 'Holstein', aptitud: 'Lechera', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Países Bajos' },
  { nombre: 'Jersey', aptitud: 'Lechera', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Isla de Jersey' },
  { nombre: 'Pardo Suizo (Americano)', aptitud: 'Lechera', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Suiza' },
  { nombre: 'Ayrshire', aptitud: 'Lechera', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Escocia' },
  { nombre: 'Guernsey', aptitud: 'Lechera', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Isla de Guernsey' },
  { nombre: 'Milking Shorthorn', aptitud: 'Lechera', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Reino Unido' },
  { nombre: 'Kerry', aptitud: 'Lechera', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Irlanda' },
  { nombre: 'Dexter', aptitud: 'Lechera', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Irlanda' },

  // Cárnicas
  { nombre: 'Angus (Negro)', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Escocia' },
  { nombre: 'Red Angus', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Escocia' },
  { nombre: 'Hereford', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Inglaterra' },
  { nombre: 'Polled Hereford', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Inglaterra' },
  { nombre: 'Charolais', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Francia' },
  { nombre: 'Limousin', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Francia' },
  { nombre: 'Belgian Blue', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Bélgica' },
  { nombre: 'Chianina', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Italia' },
  { nombre: 'Shorthorn', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Reino Unido' },
  { nombre: 'Blonde d\'Aquitaine', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Francia' },
  { nombre: 'Maine-Anjou', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Francia' },
  { nombre: 'Romagnola', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Italia' },
  { nombre: 'Piedmontese', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Italia' },
  { nombre: 'Galloway', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Escocia' },
  { nombre: 'Highland', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Escocia' },
  { nombre: 'Wagyu (Kuroge Washu)', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Japón' },
  { nombre: 'Salers', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Francia' },

  // Doble Propósito
  { nombre: 'Simmental', aptitud: 'Doble Propósito', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Austria' },
  { nombre: 'Normando', aptitud: 'Doble Propósito', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Francia' },
  { nombre: 'Pardo Suizo (Original/Braunvieh)', aptitud: 'Doble Propósito', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Suiza' },
  { nombre: 'Red Poll', aptitud: 'Doble Propósito', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Reino Unido' },
  { nombre: 'Gelbvieh', aptitud: 'Doble Propósito', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Alemania' },
  { nombre: 'Pinzgauer', aptitud: 'Doble Propósito', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Austria' },
  { nombre: 'Tarentaise', aptitud: 'Doble Propósito', especie: 'Bos taurus', clima_ideal: 'Templado', origen: 'Francia' },

  // ========== RAZAS BOS INDICUS (Cebuínas - CRÍTICAS PARA TRÓPICO) ==========
  { nombre: 'Brahman Gris', aptitud: 'Cárnica', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'India' },
  { nombre: 'Brahman Rojo', aptitud: 'Cárnica', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'India' },
  { nombre: 'Nelore', aptitud: 'Cárnica', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'Brasil/India' },
  { nombre: 'Guzerat', aptitud: 'Doble Propósito', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'India' },
  { nombre: 'Gyr', aptitud: 'Doble Propósito', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'India' },
  { nombre: 'Gyr Lechero', aptitud: 'Lechera', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'Brasil' },
  { nombre: 'Indubrasil', aptitud: 'Cárnica', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'Brasil' },
  { nombre: 'Sahiwal', aptitud: 'Lechera', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'Pakistán' },
  { nombre: 'Boran', aptitud: 'Cárnica', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'Kenya' },
  { nombre: 'Kankrej', aptitud: 'Doble Propósito', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'India' },
  { nombre: 'Tharparkar', aptitud: 'Doble Propósito', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'India' },

  // ========== RAZAS SINTÉTICAS / COMPUESTAS ==========
  { nombre: 'Brangus', aptitud: 'Cárnica', especie: 'Sintética (F1)', clima_ideal: 'Tropical/Adaptado', composicion: 'Angus + Brahman', origen: 'USA' },
  { nombre: 'Braford', aptitud: 'Cárnica', especie: 'Sintética (F1)', clima_ideal: 'Tropical/Adaptado', composicion: 'Hereford + Brahman', origen: 'USA' },
  { nombre: 'Beefmaster', aptitud: 'Cárnica', especie: 'Sintética (F1)', clima_ideal: 'Tropical/Adaptado', composicion: 'Brahman + Hereford + Shorthorn', origen: 'USA' },
  { nombre: 'Santa Gertrudis', aptitud: 'Cárnica', especie: 'Sintética (F1)', clima_ideal: 'Tropical/Adaptado', composicion: 'Brahman + Shorthorn', origen: 'USA' },
  { nombre: 'Simbrah', aptitud: 'Cárnica', especie: 'Sintética (F1)', clima_ideal: 'Tropical/Adaptado', composicion: 'Simmental + Brahman', origen: 'USA' },
  { nombre: 'Girolando', aptitud: 'Lechera', especie: 'Sintética (F1)', clima_ideal: 'Tropical/Adaptado', composicion: 'Gyr + Holstein', origen: 'Brasil' },
  { nombre: 'Charbray', aptitud: 'Cárnica', especie: 'Sintética (F1)', clima_ideal: 'Tropical/Adaptado', composicion: 'Charolais + Brahman', origen: 'USA' },
  { nombre: 'Senepol', aptitud: 'Cárnica', especie: 'Sintética (F1)', clima_ideal: 'Tropical', composicion: 'N\'Dama + Red Poll', origen: 'Islas Vírgenes' },
  { nombre: 'Tropical Longeño', aptitud: 'Doble Propósito', especie: 'Sintética (F1)', clima_ideal: 'Tropical', composicion: 'Criollo + Cebú', origen: 'Colombia' },
  { nombre: 'Siboney', aptitud: 'Doble Propósito', especie: 'Sintética (F1)', clima_ideal: 'Tropical', composicion: 'Holstein + Cebú', origen: 'Cuba' },

  // ========== RAZAS CRIOLLAS (ADAPTADAS A LATINOAMÉRICA) ==========
  { nombre: 'Blanco Orejinegro (BON)', aptitud: 'Doble Propósito', especie: 'Bos taurus', clima_ideal: 'Tropical/Adaptado', origen: 'Colombia' },
  { nombre: 'Romosinuano', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Tropical/Adaptado', origen: 'Colombia' },
  { nombre: 'Hartón del Valle', aptitud: 'Lechera', especie: 'Bos taurus', clima_ideal: 'Tropical/Adaptado', origen: 'Colombia' },
  { nombre: 'Caracu', aptitud: 'Cárnica', especie: 'Bos taurus', clima_ideal: 'Tropical/Adaptado', origen: 'Brasil' },
  { nombre: 'Criollo Mexicano', aptitud: 'Doble Propósito', especie: 'Bos taurus', clima_ideal: 'Tropical/Adaptado', origen: 'México' },
  { nombre: 'Reyna', aptitud: 'Lechera', especie: 'Bos taurus', clima_ideal: 'Tropical/Adaptado', origen: 'Centroamérica' },

  // ========== RAZAS ADICIONALES IMPORTANTES ==========
  { nombre: 'N\'Dama', aptitud: 'Doble Propósito', especie: 'Bos taurus', clima_ideal: 'Tropical/Adaptado', origen: 'Africa Occidental' },
  { nombre: 'Nellore', aptitud: 'Cárnica', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'Brasil/India' },
  { nombre: 'Raza Lechera Colombiana (RLC)', aptitud: 'Lechera', especie: 'Sintética (F1)', clima_ideal: 'Tropical/Adaptado', composicion: 'Holstein + Cebú', origen: 'Colombia' },
  { nombre: 'Cebú Americano', aptitud: 'Cárnica', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'USA' },
  { nombre: 'Ongole', aptitud: 'Cárnica', especie: 'Bos indicus', clima_ideal: 'Tropical', origen: 'Indonesia' },
];

async function seedRazas() {
  try {
    console.log('🌾 Iniciando siembra de razas en Firestore...');
    
    const batch = db.batch();
    let count = 0;

    for (const razaData of RAZAS_DATA) {
      const razaRef = db.collection('razas').doc();
      
      batch.set(razaRef, {
        ...razaData,
        activa: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      count++;
    }

    await batch.commit();
    console.log(`✅ ${count} razas insertadas exitosamente en la colección 'razas'`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al sembrar razas:', error);
    process.exit(1);
  }
}

seedRazas();
