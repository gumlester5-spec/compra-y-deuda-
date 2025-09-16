import { FaBook, FaShoppingCart, FaBoxOpen, FaHistory } from 'react-icons/fa'
import './BottomNav.css'

// Definimos los nombres de las pestañas que usaremos en la aplicación
export type Tab = 'fiado' | 'compra' | 'pedidos' | 'historial'

// Definimos las propiedades que recibirá nuestro componente
interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="bottom-nav">
      <button
        className={activeTab === 'fiado' ? 'active' : ''}
        onClick={() => onTabChange('fiado')}
      >
        <FaBook />
        <span>Fiado</span>
      </button>
      <button
        className={activeTab === 'compra' ? 'active' : ''}
        onClick={() => onTabChange('compra')}
      >
        <FaShoppingCart />
        <span>Compra</span>
      </button>
      <button
        className={activeTab === 'pedidos' ? 'active' : ''}
        onClick={() => onTabChange('pedidos')}
      >
        <FaBoxOpen />
        <span>Pedidos</span>
      </button>
      <button
        className={activeTab === 'historial' ? 'active' : ''}
        onClick={() => onTabChange('historial')}
      >
        <FaHistory />
        <span>Historial</span>
      </button>
    </nav>
  )
}

export default BottomNav