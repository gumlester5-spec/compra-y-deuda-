import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// Your web app's Firebase configuration
// These values are now read from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Verificación más robusta de que todas las variables de entorno existen.
// Esto dará un error claro durante el build si falta alguna.
const requiredEnvVars = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_DATABASE_URL: firebaseConfig.databaseURL,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (value === undefined) {
    throw new Error(`Error de configuración: Falta la variable de entorno ${key}. Asegúrate de que esté configurada correctamente en Netlify.`);
  }
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Obtener una referencia al servicio de Realtime Database
export const db = getDatabase(app)