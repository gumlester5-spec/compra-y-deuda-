import { useState, useMemo, useEffect, useRef } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa'
import { toast } from 'react-hot-toast'

// --- ¡ADVERTENCIA DE SEGURIDAD MUY IMPORTANTE! ---
// NUNCA expongas tu API Key directamente en el código del cliente en una aplicación real.
// Cualquiera podría robarla y usarla, generando costos en tu cuenta.
// Para una aplicación en producción, usa un backend (como Firebase Functions) que guarde la clave de forma segura.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("La variable de entorno VITE_GEMINI_API_KEY no está definida.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const ChatBotPage = () => {
  // El objeto `chat` gestionará el historial de la conversación con la IA.
  // Usamos `useMemo` para que se cree una sola vez por componente.
  const chat = useMemo(() => model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Eres un asistente amigable y útil para una aplicación de gestión de tiendas. Tu nombre es 'FiadoBot'. Ayuda a los usuarios con preguntas sobre la gestión de su inventario, deudas, compras y pedidos. Sé conciso y directo." }],
      },
      {
        role: "model",
        parts: [{ text: "¡Hola! Soy FiadoBot. ¿En qué puedo ayudarte a gestionar tu tienda hoy?" }],
      },
    ]
  }), []);

  // Este estado `history` es solo para mostrar los mensajes en la pantalla.
  const [history, setHistory] = useState<ChatMessage[]>([
    { role: 'model', text: "¡Hola! Soy FiadoBot. ¿En qué puedo ayudarte a gestionar tu tienda hoy?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Efecto para hacer scroll hacia el último mensaje
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setHistory(prev => [...prev, userMessage]); // Actualiza la UI
    setInput('');
    setIsLoading(true);

    try {
      // Inicia el streaming de la respuesta
      const result = await chat.sendMessageStream(input);

      // Añade un mensaje vacío del bot que se irá llenando
      setHistory(prev => [...prev, { role: 'model', text: "" }]);

      let text = '';
      for await (const chunk of result.stream) {
        text += chunk.text();
        // Actualiza el último mensaje en el historial con el texto acumulado
        setHistory(prev => {
          const newHistory = [...prev];
          newHistory[new-History.length - 1].text = text;
          return newHistory;
        });
      }
    } catch (error) {
      console.error("Error al contactar a Gemini:", error);
      toast.error("Lo siento, no pude procesar tu solicitud. Revisa la consola para más detalles.")
      const errorMessage: ChatMessage = { role: 'model', text: "Lo siento, no pude procesar tu solicitud en este momento." };
      setHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  return (
    <div className="chatbot-page">
      <div className="chatbot-header">
        <FaRobot />
        <h2>Asistente Virtual</h2>
      </div>
      <div className="chatbot-history">
        {history.map((msg, index) => ( // El historial se sigue mostrando igual
          <div key={index} className={`chat-message-wrapper ${msg.role}`}>
            <div className="chat-avatar">
              {msg.role === 'model' ? <FaRobot /> : <FaUser />}
            </div>
            <div className="chat-message">
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message-wrapper model">
            <div className="chat-avatar">
              <FaRobot />
            </div>
            <div className="chat-message">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} /> {/* Elemento invisible para hacer scroll */}
      </div>
      <div className="chatbot-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu mensaje..."
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatBotPage;