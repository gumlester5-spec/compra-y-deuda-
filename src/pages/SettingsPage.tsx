import { FaTimes } from 'react-icons/fa'
import { useSettings, type FontSize } from '../context/SettingsContext'
import { useGroup } from '../context/GroupContext'

interface SettingsPageProps {
  onClose: () => void
}

const SettingsPage = ({ onClose }: SettingsPageProps) => {
  const { fontSize, setFontSize } = useSettings()
  const { logout, userName, groupId } = useGroup()

  const handleLogout = () => {
    logout()
    onClose() // Cierra el modal después de salir
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configuración</h2>
          <button type="button" onClick={onClose} className="close-button" aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        <div className="settings-section">
          <h3>Tamaño de letra</h3>
          <div className="priority-buttons">
            {(['pequeño', 'mediano', 'grande'] as FontSize[]).map((size) => (
              <button key={size} type="button" className={`priority-button ${fontSize === size ? 'active' : ''}`} onClick={() => setFontSize(size)}>
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>Grupo Actual</h3>
          <p>Usuario: <strong>{userName ?? 'N/A'}</strong></p>
          <p>Código de Grupo: <strong>{groupId ?? 'N/A'}</strong></p>
          <button onClick={handleLogout} className="gate-button delete" style={{ width: '100%', marginTop: '10px' }}>
            Salir del Grupo
          </button>
        </div>

      </div>
    </div>
  )
}

export default SettingsPage