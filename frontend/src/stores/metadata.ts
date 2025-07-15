import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import type { FormField, DocTypeLink as LinkedTab, DocTypeAction as DocumentAction } from '@/types/metadata'

interface CachedMetadata {
  fields: FormField[]
  linkedTabs: LinkedTab[]
  documentActions: DocumentAction[]
  permissions: any | null
  hasWorkflow: boolean
  maxAttachments: number
  linkOptionsLoaded: boolean
  lastAccessed: number
  expiresAt: number
}

interface PreloadState {
  isPreloading: boolean
  preloadedDoctypes: Set<string>
  preloadErrors: Record<string, string>
}

export const useMetadataStore = defineStore('metadata', () => {
  // Core cache state
  const cache = ref<Record<string, CachedMetadata>>({})
  
  // Preload state
  const preloadState = ref<PreloadState>({
    isPreloading: false,
    preloadedDoctypes: new Set(),
    preloadErrors: {}
  })

  // Configuration
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  const MAX_CACHE_SIZE = 50
  const COMMON_DOCTYPES = [
    'Asset',
    'Asset Class', 
    'Work Order',
    'Item',
    'Inventory',
    'Location',
    'Position'
  ]

  // Use VueUse's useStorage for reactive localStorage management of permissions
  const storedPermissions = useStorage('doctype_permissions', {} as Record<string, any>)

  // Computed
  const cacheStats = computed(() => {
    const now = Date.now()
    const entries = Object.entries(cache.value)
    const validEntries = entries.filter(([, meta]) => now < meta.expiresAt)
    
    return {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      expiredEntries: entries.length - validEntries.length,
      cacheSize: MAX_CACHE_SIZE,
      cacheDuration: CACHE_DURATION,
      preloadedCount: preloadState.value.preloadedDoctypes.size,
      preloadErrors: Object.keys(preloadState.value.preloadErrors).length,
      isPreloading: preloadState.value.isPreloading
    }
  })

  // Core cache operations
  const isCacheValid = (doctype: string): boolean => {
    const cached = cache.value[doctype]
    if (!cached) return false
    return Date.now() < cached.expiresAt
  }

  const getCachedMetadata = (doctype: string): CachedMetadata | null => {
    if (!isCacheValid(doctype)) return null
    
    // Update last accessed time for LRU
    const cached = cache.value[doctype]
    cached.lastAccessed = Date.now()
    return cached
  }

  const setCachedMetadata = (
    doctype: string,
    metadata: {
      fields: FormField[]
      linkedTabs: LinkedTab[]
      documentActions: DocumentAction[]
      permissions: any | null
      hasWorkflow: boolean
      maxAttachments: number
      linkOptionsLoaded?: boolean
    }
  ) => {
    // Clean up old entries if at limit
    const entries = Object.entries(cache.value)
    if (entries.length >= MAX_CACHE_SIZE) {
      // Remove least recently used entries
      const sortedEntries = entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
      const toRemove = sortedEntries.slice(0, entries.length - MAX_CACHE_SIZE + 1)
      toRemove.forEach(([key]) => delete cache.value[key])
    }

    const now = Date.now()
    cache.value[doctype] = {
      ...metadata,
      linkOptionsLoaded: metadata.linkOptionsLoaded || false,
      lastAccessed: now,
      expiresAt: now + CACHE_DURATION
    }

    // Persist permissions to storage for quick access across sessions
    try {
      if (metadata.permissions) {
        storedPermissions.value[doctype] = metadata.permissions
      }
    } catch (err) {
      console.warn('Failed to save permissions to storage:', err)
    }
  }

  const updateLinkOptions = (doctype: string, fields: FormField[]) => {
    const cached = cache.value[doctype]
    if (cached) {
      cached.fields = fields
      cached.linkOptionsLoaded = true
      cached.lastAccessed = Date.now()
    }
  }

  // Cache management
  const clearCache = (doctype?: string) => {
    if (doctype) {
      delete cache.value[doctype]
    } else {
      cache.value = {}
      preloadState.value.preloadedDoctypes.clear()
      preloadState.value.preloadErrors = {}
    }
  }

  const cleanupExpiredEntries = () => {
    const now = Date.now()
    Object.keys(cache.value).forEach(doctype => {
      if (cache.value[doctype].expiresAt < now) {
        delete cache.value[doctype]
      }
    })
  }

  // Preload operations
  const preloadDoctype = async (
    doctype: string,
    loadMetadataFn: (doctype: string) => Promise<any>
  ): Promise<boolean> => {
    try {
      if (isCacheValid(doctype)) {
        preloadState.value.preloadedDoctypes.add(doctype)
        return true
      }

      await loadMetadataFn(doctype)
      preloadState.value.preloadedDoctypes.add(doctype)
      delete preloadState.value.preloadErrors[doctype]
      return true
    } catch (error) {
      console.warn(`Failed to preload metadata for ${doctype}:`, error)
      preloadState.value.preloadErrors[doctype] = 
        error instanceof Error ? error.message : 'Unknown error'
      return false
    }
  }

  const preloadDoctypes = async (
    doctypes: string[],
    loadMetadataFn: (doctype: string) => Promise<any>
  ) => {
    preloadState.value.isPreloading = true

    try {
      const uncachedDoctypes = doctypes.filter(doctype => !isCacheValid(doctype))
      
      if (uncachedDoctypes.length === 0) return

      // Process in small batches to avoid overwhelming server
      const BATCH_SIZE = 3
      for (let i = 0; i < uncachedDoctypes.length; i += BATCH_SIZE) {
        const batch = uncachedDoctypes.slice(i, i + BATCH_SIZE)
        const promises = batch.map(doctype => preloadDoctype(doctype, loadMetadataFn))
        await Promise.allSettled(promises)

        // Small delay between batches
        if (i + BATCH_SIZE < uncachedDoctypes.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    } finally {
      preloadState.value.isPreloading = false
    }
  }

  const preloadCommonDoctypes = async (loadMetadataFn: (doctype: string) => Promise<any>) => {
    await preloadDoctypes(COMMON_DOCTYPES, loadMetadataFn)
  }

  // Utilities
  const isPreloaded = (doctype: string): boolean => {
    return preloadState.value.preloadedDoctypes.has(doctype) || isCacheValid(doctype)
  }

  // Cleanup interval for expired entries
  setInterval(cleanupExpiredEntries, 60000) // Every minute

  return {
    // State
    cache: computed(() => cache.value),
    cacheStats,
    isPreloading: computed(() => preloadState.value.isPreloading),
    
    // Core operations
    isCacheValid,
    getCachedMetadata,
    setCachedMetadata,
    updateLinkOptions,
    
    // Cache management
    clearCache,
    cleanupExpiredEntries,
    
    // Preload operations
    preloadDoctype,
    preloadDoctypes,
    preloadCommonDoctypes,
    isPreloaded,
    
    // Constants
    CACHE_DURATION,
    MAX_CACHE_SIZE,
    COMMON_DOCTYPES
  }
}) 