import { useState, type ReactNode, useEffect } from 'react'
import { useGroup } from './GroupContext'
import { createGroup, joinGroup } from '../db'
import { toast } from 'react-hot-toast'
import { FaCopy, FaArrowRight, FaSpinner } from 'react-icons/fa'
import Onboarding from '../components/Onboarding'

const GroupGate = ({ children }: { children: ReactNode }) => {
  const { groupId, userId, setGroupInfo, isLoading } = useGroup()
  const [mode, setMode] = useState<'join' | 'create' | null>(null)
  const [inputUserName, setInputUserName] = useState('')
  const [newlyCreatedGroupId, setNewlyCreatedGroupId] = useState<string | null>(null)
  const [inputGroupId, setInputGroupId] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Comprobar si el usuario ya ha visto el onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (!hasSeenOnboarding) {
      // Si no lo ha visto, mostramos la guía
      setShowOnboarding(true)
    }
  }, [])

  // Efecto para limpiar el estado local cuando el usuario sale del grupo
  useEffect(() => {
    if (groupId === null) {
      // Si el groupId se vuelve nulo (logout), reseteamos los estados del gate
      setNewlyCreatedGroupId(null)
      setMode(null)
    }
  }, [groupId])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputUserName.trim()) {
      toast.error('Por favor, ingresa tu nombre.')
      return
    }
    try {
      if (!userId) throw new Error('El ID de usuario no está disponible.')
      toast.loading('Creando grupo...')
      const newGroupId = await createGroup(userId, inputUserName)
      toast.dismiss()
      toast.success('¡Grupo creado con éxito!')
      setNewlyCreatedGroupId(newGroupId) // Guardamos el código para mostrarlo en el siguiente paso
    } catch (error) {
      console.error(error)
      toast.dismiss() // Ocultamos el toast de "Creando grupo..."
      if (error instanceof Error) {
        // Mostramos el mensaje de error específico (ej: "Debes esperar 5 minutos...")
        toast.error(error.message)
      } else {
        // Mensaje genérico si el error no es el esperado
        toast.error('No se pudo crear el grupo. Intenta de nuevo.')
      }
    }
  }

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputUserName.trim() || !inputGroupId.trim()) {
      toast.error('Por favor, completa todos los campos.')
      return
    }
    if (!/^\d{9}$/.test(inputGroupId)) {
      toast.error('El código del grupo debe tener 9 dígitos.')
      return
    }

    try {
      if (!userId) throw new Error('El ID de usuario no está disponible.')
      const success = await joinGroup(inputGroupId, userId, inputUserName)
      if (success) {
        toast.success(`¡Te has unido al grupo ${inputGroupId}!`)
        setGroupInfo(inputGroupId, inputUserName)
      } else {
        toast.error('El grupo no existe. Verifica el código.')
      }
    } catch (error) {
      console.error(error)
      toast.error('No se pudo unir al grupo. Intenta de nuevo.')
    }
  }

  if (isLoading) {
    return (
      <div className="gate-container">
        <h1>Conectando...</h1>
        <FaSpinner className="spinner" />
      </div>
    )
  }
  if (groupId) {
    return <>{children}</>
  }

  // --- NUEVO PASO INTERMEDIO ---
  // Si se acaba de crear un grupo, muestra esta pantalla
  if (newlyCreatedGroupId) {
    return (
      <div className="gate-container">
        <h1>¡Grupo Creado con Éxito!</h1>
        <p>Comparte este código para que otros se unan a tu grupo.</p>
        <div className="gate-actions" style={{ gap: '1.5rem', alignItems: 'center' }}>
          <div
            style={{
              padding: '1rem',
              border: '2px dashed var(--border-color)',
              borderRadius: '8px',
              fontSize: '2rem',
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              fontFamily: 'monospace'
            }}
          >
            {newlyCreatedGroupId}
          </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(newlyCreatedGroupId)
            toast.success('¡Código copiado!', { duration: 2000 })
          }}
          className="gate-button secondary"
          style={{ width: '100%' }}
        >
          <FaCopy /> Copiar Código
        </button>
          <button onClick={() => setGroupInfo(newlyCreatedGroupId, inputUserName)} className="gate-button" style={{ width: '100%' }}>
            Continuar
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="gate-container">
        <h1>Crear un Nuevo Grupo</h1>
        <form onSubmit={handleCreateGroup} className="gate-form debt-form">
          <input
            type="text"
            placeholder="Tu nombre"
            value={inputUserName}
            onChange={(e) => setInputUserName(e.target.value)}
            required
          />
          <button type="submit" className="gate-button">
            <FaArrowRight /> Crear Grupo
          </button>
          <button type="button" onClick={() => setMode(null)} className="gate-button secondary">Volver</button>
        </form>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="gate-container">
        <h1>Unirse a un Grupo</h1>
        <form onSubmit={handleJoinGroup} className="gate-form debt-form">
          <input
            type="text"
            placeholder="Tu nombre"
            value={inputUserName}
            onChange={(e) => setInputUserName(e.target.value)}
            required
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Código de 9 dígitos del grupo"
            value={inputGroupId}
            onChange={(e) => setInputGroupId(e.target.value)}
            required
            maxLength={9}
          />
          <button type="submit" className="gate-button">
            <FaArrowRight /> Unirse al Grupo
          </button>
          <button type="button" onClick={() => setMode(null)} className="gate-button secondary">Volver</button>
        </form>
      </div>
    )
  }

  return (
    <div className="gate-container">
      <h1>
        Bienvenido
        {inputUserName ? `, ${inputUserName}` : ''}
      </h1>
      <p>Crea un grupo para empezar o únete a uno existente con un código.</p>
      <div className="gate-actions">
        <button onClick={() => setMode('create')} className="gate-button">
          Crear Grupo
        </button>
        <button onClick={() => setMode('join')} className="gate-button secondary">
          Unirse a un Grupo
        </button>
      </div>
    </div>
  )
}

export default GroupGate