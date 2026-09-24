import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'
import '@/shared/styles/global.css'
import 'react-day-picker/style.css'
import '@/shared/styles/controls.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
