import { useState, useRef, useEffect } from 'react'
import { FaRobot, FaTimes, FaPaperPlane, FaSpinner } from 'react-icons/fa'
import { generateChatResponse } from '../context/ai'
import { useGroup } from '../context/GroupContext'
import { ref, onValue } from 'firebase/database'
import { db, type Debtor } from '../db'
import './GlobalChat.css'

interface Message {
    sender: 'user' | 'ai'
    text: string
}

const GlobalChat = () => {
    const { userName, groupId } = useGroup()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [debtorsContext, setDebtorsContext] = useState<string>('')

    // Cargar datos de deudores para el contexto
    useEffect(() => {
        if (!groupId) return
        const debtorsRef = ref(db, `groups/${groupId}/debtors`)

        const unsubscribe = onValue(debtorsRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const debtorsList: Debtor[] = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                }))

                // Formatear los datos para la IA
                const contextString = debtorsList.map(d =>
                    `- ${d.name}: Q${d.amount.toFixed(2)} (${d.description})`
                ).join('\n')

                setDebtorsContext(contextString)
            } else {
                setDebtorsContext('No hay deudas registradas actualmente.')
            }
        })

        return () => unsubscribe()
    }, [groupId])

    // Inicializar mensaje de bienvenida solo una vez
    useEffect(() => {
        if (messages.length === 0 && userName) {
            setMessages([
                { sender: 'ai', text: `¡Hola, ${userName}! Soy tu asistente. ¿En qué puedo ayudarte hoy?` }
            ])
        }
    }, [userName])

    // Auto-scroll al final de los mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isOpen])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = { sender: 'user', text: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            // Pasamos el contexto de deudores a la IA
            const aiResponseText = await generateChatResponse(input, debtorsContext)
            const aiMessage: Message = { sender: 'ai', text: aiResponseText }
            setMessages(prev => [...prev, aiMessage])
        } catch (error) {
            const errorMessage: Message = { sender: 'ai', text: 'Lo siento, no pude procesar tu solicitud en este momento.' }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const toggleChat = () => {
        setIsOpen(!isOpen)
    }

    return (
        <>
            {/* Botón Flotante (FAB) */}
            {!isOpen && (
                <button
                    onClick={toggleChat}
                    className="fab"
                    aria-label="Abrir chat con IA"
                >
                    <FaRobot />
                </button>
            )}

            {/* Ventana de Chat */}
            {isOpen && (
                <div className="global-chat-overlay">
                    <div className="global-chat-window" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="ai-avatar-header">
                                    <FaRobot />
                                </div>
                                <h3>PIVOT</h3>
                            </div>
                            <button onClick={toggleChat} className="close-chat-button" aria-label="Cerrar chat">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="chat-messages-area">
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
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="chat-input-area">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                disabled={isLoading}
                                autoFocus
                            />
                            <button type="submit" disabled={isLoading || !input.trim()}>
                                <FaPaperPlane />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default GlobalChat
