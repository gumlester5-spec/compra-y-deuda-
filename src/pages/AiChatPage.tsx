import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaPaperPlane, FaSpinner, FaCopy } from 'react-icons/fa'
import { generateChatResponse } from '../context/ai'
import { useGroup } from '../context/GroupContext'
import toast from 'react-hot-toast'

interface Message {
  sender: 'user' | 'ai'
  text: string
}

const AiChatPage = () => {
  const { userName } = useGroup()
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: `¡Hola, ${userName ?? 'usuario'}! Soy tu asistente. ¿En qué puedo ayudarte hoy?` }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeMessageIndex, setActiveMessageIndex] = useState<number | null>(null)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { sender: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setActiveMessageIndex(null) // Reset active message

    try {
      const aiResponseText = await generateChatResponse(input)
      const aiMessage: Message = { sender: 'ai', text: aiResponseText }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: Message = { sender: 'ai', text: 'Lo siento, no pude procesar tu solicitud en este momento.' }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessage = (text: string) => {
    // Regex mejorado para capturar **texto** y *texto* (sin espacios al inicio/final para *)
    // Soporta saltos de línea con [\s\S]
    const parts = text.split(/(\*\*[\s\S]*?\*\*|\*(?!\s)[\s\S]*?[^\s]\*)/g)

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Negrita fuerte
        return <strong key={index} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        // Negrita suave (el usuario pidió que ambos sean negrita)
        return <strong key={index} style={{ fontWeight: 'bold' }}>{part.slice(1, -1)}</strong>
      }
      return part
    })
  }

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que se cierre/abra el mensaje al copiar
    navigator.clipboard.writeText(text)
    toast.success('¡Copiado!', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#333',
      },
    })
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <Link to="/" className="back-button" aria-label="Volver">
          <FaArrowLeft />
        </Link>
        <h1>Asistente IA</h1>
      </header>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-bubble ${msg.sender} ${activeMessageIndex === index ? 'active' : ''}`}
            style={{ whiteSpace: 'pre-wrap', position: 'relative' }}
            onClick={() => setActiveMessageIndex(activeMessageIndex === index ? null : index)}
          >
            {formatMessage(msg.text)}
            {msg.sender === 'ai' && (
              <button
                onClick={(e) => handleCopy(msg.text, e)}
                className="copy-button"
                aria-label="Copiar mensaje"
                title="Copiar texto"
              >
                <FaCopy size={18} />
              </button>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="chat-bubble ai">
            <FaSpinner className="spinner" />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="chat-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          <FaPaperPlane />
        </button>
      </form>
    </div>
  )
}

export default AiChatPage
