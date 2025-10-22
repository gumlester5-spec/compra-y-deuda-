import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FaCog } from 'react-icons/fa'
import ThemeToggle from './ThemeToggle'
import SettingsPage from '../pages/SettingsPage'

const Header = () => {
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const location = useLocation()

  const getTitle = (pathname: string) => {
    switch (pathname) {
      case '/fiado':
        return 'Control de Fiado'
      case '/compras':
        return 'Lista de Compras'
      case '/pedidos':
        return 'Gestión de Pedidos'
      case '/historial':
        return 'Historial de Actividad'
      case '/notas':
        return 'Bloc de Notas'
      default:
        return 'Control de Fiado'
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>{getTitle(location.pathname)}</h1>
        <div className="header-actions">
          <ThemeToggle />
          <button onClick={() => setIsSettingsVisible(true)} className="settings-button" aria-label="Configuración">
            <FaCog />
          </button>
        </div>
      </header>
      {isSettingsVisible && <SettingsPage onClose={() => setIsSettingsVisible(false)} />}
    </>
  )
}

export default Header