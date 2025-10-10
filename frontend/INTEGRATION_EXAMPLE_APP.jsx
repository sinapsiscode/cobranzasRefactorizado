// EXAMPLE: Updated App.jsx with UI Store Backend Integration
// This shows how to integrate the migrated uiStore with user preferences loading

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';

// ... (import all your components as before)

function App() {
  const { isAuthenticated, user, validateToken, loading } = useAuthStore();
  const { initialize, globalLoading, preferencesLoading } = useUIStore();

  useEffect(() => {
    const initializeApp = async () => {
      // Validate token if exists
      if (localStorage.getItem('tv-cable-auth')) {
        await validateToken();
      }

      // Initialize UI store with userId if user is logged in
      // This will load preferences from backend
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.id) {
        console.log('Loading preferences for user:', currentUser.id);
        await initialize(currentUser.id);
      } else {
        // Initialize without userId (uses LocalStorage/defaults)
        console.log('Initializing UI store without user (LocalStorage fallback)');
        await initialize();
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      const cleanup = useUIStore.getState().cleanup;
      cleanup();
    };
  }, [validateToken, initialize]);

  // Show loading while validating token or loading preferences
  if (loading || globalLoading || preferencesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">
            {loading && 'Validating session...'}
            {preferencesLoading && 'Loading your preferences...'}
            {globalLoading && 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <Routes>
          {/* Login route */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRoute(user?.role)} replace />
              ) : (
                <Login />
              )
            }
          />

          {/* ... rest of your routes ... */}
        </Routes>

        {/* Notification container */}
        <NotificationContainer />

        {/* Collector alerts */}
        <CollectorAlerts />
      </div>
    </ErrorBoundary>
  );
}

// Helper function to get default route by role
function getDefaultRoute(role) {
  switch (role) {
    case 'subadmin':
      return '/subadmin/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'collector':
      return '/collector/dashboard';
    case 'client':
      return '/client/dashboard';
    default:
      return '/login';
  }
}

export default App;
