import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.tsx';
 // adjust path if needed
import './index.css';
import { store } from './redux/store/index.ts';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#fef9f4',       // cream background
            color: '#5d4037',            // primary dark brown text
            border: '1px solid #d4af37', // gold border
          },
        }}
      />

      <App /> 
    </Provider>
  </StrictMode>
);
