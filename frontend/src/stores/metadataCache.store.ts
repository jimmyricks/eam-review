import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FormField, DocTypeLink, DocTypeAction } from '@/types/metadata'

interface CachedMetadata {
  fields: FormField[]
  linkedTabs: DocTypeLink[]
  documentActions: DocTypeAction[]
  permissions: any | null
  hasWorkflow: boolean
  maxAttachments: number
  linkOptionsLoaded: boolean
  lastAccessed: number
  expiresAt: number
}

export const useMetadataCacheStore = defineStore('metadataCache', () => {
  // Core cache state
  const cache = ref<Record<string, CachedMetadata>>({})

  // Configuration
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  const MAX_CACHE_SIZE = 50

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
      linkedTabs: DocTypeLink[]
      documentActions: DocTypeAction[]
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

  // Computed properties
  const cacheEntries = computed(() => Object.entries(cache.value))
  const validEntries = computed(() => {
    const now = Date.now()
    return cacheEntries.value.filter(([, meta]) => now < meta.expiresAt)
  })

  const getCacheSize = computed(() => Object.keys(cache.value).length)
  const getValidCacheSize = computed(() => validEntries.value.length)
  const getExpiredCacheSize = computed(() => getCacheSize.value - getValidCacheSize.value)

  // Cleanup interval for expired entries (runs every minute)
  if (typeof window !== 'undefined') {
    setInterval(cleanupExpiredEntries, 60000)
  }

  return {
    // State
    cache: computed(() => cache.value),
    
    // Computed
    getCacheSize,
    getValidCacheSize,
    getExpiredCacheSize,
    
    // Core operations
    isCacheValid,
    getCachedMetadata,
    setCachedMetadata,
    updateLinkOptions,
    
    // Cache management
    clearCache,
    cleanupExpiredEntries,
    
    // Constants
    CACHE_DURATION,
    MAX_CACHE_SIZE
  }
}, {
  persist: {
    key: 'eam_metadata_cache',
    paths: ['cache']
  }
}) 