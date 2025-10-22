import './App.css'
import Navbar from './components/Navbar'
import FiadoPage from './pages/FiadoPage'
import ComprasPage from './pages/ComprasPage'
import PedidosPage from './pages/PedidosPage'
import HistorialPage from './pages/HistorialPage'
import NotasPage from './pages/NotasPage'
import Header from './components/Header'
import GroupGate from './context/GroupGate'
import { useSettings } from './context/SettingsContext'
import { Navigate, Route, Routes } from 'react-router-dom'

// Componente intermedio para poder usar el hook useSettings
const AppContent = () => {
  const { fontSize } = useSettings()

  return (
    <div className={`font-size-${fontSize}`}>
      <Header />
      <main>
        <Routes>
          <Route path="/fiado" element={<FiadoPage />} />
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/historial" element={<HistorialPage />} />
          <Route path="/notas" element={<NotasPage />} />
          <Route path="/" element={<Navigate to="/fiado" replace />} />
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
