import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface ColumnSettings {
  visibleColumns: string[]
  columnOrder: string[]
  hiddenColumns: string[]
}

interface TableSettings {
  [doctypeKey: string]: ColumnSettings
}

const defaultColumnSettings: ColumnSettings = {
  visibleColumns: [],
  columnOrder: [],
  hiddenColumns: []
}

export const useTableSettingsStore = defineStore('tableSettings', () => {
  // State
  const settings = ref<TableSettings>({})

  // Getters
  const getTableColumnSettings = (doctypeKey: string) => {
    return computed(() => {
      return settings.value[doctypeKey] || { ...defaultColumnSettings }
    })
  }

  const hasTableSettings = (doctypeKey: string) => {
    return computed(() => !!settings.value[doctypeKey])
  }

  const getAllTableSettings = computed(() => settings.value)

  // Actions
  const setTableColumnSettings = (
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
    setTableColumnSettings(doctypeKey, { visibleColumns })
  }

  const updateColumnOrder = (doctypeKey: string, columnOrder: string[]) => {
    setTableColumnSettings(doctypeKey, { columnOrder })
  }

  const updateHiddenColumns = (doctypeKey: string, hiddenColumns: string[]) => {
    setTableColumnSettings(doctypeKey, { hiddenColumns })
  }

  const resetTableSettings = (doctypeKey?: string) => {
    if (doctypeKey) {
      delete settings.value[doctypeKey]
    } else {
      settings.value = {}
    }
  }

  const importTableSettings = (importedSettings: TableSettings): boolean => {
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
      console.error('Failed to import table settings:', error)
      return false
    }
  }

  const exportTableSettings = () => {
    return JSON.stringify(settings.value, null, 2)
  }

  return {
    // State
    settings: getAllTableSettings,

    // Getters
    getTableColumnSettings,
    hasTableSettings,

    // Actions
    setTableColumnSettings,
    updateVisibleColumns,
    updateColumnOrder,
    updateHiddenColumns,
    resetTableSettings,
    importTableSettings,
    exportTableSettings
  }
}, {
  persist: {
    key: 'eam_table_settings'
  }
}) 