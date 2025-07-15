import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserSettingsService } from '@/composables/services/useUserSettingsService'

export const useUserSettingsStore = defineStore('userSettings', () => {
  const listPageSettings = ref<Record<string, any>>({})
  const formPageSettings = ref<Record<string, any>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  const service = useUserSettingsService()

  /**
   * Load both list & form settings from server.
   */
  const load = async () => {
    try {
      loading.value = true
      error.value = null

      listPageSettings.value = await service.getListPageSettings()
      formPageSettings.value = await service.getFormPageSettings()
    } catch (err: any) {
      console.error('Failed to load user settings:', err)
      error.value = err?.message ?? String(err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Persist list-page settings for a single DocType and update local cache.
   */
  const saveList = async (doctype: string, payload: Record<string, any>) => {
    await service.setDoctypeListSettings(doctype, payload)
    listPageSettings.value = {
      ...listPageSettings.value,
      [doctype]: { ...(listPageSettings.value[doctype] || {}), ...payload },
    }
  }

  /**
   * Persist form-page settings for a single DocType and update local cache.
   */
  const saveForm = async (doctype: string, payload: Record<string, any>) => {
    await service.setDoctypeFormSettings(doctype, payload)
    formPageSettings.value = {
      ...formPageSettings.value,
      [doctype]: { ...(formPageSettings.value[doctype] || {}), ...payload },
    }
  }

  return {
    listPageSettings,
    formPageSettings,
    loading,
    error,
    load,
    saveList,
    saveForm,
  }
})
