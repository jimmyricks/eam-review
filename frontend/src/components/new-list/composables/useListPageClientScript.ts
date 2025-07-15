import { ref, watch, computed } from 'vue'
import { useClientScriptService } from '@/composables/services/useClientScriptService'
import type { ListConfig } from '@/services/client-script/types'

export function useListPageClientScript(doctype: string) {
  const clientScriptService = useClientScriptService(doctype)

  const listConfig = ref<ListConfig | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const availableViews = computed(() => {
    return listConfig.value?.availableViews || ['List']
  })

  const uiSettings = computed(() => ({
    hideAddButton: listConfig.value?.hideAddButton || false,
  }))

  watch(
    () => doctype,
    async (newDoctype) => {
      if (!newDoctype) return

      try {
        loading.value = true
        error.value = null

        await clientScriptService.loadClientScript(newDoctype)
        listConfig.value = clientScriptService.getListConfig()
        
      } catch (err) {
        console.error(`ClientScript Error for ${newDoctype}:`, err)
        error.value = `Failed to load client script for ${newDoctype}`
        
        // Fallback to defaults
        listConfig.value = null
      } finally {
        loading.value = false
      }
    },
    { immediate: true }
  )

  return {
    loading,
    error,
    listConfig,
    availableViews,
    uiSettings,
    runHook: clientScriptService.runHook,
  }
} 