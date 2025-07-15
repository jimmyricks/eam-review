import { useRouter } from 'vue-router'
import { doctypeToRoute } from '@/utils/slugify'

/**
 * Navigation utilities composable
 * Provides methods for handling navigation, including going back to previous page
 */
export function useNavigation() {
  const router = useRouter()

  /**
   * Go back to the previous page in browser history
   * Falls back to a default route if no history is available
   */
  const goBack = (fallbackRoute?: string) => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      window.history.back()
    } else if (fallbackRoute) {
      // If no history, go to fallback route
      router.push(fallbackRoute)
    } else {
      // Default fallback - go to home/dashboard
      router.push('/')
    }
  }

  /**
   * Go back with a specific fallback route based on current route
   * Useful for forms where you want to go back to the list view
   */
  const goBackWithFallback = (currentDoctype?: string) => {
    if (window.history.length > 1) {
      window.history.back()
    } else if (currentDoctype) {
      // Convert doctype to route slug and go to list view
      const routeSlug = doctypeToRoute(currentDoctype)
      router.push(`/${routeSlug}`)
    } else {
      router.push('/')
    }
  }

  /**
   * Navigate to a specific route
   */
  const navigateTo = (route: string) => {
    router.push(route)
  }

  /**
   * Replace current route (doesn't add to history)
   */
  const replaceTo = (route: string) => {
    router.replace(route)
  }

  return {
    goBack,
    goBackWithFallback,
    navigateTo,
    replaceTo,
  }
}
