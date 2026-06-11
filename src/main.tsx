import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Silence benign Vite HMR WebSocket errors/warnings inside sandboxed preview environment
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = function (...args: any[]) {
    const msg = args.map(arg => String(arg)).join(' ');
    if (
      msg.toLowerCase().includes('websocket') || 
      msg.toLowerCase().includes('failed to connect') ||
      msg.toLowerCase().includes('hmr')
    ) {
      // Retain log silently or skip completely to keep console clean
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = function (...args: any[]) {
    const msg = args.map(arg => String(arg)).join(' ');
    if (
      msg.toLowerCase().includes('websocket') || 
      msg.toLowerCase().includes('failed to connect') ||
      msg.toLowerCase().includes('hmr')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    if (
      event.message && 
      (event.message.toLowerCase().includes('websocket') || 
       event.message.toLowerCase().includes('socket'))
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason || '');
    if (
      reason.toLowerCase().includes('websocket') || 
      reason.toLowerCase().includes('socket')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

