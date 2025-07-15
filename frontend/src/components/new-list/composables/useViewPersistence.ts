import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'

export function useViewPersistence(doctype: string, initialView: string = 'List') {
  const storageKey = `doctype-view-${doctype}`

  // Use VueUse's useStorage for reactive localStorage management
  const currentView = useStorage(storageKey, initialView)

  const setView = (view: string) => {
    currentView.value = view
  }

  return {
    currentView,
    setView,
  }
}
