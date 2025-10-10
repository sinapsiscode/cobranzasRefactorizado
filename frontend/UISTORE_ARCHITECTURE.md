# UI Store Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Login      │  │  Settings    │  │  Theme       │          │
│  │   Page       │  │  Page        │  │  Toggle      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │ loadPreferences()│ updatePrefs()    │ toggleTheme()
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       UI STORE (Zustand)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  PERSISTENT STATE                          │ │
│  │  • theme: 'light' | 'dark'                                 │ │
│  │  • fontSize: 'small' | 'medium' | 'large'                  │ │
│  │  • language: 'es' | 'en'                                   │ │
│  │  • sidebarCollapsed: boolean                               │ │
│  │  • preferences: { notifications, sounds, etc. }            │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  EPHEMERAL STATE                           │ │
│  │  • loading, modals, breadcrumbs, etc.                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  SYNC STATE                                │ │
│  │  • preferencesLoading: boolean                             │ │
│  │  • preferencesSaving: boolean                              │ │
│  │  • preferencesError: string | null                         │ │
│  │  • lastSyncedUserId: string | null                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────┬───────────────────────┬──────────────────────┘
                   │                       │
       Backend Sync│                       │LocalStorage Cache
                   │                       │
                   ▼                       ▼
┌──────────────────────────────┐  ┌─────────────────────────┐
│      JSON Server API         │  │   LocalStorage          │
│  ┌────────────────────────┐  │  │  ┌───────────────────┐  │
│  │ GET /api/user-prefs/:id│  │  │  │ tv-cable-ui       │  │
│  │ POST /api/user-prefs   │  │  │  │   {              │  │
│  │ PATCH /api/user-prefs  │  │  │  │     theme: ...    │  │
│  └────────────────────────┘  │  │  │     fontSize: ... │  │
│           ▼                   │  │  │     ...           │  │
│  ┌────────────────────────┐  │  │  │   }              │  │
│  │  user-preferences.json │  │  │  └───────────────────┘  │
│  │  [                     │  │  └─────────────────────────┘
│  │    {                   │  │
│  │      "id": "user-1",   │  │        (Fallback/Cache)
│  │      "theme": "dark",  │  │
│  │      ...               │  │
│  │    }                   │  │
│  │  ]                     │  │
│  └────────────────────────┘  │
└──────────────────────────────┘

        (Primary Storage)
```

## Data Flow Diagrams

### 1. Login Flow - Loading Preferences

```
User Logs In
    │
    ├─> authStore.login(credentials)
    │       │
    │       └─> Returns user object
    │
    ├─> uiStore.loadUserPreferences(user.id)
    │       │
    │       ├─> GET /api/user-preferences/:userId
    │       │       │
    │       │       ├─> 200 OK: Load preferences
    │       │       │       │
    │       │       │       └─> Update store state
    │       │       │               │
    │       │       │               └─> Apply theme to document
    │       │       │
    │       │       └─> 404 Not Found: Use defaults
    │       │               │
    │       │               └─> Keep default values
    │       │
    │       └─> Set preferencesLoading = false
    │
    └─> Navigate to dashboard
```

### 2. Preference Change Flow - Saving to Backend

```
User Changes Theme
    │
    ├─> Call setTheme('dark', userId)
    │       │
    │       ├─> Update local state immediately
    │       │       theme = 'dark'
    │       │
    │       ├─> Apply to document
    │       │       document.documentElement.className = 'dark'
    │       │
    │       └─> autoSave(userId)
    │               │
    │               ├─> Set preferencesSaving = true
    │               │
    │               ├─> PATCH /api/user-preferences/:userId
    │               │       │
    │               │       ├─> 200 OK: Success
    │               │       │       │
    │               │       │       └─> Set preferencesSaving = false
    │               │       │
    │               │       └─> 404 Not Found: Create new
    │               │               │
    │               │               └─> POST /api/user-preferences
    │               │                       │
    │               │                       └─> Set preferencesSaving = false
    │               │
    │               └─> LocalStorage updated by persist middleware
    │
    └─> UI shows "Saved" indicator
```

### 3. Initialization Flow

```
App Starts
    │
    ├─> Check if user is logged in
    │       │
    │       ├─> User logged in (userId exists)
    │       │       │
    │       │       └─> uiStore.initialize(userId)
    │       │               │
    │       │               ├─> loadUserPreferences(userId)
    │       │               │       │
    │       │               │       └─> Load from backend
    │       │               │
    │       │               ├─> handleResize()
    │       │               │       │
    │       │               │       └─> Set responsive state
    │       │               │
    │       │               └─> Add resize listener
    │       │
    │       └─> User not logged in (no userId)
    │               │
    │               └─> uiStore.initialize()
    │                       │
    │                       ├─> Use LocalStorage values
    │                       │       │
    │                       │       └─> Or defaults if empty
    │                       │
    │                       ├─> handleResize()
    │                       │
    │                       └─> Add resize listener
    │
    └─> Render app
```

## State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    UI Store State Machine                        │
└─────────────────────────────────────────────────────────────────┘

Initial State
    │
    └─> [UNINITIALIZED]
            │
            │ initialize() called
            │
            ├─> With userId
            │       │
            │       └─> [LOADING]
            │               │
            │               ├─> Success → [SYNCED]
            │               │               │
            │               │               └─> lastSyncedUserId = userId
            │               │
            │               └─> Error → [ERROR]
            │                       │
            │                       └─> Use LocalStorage fallback
            │
            └─> Without userId
                    │
                    └─> [LOCAL_ONLY]
                            │
                            └─> Uses LocalStorage only

State Transitions:

[SYNCED]
    │
    ├─> Preference changed
    │       │
    │       └─> [SAVING]
    │               │
    │               ├─> Success → [SYNCED]
    │               │
    │               └─> Error → [ERROR]
    │
    └─> User logs out
            │
            └─> [LOCAL_ONLY]

[ERROR]
    │
    └─> Retry
            │
            ├─> Success → [SYNCED]
            │
            └─> Error → [ERROR]

[LOCAL_ONLY]
    │
    └─> User logs in
            │
            └─> [LOADING] → [SYNCED]
```

## Component Integration Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                        Component Tree                            │
└─────────────────────────────────────────────────────────────────┘

<App>
  │
  ├─ useAuthStore() ────────────────┐
  │                                  │
  ├─ useUIStore() ──────────────────┤
  │                                  │
  ├─ useEffect(() => {               │
  │    initialize(user?.id)          │ Sync on mount
  │  }, [user?.id])                  │
  │                                  │
  └─ <Routes>                        │
       │                             │
       ├─ <Login>                    │
       │    │                        │
       │    └─ On success:           │
       │         loadPreferences() ──┘
       │
       ├─ <Layout>
       │    │
       │    ├─ <Header>
       │    │    │
       │    │    └─ <ThemeToggle>
       │    │         │
       │    │         └─ toggleTheme(userId) ───┐
       │    │                                    │
       │    ├─ <Sidebar>                        │
       │    │    │                               │ Auto-save
       │    │    └─ toggleSidebar(userId) ──────┤
       │    │                                    │
       │    └─ <Content>                         │
       │         │                               │
       │         └─ <SettingsPage>              │
       │              │                          │
       │              └─ updatePreferences() ───┘
       │
       └─ <NotificationContainer>
```

## Error Handling Flow

```
API Call
    │
    ├─> Success (200 OK)
    │       │
    │       └─> Update state
    │               │
    │               └─> Clear error
    │
    ├─> Not Found (404)
    │       │
    │       └─> Is it load?
    │               │
    │               ├─> Yes: Use defaults
    │               │       │
    │               │       └─> No error shown
    │               │
    │               └─> No: Try create (POST)
    │                       │
    │                       ├─> Success → Clear error
    │                       │
    │                       └─> Error → Set error
    │
    ├─> Server Error (500)
    │       │
    │       └─> Set preferencesError
    │               │
    │               └─> Use LocalStorage fallback
    │
    └─> Network Error
            │
            └─> Set preferencesError
                    │
                    └─> Use LocalStorage fallback
```

## Multi-Device Sync

```
Device A                    Backend              Device B
   │                           │                    │
   │─ Update theme ──────────> │                    │
   │  (dark)                   │                    │
   │                           │                    │
   │ <── 200 OK ───────────────│                    │
   │                           │                    │
   │                           │ <── Login ─────────│
   │                           │                    │
   │                           │─ Load prefs ──────>│
   │                           │  (theme: dark)     │
   │                           │                    │
   │─ Update fontSize ───────> │                    │
   │  (large)                  │                    │
   │                           │                    │
   │ <── 200 OK ───────────────│                    │
   │                           │                    │
   │                           │                    │─ Refresh page
   │                           │                    │
   │                           │ <── Load prefs ────│
   │                           │                    │
   │                           │─ Latest data ─────>│
   │                           │  (theme: dark,     │
   │                           │   fontSize: large) │
```

## Storage Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        Storage Priority                          │
└─────────────────────────────────────────────────────────────────┘

Load Preferences:
    │
    └─> Priority Order:
            │
            1. Backend API (if userId provided)
            │       │
            │       ├─> Success: Use backend data
            │       │
            │       └─> Fail: Fall through to next
            │
            2. LocalStorage Cache
            │       │
            │       ├─> Exists: Use cached data
            │       │
            │       └─> Empty: Fall through to next
            │
            3. Default Values
                    │
                    └─> Use hardcoded defaults

Save Preferences:
    │
    └─> Save Targets:
            │
            ├─> 1. Backend API (if userId)
            │        │
            │        └─> Async save
            │
            └─> 2. LocalStorage (always)
                     │
                     └─> Sync save via persist middleware
```

## Architecture Benefits

```
┌──────────────────────────────────────────────────────────────┐
│                     Architecture Benefits                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ Multi-Device Sync                                        │
│     └─> Preferences follow user across devices               │
│                                                               │
│  ✅ Offline Support                                          │
│     └─> LocalStorage fallback when backend unavailable       │
│                                                               │
│  ✅ Performance                                              │
│     └─> LocalStorage cache reduces API calls                 │
│                                                               │
│  ✅ Resilience                                               │
│     └─> Graceful degradation on errors                       │
│                                                               │
│  ✅ Backward Compatible                                      │
│     └─> Works with or without backend sync                   │
│                                                               │
│  ✅ Type Safety                                              │
│     └─> Zustand provides TypeScript support                  │
│                                                               │
│  ✅ Developer Experience                                     │
│     └─> Simple API, optional userId parameter                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Production Setup                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │         │   Backend   │         │  Database   │
│             │         │             │         │             │
│  UI Store   │◄──────►│  API Server │◄──────►│  PostgreSQL │
│  (Zustand)  │  HTTPS  │  (Express)  │         │     or      │
│             │         │             │         │   MongoDB   │
│  LocalStorage│         │   Redis    │         │             │
│  (Cache)    │         │  (Cache)    │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
      │                                                 │
      │                                                 │
      └─────────────────────────────────────────────────┘
                   Sync via REST API
```

This architecture provides a robust, scalable, and user-friendly preference management system!
