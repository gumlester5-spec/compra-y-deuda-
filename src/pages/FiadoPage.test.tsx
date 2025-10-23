import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FiadoPage from './FiadoPage'
import { GroupProvider } from '../context/GroupContext'
import { type ReactNode } from 'react'

// Mock del contexto para proveer valores controlados en la prueba
vi.mock('../context/GroupContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../context/GroupContext')>()
  return {
    ...mod,
    useGroup: () => ({
      groupId: 'test-group-123',
      userName: 'Test User',
      isLoading: false,
      setGroupInfo: vi.fn(),
      logout: vi.fn(),
    }),
  }
})

// Un componente "Wrapper" para envolver nuestro componente de prueba con los providers necesarios
const TestWrapper = ({ children }: { children: ReactNode }) => {
  return <GroupProvider>{children}</GroupProvider>
}

describe('FiadoPage', () => {
  it('debería renderizar el título "Lista de Deudores"', () => {
    // Renderizamos el componente dentro de nuestro Wrapper
    render(<FiadoPage />, { wrapper: TestWrapper })

    // Buscamos el texto en el documento
    const headingElement = screen.getByRole('heading', {
      name: /lista de deudores/i,
    })

    // Verificamos que el elemento exista
    expect(headingElement).toBeInTheDocument()
  })

  it('debería cargar las variables de entorno desde .env.local', () => {
    // Vitest carga automáticamente las variables de entorno
    const appTitle = import.meta.env.VITE_APP_TITLE
    expect(appTitle).toBe('Control de Fiado (Local)')
  })
})