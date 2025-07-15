import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFrappeSDK } from './useFrappeSDK'
import { useAuthStore } from '@/stores/auth.store'
import { usePermissionsStore } from '@/stores/permissions'

export const useAuthentication = () => {
  const router = useRouter()
  const { getLoggedInUser } = useFrappeSDK()
  const authStore = useAuthStore()
  const permissionsStore = usePermissionsStore()
  
  const isCheckingAuth = ref(false)
  const authError = ref<string | null>(null)

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isLoading = computed(() => isCheckingAuth.value || authStore.isLoading)

  /**
   * Check if user is authenticated and redirect accordingly
   */
  const checkAuthentication = async (): Promise<boolean> => {
    isCheckingAuth.value = true
    authError.value = null

    try {
      // Check if user is logged in via Frappe session
      const user = await getLoggedInUser()
      const isLoggedIn = !!user

      if (isLoggedIn) {
        // User is logged in, try to load permissions
        if (!authStore.isAuthenticated) {
          // Try to load cached user info first for faster startup
          const cachedLoaded = authStore.loadCachedUserInfo()
          if (!cachedLoaded) {
            // Fetch fresh permissions
            await permissionsStore.fetchBootInfo()
          }
        }
        return true
      } else {
        // User is not logged in, clear any cached data
        authStore.clearUserInfo()
        permissionsStore.clearPermissions()
        return false
      }
    } catch (error) {
      console.error('Authentication check failed:', error)
      authError.value = 'Failed to check authentication status'
      authStore.clearUserInfo()
      permissionsStore.clearPermissions()
      return false
    } finally {
      isCheckingAuth.value = false
    }
  }

  /**
   * Handle authentication for protected routes
   */
  const handleProtectedRoute = async (to: any): Promise<boolean> => {
    const isLoggedIn = await checkAuthentication()
    
    if (!isLoggedIn) {
      // Redirect to login with return path
      router.push({ 
        name: 'Login', 
        query: { redirect: to.fullPath } 
      })
      return false
    }
    
    return true
  }

  /**
   * Handle authentication for login page
   */
  const handleLoginPage = async (): Promise<boolean> => {
    const isLoggedIn = await checkAuthentication()
    
    if (isLoggedIn) {
      // User is already logged in, redirect to home
      router.push({ name: 'LandingPage' })
      return false
    }
    
    return true
  }

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      const { logout: frappeLogout } = useFrappeSDK()
      await frappeLogout()
      authStore.clearUserInfo()
      permissionsStore.clearPermissions()
      router.push({ name: 'Login' })
    } catch (error) {
      console.error('Logout failed:', error)
      // Even if logout fails, clear local data and redirect
      authStore.clearUserInfo()
      permissionsStore.clearPermissions()
      router.push({ name: 'Login' })
    }
  }

  return {
    // State
    isCheckingAuth,
    authError,
    isLoading,
    isAuthenticated,
    
    // Actions
    checkAuthentication,
    handleProtectedRoute,
    handleLoginPage,
    logout
  }
} 