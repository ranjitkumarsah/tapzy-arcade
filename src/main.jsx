import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { applyPremiumTheme } from './theme/premium'
import './styles/global.css'
import './styles/theme.css'
import './styles/games.css'

applyPremiumTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
)
