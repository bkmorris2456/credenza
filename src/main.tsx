import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root')!)

// Dynamic import so a module-load-time crash (e.g. missing Firebase env
// vars) can be caught and shown on-screen instead of leaving a blank page.
import('./App.tsx')
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((err) => {
    console.error('[main] Failed to load app:', err)
    root.render(
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
        <h1>Credenza failed to start</h1>
        <p>{err instanceof Error ? err.message : 'An unknown error occurred.'}</p>
        <p>Check the browser console for the full error.</p>
      </div>,
    )
  })
