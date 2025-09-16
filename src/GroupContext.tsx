import { createContext, useState, useContext, type ReactNode, useEffect } from 'react'

interface GroupContextType {
  groupId: string | null
  userName: string | null
  isLoading: boolean
  setGroupInfo: (id: string, name: string) => void
  logout: () => void
}

const GroupContext = createContext<GroupContextType | undefined>(undefined)

export const GroupProvider = ({ children }: { children: ReactNode }) => {
  const [groupId, setGroupId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const storedGroupId = localStorage.getItem('groupId')
      const storedUserName = localStorage.getItem('userName')
      if (storedGroupId && storedUserName) {
        setGroupId(storedGroupId)
        setUserName(storedUserName)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setGroupInfo = (id: string, name:string) => {
    localStorage.setItem('groupId', id)
    localStorage.setItem('userName', name)
    setGroupId(id)
    setUserName(name)
  }

  const logout = () => {
    localStorage.removeItem('groupId')
    localStorage.removeItem('userName')
    setGroupId(null)
    setUserName(null)
  }

  const value = { groupId, userName, isLoading, setGroupInfo, logout }

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}

export const useGroup = (): GroupContextType => {
  const context = useContext(GroupContext)
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider')
  }
  return context
}