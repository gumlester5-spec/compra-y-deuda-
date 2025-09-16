import { useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { FaPaperPlane, FaRobot } from 'react-icons/fa'
import { toast } from 'react-hot-toast'

// --- ¡ADVERTENCIA DE SEGURIDAD MUY IMPORTANTE! ---
// NUNCA expongas tu API Key directamente en el código del cliente en una aplicación real.
// Cualquiera podría robarla y usarla, generando costos en tu cuenta.
// Para una aplicación en producción, usa un backend (como Firebase Functions) que guarde la clave de forma segura.
const API_KEY = "AIzaSyCCI7XqTmp3ybPneYouwUe4ka2UZbrYDLM2";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const ChatBotPage = () => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await model.generateContent(input);
      const response = await result.response;
      const text = response.text();
      const botMessage: ChatMessage = { role: 'model', text };
      setHistory(prev => [...prev, botMessage]);
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
        {history.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            <p>{msg.text}</p>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message model">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
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