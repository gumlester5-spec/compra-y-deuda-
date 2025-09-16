import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type FontSize = 'pequeño' | 'mediano' | 'grande'

interface SettingsContextType {
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings debe usarse dentro de un SettingsProvider')
  }
  return context
}

interface SettingsProviderProps {
  children: ReactNode
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('fontSize') as FontSize) || 'mediano'
  })

  useEffect(() => {
    document.body.classList.remove('font-size-pequeño', 'font-size-mediano', 'font-size-grande')
    document.body.classList.add(`font-size-${fontSize}`)
    localStorage.setItem('fontSize', fontSize)
  }, [fontSize])

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size)
  }

  return (
    <SettingsContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </SettingsContext.Provider>
  )
}