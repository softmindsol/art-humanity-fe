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
      <Toaster richColors />
      <App /> 
    </Provider>
  </StrictMode>
);
