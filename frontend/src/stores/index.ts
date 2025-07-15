// Core stores
export { useAuthStore } from './auth.store'

// Theme and UI stores
export { useThemeStore } from './theme.store'
export { useTableSettingsStore } from './tableSettings.store'
export { useListSettingsStore } from './listSettings.store'

// Metadata stores
export { useMetadataCacheStore } from './metadataCache.store'
export { useMetadataStatsStore } from './metadataStats.store'

// Domain stores
export { useAssetStore, useAssetClassStore, useAssetPropertyStore } from './asset-management/AssetStore'

// User settings
export { useUserSettingsStore } from './userSettings'

// Base store factory
export { createBaseStore } from './base/BaseStore'

// Legacy stores (will be phased out)
export { useSettingsStore } from './settings' // Deprecated: Use useThemeStore, useTableSettingsStore, useListSettingsStore instead
export { useMetadataStore } from './metadata' // Deprecated: Use useMetadataCacheStore, useMetadataStatsStore instead 