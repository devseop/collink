import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import router from './routes/router';
import { useAuth } from './hooks/useAuth';
  
const queryClient = new QueryClient();

function App() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="app-shell">
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Loading...
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-shell">
        <RouterProvider
          router={router}
          context={{
            auth: { user, isLoading },
          }}
        />
      </div>
    </QueryClientProvider>
  );
}

export default App;
