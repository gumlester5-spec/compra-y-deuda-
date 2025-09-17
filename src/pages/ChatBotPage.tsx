import { FunctionDeclarationSchemaType } from '@google/generative-ai'
import { useState, useEffect, useRef } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa'
import { toast } from 'react-hot-toast'
import { useGroup } from '../context/GroupContext'
import { db, type Debtor, type PurchaseItem, type Order, addDebtor, addPurchase, addOrder, addHistoryLog, type PurchasePriority } from '../db';
import { ref, get } from 'firebase/database'

// --- ¡ADVERTENCIA DE SEGURIDAD MUY IMPORTANTE! ---
// NUNCA expongas tu API Key directamente en el código del cliente en una aplicación real.
// Para una aplicación en producción, usa un backend (como Firebase Functions) que guarde la clave de forma segura.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("La variable de entorno VITE_GEMINI_API_KEY no está definida.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  // CORRECCIÓN: Se define el array de herramientas directamente para mayor claridad.
  // La estructura [ { functionDeclarations: [...] } ] es la correcta.
  tools: [{
    functionDeclarations: [
      {
        name: "addFiado",
        description: "Agrega una nueva deuda o fiado para un cliente. Pide la información que falte si es necesario.",
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            nombreCliente: { type: FunctionDeclarationSchemaType.STRING, description: "El nombre del cliente que recibe el fiado." },
            monto: { type: FunctionDeclarationSchemaType.NUMBER, description: "El monto total de la deuda en Quetzales." },
            descripcion: { type: FunctionDeclarationSchemaType.STRING, description: "Una breve descripción del producto o motivo del fiado." },
          },
          required: ["nombreCliente", "monto", "descripcion"],
        },
      },
      {
        name: "addCompra",
        description: "Agrega un nuevo producto a la lista de compras pendientes. Pide la información que falte si es necesario.",
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            nombreProducto: { type: FunctionDeclarationSchemaType.STRING, description: "El nombre del producto que se necesita comprar." },
            proveedor: { type: FunctionDeclarationSchemaType.STRING, description: "El nombre del proveedor al que se le compra el producto." },
            prioridad: { type: FunctionDeclarationSchemaType.STRING, description: "La prioridad de la compra (alta, media, o baja).", enum: ["alta", "media", "baja"] },
          },
          required: ["nombreProducto", "proveedor", "prioridad"],
        },
      },
      {
        name: "addPedido",
        description: "Agrega un nuevo pedido a un proveedor. Pide la información que falte si es necesario.",
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            nombreProveedor: { type: FunctionDeclarationSchemaType.STRING, description: "El nombre del proveedor al que se le hace el pedido." },
            productos: { type: FunctionDeclarationSchemaType.STRING, description: "Una lista o descripción de los productos pedidos." },
            monto: { type: FunctionDeclarationSchemaType.NUMBER, description: "El monto total del pedido en Quetzales." },
            fechaLlegada: { type: FunctionDeclarationSchemaType.STRING, description: "La fecha estimada de llegada del pedido en formato AAAA-MM-DD." },
          },
          required: ["nombreProveedor", "productos", "monto", "fechaLlegada"],
        },
      },
    ],
  }]
});

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const ChatBotPage = () => {
  // El objeto `chat` gestionará el historial de la conversación con la IA. Se inicializa en un useEffect.
  const chatRef = useRef<ReturnType<typeof model.startChat> | null>(null);

  // Este estado `history` es solo para mostrar los mensajes en la pantalla.
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { groupId, userName } = useGroup()

  // Carga el historial del chat desde localStorage o inicializa uno nuevo.
  useEffect(() => {
    if (!groupId) return;

    const initialPrompt = [
      { role: "user", parts: [{ text: "Eres un asistente amigable y útil para una aplicación de gestión de tiendas. Tu nombre es 'FiadoBot'. Ayuda a los usuarios con preguntas sobre la gestión de su inventario, deudas, compras y pedidos. Sé conciso y directo." }] },
      { role: "model", parts: [{ text: "¡Hola! Soy FiadoBot. ¿En qué puedo ayudarte a gestionar tu tienda hoy?" }] },
    ];

    const startFreshChat = () => {
      console.log("Iniciando un nuevo chat, el historial anterior no era válido o no existía.");
      chatRef.current = model.startChat({ history: initialPrompt });
      setHistory([{ role: 'model', text: "¡Hola! Soy FiadoBot. ¿En qué puedo ayudarte a gestionar tu tienda hoy?" }]);
      // Limpiamos cualquier historial potencialmente corrupto
      localStorage.removeItem(`chatHistory_${groupId}`);
    };

    try {
      const storedHistoryJson = localStorage.getItem(`chatHistory_${groupId}`);
      if (storedHistoryJson) {
        const storedModelHistory = JSON.parse(storedHistoryJson);

        // Validamos que el historial no esté vacío o sea inválido
        if (!Array.isArray(storedModelHistory) || storedModelHistory.length === 0) {
          throw new Error("El historial almacenado está vacío o no es un array.");
        }

        chatRef.current = model.startChat({ history: storedModelHistory });

        // Convierte el historial del modelo a un historial para la UI (omitiendo el prompt inicial)
        const uiHistory = storedModelHistory
          .filter((msg: any) => msg.role !== 'user' || !msg.parts[0]?.text?.startsWith('Eres un asistente'))
          .map((msg: any) => ({ role: msg.role, text: msg.parts?.map((p: any) => p.text || '').join('') || '' }))
          .filter((msg: ChatMessage) => msg.text.trim() !== '');

        setHistory(uiHistory.length > 0 ? uiHistory : [{ role: 'model', text: "¡Hola! Soy FiadoBot. ¿En qué puedo ayudarte a gestionar tu tienda hoy?" }]);
      } else {
        startFreshChat();
      }
    } catch (error) {
      console.error("Error al cargar el historial del chat:", error);
      startFreshChat();
    }
  }, [groupId]);

  // --- Implementación de las Herramientas ---
  // Estas son las funciones reales que se ejecutan cuando la IA decide usar una herramienta.
  const availableTools = {
    addFiado: async ({ nombreCliente, monto, descripcion }: { nombreCliente: string, monto: number, descripcion: string }) => {
      if (!groupId || !userName) return { success: false, error: "Usuario o grupo no identificado." };
      try {
        const newDebtorData: Omit<Debtor, 'id'> = {
          name: nombreCliente.trim(),
          description: descripcion.trim(),
          amount: monto,
          date: Date.now(),
        };
        await addDebtor(groupId, newDebtorData);
        await addHistoryLog(groupId, userName, `agregó la deuda de "${newDebtorData.name}" por Q${newDebtorData.amount.toFixed(2)} vía chat.`, 'add');
        return { success: true, message: `Deuda de ${nombreCliente} por Q${monto} agregada.` };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: `Error al agregar fiado: ${errorMessage}` };
      }
    },
    addCompra: async ({ nombreProducto, proveedor, prioridad }: { nombreProducto: string, proveedor: string, prioridad: PurchasePriority }) => {
      if (!groupId || !userName) return { success: false, error: "Usuario o grupo no identificado." };
      try {
        const newItemData: Omit<PurchaseItem, 'id'> = {
          name: nombreProducto.trim(),
          supplier: proveedor.trim(),
          priority: prioridad,
        };
        await addPurchase(groupId, newItemData);
        await addHistoryLog(groupId, userName, `agregó la compra "${newItemData.name}" vía chat.`, 'add');
        return { success: true, message: `Compra "${nombreProducto}" agregada a la lista.` };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: `Error al agregar compra: ${errorMessage}` };
      }
    },
    addPedido: async ({ nombreProveedor, productos, monto, fechaLlegada }: { nombreProveedor: string, productos: string, monto: number, fechaLlegada: string }) => {
      if (!groupId || !userName) return { success: false, error: "Usuario o grupo no identificado." };
      try {
        const newOrderData: Omit<Order, 'id'> = {
          supplierName: nombreProveedor.trim(),
          products: productos.trim(),
          amount: monto,
          arrivalDate: new Date(fechaLlegada + 'T00:00:00').getTime(),
        };
        await addOrder(groupId, newOrderData);
        await addHistoryLog(groupId, userName, `agregó el pedido para "${newOrderData.supplierName}" por Q${newOrderData.amount.toFixed(2)} vía chat.`, 'add');
        return { success: true, message: `Pedido para ${nombreProveedor} agregado.` };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: `Error al agregar pedido: ${errorMessage}` };
      }
    },
  };

  // Función para obtener el estado actual de la aplicación y crear un contexto para la IA.
  const getApplicationContext = async (): Promise<string> => {
    if (!groupId) return 'El usuario no está en un grupo.'

    try {
      const debtorsRef = ref(db, `groups/${groupId}/debtors`)
      const purchasesRef = ref(db, `groups/${groupId}/purchases`)
      const ordersRef = ref(db, `groups/${groupId}/orders`)

      const [debtorsSnap, purchasesSnap, ordersSnap] = await Promise.all([
        get(debtorsRef),
        get(purchasesRef),
        get(ordersRef)
      ])

      const debtorsData = debtorsSnap.val()
      const purchasesData = purchasesSnap.val()
      const ordersData = ordersSnap.val()

      const now = new Date();
      const formattedDateTime = now.toLocaleString('es-GT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
      });

      let context = '--- CONTEXTO ACTUAL DE LA APLICACIÓN (NO MENCIONES ESTE BLOQUE AL USUARIO A MENOS QUE TE PREGUNTE POR UN RESUMEN) ---\n'
      context += `FECHA Y HORA ACTUAL: ${formattedDateTime}.\n\n`
      
      if (debtorsData) {
        const debtorsList: Debtor[] = Object.values(debtorsData);

        const groupedDebts = debtorsList.reduce((acc, debt) => {
          const clientName = debt.name;
          if (!acc[clientName]) {
            acc[clientName] = { name: clientName, totalAmount: 0, lastDebtDate: 0 };
          }
          acc[clientName].totalAmount += debt.amount;
          if (debt.date > acc[clientName].lastDebtDate) {
            acc[clientName].lastDebtDate = debt.date;
          }
          return acc;
        }, {} as Record<string, { name: string; totalAmount: number; lastDebtDate: number }>);

        const clientDetails = Object.values(groupedDebts).map(group => {
          const lastDate = new Date(group.lastDebtDate).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
          return `${group.name} (debe Q${group.totalAmount.toFixed(2)}, su último fiado fue el ${lastDate})`;
        }).join('; ');

        const totalDebt = debtorsList.reduce((sum, d) => sum + d.amount, 0)
        context += `FIADO: Hay ${Object.keys(groupedDebts).length} clientes con deudas. El total adeudado es Q${totalDebt.toFixed(2)}. Detalles de clientes: ${clientDetails}.\n`
      } else {
        context += 'FIADO: No hay deudas registradas.\n'
      }

      if (purchasesData) {
        const purchasesList: PurchaseItem[] = Object.values(purchasesData)
        const purchaseDetails = purchasesList
          .map(p => `${p.name} (proveedor: ${p.supplier}, prioridad: ${p.priority})`)
          .join('; ');
        context += `COMPRAS: Hay ${purchasesList.length} productos en la lista de compras pendientes. Productos: ${purchaseDetails}.\n`
      } else {
        context += 'COMPRAS: No hay compras pendientes.\n'
      }

      if (ordersData) {
        const ordersList: Order[] = Object.values(ordersData)
        const totalOrderAmount = ordersList.reduce((sum, o) => sum + o.amount, 0);
        const orderDetails = ordersList.map(o => {
          const arrivalDate = new Date(o.arrivalDate).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
          return `Pedido a ${o.supplierName} por Q${o.amount.toFixed(2)} (productos: ${o.products}) llega el ${arrivalDate}`;
        }).join('; ');
        context += `PEDIDOS: Hay ${ordersList.length} pedidos pendientes. El monto total de los pedidos es Q${totalOrderAmount.toFixed(2)}. Detalles: ${orderDetails}.\n`
      } else {
        context += 'PEDIDOS: No hay pedidos pendientes.\n'
      }

      return context + '--- FIN DEL CONTEXTO ---\n\n'
    } catch (error) {
      console.error('Error al obtener contexto de la app:', error)
      return 'Hubo un error al obtener la información de la aplicación.\n'
    }
  }

  // Efecto para hacer scroll hacia el último mensaje
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Función auxiliar para manejar el streaming de texto a la UI de forma segura
  const streamToUI = async (stream: AsyncGenerator<any, any, any>) => {
    let text = '';
    // Añade un mensaje vacío del bot que se irá llenando
    setHistory(prev => [...prev, { role: 'model', text: "" }]);

    // Usamos requestAnimationFrame para no sobrecargar React con actualizaciones de estado
    const update = () => {
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].text = text;
        return newHistory;
      });
    };

    for await (const chunk of stream) {
      text += chunk.text();
      requestAnimationFrame(update);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !chatRef.current) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    const currentInput = input; // Guardamos el input antes de limpiarlo
    setHistory(prev => [...prev, userMessage]); // Actualiza la UI
    setInput('');
    setIsLoading(true);

    try {
      const chat = chatRef.current;
      // Obtenemos el contexto de la aplicación y lo añadimos a la pregunta del usuario
      const appContext = await getApplicationContext();
      const promptWithContext = appContext + currentInput;

      // Inicia el streaming de la respuesta
      let result = await chat.sendMessageStream(promptWithContext);

      let running = true;
      while (running) {
        // Espera a que la respuesta completa esté disponible para verificar si hay llamadas a funciones
        const response = await result.response;

        // Manejo de respuestas bloqueadas por seguridad
        if (!response.candidates || response.candidates.length === 0) {
          const errorMessage = "No pude generar una respuesta. Es posible que el contenido haya sido bloqueado por políticas de seguridad.";
          setHistory(prev => [...prev, { role: 'model', text: errorMessage }]);
          running = false;
          continue;
        }

        // El método `functionCalls()` está obsoleto. Accedemos a `content.parts`.
        const content = response.candidates[0].content;
        const functionCallPart = content.parts.find(part => !!part.functionCall);
        
        // Si no hay llamada a función, la respuesta es texto final.
        if (!functionCallPart) {
          // CORRECCIÓN 1: Usar una función de streaming segura para la UI.
          await streamToUI(result.stream);
          running = false; // No hay más funciones que llamar, terminamos el bucle.
        } else {
          // --- CORRECCIÓN 2: Preservar el texto antes de la llamada a la función ---
          // Si el modelo generó texto ANTES de decidir llamar a la función, lo mostramos.
          const textBeforeFunctionCall = response.text();
          if (textBeforeFunctionCall) {
            setHistory(prev => [...prev, { role: 'model', text: textBeforeFunctionCall }]);
          }

          // Si hay una llamada a función, la ejecutamos.
          const call = functionCallPart.functionCall;
          
          // CORRECCIÓN 3: Validar que los argumentos de la función existen.
          if (!call.args || Object.keys(call.args).length === 0) {
            throw new Error(`La función ${call.name} fue llamada sin argumentos. El modelo necesita volver a preguntar por la información.`);
          }

          const functionToCall = availableTools[call.name as keyof typeof availableTools];

          if (!functionToCall) {
            throw new Error(`Función desconocida: ${call.name}`);
          }
          
          // CORRECCIÓN 4: Mostrar consistentemente el mensaje de ejecución.
          const actionMessage: ChatMessage = { role: 'model', text: `Ejecutando: ${call.name}...` };
          setHistory(prev => [...prev, actionMessage]);

          console.log('Args recibidos para la función', call.name, call.args);
          // CORRECCIÓN: Pasar `call.args` directamente. Es más simple y correcto.
          const apiResponse = await functionToCall(call.args as any);
          
          // Enviamos el resultado de la función de vuelta a la IA para que genere una respuesta final para el usuario.
          result = await chat.sendMessageStream(
            [{ functionResponse: { name: call.name, response: apiResponse } }]
          );
        }
      }
      
      // CORRECCIÓN 2: Guardar el historial actualizado en localStorage después de cada interacción.
      if (chatRef.current && groupId) {
        const modelHistory = await chatRef.current.getHistory();
        localStorage.setItem(`chatHistory_${groupId}`, JSON.stringify(modelHistory));
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
        {history.map((msg, index) => (
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