import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import router from './routes/router';
  
const queryClient = new QueryClient();

function App() {
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-shell">
        <RouterProvider router={router} />
      </div>
    </QueryClientProvider>
  );
}

export default App;
