import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext'
import { SettingsProvider } from './context/SettingsContext'
import { GroupProvider } from './context/GroupContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <GroupProvider>
          <HashRouter>
            <Toaster position="bottom-center" />
            <App />
          </HashRouter>
        </GroupProvider>
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>,
)
