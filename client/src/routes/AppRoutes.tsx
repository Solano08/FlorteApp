import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { HomePage } from '../pages/dashboard/HomePage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { PublicProfilePage } from '../pages/profile/PublicProfilePage';
import { ChatsPage } from '../pages/chats/ChatsPage';
import { LibraryPage } from '../pages/library/LibraryPage';
import { GroupsPage } from '../pages/groups/GroupsPage';
import { ProjectsPage } from '../pages/projects/ProjectsPage';
import { ExplorePage } from '../pages/explore/ExplorePage';
import { AdminModerationPage } from '../pages/admin/AdminModerationPage';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { UserRole } from '../types/auth';

const ProtectedRoute = ({
  children,
  allowedRoles
}: {
  children: JSX.Element;
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

const PublicRoute = ({ children }: { children: JSX.Element }) => {
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
      path="/explore"
      element={
        <ProtectedRoute>
          <ExplorePage />
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
      path="/groups"
      element={
        <ProtectedRoute>
          <GroupsPage />
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
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);
