import { jsx as _jsx } from "react/jsx-runtime";
import { Suspense } from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { LoadingScreen } from './components/ui/LoadingScreen';
const App = () => {
    return (_jsx(Suspense, { fallback: _jsx(LoadingScreen, {}), children: _jsx(AppRoutes, {}) }));
};
export default App;
