import { useRoute } from 'vue-router'

export type LayoutType = 'list' | 'form'

export function useLayout() {
  const route = useRoute()

  // Determine current layout type based on route
  const getCurrentLayoutType = (): LayoutType => {
    // Check if route meta specifies layout type
    if (route.meta?.layout === 'list') {
      return 'list'
    }
    if (route.meta?.layout === 'form') {
      return 'form'
    }

    // Auto-detect: form if route has parameters, list otherwise
    const hasParams = route.params && Object.keys(route.params).length > 0
    return hasParams ? 'form' : 'list'
  }

  // Check if breadcrumbs should be shown
  const shouldShowBreadcrumbs = (): boolean => {
    return getCurrentLayoutType() === 'form'
  }

  return {
    getCurrentLayoutType,
    shouldShowBreadcrumbs,
  }
}
