import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles.css'

// Bewust géén React.StrictMode: die initialiseert effecten dubbel, wat met
// MapLibre (WebGL-kaart) tot problemen / een wit scherm kan leiden.
createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
