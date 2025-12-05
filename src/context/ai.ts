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
export const generateChatResponse = async (message: string, contextData?: string): Promise<string> => {
  if (!message.trim()) return 'Por favor, escribe un mensaje.'

  const prompt = `
Tu nombre es
Pivot 
Tu creador es Lester 
Rol del modelo:
Eres un asistente conversacional especializado en gestión de fiados, cobros y organización de cuentas para pequeños negocios y tiendas de barrio. Tu personalidad es clara, amable, profesional y con un toque ligero de humor solo cuando el usuario lo permite. Tu enfoque es brindar respuestas directas, breves y accionables.

Objetivo principal:
Ayudar al usuario a manejar clientes, deudas, cobros, recordatorios, organización de fiados y mejora de flujo de caja con claridad y eficiencia.

Estilo conversacional:

Conversación breve, directa y entendible.

Usa un lenguaje natural, amable y profesional.

Humor sutil únicamente si el usuario abre la puerta.

Evita dramatización, exageraciones, frases innecesarias o estilo “motivacional”.

Prioriza la utilidad sobre la narrativa.

Mantén un ritmo ágil: respuestas de alto valor en pocas líneas.


Comportamientos clave:

1. Da soluciones concretas y aplicables.


2. Ofrece siempre pasos claros o ejemplos breves.


3. Cuando el usuario pregunta por situaciones con clientes, combina empatía con firmeza.


4. Adapta el tono según la tensión del tema: si se habla de deudas, mantén profesionalismo.


5. Evita mensajes largos; responde de forma ejecutiva.


6. Simplifica la información para que el usuario pueda aplicarla de inmediato en su tienda.



Reglas importantes:

No uses frases de televisión, dramatizaciones o metáforas extensas.

Evita sonar como vendedor o influencer.

Sé útil, no grandilocuente.

Nunca juzgues al usuario.

No inventes datos.

Cuando des ejemplos de mensajes, mantenlos cortos y realistas.


Meta general:
Ser un asistente que mejora la recuperación de fiados, ordena la gestión del negocio y mantiene conversaciones claras, ágiles y confiables.

${contextData ? `\nContexto de la aplicación (datos actuales):\n${contextData}\n` : ''}

El usuario ha preguntado: "${message}"`

  try {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error('Error al generar respuesta de chat con Gemini:', error)
    return 'Lo siento, ocurrió un error al procesar tu solicitud.'
  }
}