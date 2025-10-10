# UI Store Migration Guide

## Overview

The `uiStore` has been migrated from using Zustand persist (LocalStorage only) to the real JSON Server API for persisting user preferences while maintaining LocalStorage as a fallback/cache.

**File Location**: `C:\Users\usu\Documents\cobranzasRefactorizado\frontend\src\stores\uiStore.js`

## What Changed

### Before
- All preferences saved to LocalStorage only
- No backend synchronization
- Preferences lost when clearing browser data

### After
- **Persistent preferences** saved to JSON Server backend
- **Ephemeral UI state** kept in memory only
- LocalStorage used as fallback/cache
- Multi-device preference synchronization

## API Endpoints Used

```javascript
GET    /api/user-preferences/:userId    // Load user preferences
POST   /api/user-preferences            // Create new preferences
PATCH  /api/user-preferences/:userId    // Update preferences
```

## Persistent vs Ephemeral State

### Persistent (Saved to Backend)
These are saved to both backend and LocalStorage:
- `theme` - 'light' or 'dark'
- `fontSize` - 'small', 'medium', 'large'
- `language` - 'es', 'en'
- `sidebarCollapsed` - boolean
- `preferences` object:
  - `defaultPageSize`
  - `autoRefresh`
  - `refreshInterval`
  - `notifications`
  - `sounds`
  - `compactMode`

### Ephemeral (Memory Only)
These are NOT saved to backend:
- `loading`, `globalLoading`
- `sidebarOpen`
- `modals`, `modalData`
- `isMobile`, `isTablet`, `screenSize`
- `currentPage`, `breadcrumbs`
- `globalSearch`

## New Store Properties

```javascript
{
  // Backend sync states
  preferencesLoading: false,      // Loading preferences from backend
  preferencesSaving: false,       // Saving preferences to backend
  preferencesError: null,         // Error message if sync fails
  lastSyncedUserId: null          // Last user ID synced
}
```

## New Methods

### 1. `loadUserPreferences(userId)`
Loads user preferences from backend.

```javascript
// Call this when user logs in
const uiStore = useUIStore();
await uiStore.loadUserPreferences(user.id);
```

**Behavior**:
- Fetches preferences from `GET /api/user-preferences/:userId`
- If 404 (not found), uses defaults
- Updates all persistent state
- Applies theme to document
- Sets `lastSyncedUserId` for tracking

### 2. `saveUserPreferences(userId)`
Saves current preferences to backend.

```javascript
// Manually save preferences
const saved = await uiStore.saveUserPreferences(user.id);
if (saved) {
  console.log('Preferences saved!');
}
```

**Behavior**:
- Tries PATCH first to update existing preferences
- If 404, creates new preferences with POST
- Returns `true` on success, `false` on failure
- Uses `userId` as the preference record ID

### 3. `autoSave(userId)`
Internal helper for auto-saving.

```javascript
// This is called internally, you don't need to call it
await uiStore.autoSave(userId);
```

## Updated Methods

All preference-modifying methods now accept an optional `userId` parameter for auto-save:

### Theme Methods
```javascript
// Set theme and auto-save
await setTheme('dark', userId);
await toggleTheme(userId);
await setFontSize('large', userId);
await setLanguage('en', userId);
```

### Sidebar Methods
```javascript
// Toggle sidebar and auto-save
await toggleSidebarCollapse(userId);
await setSidebarCollapsed(true, userId);
```

### Preferences Methods
```javascript
// Update preferences and auto-save
await updatePreferences({ notifications: false }, userId);
await resetPreferences(userId);
```

### Initialize Method
```javascript
// Initialize with optional userId to load from backend
await initialize(userId);

// Initialize without userId uses LocalStorage/defaults
await initialize();
```

## Integration Steps

### Step 1: Update Login Flow

In your login/authentication component:

```javascript
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

// After successful login
const handleLogin = async (credentials) => {
  const authStore = useAuthStore();
  const uiStore = useUIStore();

  const user = await authStore.login(credentials);

  if (user) {
    // Load user preferences from backend
    await uiStore.loadUserPreferences(user.id);
  }
};
```

### Step 2: Update App Initialization

In your main `App.jsx` or layout component:

```javascript
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

function App() {
  const user = useAuthStore(state => state.user);
  const initialize = useUIStore(state => state.initialize);

  useEffect(() => {
    // Initialize with userId if logged in
    initialize(user?.id);

    return () => {
      // Cleanup on unmount
      useUIStore.getState().cleanup();
    };
  }, [user?.id]);

  // ... rest of app
}
```

### Step 3: Update Preference-Modifying Components

Components that change preferences should pass userId:

```javascript
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

function ThemeToggle() {
  const user = useAuthStore(state => state.user);
  const { theme, toggleTheme } = useUIStore();

  const handleToggle = async () => {
    // Pass userId for auto-save
    await toggleTheme(user?.id);
  };

  return (
    <button onClick={handleToggle}>
      Toggle Theme (Current: {theme})
    </button>
  );
}
```

### Step 4: Handle Loading States

Show loading indicators during preference sync:

```javascript
import { useUIStore } from '@/stores/uiStore';

function SettingsPage() {
  const {
    preferencesLoading,
    preferencesSaving,
    preferencesError,
    updatePreferences
  } = useUIStore();

  if (preferencesLoading) {
    return <div>Loading preferences...</div>;
  }

  if (preferencesError) {
    return <div>Error: {preferencesError}</div>;
  }

  return (
    <div>
      {preferencesSaving && <span>Saving...</span>}
      {/* Settings form */}
    </div>
  );
}
```

## Backend Data Structure

The backend expects this structure:

```json
{
  "id": "user-123",
  "userId": "user-123",
  "theme": "dark",
  "fontSize": "medium",
  "language": "es",
  "sidebarCollapsed": false,
  "preferences": {
    "defaultPageSize": 25,
    "autoRefresh": false,
    "refreshInterval": 30000,
    "notifications": true,
    "sounds": false,
    "compactMode": false
  },
  "createdAt": "2025-10-10T12:00:00.000Z",
  "updatedAt": "2025-10-10T12:30:00.000Z"
}
```

## Backward Compatibility

The migration maintains full backward compatibility:

1. **LocalStorage still works**: The persist middleware still saves to LocalStorage
2. **Fallback behavior**: If backend is unavailable, uses LocalStorage values
3. **Graceful degradation**: If no userId provided, works like before
4. **No breaking changes**: All existing method signatures work (userId is optional)

## Testing

### Test Backend Integration

```javascript
// Test loading preferences
const uiStore = useUIStore.getState();
await uiStore.loadUserPreferences('test-user-1');

// Check if preferences loaded
console.log(uiStore.lastSyncedUserId); // Should be 'test-user-1'
console.log(uiStore.theme); // Should match backend value

// Test saving preferences
await uiStore.setTheme('dark', 'test-user-1');
console.log(uiStore.preferencesSaving); // Should be false after save

// Test error handling
await uiStore.loadUserPreferences('non-existent-user');
// Should use defaults, no error
```

### Test LocalStorage Fallback

```javascript
// Clear backend data and test fallback
localStorage.setItem('tv-cable-ui', JSON.stringify({
  state: {
    theme: 'dark',
    fontSize: 'large'
  }
}));

// Initialize without userId
await uiStore.initialize();

// Should use LocalStorage values
console.log(uiStore.theme); // 'dark'
console.log(uiStore.fontSize); // 'large'
```

## Migration Checklist

- [x] Migrate uiStore to use JSON Server API
- [ ] Update login flow to call `loadUserPreferences()`
- [ ] Update App initialization to pass userId
- [ ] Update components that modify theme to pass userId
- [ ] Update components that modify preferences to pass userId
- [ ] Add loading indicators for preference sync
- [ ] Add error handling for backend failures
- [ ] Test with real JSON Server backend
- [ ] Test LocalStorage fallback
- [ ] Test multi-device synchronization
- [ ] Update user documentation

## Troubleshooting

### Preferences not saving
1. Check if userId is being passed to methods
2. Check browser console for API errors
3. Verify JSON Server is running
4. Check `preferencesSaving` and `preferencesError` states

### Preferences not loading on login
1. Ensure `loadUserPreferences()` is called after login
2. Check if backend has preferences for the user
3. Check `preferencesLoading` and `preferencesError` states

### Theme not applying
1. Theme is applied in `loadUserPreferences()` and `setTheme()`
2. Check if `document.documentElement.className` is being set
3. Verify CSS classes match theme values

### LocalStorage conflicts
1. Clear LocalStorage: `localStorage.clear()`
2. Reload app to regenerate from backend
3. Or increment version in persist config

## Future Enhancements

1. **Optimistic Updates**: Update UI immediately, sync in background
2. **Conflict Resolution**: Handle concurrent updates from multiple devices
3. **Sync Indicator**: Show sync status in UI
4. **Offline Support**: Queue changes when offline, sync when online
5. **Preference History**: Track changes over time
6. **Bulk Export/Import**: Export/import all preferences

## Questions?

If you encounter issues or have questions about the migration, check:
1. Browser console for errors
2. Network tab for API calls
3. `preferencesError` state for error messages
4. JSON Server logs for backend issues
