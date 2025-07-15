import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'

interface PreloadState {
  isPreloading: boolean
  preloadedDoctypes: Set<string>
  preloadErrors: Record<string, string>
}

export const useMetadataStatsStore = defineStore('metadataStats', () => {
  // Preload state
  const preloadState = ref<PreloadState>({
    isPreloading: false,
    preloadedDoctypes: new Set(),
    preloadErrors: {}
  })

  // Common doctypes that should be preloaded
  const COMMON_DOCTYPES = [
    'Asset',
    'Asset Class', 
    'Work Order',
    'Item',
    'Inventory',
    'Location',
    'Position'
  ]

  // Computed properties
  const isPreloading = computed(() => preloadState.value.isPreloading)
  const preloadedCount = computed(() => preloadState.value.preloadedDoctypes.size)
  const preloadErrorCount = computed(() => Object.keys(preloadState.value.preloadErrors).length)

  // Statistics
  const getPreloadStats = computed(() => ({
    isPreloading: isPreloading.value,
    preloadedCount: preloadedCount.value,
    preloadErrors: preloadErrorCount.value,
    commonDoctypes: COMMON_DOCTYPES.length,
    preloadedDoctypes: Array.from(preloadState.value.preloadedDoctypes),
    errorDoctypes: Object.keys(preloadState.value.preloadErrors)
  }))

  // Preload operations
  const preloadDoctype = async (
    doctype: string,
    loadMetadataFn: (doctype: string) => Promise<any>
  ): Promise<boolean> => {
    try {
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

  // Debounced batch preloading to avoid overwhelming server
  const preloadDoctypes = useDebounceFn(async (
    doctypes: string[],
    loadMetadataFn: (doctype: string) => Promise<any>
  ) => {
    preloadState.value.isPreloading = true

    try {
      // Filter out already preloaded doctypes
      const uncachedDoctypes = doctypes.filter(doctype => 
        !preloadState.value.preloadedDoctypes.has(doctype)
      )
      
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
  }, 300)

  const preloadCommonDoctypes = async (loadMetadataFn: (doctype: string) => Promise<any>) => {
    await preloadDoctypes(COMMON_DOCTYPES, loadMetadataFn)
  }

  // Utilities
  const isPreloaded = (doctype: string): boolean => {
    return preloadState.value.preloadedDoctypes.has(doctype)
  }

  const hasPreloadError = (doctype: string): boolean => {
    return doctype in preloadState.value.preloadErrors
  }

  const getPreloadError = (doctype: string): string | undefined => {
    return preloadState.value.preloadErrors[doctype]
  }

  const clearPreloadErrors = (doctype?: string) => {
    if (doctype) {
      delete preloadState.value.preloadErrors[doctype]
    } else {
      preloadState.value.preloadErrors = {}
    }
  }

  const resetPreloadState = () => {
    preloadState.value = {
      isPreloading: false,
      preloadedDoctypes: new Set(),
      preloadErrors: {}
    }
  }

  return {
    // State
    preloadState,
    
    // Computed
    isPreloading,
    preloadedCount,
    preloadErrorCount,
    getPreloadStats,
    
    // Preload operations
    preloadDoctype,
    preloadDoctypes,
    preloadCommonDoctypes,
    
    // Utilities
    isPreloaded,
    hasPreloadError,
    getPreloadError,
    clearPreloadErrors,
    resetPreloadState,
    
    // Constants
    COMMON_DOCTYPES
  }
}, {
  persist: {
    key: 'eam_metadata_stats',
    paths: ['preloadState']
  }
}) 