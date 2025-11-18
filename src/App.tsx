import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { APIProvider, useAPI } from './contexts/APIContext';
import { APIConfigForm } from './components/APIConfigForm';
import { Layout } from './components/Layout';
import { WebhookEvents } from './pages/WebhookEvents';
import { Channels } from './pages/Channels';
import { Videos } from './pages/Videos';
import { VideoUpdates } from './pages/VideoUpdates';
import { Subscriptions } from './pages/Subscriptions';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    },
  },
});

/**
 * Protected routes that require API configuration
 */
function ProtectedRoutes() {
  const { isConfigured } = useAPI();

  if (!isConfigured) {
    return <APIConfigForm />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/webhook-events" element={<WebhookEvents />} />
        <Route path="/channels" element={<Channels />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/video-updates" element={<VideoUpdates />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/" element={<Navigate to="/webhook-events" replace />} />
        <Route path="*" element={<Navigate to="/webhook-events" replace />} />
      </Routes>
    </Layout>
  );
}

/**
 * Main App component
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <APIProvider>
        <BrowserRouter>
          <ProtectedRoutes />
        </BrowserRouter>
      </APIProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
