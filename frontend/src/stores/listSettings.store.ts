import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface ColumnSettings {
  visibleColumns: string[]
  columnOrder: string[]
  hiddenColumns: string[]
}

interface ListSettings {
  [doctypeKey: string]: ColumnSettings
}

const defaultColumnSettings: ColumnSettings = {
  visibleColumns: [],
  columnOrder: [],
  hiddenColumns: []
}

export const useListSettingsStore = defineStore('listSettings', () => {
  // State
  const settings = ref<ListSettings>({})

  // Getters
  const getListPageColumnSettings = (doctypeKey: string) => {
    return computed(() => {
      return settings.value[doctypeKey] || { ...defaultColumnSettings }
    })
  }

  const hasListSettings = (doctypeKey: string) => {
    return computed(() => !!settings.value[doctypeKey])
  }

  const getAllListSettings = computed(() => settings.value)

  // Actions
  const setListPageColumnSettings = (
    doctypeKey: string,
    columnSettings: Partial<ColumnSettings>
  ) => {
    if (!settings.value[doctypeKey]) {
      settings.value[doctypeKey] = { ...defaultColumnSettings }
    }

    // Merge the new settings with existing ones
    settings.value[doctypeKey] = {
      ...settings.value[doctypeKey],
      ...columnSettings
    }
  }

  const updateVisibleColumns = (doctypeKey: string, visibleColumns: string[]) => {
    setListPageColumnSettings(doctypeKey, { visibleColumns })
  }

  const updateColumnOrder = (doctypeKey: string, columnOrder: string[]) => {
    setListPageColumnSettings(doctypeKey, { columnOrder })
  }

  const updateHiddenColumns = (doctypeKey: string, hiddenColumns: string[]) => {
    setListPageColumnSettings(doctypeKey, { hiddenColumns })
  }

  const resetListPageSettings = (doctypeKey?: string) => {
    if (doctypeKey) {
      delete settings.value[doctypeKey]
    } else {
      settings.value = {}
    }
  }

  const importListSettings = (importedSettings: ListSettings): boolean => {
    try {
      // Validate the imported settings structure
      if (typeof importedSettings !== 'object' || importedSettings === null) {
        return false
      }

      // Validate each doctype's settings
      for (const [key, value] of Object.entries(importedSettings)) {
        if (!value || typeof value !== 'object') {
          continue
        }
        
        const validatedSettings: Partial<ColumnSettings> = {}
        if (Array.isArray(value.visibleColumns)) {
          validatedSettings.visibleColumns = value.visibleColumns
        }
        if (Array.isArray(value.columnOrder)) {
          validatedSettings.columnOrder = value.columnOrder
        }
        if (Array.isArray(value.hiddenColumns)) {
          validatedSettings.hiddenColumns = value.hiddenColumns
        }
        
        if (Object.keys(validatedSettings).length > 0) {
          settings.value[key] = { ...defaultColumnSettings, ...validatedSettings }
        }
      }

      return true
    } catch (error) {
      console.error('Failed to import list settings:', error)
      return false
    }
  }

  const exportListSettings = () => {
    return JSON.stringify(settings.value, null, 2)
  }

  return {
    // State
    settings: getAllListSettings,

    // Getters
    getListPageColumnSettings,
    hasListSettings,

    // Actions
    setListPageColumnSettings,
    updateVisibleColumns,
    updateColumnOrder,
    updateHiddenColumns,
    resetListPageSettings,
    importListSettings,
    exportListSettings
  }
}, {
  persist: {
    key: 'eam_list_settings'
  }
}) 