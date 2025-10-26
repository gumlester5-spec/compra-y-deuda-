import { createContext, useState, useContext, type ReactNode, useEffect } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth'
import { db } from '../db'
import { ref, get } from 'firebase/database'

// 1. Definir la forma de los datos que compartirá el contexto
interface GroupContextType {
  groupId: string | null
  userName: string | null
  userId: string | null // Añadimos el ID del usuario de Firebase
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
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Nuevo estado de carga

  // Efecto para manejar la autenticación y cargar datos del localStorage
  useEffect(() => {
    // onAuthStateChanged se ejecuta cuando el usuario inicia/cierra sesión o al cargar la página
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        // El usuario ya está autenticado (anónimamente)
        const currentUserId = user.uid
        setUserId(currentUserId)

        const storedGroupId = localStorage.getItem('groupId')
        const storedUserName = localStorage.getItem('userName')

        if (storedGroupId && storedUserName) {
          // --- VERIFICACIÓN DE MEMBRESÍA ---
          // Antes de confiar en localStorage, verificamos si el usuario sigue siendo miembro.
          const memberRef = ref(db, `groups/${storedGroupId}/members/${currentUserId}`)
          const snapshot = await get(memberRef)
          if (snapshot.exists()) {
            // Si el usuario es miembro, cargamos la información.
            setGroupId(storedGroupId)
            setUserName(storedUserName)
          } else {
            // Si no es miembro (fue eliminado, etc.), limpiamos los datos locales.
            logout()
          }
        }
      } else {
        // El usuario no está autenticado, lo autenticamos anónimamente
        try {
          const userCredential = await signInAnonymously(auth)
          setUserId(userCredential.user.uid)
        } catch (error) {
          console.error('Error al iniciar sesión anónimamente:', error)
        }
      }
      setIsLoading(false) // Termina la carga, haya encontrado datos o no
    })

    // Limpiamos el listener al desmontar el componente
    return () => unsubscribe()
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

  const value = { groupId, userName, userId, isLoading, setGroupInfo, logout }

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}

// 4. Crear y EXPORTAR el custom hook `useGroup`.
// Este es el hook que tus componentes usarán para acceder al contexto.
export const useGroup = () => {
  const context = useContext(GroupContext)
  if (context === undefined) {
    throw new Error('useGroup debe ser usado dentro de un GroupProvider')
  }
  return context
}