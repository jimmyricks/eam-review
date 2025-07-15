import { useDebounceFn } from '@vueuse/core'

export function useSearchDebounce(delay: number, callback: (value: string) => void) {
  const debouncedSearch = useDebounceFn((value: string) => {
    callback(value)
  }, delay)

  return { debouncedSearch }
} 