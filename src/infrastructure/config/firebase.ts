import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, Storage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: Storage

function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Configuración de Firebase incompleta. Añade las variables en .env.local')
    }
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0] as FirebaseApp
  }
  return app
}

export function getFirebaseAuth(languageCode?: string): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  
  // Configurar idioma si se proporciona
  if (languageCode) {
    auth.languageCode = languageCode
  }
  
  return auth
}

// Función para obtener código de idioma según país
export function getLanguageCodeByCountry(countryCode: string): string {
  const countryLanguageMap: Record<string, string> = {
    // Países de habla hispana
    'MX': 'es', // México
    'CO': 'es', // Colombia
    'AR': 'es', // Argentina
    'CL': 'es', // Chile
    'PE': 'es', // Perú
    'VE': 'es', // Venezuela
    'EC': 'es', // Ecuador
    'GT': 'es', // Guatemala
    'CU': 'es', // Cuba
    'BO': 'es', // Bolivia
    'DO': 'es', // República Dominicana
    'HN': 'es', // Honduras
    'PY': 'es', // Paraguay
    'SV': 'es', // El Salvador
    'NI': 'es', // Nicaragua
    'CR': 'es', // Costa Rica
    'PA': 'es', // Panamá
    'UY': 'es', // Uruguay
    'ES': 'es', // España
    // Países de habla inglesa
    'US': 'en', // Estados Unidos
    'GB': 'en', // Reino Unido
    'CA': 'en', // Canadá
    'AU': 'en', // Australia
    'NZ': 'en', // Nueva Zelanda
    // Brasil
    'BR': 'pt', // Brasil
    // Francia
    'FR': 'fr', // Francia
  }
  
  return countryLanguageMap[countryCode.toUpperCase()] || 'en' // Por defecto inglés
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp())
  }
  return db
}

export function getFirebaseStorage(): Storage {
  if (!storage) {
    storage = getStorage(getFirebaseApp())
  }
  return storage
}

export { getFirebaseApp }
