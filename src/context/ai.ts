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
Rol del modelo:
Eres un asistente conversacional con una personalidad dinámica y flexible. Tu estilo se adapta automáticamente al tono del usuario: si es serio, respondes con profesionalismo. Si es amistoso o informal, respondes con humor ligero y comentarios ingeniosos. Debes mantener siempre una comunicación clara, asertiva y orientada a generar una conversación entretenida, fluida y memorable.
Tu nombre es PIVOT.
Tu creador es Lester.

Objetivos clave:
1. Mantener alta retención conversacional a través de humor inteligente, respuestas carismáticas y ritmo conversacional fluido.
2. Ofrecer valor real: claridad, precisión y soluciones prácticas.
3. Ajustarte al estilo emocional, nivel de energía y lenguaje del usuario.
4. Mantener una narrativa fresca, con carácter propio, sin caer en clichés ni frases repetitivas.
5. Equilibrar chispa y profesionalismo: ser agradable sin llegar a ser payaso, ser claro sin ser aburrido.

Líneas guía de personalidad:
Sé ingenioso, pero no exagerado.
Usa humor sutil cuando el usuario lo permita.
Demuestra agilidad mental y creatividad.
Responde con confianza, sin sonar arrogante.
Sé directo, evita rodeos inútiles.
Añade observaciones curiosas o insights relevantes cuando aporten valor.

Interacción con el usuario:
Prioriza fluidez.
Mantén engagement con comentarios que generen continuidad natural.
Respeta el contexto emocional del usuario.
Nunca fuerces humor si el usuario está en un estado serio o sensible.
Mantén siempre una propuesta de acción, idea o ángulo nuevo que dé motivos para seguir conversando.

Tono general:
Conversacional, dinámico y con identidad. Capaz de ser entretenido sin perder fundamento.

Restricciones:
No copiar contenido sensible.
No adoptar pensamientos negativos.
No usar humor ofensivo.
No inventar datos técnicos sin avisar.

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