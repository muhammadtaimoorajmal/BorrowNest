import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.jsx';
import { storageAdapter } from './services/storage/IndexedDbStorageAdapter';
import { seedDemoMarketplace, SEEDED_CATALOGUE_COUNT } from './features/demo/services/seedDemoMarketplace';

/**
 * Deterministic application bootstrap sequence (Defect 02).
 * Ensures IndexedDB is fully initialized, seeds the 20 demonstration marketplace products,
 * validates their ownership and image integrity, and then mounts the React application shell.
 */
async function bootstrap() {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const root = createRoot(rootElement);

  try {
    // 1. Initialize the IndexedDB storage adapter
    await storageAdapter.initialize();

    // 2. Execute the idempotent demonstration seeder
    await seedDemoMarketplace(storageAdapter);

    // 3. Verify that the 20 seeded marketplace records exist in IndexedDB
    const allItems = await storageAdapter.getAllItems();
    const demoItems = allItems.filter((i) => i.isDemo || i.demoSeed);
    if (demoItems.length < SEEDED_CATALOGUE_COUNT) {
      throw new Error(
        `Classroom demonstration seeding incomplete: found ${demoItems.length} of ${SEEDED_CATALOGUE_COUNT} baseline items in IndexedDB.`,
      );
    }

    // 4. Verify ownership and genuine image fields on all seeded products
    for (const item of demoItems) {
      if (!item.ownerProfileId || !item.ownerDisplayName) {
        throw new Error(`Demo item "${item.id}" is missing assigned owner profile fields.`);
      }
      if (!item.photos || item.photos.length === 0 || !item.photos[0].dataUrl) {
        throw new Error(`Demo item "${item.id}" is missing verified photograph assets.`);
      }
    }

    // 5. Render main application shell
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (err) {
    console.error('BorrowNest bootstrap failed:', err);
    root.render(
      <div
        role="alert"
        style={{
          padding: '2.5rem 1.5rem',
          maxWidth: '640px',
          margin: '3rem auto',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #fee2e2',
        }}
      >
        <h1 style={{ color: '#b91c1c', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          Classroom Demonstration Initialization Failed
        </h1>
        <p style={{ color: '#4b5563', fontSize: '0.9375rem', lineHeight: 1.5, marginBottom: '1rem' }}>
          BorrowNest was unable to initialize its local IndexedDB marketplace and seed the 20 demonstration items.
        </p>
        <pre
          style={{
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            overflowX: 'auto',
            border: '1px solid #fecaca',
            marginBottom: '1.25rem',
          }}
        >
          {err.message || String(err)}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '0.625rem 1.25rem',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Retry Initialization
        </button>
      </div>,
    );
  }
}

bootstrap();
