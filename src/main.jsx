import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.jsx';
import { storageAdapter } from './services/storage/IndexedDbStorageAdapter';
import { seedDemoMarketplace } from './features/demo/services/seedDemoMarketplace';

// Initialize and idempotently seed the 20 demonstration equipment listings
seedDemoMarketplace(storageAdapter).catch((err) => {
  console.warn('Classroom marketplace demo seeder warning:', err);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
