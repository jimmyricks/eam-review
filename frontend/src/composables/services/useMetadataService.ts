import { ref, reactive, readonly } from 'vue'
import { frappeCall } from '@/composables/useFrappeSDK'
import type { WorkflowDoc, DoctypeMetadata, LinkedTab, DocumentAction, FormField, DocTypeAction, DocTypeLink, DocPerm } from '@/types/metadata'
import type { CachedMetadata, MetadataCache, Doctype } from '@/types/Forms'
import { apiCache } from './useApiCache'

/**
 * Metadata Service
 * Combines metadata operations with caching functionality
 * Migrates logic from useMetadata.ts, useMetadataCache.ts, useMetadataPreloader.ts
 * Now includes API caching for improved performance
 */
export const useMetadataService = () => {
  // Internal cache - shared across all instances
  const metadataCache = reactive<MetadataCache>({})
  
  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
  const MAX_CACHE_SIZE = 50 // Maximum number of doctypes to cache
  
  // Preloading state
  const isPreloading = ref(false)
  const preloadedDoctypes = ref<Set<string>>(new Set())
  const preloadErrors = ref<Record<string, string>>({})

  // Common doctypes that should be preloaded
  const COMMON_DOCTYPES = [
    'Asset',
    'Asset Class',
    'Work Order',
    'Item',
    'Inventory',
    'Location',
    'Position',
  ]

  /**
   * Check if cached metadata is still valid
   * @param doctype - The document type
   * @returns Boolean indicating if cache is valid
   */
  const isCacheValid = (doctype: string): boolean => {
    const cached = metadataCache[doctype]
    if (!cached) return false
    return true
  }

  /**
   * Get metadata from cache if valid
   * @param doctype - The document type
   * @returns Cached metadata or null if not valid
   */
  const getCachedMetadata = (doctype: string): CachedMetadata | null => {
    if (!isCacheValid(doctype)) {
      return null
    }
    return metadataCache[doctype]
  }

  /**
   * Set metadata in cache
   * @param doctype - The document type
   * @param metadata - Metadata to cache
   */
  const setCachedMetadata = (doctype: string, metadata: Partial<CachedMetadata>) => {
    // Clean up old cache entries if we're at the limit
    const cacheKeys = Object.keys(metadataCache)
    if (cacheKeys.length >= MAX_CACHE_SIZE) {
      // Remove oldest entries (simple LRU-like behavior)
      const sortedKeys = cacheKeys.sort(
        (a, b) => metadataCache[a].timestamp - metadataCache[b].timestamp,
      )
      const keysToRemove = sortedKeys.slice(
        0,
        cacheKeys.length - MAX_CACHE_SIZE + 1,
      )
      keysToRemove.forEach((key) => delete metadataCache[key])
    }

    // Set default values for missing properties
    metadataCache[doctype] = {
      rawMetadata: null as any,
      fields: [],
      linkedTabs: [],
      documentActions: [],
      hasWorkflow: false,
      maxAttachments: 10,
      linkOptionsLoaded: false,
      timestamp: Date.now(),
      ...metadata,
    }
  }

  /**
   * Get metadata for a doctype
   * Checks cache first, then fetches from API if needed
   * Now uses API caching for improved performance
   * @param doctype - The document type
   * @returns Raw metadata
   */
  const getMetadata = async (doctype: string): Promise<DoctypeMetadata> => {
    try {

      // Check cache first
      const cachedMetadata = getCachedMetadata(doctype)
      if (cachedMetadata) {
        return cachedMetadata.rawMetadata
      }

      // Use cached API call with 5-minute TTL for metadata
      const response = await apiCache.cachedApiCall(
        () => frappeCall.get('frappe.desk.form.load.getdoctype', {
          doctype: doctype,
          with_parent: 1,
        }),
        'frappe.desk.form.load.getdoctype',
        { doctype, with_parent: 1 },
        5 * 60 * 1000 // 5 minutes TTL
      )

      if (!response?.docs || !response.docs.length) {
        throw new Error(`Failed to load metadata for ${doctype}`)
      }

      const rawMetadata = response.docs[0] as DoctypeMetadata

      // Cache the metadata
      setCachedMetadata(doctype, {
        rawMetadata,
        timestamp: Date.now(),
      })

      return rawMetadata
    } catch (error) {
      console.error(`Error getting metadata for ${doctype}:`, error)
      throw error
    }
  }

  /**
   * Refresh metadata for a doctype
   * Clears both internal cache and API cache
   * @param doctype - The document type
   * @returns Fresh metadata
   */
  const refreshMetadata = async (doctype: string): Promise<DoctypeMetadata> => {
    try {
      // Clear internal cache
      delete metadataCache[doctype]
      
      // Clear API cache for this doctype
      apiCache.clearEndpoint('frappe.desk.form.load.getdoctype')
      
      // Fetch fresh metadata
      return await getMetadata(doctype)
    } catch (error) {
      console.error(`Error refreshing metadata for ${doctype}:`, error)
      throw error
    }
  }

  /**
   * Preload metadata for common doctypes
   * @returns Promise that resolves when preloading is complete
   */
  const preloadCommonDoctypes = async (): Promise<void> => {
    if (isPreloading.value) {
      return
    }

    isPreloading.value = true
    preloadErrors.value = {}

    try {
      const promises = COMMON_DOCTYPES.map(async (doctype) => {
        try {
          await getMetadata(doctype)
          preloadedDoctypes.value.add(doctype)
        } catch (error) {
          console.error(`Failed to preload metadata for ${doctype}:`, error)
          preloadErrors.value[doctype] = error instanceof Error ? error.message : 'Unknown error'
        }
      })

      await Promise.allSettled(promises)
    } finally {
      isPreloading.value = false
    }
  }

  /**
   * Preload metadata for specific doctypes
   * @param doctypes - Array of doctypes to preload
   * @returns Promise that resolves when preloading is complete
   */
  const preloadMetadata = async (doctypes: string[]): Promise<void> => {
    if (isPreloading.value) {
      return
    }

    isPreloading.value = true
    preloadErrors.value = {}

    try {
      const promises = doctypes.map(async (doctype) => {
        try {
          await getMetadata(doctype)
          preloadedDoctypes.value.add(doctype)
        } catch (error) {
          console.error(`Failed to preload metadata for ${doctype}:`, error)
          preloadErrors.value[doctype] = error instanceof Error ? error.message : 'Unknown error'
        }
      })

      await Promise.allSettled(promises)
    } finally {
      isPreloading.value = false
    }
  }

  /**
   * Clear all metadata cache
   * @returns Promise that resolves when cache is cleared
   */
  const clearCache = async (): Promise<void> => {
    // Clear internal cache
    Object.keys(metadataCache).forEach((key) => {
      delete metadataCache[key]
    })

    // Clear API cache for metadata endpoint
    apiCache.clearEndpoint('frappe.desk.form.load.getdoctype')

    // Reset preloading state
    preloadedDoctypes.value.clear()
    preloadErrors.value = {}
  }

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  const getCacheStats = () => {
    const apiStats = apiCache.getStats()
    
    return {
      internalCacheSize: Object.keys(metadataCache).length,
      maxInternalCacheSize: MAX_CACHE_SIZE,
      preloadedCount: preloadedDoctypes.value.size,
      isPreloading: isPreloading.value,
      preloadErrors: Object.keys(preloadErrors.value).length,
      apiCacheStats: apiStats,
    }
  }

  return {
    getMetadata,
    refreshMetadata,
    preloadMetadata,
    preloadCommonDoctypes,
    clearCache,
    getCacheStats,
    
    // Readonly state for components
    isPreloading: readonly(isPreloading),
    preloadedDoctypes: readonly(preloadedDoctypes),
    preloadErrors: readonly(preloadErrors),
  }
} 