# UI Store Usage Examples

Complete examples showing how to use the migrated uiStore in different scenarios.

## Example 1: Login Flow Integration

```javascript
// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = useAuthStore(state => state.login);
  const loadUserPreferences = useUIStore(state => state.loadUserPreferences);
  const preferencesLoading = useUIStore(state => state.preferencesLoading);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Authenticate user
      const user = await login(username, password);

      if (user) {
        // Step 2: Load user preferences from backend
        await loadUserPreferences(user.id);

        // Step 3: Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={loading || preferencesLoading}>
        {loading ? 'Logging in...' : preferencesLoading ? 'Loading preferences...' : 'Login'}
      </button>
    </form>
  );
}
```

## Example 2: App Initialization

```javascript
// src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

function App() {
  const user = useAuthStore(state => state.user);
  const initialize = useUIStore(state => state.initialize);
  const cleanup = useUIStore(state => state.cleanup);

  useEffect(() => {
    // Initialize UI store with user ID if logged in
    const initializeApp = async () => {
      if (user?.id) {
        console.log('Initializing with user:', user.id);
        await initialize(user.id);
      } else {
        console.log('Initializing without user (using LocalStorage)');
        await initialize();
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [user?.id, initialize, cleanup]);

  return (
    <BrowserRouter>
      {/* Your routes */}
    </BrowserRouter>
  );
}

export default App;
```

## Example 3: Theme Toggle Component

```javascript
// src/components/ThemeToggle.jsx
import { Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export default function ThemeToggle() {
  const user = useAuthStore(state => state.user);
  const theme = useUIStore(state => state.theme);
  const toggleTheme = useUIStore(state => state.toggleTheme);
  const preferencesSaving = useUIStore(state => state.preferencesSaving);

  const handleToggle = async () => {
    // Pass userId for auto-save to backend
    await toggleTheme(user?.id);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={preferencesSaving}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {preferencesSaving ? (
        <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full" />
      ) : theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
}
```

## Example 4: Settings Page

```javascript
// src/pages/Settings.jsx
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export default function Settings() {
  const user = useAuthStore(state => state.user);
  const {
    theme,
    fontSize,
    language,
    preferences,
    setTheme,
    setFontSize,
    setLanguage,
    updatePreferences,
    resetPreferences,
    preferencesLoading,
    preferencesSaving,
    preferencesError
  } = useUIStore();

  const [localPreferences, setLocalPreferences] = useState(preferences);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleSave = async () => {
    // Update preferences and auto-save to backend
    await updatePreferences(localPreferences, user?.id);
  };

  const handleReset = async () => {
    if (confirm('Reset all preferences to defaults?')) {
      await resetPreferences(user?.id);
    }
  };

  if (preferencesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        <span className="ml-3">Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {preferencesError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {preferencesError}
        </div>
      )}

      {/* Theme */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Theme</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value, user?.id)}
          className="w-full px-3 py-2 border rounded-lg"
          disabled={preferencesSaving}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {/* Font Size */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Font Size</label>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value, user?.id)}
          className="w-full px-3 py-2 border rounded-lg"
          disabled={preferencesSaving}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Language */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value, user?.id)}
          className="w-full px-3 py-2 border rounded-lg"
          disabled={preferencesSaving}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Page Size */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Default Page Size</label>
        <select
          value={localPreferences.defaultPageSize}
          onChange={(e) => setLocalPreferences({
            ...localPreferences,
            defaultPageSize: parseInt(e.target.value)
          })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      {/* Notifications */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={localPreferences.notifications}
            onChange={(e) => setLocalPreferences({
              ...localPreferences,
              notifications: e.target.checked
            })}
            className="mr-2"
          />
          <span>Enable notifications</span>
        </label>
      </div>

      {/* Sounds */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={localPreferences.sounds}
            onChange={(e) => setLocalPreferences({
              ...localPreferences,
              sounds: e.target.checked
            })}
            className="mr-2"
          />
          <span>Enable sounds</span>
        </label>
      </div>

      {/* Compact Mode */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={localPreferences.compactMode}
            onChange={(e) => setLocalPreferences({
              ...localPreferences,
              compactMode: e.target.checked
            })}
            className="mr-2"
          />
          <span>Compact mode</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={preferencesSaving}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {preferencesSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={handleReset}
          disabled={preferencesSaving}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
```

## Example 5: Sidebar with Collapse Persistence

```javascript
// src/components/layout/Sidebar.jsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export default function Sidebar() {
  const user = useAuthStore(state => state.user);
  const {
    sidebarCollapsed,
    toggleSidebarCollapse,
    preferencesSaving
  } = useUIStore();

  const handleToggleCollapse = async () => {
    // Toggle and auto-save to backend
    await toggleSidebarCollapse(user?.id);
  };

  return (
    <aside
      className={`
        bg-white border-r border-gray-200 transition-all duration-300
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      <div className="flex items-center justify-between p-4">
        {!sidebarCollapsed && (
          <h2 className="text-xl font-bold">Menu</h2>
        )}
        <button
          onClick={handleToggleCollapse}
          disabled={preferencesSaving}
          className="p-1 rounded hover:bg-gray-100"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {preferencesSaving ? (
            <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full" />
          ) : sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Sidebar navigation items */}
      <nav className="p-2">
        {/* ... */}
      </nav>
    </aside>
  );
}
```

## Example 6: Protected Route with Preference Loading

```javascript
// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = useAuthStore(state => state.user);
  const {
    loadUserPreferences,
    preferencesLoading,
    lastSyncedUserId
  } = useUIStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      if (user && user.id !== lastSyncedUserId) {
        // Load preferences if not already loaded for this user
        await loadUserPreferences(user.id);
      }
      setIsReady(true);
    };

    loadPreferences();
  }, [user, loadUserPreferences, lastSyncedUserId]);

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Not authorized
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Loading preferences
  if (preferencesLoading || !isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return children;
}
```

## Example 7: Hook for Preference Management

```javascript
// src/hooks/useUserPreferences.js
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export function useUserPreferences() {
  const user = useAuthStore(state => state.user);
  const {
    theme,
    fontSize,
    language,
    sidebarCollapsed,
    preferences,
    setTheme,
    setFontSize,
    setLanguage,
    toggleSidebarCollapse,
    updatePreferences,
    resetPreferences,
    preferencesLoading,
    preferencesSaving,
    preferencesError
  } = useUIStore();

  // Helper to call methods with userId automatically
  const setThemeWithSync = async (newTheme) => {
    await setTheme(newTheme, user?.id);
  };

  const setFontSizeWithSync = async (newFontSize) => {
    await setFontSize(newFontSize, user?.id);
  };

  const setLanguageWithSync = async (newLanguage) => {
    await setLanguage(newLanguage, user?.id);
  };

  const toggleSidebarWithSync = async () => {
    await toggleSidebarCollapse(user?.id);
  };

  const updatePreferencesWithSync = async (newPrefs) => {
    await updatePreferences(newPrefs, user?.id);
  };

  const resetPreferencesWithSync = async () => {
    await resetPreferences(user?.id);
  };

  return {
    // Values
    theme,
    fontSize,
    language,
    sidebarCollapsed,
    preferences,

    // Actions (auto-sync enabled)
    setTheme: setThemeWithSync,
    setFontSize: setFontSizeWithSync,
    setLanguage: setLanguageWithSync,
    toggleSidebar: toggleSidebarWithSync,
    updatePreferences: updatePreferencesWithSync,
    resetPreferences: resetPreferencesWithSync,

    // States
    isLoading: preferencesLoading,
    isSaving: preferencesSaving,
    error: preferencesError
  };
}
```

Usage:

```javascript
import { useUserPreferences } from '@/hooks/useUserPreferences';

function MyComponent() {
  const {
    theme,
    setTheme,
    isLoading,
    isSaving
  } = useUserPreferences();

  // No need to pass userId, it's handled automatically
  const handleThemeChange = async () => {
    await setTheme('dark');
  };

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={handleThemeChange} disabled={isSaving}>
        Toggle Theme {isSaving && '(Saving...)'}
      </button>
    </div>
  );
}
```

## Example 8: Sync Status Indicator

```javascript
// src/components/SyncStatusIndicator.jsx
import { Cloud, CloudOff, Check, AlertCircle } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export default function SyncStatusIndicator() {
  const {
    preferencesSaving,
    preferencesError,
    lastSyncedUserId
  } = useUIStore();

  if (!lastSyncedUserId) {
    // Not synced to backend
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <CloudOff className="h-4 w-4" />
        <span>Offline mode</span>
      </div>
    );
  }

  if (preferencesError) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>Sync error</span>
      </div>
    );
  }

  if (preferencesSaving) {
    return (
      <div className="flex items-center gap-2 text-blue-500 text-sm">
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-500 text-sm">
      <Check className="h-4 w-4" />
      <span>Synced</span>
    </div>
  );
}
```

## Testing Examples

```javascript
// __tests__/uiStore.test.js
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUIStore } from '@/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Clear store state
    useUIStore.setState({
      theme: 'light',
      preferences: {},
      preferencesLoading: false,
      preferencesSaving: false,
      preferencesError: null,
      lastSyncedUserId: null
    });
  });

  it('loads user preferences from backend', async () => {
    const { result } = renderHook(() => useUIStore());

    await act(async () => {
      await result.current.loadUserPreferences('test-user-1');
    });

    await waitFor(() => {
      expect(result.current.preferencesLoading).toBe(false);
      expect(result.current.lastSyncedUserId).toBe('test-user-1');
    });
  });

  it('saves preferences to backend', async () => {
    const { result } = renderHook(() => useUIStore());

    await act(async () => {
      await result.current.setTheme('dark', 'test-user-1');
    });

    await waitFor(() => {
      expect(result.current.theme).toBe('dark');
      expect(result.current.preferencesSaving).toBe(false);
    });
  });

  it('handles backend errors gracefully', async () => {
    const { result } = renderHook(() => useUIStore());

    // Mock fetch to return error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500
      })
    );

    await act(async () => {
      await result.current.loadUserPreferences('test-user-1');
    });

    await waitFor(() => {
      expect(result.current.preferencesError).toBeTruthy();
    });
  });
});
```

These examples demonstrate all the key patterns for using the migrated uiStore in your application.
