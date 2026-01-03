import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import QuickLogin from './pages/QuickLogin';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import PublicProfile from './pages/PublicProfile';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import PostsGallery from './pages/PostsGallery';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  console.log('🛡️ [PROTECTED ROUTE] Vérification...');
  console.log('🛡️ [PROTECTED ROUTE] loading:', loading);
  console.log('🛡️ [PROTECTED ROUTE] user:', user);
  console.log('🛡️ [PROTECTED ROUTE] profile:', profile);

  if (loading) {
    console.log('⏳ [PROTECTED ROUTE] Chargement en cours...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ [PROTECTED ROUTE] Pas d\'utilisateur, redirection vers l\'accueil');
    return <Navigate to="/" replace />;
  }

  // If user is not registered, redirect to onboarding
  if (profile && !profile.is_registered) {
    console.log('⚠️ [PROTECTED ROUTE] Utilisateur non enregistré, redirection vers /onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  console.log('✅ [PROTECTED ROUTE] Accès autorisé au dashboard');
  return <>{children}</>;
};

// Onboarding Route (only accessible if not registered)
const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If already registered, redirect to appropriate dashboard
  if (profile && profile.is_registered) {
    return <Navigate to={profile.role === 'ambassador' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

// Login Route (redirect if already logged in)
const LoginRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user && profile) {
    if (!profile.is_registered) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to={profile.role === 'ambassador' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

// Admin Route (only for ambassadors)
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // If user is not registered, redirect to onboarding
  if (profile && !profile.is_registered) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user is not an ambassador, redirect to student dashboard
  if (profile && profile.role !== 'ambassador') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <LoginRoute>
            <Login />
          </LoginRoute>
        }
      />
      <Route path="/quick-login" element={<QuickLogin />} />

      <Route path="/u/:userId" element={<PublicProfile />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Onboarding Route */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Home and Leaderboard Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/posts" element={<PostsGallery />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
