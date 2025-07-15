import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useStorage, useDebounceFn } from '@vueuse/core'

interface AppSettings {
  theme: {
    isDarkMode: boolean
  }
  tables: {
    [doctypeKey: string]: {
      visibleColumns: string[]
      columnOrder: string[]
      hiddenColumns: string[]
    }
  }
  listPages: {
    [doctypeKey: string]: {
      visibleColumns: string[]
      columnOrder: string[]
      hiddenColumns: string[]
    }
  }
}

const defaultSettings: AppSettings = {
  theme: {
    isDarkMode: false
  },
  tables: {},
  listPages: {}
}

// Use the same storage key as the composable for consistency
const SETTINGS_STORAGE_KEY = 'eam_app_settings'

export const useSettingsStore = defineStore('settings', () => {
  // Core settings state - use VueUse's useStorage for reactive localStorage management
  const settings = useStorage<AppSettings>(SETTINGS_STORAGE_KEY, defaultSettings)
  
  // Initialize with defaults if no stored settings
  if (!settings.value.theme) {
    settings.value.theme = defaultSettings.theme
  }
  if (!settings.value.tables) {
    settings.value.tables = defaultSettings.tables
  }
  if (!settings.value.listPages) {
    settings.value.listPages = defaultSettings.listPages
  }

  // Computed properties
  const isDarkMode = computed({
    get: () => settings.value.theme.isDarkMode,
    set: (value: boolean) => {
      settings.value.theme.isDarkMode = value
    }
  })

  // Theme actions
  const toggleDarkMode = () => {
    settings.value.theme.isDarkMode = !settings.value.theme.isDarkMode
  }

  // Table column settings
  const getTableColumnSettings = (doctypeKey: string) => {
    return computed(() => {
      return settings.value.tables[doctypeKey] || {
        visibleColumns: [],
        columnOrder: [],
        hiddenColumns: []
      }
    })
  }

  const setTableColumnSettings = (
    doctypeKey: string,
    columnSettings: {
      visibleColumns: string[]
      columnOrder?: string[]
      hiddenColumns?: string[]
    }
  ) => {
    if (!settings.value.tables[doctypeKey]) {
      settings.value.tables[doctypeKey] = {
        visibleColumns: [],
        columnOrder: [],
        hiddenColumns: []
      }
    }

    settings.value.tables[doctypeKey].visibleColumns = columnSettings.visibleColumns
    if (columnSettings.columnOrder) {
      settings.value.tables[doctypeKey].columnOrder = columnSettings.columnOrder
    }
    if (columnSettings.hiddenColumns) {
      settings.value.tables[doctypeKey].hiddenColumns = columnSettings.hiddenColumns
    }
  }

  // List page column settings
  const getListPageColumnSettings = (doctypeKey: string) => {
    return computed(() => {
      return settings.value.listPages[doctypeKey] || {
        visibleColumns: [],
        columnOrder: [],
        hiddenColumns: []
      }
    })
  }

  const setListPageColumnSettings = (
    doctypeKey: string,
    columnSettings: {
      visibleColumns: string[]
      columnOrder?: string[]
      hiddenColumns?: string[]
    }
  ) => {
    if (!settings.value.listPages[doctypeKey]) {
      settings.value.listPages[doctypeKey] = {
        visibleColumns: [],
        columnOrder: [],
        hiddenColumns: []
      }
    }

    settings.value.listPages[doctypeKey].visibleColumns = columnSettings.visibleColumns
    if (columnSettings.columnOrder) {
      settings.value.listPages[doctypeKey].columnOrder = columnSettings.columnOrder
    }
    if (columnSettings.hiddenColumns) {
      settings.value.listPages[doctypeKey].hiddenColumns = columnSettings.hiddenColumns
    }
  }

  // Reset functions
  const resetSettings = () => {
    settings.value = { ...defaultSettings }
  }

  const resetThemeSettings = () => {
    settings.value.theme = { ...defaultSettings.theme }
  }

  const resetTableSettings = (doctypeKey?: string) => {
    if (doctypeKey) {
      delete settings.value.tables[doctypeKey]
    } else {
      settings.value.tables = {}
    }
  }

  const resetListPageSettings = (doctypeKey?: string) => {
    if (doctypeKey) {
      delete settings.value.listPages[doctypeKey]
    } else {
      settings.value.listPages = {}
    }
  }

  // Import/Export
  const exportSettings = () => {
    return JSON.stringify(settings.value, null, 2)
  }

  const importSettings = (settingsJson: string): boolean => {
    try {
      const imported = JSON.parse(settingsJson)
      
      // Validate the imported settings structure
      if (typeof imported !== 'object' || imported === null) {
        return false
      }
      
      settings.value = {
        theme: { ...defaultSettings.theme, ...(imported.theme || {}) },
        tables: { ...defaultSettings.tables, ...(imported.tables || {}) },
        listPages: { ...defaultSettings.listPages, ...(imported.listPages || {}) }
      }
      
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }

  return {
    // State
    settings: computed(() => settings.value),
    isDarkMode,

    // Theme actions
    toggleDarkMode,

    // Table settings
    getTableColumnSettings,
    setTableColumnSettings,

    // List page settings
    getListPageColumnSettings,
    setListPageColumnSettings,

    // Reset functions
    resetSettings,
    resetThemeSettings,
    resetTableSettings,
    resetListPageSettings,

    // Import/Export
    exportSettings,
    importSettings
  }
}) 