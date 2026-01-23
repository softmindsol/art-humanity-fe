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
          position="top-center"
          toastOptions={{
            style: {
              background: '#FFFBF2',
              color: '#3E2723',
              border: '1px solid #3E2723',
              borderRadius: '8px',
              fontFamily: 'inherit',
              padding: '16px',
            },
            classNames: {
              icon: 'text-[#3E2723]', 
            }
          }}
          icons={{
            success: (
                 <div className="w-6 h-6 rounded-full bg-[#5D4037] flex items-center justify-center">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
            )
          }}
        />
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>
);
