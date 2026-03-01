import ReactDOM from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/literata'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import './styles/global.css'
import App from './app/App'

// No StrictMode on purpose: epub.js renderers are not idempotent across
// double-invoked effects in development.
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
