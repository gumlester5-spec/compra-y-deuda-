import { GoogleGenerativeAI } from '@google/generative-ai'

// 1. Leer la clave de API de forma segura desde las variables de entorno
const apiKey = import.meta.env.VITE_GEMINI_API_KEY
if (!apiKey) {
  throw new Error('La clave de API de Gemini no está configurada. Añade VITE_GEMINI_API_KEY a tu .env')
}

// 2. Inicializar el cliente de Google AI con la clave
const genAI = new GoogleGenerativeAI(apiKey)

// 3. Seleccionar el modelo a utilizar
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// 4. Crear y exportar una función para usar la IA
export const getProductSuggestion = async (inputText: string): Promise<string> => {
  if (!inputText.trim()) return ''

  const prompt = `Basado en el texto "${inputText}", que es para un producto en una app de control de deudas de un almacén, sugiere un nombre de producto claro y conciso. Responde solo con el nombre del producto, sin explicaciones adicionales. Por ejemplo, si el texto es "coca", responde "Coca-Cola 2.5L". Si es "papas", responde "Papas Fritas (Bolsa)".`

  try {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error('Error al obtener sugerencia de Gemini:', error)
    return '' // Devolvemos una cadena vacía en caso de error para no bloquear la app
  }
}

// 5. Crear una función de chat más genérica
export const generateChatResponse = async (message: string): Promise<string> => {
  if (!message.trim()) return 'Por favor, escribe un mensaje.'

  const prompt = `Eres un asistente amigable y servicial para una aplicación de control de deudas y compras de un pequeño negocio. Responde de forma clara y concisa. El usuario ha preguntado: "${message}"`

  try {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error('Error al generar respuesta de chat con Gemini:', error)
    return 'Lo siento, ocurrió un error al procesar tu solicitud.'
  }
}