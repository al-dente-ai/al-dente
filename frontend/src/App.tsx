import { RouterProvider } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { router } from './routes';
import { useAuth } from './store';
import Spinner from './components/ui/Spinner';
import Toasts from './components/ui/Toasts';

function App() {
  const hydrate = useAuth((state) => state.hydrate);

  // Hydrate auth store on app start
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <Spinner size="lg" />
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
      <Toasts />
    </div>
  );
}

export default App;
