import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Define the structure of the user info we expect
interface UserInfo {
  name?: string | null
  email?: string | null
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const userName = ref<string | null>(null)
  const userEmail = ref<string | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => {
    return (
      !isLoading.value &&
      !error.value &&
      !!userName.value
    )
  })

  // Load cached user info on startup
  const loadCachedUserInfo = () => {
    try {
      const cached = localStorage.getItem('eam_user_info')
      if (cached) {
        const userInfo = JSON.parse(cached)
        const cacheAge = Date.now() - userInfo.timestamp
        // Use cached info if it's less than 30 minutes old
        if (cacheAge < 30 * 60 * 1000) {
          userName.value = userInfo.name || null
          userEmail.value = userInfo.email || null
          return true
        }
      }
    } catch (error) {
      console.warn('Failed to load cached user info:', error)
    }
    return false
  }

  // Actions
  function setUserInfo(name: string | null, email: string | null) {
    userName.value = name
    userEmail.value = email
    // Cache user info in localStorage for faster subsequent loads
    try {
      localStorage.setItem('eam_user_info', JSON.stringify({
        name: userName.value,
        email: userEmail.value,
        timestamp: Date.now()
      }))
    } catch (storageError) {
      console.warn('Failed to cache user info:', storageError)
    }
  }

  function clearUserInfo() {
    userName.value = null
    userEmail.value = null
    error.value = null
    // Clear cached user info
    try {
      localStorage.removeItem('eam_user_info')
    } catch (storageError) {
      console.warn('Failed to clear cached user info:', storageError)
    }
  }

  // Example login/logout actions (to be implemented as needed)
  async function login(credentials: { username: string; password: string }) {
    isLoading.value = true
    error.value = null
    try {
      // Implement login logic here (API call, etc.)
      // On success:
      // setUserInfo(response.name, response.email)
    } catch (err: any) {
      error.value = err.message || 'Login failed.'
      clearUserInfo()
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    clearUserInfo()
    // Implement additional logout logic if needed
  }

  return {
    // State
    userName,
    userEmail,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    setUserInfo,
    clearUserInfo,
    loadCachedUserInfo,
    login,
    logout,
  }
}, {
  persist: {
    key: 'eam_auth',
    paths: ['userName', 'userEmail']
  }
})
