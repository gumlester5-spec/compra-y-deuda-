import { NavLink } from 'react-router-dom'
import { FaBook, FaShoppingCart, FaBoxOpen, FaHistory, FaStickyNote } from 'react-icons/fa'
import './BottomNav.css' // Reutilizamos los estilos existentes

const navItems = [
  { to: '/fiado', icon: <FaBook />, label: 'Fiado' },
  { to: '/compras', icon: <FaShoppingCart />, label: 'Compras' },
  { to: '/pedidos', icon: <FaBoxOpen />, label: 'Pedidos' },
  { to: '/historial', icon: <FaHistory />, label: 'Historial' },
  { to: '/notas', icon: <FaStickyNote />, label: 'Nota' },
]

const Navbar = () => {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default Navbar