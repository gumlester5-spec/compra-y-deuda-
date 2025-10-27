import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaPaperPlane, FaSpinner } from 'react-icons/fa'
import { generateChatResponse } from '../context/ai'
import { useGroup } from '../context/GroupContext'

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { sender: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

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
          <div key={index} className={`chat-bubble ${msg.sender}`}>
            {msg.text}
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
