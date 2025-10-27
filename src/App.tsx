import './App.css'
import Navbar from './components/Navbar'
import FiadoPage from './pages/FiadoPage'
import ComprasPage from './pages/ComprasPage'
import PedidosPage from './pages/PedidosPage'
import HistorialPage from './pages/HistorialPage'
import NotasPage from './pages/NotasPage'
import AiChatPage from './pages/AiChatPage' // 1. Importar la página de chat
import Header from './components/Header'
import FloatingActionButton from './components/FloatingActionButton' // 2. Importar el botón flotante
import GroupGate from './context/GroupGate'
import { useSettings } from './context/SettingsContext'
import { Navigate, Route, Routes } from 'react-router-dom'

// Componente intermedio para poder usar el hook useSettings
const AppContent = () => {
  const { fontSize } = useSettings()

  return (
    <div className={`font-size-${fontSize}`}>
      {/* El botón flotante ahora se renderiza fuera del layout principal */}
      <FloatingActionButton />
      <Header />
      <main>
        <Routes>
          <Route path="/fiado" element={<FiadoPage />} />
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/historial" element={<HistorialPage />} />
          <Route path="/notas" element={<NotasPage />} />
          <Route path="/" element={<Navigate to="/fiado" replace />} />
          <Route path="/ai-chat" element={<AiChatPage />} /> {/* 5. Añadir la nueva ruta */}
        </Routes>
      </main>
      <Navbar />
    </div>
  )
}

function App() {
  return <GroupGate>
    <AppContent />
  </GroupGate>
}

export default App
