import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.tsx';
import './index.css';
import { store, persistor } from './redux/store/index.ts'; // ✅ import persistor
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#fef9f4',       // cream background
              color: '#5d4037',            // dark brown text
              border: '1px solid #d4af37', // gold border
            },
          }}
        />
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>
);
