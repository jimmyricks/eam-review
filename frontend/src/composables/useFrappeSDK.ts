import { FrappeApp } from 'frappe-js-sdk'

/**
 * Provides access to Frappe JS SDK instances.
 *
 * Implementation details:
 * 1. We keep a module-level cache (sdkInstance).
 * 2. The first time useFrappeSDK() is invoked we create and store the
 *    FrappeApp + helpers; subsequent calls return the cached object.
 * 3. NO work happens at module import time – everything is lazy, so we never
 *    hit Vue's provide/inject mechanism outside of a valid setup() context.
 */

// Internal singleton cache
let sdkInstance: ReturnType<typeof createSDK> | null = null

// Factory that actually constructs the SDK object once
const createSDK = () => {
  const frappe = new FrappeApp('/')

  const db = frappe.db()
  const call = frappe.call()
  const auth = frappe.auth()
  const file = frappe.file()

  const login = (username: string, password: string) =>
    auth.loginWithUsernamePassword({ username, password })
  const logout = () => auth.logout()
  const getLoggedInUser = () => auth.getLoggedInUser()

  return {
    frappe,
    db,
    call,
    auth,
    file,
    login,
    logout,
    getLoggedInUser,
  }
}

/**
 * Main composable – returns the cached instance or creates a new one.
 */
export const useFrappeSDK = () => {
  if (!sdkInstance) {
    sdkInstance = createSDK()
  }
  return sdkInstance
}

/* -------------------------------------------------------------------------- */
/* Convenience lazy exports                                                   */
/* -------------------------------------------------------------------------- */

// Helper to avoid repeating the proxy boilerplate
function makeLazyProxy<T extends object>(getter: () => T): T {
  // Casting because we build dynamic proxy; TS can't infer generic easily here
  return new Proxy({} as T, {
    get(_t, key: string) {
      // Always resolve from the singleton (created on first use)
      return (getter() as any)[key]
    },
  }) as T
}

// Expose the common helpers while keeping them lazy / singleton-safe
export const frappeDB    = makeLazyProxy(() => useFrappeSDK().db)
export const frappeCall  = makeLazyProxy(() => useFrappeSDK().call)
export const frappeAuth  = makeLazyProxy(() => useFrappeSDK().auth)
export const frappeFile  = makeLazyProxy(() => useFrappeSDK().file)
export const login       = (username: string, password: string) =>
  useFrappeSDK().login(username, password)
export const logout      = () => useFrappeSDK().logout()
export const getLoggedInUser = () => useFrappeSDK().getLoggedInUser()
