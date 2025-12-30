import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker, clearExpiredCache, preloadImages } from './lib/cache'

// Register service worker for caching
registerServiceWorker();

// Clear expired cache on startup
clearExpiredCache();

// Preload critical images
preloadImages([
  '/images/currency/ton.png',
  '/images/currency/usdt.svg',
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
