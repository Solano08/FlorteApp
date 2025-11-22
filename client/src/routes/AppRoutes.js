import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { HomePage } from '../pages/dashboard/HomePage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { ChatsPage } from '../pages/chats/ChatsPage';
import { LibraryPage } from '../pages/library/LibraryPage';
import { GroupsPage } from '../pages/groups/GroupsPage';
import { ProjectsPage } from '../pages/projects/ProjectsPage';
import { ExplorePage } from '../pages/explore/ExplorePage';
import { AdminModerationPage } from '../pages/admin/AdminModerationPage';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from '../components/ui/LoadingScreen';
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    if (isLoading) {
        return _jsx(LoadingScreen, {});
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return children;
};
const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return _jsx(LoadingScreen, {});
    }
    if (isAuthenticated) {
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return children;
};
export const AppRoutes = () => (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "/login", element: _jsx(PublicRoute, { children: _jsx(LoginPage, {}) }) }), _jsx(Route, { path: "/register", element: _jsx(PublicRoute, { children: _jsx(RegisterPage, {}) }) }), _jsx(Route, { path: "/forgot-password", element: _jsx(PublicRoute, { children: _jsx(ForgotPasswordPage, {}) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(HomePage, {}) }) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(ProfilePage, {}) }) }), _jsx(Route, { path: "/explore", element: _jsx(ProtectedRoute, { children: _jsx(ExplorePage, {}) }) }), _jsx(Route, { path: "/chats", element: _jsx(ProtectedRoute, { children: _jsx(ChatsPage, {}) }) }), _jsx(Route, { path: "/library", element: _jsx(ProtectedRoute, { children: _jsx(LibraryPage, {}) }) }), _jsx(Route, { path: "/groups", element: _jsx(ProtectedRoute, { children: _jsx(GroupsPage, {}) }) }), _jsx(Route, { path: "/projects", element: _jsx(ProtectedRoute, { children: _jsx(ProjectsPage, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx(ProtectedRoute, { allowedRoles: ['admin'], children: _jsx(AdminModerationPage, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/dashboard", replace: true }) })] }));
