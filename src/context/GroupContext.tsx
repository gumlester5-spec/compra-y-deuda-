import { createContext, useState, useContext, type ReactNode, useEffect } from 'react'

// 1. Definir la forma de los datos que compartirá el contexto
interface GroupContextType {
  groupId: string | null
  userName: string | null
  isLoading: boolean
  setGroupInfo: (id: string | null, name: string | null) => void
  logout: () => void
}

// 2. Crear el Contexto de React.
// Se inicializa con `undefined` y se manejará el caso de uso fuera del provider.
const GroupContext = createContext<GroupContextType | undefined>(undefined) // El tipo se actualizará

// 3. Crear el componente Provider.
// Este componente envolverá a las partes de la app que necesitan acceso al contexto.
export const GroupProvider = ({ children }: { children: ReactNode }) => {
  const [groupId, setGroupId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Nuevo estado de carga

  // Efecto para cargar datos del localStorage al iniciar
  useEffect(() => {
    try {
      const storedGroupId = localStorage.getItem('groupId')
      const storedUserName = localStorage.getItem('userName')
      if (storedGroupId && storedUserName) {
        setGroupId(storedGroupId)
        setUserName(storedUserName)
      }
    } finally {
      setIsLoading(false) // Termina la carga, haya encontrado datos o no
    }
  }, [])

  // Función para establecer la información del grupo y guardarla en localStorage.
  const setGroupInfo = (id: string | null, name: string | null) => {
    if (id && name) {
      localStorage.setItem('groupId', id)
      localStorage.setItem('userName', name)
      setGroupId(id)
      setUserName(name)
    } else {
      localStorage.removeItem('groupId')
      localStorage.removeItem('userName')
      setGroupId(null)
      setUserName(null)
    }
  }

  // Función para cerrar sesión
  const logout = () => {
    setGroupInfo(null, null) // Esto ahora limpiará correctamente el estado y el localStorage
  }

  const value = { groupId, userName, isLoading, setGroupInfo, logout }

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}

// 4. Crear y EXPORTAR el custom hook `useGroup`.
// Este es el hook que tus componentes usarán para acceder al contexto.
export const useGroup = () => {
  const context = useContext(GroupContext) as GroupContextType
  if (context === undefined) {
    throw new Error('useGroup debe ser usado dentro de un GroupProvider')
  }
  return context
}