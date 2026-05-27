import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import ClerkTokenProvider from './components/ClerkTokenProvider';
import './styles/globals.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <ClerkTokenProvider>
          <App />
        </ClerkTokenProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#1a1a2e', color: '#fff', borderRadius: '12px' },
          }}
        />
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>
);
