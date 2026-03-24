import { lazy, Suspense, type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { UserRole } from '../types/auth';

const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const HomePage = lazy(() => import('../pages/dashboard/HomePage').then((m) => ({ default: m.HomePage })));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const PublicProfilePage = lazy(() => import('../pages/profile/PublicProfilePage').then((m) => ({ default: m.PublicProfilePage })));
const ChatsPage = lazy(() => import('../pages/chats/ChatsPage').then((m) => ({ default: m.ChatsPage })));
const LibraryPage = lazy(() => import('../pages/library/LibraryPage').then((m) => ({ default: m.LibraryPage })));
const CommunitiesPage = lazy(() => import('../pages/communities/CommunitiesPage').then((m) => ({ default: m.CommunitiesPage })));
const ChannelSettingsPage = lazy(() => import('../pages/communities/ChannelSettingsPage').then((m) => ({ default: m.ChannelSettingsPage })));
const CommunitySettingsPage = lazy(() => import('../pages/communities/CommunitySettingsPage').then((m) => ({ default: m.CommunitySettingsPage })));
const ProjectsPage = lazy(() => import('../pages/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const AdminModerationPage = lazy(() => import('../pages/admin/AdminModerationPage').then((m) => ({ default: m.AdminModerationPage })));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const UIPlaygroundPage = lazy(() => import('../pages/ui/UIPlaygroundPage').then((m) => ({ default: m.UIPlaygroundPage })));

const ProtectedRoute = ({
  children,
  allowedRoles
}: {
  children: ReactElement;
  allowedRoles?: UserRole[];
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <LoadingScreen />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const PublicRoute = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <LoadingScreen />;
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const AppRoutes = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      }
    />
    <Route
      path="/forgot-password"
      element={
        <PublicRoute>
          <ForgotPasswordPage />
        </PublicRoute>
      }
    />

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/profile/:userId"
      element={
        <ProtectedRoute>
          <PublicProfilePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/chats"
      element={
        <ProtectedRoute>
          <ChatsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/library"
      element={
        <ProtectedRoute>
          <LibraryPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/communities"
      element={
        <ProtectedRoute>
          <CommunitiesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/communities/:communityId"
      element={
        <ProtectedRoute>
          <CommunitiesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/communities/:communityId/:channelId"
      element={
        <ProtectedRoute>
          <CommunitiesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/communities/:communityId/:channelId/settings"
      element={
        <ProtectedRoute>
          <ChannelSettingsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/communities/:communityId/settings"
      element={
        <ProtectedRoute>
          <CommunitySettingsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/projects"
      element={
        <ProtectedRoute>
          <ProjectsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminModerationPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ui-playground"
      element={
        <ProtectedRoute>
          <UIPlaygroundPage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
  </Suspense>
);
