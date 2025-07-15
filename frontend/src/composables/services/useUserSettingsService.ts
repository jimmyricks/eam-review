import { ref } from 'vue'
import { useFrappeSDK } from '@/composables/useFrappeSDK'

/**
 * Service for persisting user-specific UI settings in the *My Settings* single DocType.
 *
 * DocType: My Settings (issingle = 1)
 * Fields:
 *   - list_page_settings  JSON
 *   - form_page_settings  JSON
 */
export function useUserSettingsService() {
  const { db } = useFrappeSDK()

  // Internal cache to avoid redundant round-trips
  const settingsDoc = ref<any | null>(null)

  // Ensure we have the latest *My Settings* document cached
  const ensureLoaded = async () => {
    if (settingsDoc.value) return settingsDoc.value

    // Single Doctype always has name == doctype
    settingsDoc.value = await db.getDoc('My Settings', 'My Settings')
    return settingsDoc.value
  }

  /**
   * Fetch *list_page_settings* JSON as a plain object.
   */
  const getListPageSettings = async (): Promise<Record<string, any>> => {
    const doc = await ensureLoaded()
    try {
      return JSON.parse(doc.list_page_settings || '{}')
    } catch {
      return {}
    }
  }

  /**
   * Persist an updated `list_page_settings` object back to the server.
   * This overwrites the entire JSON field.
   */
  const saveListPageSettings = async (settings: Record<string, any>) => {
    // Stringify once for storage consistency
    // make payload have indent of 2
    const payload = JSON.stringify(settings, null, 2)

    // Update server – using cast to any because typings may lag
    await (db as any).setValue('My Settings', 'My Settings', 'list_page_settings', payload)

    // Keep cache in sync
    if (settingsDoc.value) {
      settingsDoc.value.list_page_settings = payload
    }
  }

  /**
   * Convenience helpers for a single doctype key (e.g., "Asset")
   */
  const getDoctypeListSettings = async (doctype: string) => {
    const all = await getListPageSettings()
    return (all[doctype] || {}) as Record<string, any>
  }

  const setDoctypeListSettings = async (doctype: string, partial: Record<string, any>) => {
    const all = await getListPageSettings()
    all[doctype] = { ...(all[doctype] || {}), ...partial }
    await saveListPageSettings(all)
  }

  /* -------------------------------------------------------------------------- */
  /* Form Page Settings                                                         */
  /* -------------------------------------------------------------------------- */

  const getFormPageSettings = async (): Promise<Record<string, any>> => {
    const doc = await ensureLoaded()
    try {
      return JSON.parse(doc.form_page_settings || '{}')
    } catch {
      return {}
    }
  }

  const saveFormPageSettings = async (settings: Record<string, any>) => {
    const payload = JSON.stringify(settings, null, 2)
    await (db as any).setValue('My Settings', 'My Settings', 'form_page_settings', payload)
    if (settingsDoc.value) {
      settingsDoc.value.form_page_settings = payload
    }
  }

  const getDoctypeFormSettings = async (doctype: string) => {
    const all = await getFormPageSettings()
    return (all[doctype] || {}) as Record<string, any>
  }

  const setDoctypeFormSettings = async (doctype: string, partial: Record<string, any>) => {
    const all = await getFormPageSettings()
    all[doctype] = { ...(all[doctype] || {}), ...partial }
    await saveFormPageSettings(all)
  }

  return {
    getListPageSettings,
    saveListPageSettings,
    getDoctypeListSettings,
    setDoctypeListSettings,

    // Form settings handlers
    getFormPageSettings,
    saveFormPageSettings,
    getDoctypeFormSettings,
    setDoctypeFormSettings,
  }
} 