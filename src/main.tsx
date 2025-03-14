
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import App from './App';
import './index.css';

// Providers
import { BaseAuthProvider } from '@/components/BaseAuthProvider';
import { AuthUserProvider } from '@/hooks/auth/AuthUserContext';
import { SubscriptionProvider } from '@/hooks/subscription/providers/SubscriptionProvider';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <BaseAuthProvider>
          <AuthUserProvider>
            <SubscriptionProvider>
              <Toaster />
              <App />
            </SubscriptionProvider>
          </AuthUserProvider>
        </BaseAuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
