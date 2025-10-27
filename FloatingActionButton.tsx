import { Link, useLocation } from 'react-router-dom'
import { FaRobot } from 'react-icons/fa'

const FloatingActionButton = () => {
  const location = useLocation()

  // No mostrar botones en la página de chat o en la de edición de notas
  if (['/ai-chat', '/notas/edit'].some(path => location.pathname.startsWith(path))) {
    return null
  }

  return (
    <Link to="/ai-chat" className="fab" aria-label="Abrir chat con IA">
      <FaRobot />
    </Link>
  )
}

export default FloatingActionButton
