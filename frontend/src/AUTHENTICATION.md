# Authentication & API Debugging Architecture

This section provides a deep-dive analysis of the codebase structure for debugging authentication and unwanted API calls, especially on the login page. It covers service/composable imports, authentication flow, app initialization, route structure, component dependencies, and potential issues.

---

## 1. Service/Composable Imports

### Core Service Composables

- **Location:** `src/composables/services/`
- **Key Services:**
  - `useMetadataService` (metadata, caching, preloading)
  - `useDocumentService` (CRUD, form loading)
  - `useListService`, `useSearchService`, `useWorkflowService`, `useDocumentActionService`, `useAttachmentService`
- **Exports:** Centralized in `src/composables/services/index.ts`

### Where Are They Imported?

- **Feature Components:**
  - `FormPage.vue`, `ListPage.vue`, `FormContent.vue`, `FormHeader.vue`, etc. import these services for CRUD, metadata, and workflow operations.
- **Composables:**
  - `useColumnManagement`, `useListPageState`, etc. import services for list/table logic.
- **No evidence of global service initialization in `main.js` or `App.vue`** (services are only used in setup functions, not at module scope).

### Auto-Execution Risk

- **No auto-execution on import:**
  - All service composables are factory functions (returning methods/state), so nothing runs until called in a `setup()` or composable.
  - **Exception:** If a composable is used in a component that is always mounted (e.g., Navbar, AppShell), it may trigger API calls on app load.

---

## 2. Authentication Flow

### State Management

- **Pinia Stores:**
  - `authStore` (`src/stores/auth.store.ts`): user info, session, basic permissions
  - `permissionsStore` (`src/stores/permissions.ts`): boot info, detailed permissions, menu filtering

### Permissions Caching

- **authStore:** Caches user info/permissions in `eam_user_info` (30 min)
- **permissionsStore:** Caches boot info in `eam_boot_info_cache` (5 min)

### Guards & Execution Timing

- **Router Guards:**
  - Defined in `src/router/index.js` (see previous documentation)
  - On each navigation, checks if route requires auth, loads cached permissions, and redirects as needed
- **Composables:**
  - `useAuthentication.ts` provides `checkAuthentication`, `handleProtectedRoute`, `handleLoginPage`, and `logout` (all call both stores for cache clearing)

---

## 3. App Initialization

### What Runs Immediately?

- **App.vue:**
  - Only sets up theme, providers, and determines which shell to render (no API calls here)
- **AppShell.vue:**
  - Handles layout logic, but does not trigger API calls directly
- **AuthShell.vue:**
  - Minimal, only renders `<router-view />`
- **Pinia Store Initialization:**
  - Stores are registered but do not auto-fetch data unless a method is called

### Global Providers

- **Naive UI Providers:**
  - Provided in `App.vue` (theme, dialogs, notifications, etc.)
  - No API calls on their own

---

## 4. Route Structure

### Shell Mapping

- **App.vue:**
  - Renders `AuthShell` for routes with `meta.requiresAuth: false` (e.g., Login, NotFound)
  - Renders `AppShell` for all other routes
- **AppShell.vue:**
  - Renders main layout (sidebar, header, content) for authenticated routes
- **AuthShell.vue:**
  - Used for login and error pages (no layout, no menu)

### Router Config

- **Location:** `src/router/index.js`
- **Meta Flags:**
  - `meta.requiresAuth: false` for public routes
  - All other routes default to `requiresAuth: true`
- **Guards:**
  - Navigation guard checks authentication and permissions before allowing access

---

## 5. Component Dependencies

### Login.vue

- **Imports:**
  - `useAuthStore`, `usePermissionsStore`, `useAuthentication` (all in setup)
  - Naive UI components
- **onMounted:**
  - Clears both caches, checks for cached permissions, redirects if already authenticated
  - **No API calls unless user submits login form**

### AuthShell.vue

- **Component Tree:**
  - Only `<router-view />` (no children, no layout, no menu)
  - **No API calls or global state usage**

### Global Components

- **Navbar.vue, Header.vue:**
  - Only rendered in `AppShell` (never in `AuthShell`)
  - Both import `usePermissionsStore` and may trigger permissions fetch on mount

---

## 6. Potential Issues & API Call Triggers

### Unwanted API Calls on Login Page

- **Root Cause:**
  - If the login route is not correctly excluded from the main layout, `AppShell` (and thus Navbar/Header) may render, triggering permissions API calls
- **How to Debug:**
  - Ensure login route has `meta.requiresAuth: false` and is named exactly 'Login'
  - Confirm `App.vue` and `AppShell.vue` logic for shell/layout selection

### Services Initializing on Import

- **Not an issue:**
  - All service composables are factories; nothing runs until called in setup

### Global State Management

- **Pinia stores:**
  - Do not auto-fetch data; only fetch when methods are called (e.g., `fetchBootInfo`, `fetchPermissions`)

### Other Risks

- **If a component (e.g., Navbar) is accidentally included in AuthShell or login page, it will trigger API calls**
- **If a composable is used at the top level of a component that is always mounted, it may trigger API calls**

---

## 7. File-by-File Breakdown: What Loads When

### On Login Page (`/login`)

- **App.vue:** Renders `AuthShell`
- **AuthShell.vue:** Renders `<router-view />` (Login.vue)
- **Login.vue:**
  - onMounted: clears caches, checks for cached permissions
  - No API calls unless user submits login form

### On Authenticated Route

- **App.vue:** Renders `AppShell`
- **AppShell.vue:** Renders main layout
- **BaseLayout.vue:** Renders Navbar, Header, etc.
- **Navbar.vue/Header.vue:**
  - onMounted: may trigger permissions API calls (fetchBootInfo)

---

## 8. Where Unwanted API Calls Are Likely Coming From

- **If you see API calls on the login page:**
  - The login route is not being excluded from the main layout (check router config and AppShell logic)
  - Navbar or Header is being rendered on the login page (should not happen)
- **If you see API calls on every route change:**
  - Permissions are being fetched on every mount (check isLoaded/caching logic in stores)

---

## 9. Debugging Checklist

- [ ] Confirm login route has `meta.requiresAuth: false` and name 'Login'
- [ ] Confirm `App.vue` and `AppShell.vue` logic for shell/layout selection
- [ ] Ensure Navbar/Header are not rendered in `AuthShell`
- [ ] Check that no composable is auto-executing API calls on import
- [ ] Use Vue Devtools to inspect component tree on login page
- [ ] Use browser network tab to trace unwanted API calls

---

_Last updated: 2024-06-16_
