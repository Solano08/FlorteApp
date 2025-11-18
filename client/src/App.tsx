import { Suspense } from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { LoadingScreen } from './components/ui/LoadingScreen';

const App = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AppRoutes />
    </Suspense>
  );
};

export default App;
