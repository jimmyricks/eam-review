import { ref, watch, computed, reactive } from 'vue'

// Define the settings interface
export interface AppSettings {
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

// Default settings
const defaultSettings: AppSettings = {
  theme: {
    isDarkMode: false,
  },
  tables: {},
  listPages: {},
}

// Storage key
const SETTINGS_STORAGE_KEY = 'eam_app_settings'

// Global settings state - use reactive for proper nested reactivity
const settings = reactive<AppSettings>({ ...defaultSettings })

// Cache for computed settings to avoid unnecessary recalculations
const settingsCache = new Map<string, any>()

// Load settings from localStorage
function loadSettings(): AppSettings {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to ensure all properties exist
        return {
          theme: { ...defaultSettings.theme, ...parsed.theme },
          tables: { ...defaultSettings.tables, ...parsed.tables },
          listPages: { ...defaultSettings.listPages, ...parsed.listPages },
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error)
  }
  return { ...defaultSettings }
}

// Save settings to localStorage with debouncing for performance
let saveTimeout: ReturnType<typeof setTimeout> | null = null
function saveSettings(newSettings: AppSettings) {
  // Clear previous timeout to debounce rapid changes
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  saveTimeout = setTimeout(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings))
        // Clear cache when settings are saved
        settingsCache.clear()
      }
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
    }
    saveTimeout = null
  }, 100) // 100ms debounce
}

// Initialize settings
Object.assign(settings, loadSettings())

// Watch for changes and save automatically
watch(
  settings,
  (newSettings) => {
    saveSettings(newSettings)
  },
  { deep: true },
)

export function useSettings() {
  // Theme settings
  const isDarkMode = computed({
    get: () => settings.theme.isDarkMode,
    set: (value: boolean) => {
      settings.theme.isDarkMode = value
    },
  })

  const toggleDarkMode = () => {
    settings.theme.isDarkMode = !settings.theme.isDarkMode
  }

  // Table column settings with caching
  const getTableColumnSettings = (doctypeKey: string) => {
    const cacheKey = `table_${doctypeKey}`

    return computed(() => {
      if (settingsCache.has(cacheKey)) {
        return settingsCache.get(cacheKey)
      }

      const result = settings.tables[doctypeKey] || {
        visibleColumns: [],
        columnOrder: [],
        hiddenColumns: [],
      }

      settingsCache.set(cacheKey, result)
      return result
    })
  }

  const setTableColumnSettings = (
    doctypeKey: string,
    columnSettings: {
      visibleColumns: string[]
      columnOrder?: string[]
      hiddenColumns?: string[]
    },
  ) => {
    if (!settings.tables[doctypeKey]) {
      settings.tables[doctypeKey] = {
        visibleColumns: [],
        columnOrder: [],
        hiddenColumns: [],
      }
    }

    settings.tables[doctypeKey].visibleColumns = columnSettings.visibleColumns
    if (columnSettings.columnOrder) {
      settings.tables[doctypeKey].columnOrder = columnSettings.columnOrder
    }
    if (columnSettings.hiddenColumns) {
      settings.tables[doctypeKey].hiddenColumns = columnSettings.hiddenColumns
    }

    // Invalidate cache for this doctype
    settingsCache.delete(`table_${doctypeKey}`)
  }

  // List page column settings with caching
  const getListPageColumnSettings = (doctypeKey: string) => {
    const cacheKey = `listPage_${doctypeKey}`

    return computed(() => {
      if (settingsCache.has(cacheKey)) {
        return settingsCache.get(cacheKey)
      }

      const result = settings.listPages[doctypeKey] || {
        visibleColumns: [],
        columnOrder: [],
        hiddenColumns: [],
      }

      settingsCache.set(cacheKey, result)
      return result
    })
  }

  const setListPageColumnSettings = (
    doctypeKey: string,
    columnSettings: {
      visibleColumns: string[]
      columnOrder?: string[]
      hiddenColumns?: string[]
    },
  ) => {
    if (!settings.listPages[doctypeKey]) {
      settings.listPages[doctypeKey] = {
        visibleColumns: [],
        columnOrder: [],
        hiddenColumns: [],
      }
    }

    settings.listPages[doctypeKey].visibleColumns =
      columnSettings.visibleColumns
    if (columnSettings.columnOrder) {
      settings.listPages[doctypeKey].columnOrder = columnSettings.columnOrder
    }
    if (columnSettings.hiddenColumns) {
      settings.listPages[doctypeKey].hiddenColumns =
        columnSettings.hiddenColumns
    }

    // Invalidate cache for this doctype
    settingsCache.delete(`listPage_${doctypeKey}`)
  }

  // Reset settings
  const resetSettings = () => {
    Object.assign(settings, { ...defaultSettings })
    settingsCache.clear()
  }

  const resetThemeSettings = () => {
    Object.assign(settings.theme, { ...defaultSettings.theme })
  }

  const resetTableSettings = (doctypeKey?: string) => {
    if (doctypeKey) {
      delete settings.tables[doctypeKey]
      settingsCache.delete(`table_${doctypeKey}`)
    } else {
      settings.tables = {}
      // Clear all table-related cache entries
      for (const key of settingsCache.keys()) {
        if (key.startsWith('table_')) {
          settingsCache.delete(key)
        }
      }
    }
  }

  const resetListPageSettings = (doctypeKey?: string) => {
    if (doctypeKey) {
      delete settings.listPages[doctypeKey]
      settingsCache.delete(`listPage_${doctypeKey}`)
    } else {
      settings.listPages = {}
      // Clear all listPage-related cache entries
      for (const key of settingsCache.keys()) {
        if (key.startsWith('listPage_')) {
          settingsCache.delete(key)
        }
      }
    }
  }

  // Export/Import settings
  const exportSettings = () => {
    return JSON.stringify(settings, null, 2)
  }

  const importSettings = (settingsJson: string) => {
    try {
      const imported = JSON.parse(settingsJson)
      const newSettings = {
        theme: { ...defaultSettings.theme, ...imported.theme },
        tables: { ...defaultSettings.tables, ...imported.tables },
        listPages: { ...defaultSettings.listPages, ...imported.listPages },
      }
      Object.assign(settings, newSettings)
      settingsCache.clear()
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }

  return {
    // Settings state
    settings,

    // Theme
    isDarkMode,
    toggleDarkMode,

    // Table columns
    getTableColumnSettings,
    setTableColumnSettings,

    // List page columns
    getListPageColumnSettings,
    setListPageColumnSettings,

    // Reset functions
    resetSettings,
    resetThemeSettings,
    resetTableSettings,
    resetListPageSettings,

    // Import/Export
    exportSettings,
    importSettings,
  }
}
