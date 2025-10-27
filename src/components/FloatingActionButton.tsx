import { Link } from 'react-router-dom';
import { FaRobot } from 'react-icons/fa';

const FloatingActionButton = () => {
  return (
    <Link to="/ai-chat" className="fab" aria-label="Abrir chat con IA">
      <FaRobot />
    </Link>
  );
};

export default FloatingActionButton;

