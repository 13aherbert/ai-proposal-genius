
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { getAuthToken } from './utils/network';

// Check for existing token early in application lifecycle
const initialToken = getAuthToken();
if (initialToken) {
  console.log('Initial auth token found in storage');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
