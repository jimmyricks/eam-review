import { useSettingsStore } from '@/stores/settings'
import { useThemeStore, useTableSettingsStore, useListSettingsStore } from '@/stores'

/**
 * Migration helper for transitioning from old monolithic settings store 
 * to new focused stores. This will help components migrate gradually.
 */
export const useStoreMigration = () => {
  const legacySettings = useSettingsStore()
  const themeStore = useThemeStore()
  const tableSettings = useTableSettingsStore()
  const listSettings = useListSettingsStore()

  /**
   * Migrate legacy theme settings to new theme store
   */
  const migrateThemeSettings = () => {
    try {
      const legacyTheme = legacySettings.settings.theme
      if (legacyTheme && typeof legacyTheme.isDarkMode === 'boolean') {
        themeStore.setDarkMode(legacyTheme.isDarkMode)
        console.log('✅ Migrated theme settings to new store')
      }
    } catch (error) {
      console.warn('Failed to migrate theme settings:', error)
    }
  }

  /**
   * Migrate legacy table settings to new table settings store
   */
  const migrateTableSettings = () => {
    try {
      const legacyTables = legacySettings.settings.tables
      if (legacyTables && typeof legacyTables === 'object') {
        Object.entries(legacyTables).forEach(([doctype, settings]) => {
          if (settings && typeof settings === 'object') {
            tableSettings.setTableColumnSettings(doctype, settings)
          }
        })
        console.log('✅ Migrated table settings to new store')
      }
    } catch (error) {
      console.warn('Failed to migrate table settings:', error)
    }
  }

  /**
   * Migrate legacy list page settings to new list settings store
   */
  const migrateListSettings = () => {
    try {
      const legacyListPages = legacySettings.settings.listPages
      if (legacyListPages && typeof legacyListPages === 'object') {
        Object.entries(legacyListPages).forEach(([doctype, settings]) => {
          if (settings && typeof settings === 'object') {
            listSettings.setListPageColumnSettings(doctype, settings)
          }
        })
        console.log('✅ Migrated list page settings to new store')
      }
    } catch (error) {
      console.warn('Failed to migrate list page settings:', error)
    }
  }

  /**
   * Run all migrations
   */
  const migrateAllSettings = () => {
    console.log('🔄 Starting store migration...')
    migrateThemeSettings()
    migrateTableSettings()
    migrateListSettings()
    console.log('✅ Store migration completed')
  }

  /**
   * Check if migration is needed
   */
  const needsMigration = () => {
    try {
      const settings = legacySettings.settings
      return !!(
        settings.theme?.isDarkMode !== undefined ||
        Object.keys(settings.tables || {}).length > 0 ||
        Object.keys(settings.listPages || {}).length > 0
      )
    } catch {
      return false
    }
  }

  /**
   * Compatibility layer - provides the old API while using new stores
   */
  const compatibilityLayer = {
    // Theme compatibility
    get isDarkMode() {
      return themeStore.isDarkMode
    },
    set isDarkMode(value: boolean) {
      themeStore.setDarkMode(value)
    },
    toggleDarkMode: () => themeStore.toggleDarkMode(),

    // Table settings compatibility
    getTableColumnSettings: (doctype: string) => tableSettings.getTableColumnSettings(doctype),
    setTableColumnSettings: (doctype: string, settings: any) => 
      tableSettings.setTableColumnSettings(doctype, settings),

    // List settings compatibility
    getListPageColumnSettings: (doctype: string) => listSettings.getListPageColumnSettings(doctype),
    setListPageColumnSettings: (doctype: string, settings: any) => 
      listSettings.setListPageColumnSettings(doctype, settings),

    // Reset functions
    resetSettings: () => {
      themeStore.resetTheme()
      tableSettings.resetTableSettings()
      listSettings.resetListPageSettings()
    }
  }

  return {
    // Migration functions
    migrateThemeSettings,
    migrateTableSettings,
    migrateListSettings,
    migrateAllSettings,
    needsMigration,

    // Compatibility layer
    compatibilityLayer,

    // Direct store access
    stores: {
      theme: themeStore,
      table: tableSettings,
      list: listSettings,
      legacy: legacySettings
    }
  }
} 