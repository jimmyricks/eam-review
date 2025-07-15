import { ref, readonly } from 'vue'
import { useDebounceFn } from '@vueuse/core'

/**
 * Composable for debouncing search input
 * @param delay - Delay in milliseconds (default: 300)
 * @param callback - Function to call after debounce
 */
export function useSearchDebounce(
  delay: number = 300,
  callback: (value: string) => void
) {
  const isDebouncing = ref(false)

  // Use VueUse's useDebounceFn for better performance and consistency
  const debouncedSearch = useDebounceFn((value: string) => {
    callback(value)
    isDebouncing.value = false
  }, delay)

  const wrappedDebouncedSearch = (value: string) => {
    isDebouncing.value = true
    debouncedSearch(value)
  }

  const cancelDebounce = () => {
    // VueUse's useDebounceFn doesn't have a cancel method, so we just reset the state
    isDebouncing.value = false
  }

  const immediateSearch = (value: string) => {
    cancelDebounce()
    callback(value)
  }

  return {
    debouncedSearch: wrappedDebouncedSearch,
    cancelDebounce,
    immediateSearch,
    isDebouncing: readonly(isDebouncing),
  }
} 