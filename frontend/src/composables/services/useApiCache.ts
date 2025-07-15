import { ref, reactive } from 'vue'

/**
 * API Cache Service
 * Provides centralized caching for all API responses with configurable TTL and memory management
 * 
 * Features:
 * - Configurable cache duration per endpoint
 * - Automatic cache invalidation
 * - Memory management with LRU eviction
 * - Cache statistics and debugging
 * - Selective cache clearing
 */
export const useApiCache = () => {
  // Cache storage
  const cache = reactive(new Map<string, CacheEntry>())
  
  // Cache configuration
  const config = reactive({
    defaultTTL: 5 * 60 * 1000, // 5 minutes default
    maxSize: 100, // Maximum number of cached entries
    enableDebug: false, // Enable debug logging
  })

  // Cache statistics
  const stats = reactive({
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
  })

  /**
   * Cache entry interface
   */
  interface CacheEntry {
    data: any
    timestamp: number
    ttl: number
    key: string
    endpoint: string
  }

  /**
   * Generate cache key from endpoint and parameters
   */
  const generateKey = (endpoint: string, params?: any): string => {
    const paramString = params ? JSON.stringify(params) : ''
    return `${endpoint}:${paramString}`
  }

  /**
   * Check if cache entry is still valid
   */
  const isEntryValid = (entry: CacheEntry): boolean => {
    const now = Date.now()
    return (now - entry.timestamp) < entry.ttl
  }

  /**
   * Get cached response if valid
   */
  const get = (endpoint: string, params?: any): any | null => {
    const key = generateKey(endpoint, params)
    const entry = cache.get(key)

    if (!entry) {
      stats.misses++
      if (config.enableDebug) {
        console.log(`[Cache] MISS: ${key}`)
      }
      return null
    }

    if (!isEntryValid(entry)) {
      // Remove expired entry
      cache.delete(key)
      stats.misses++
      stats.size--
      if (config.enableDebug) {
        console.log(`[Cache] EXPIRED: ${key}`)
      }
      return null
    }

    stats.hits++
    if (config.enableDebug) {
      console.log(`[Cache] HIT: ${key}`)
    }
    return entry.data
  }

  /**
   * Set cache entry with optional TTL
   */
  const set = (endpoint: string, data: any, params?: any, ttl?: number): void => {
    const key = generateKey(endpoint, params)
    const entryTTL = ttl || config.defaultTTL

    // Check if we need to evict entries
    if (cache.size >= config.maxSize) {
      evictOldest()
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: entryTTL,
      key,
      endpoint,
    }

    cache.set(key, entry)
    stats.sets++
    stats.size = cache.size

    if (config.enableDebug) {
      console.log(`[Cache] SET: ${key} (TTL: ${entryTTL}ms)`)
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  const evictOldest = (): void => {
    const entries = Array.from(cache.entries())
    const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    // Remove oldest 10% of entries
    const toRemove = Math.ceil(config.maxSize * 0.1)
    for (let i = 0; i < toRemove && i < sortedEntries.length; i++) {
      const [key] = sortedEntries[i]
      cache.delete(key)
      stats.deletes++
    }
    
    stats.size = cache.size
    
    if (config.enableDebug) {
      console.log(`[Cache] EVICTED: ${toRemove} entries`)
    }
  }

  /**
   * Clear cache for specific endpoint
   */
  const clearEndpoint = (endpoint: string): void => {
    const keysToDelete: string[] = []
    
    for (const [key, entry] of cache.entries()) {
      if (entry.endpoint === endpoint) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => {
      cache.delete(key)
      stats.deletes++
    })
    
    stats.size = cache.size
    
    if (config.enableDebug) {
      console.log(`[Cache] CLEARED endpoint: ${endpoint} (${keysToDelete.length} entries)`)
    }
  }

  /**
   * Clear all cache
   */
  const clearAll = (): void => {
    const size = cache.size
    cache.clear()
    stats.deletes += size
    stats.size = 0
    
    if (config.enableDebug) {
      console.log(`[Cache] CLEARED ALL: ${size} entries`)
    }
  }

  /**
   * Get cache statistics
   */
  const getStats = () => {
    const hitRate = stats.hits + stats.misses > 0 
      ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)
      : '0.00'
    
    return {
      ...stats,
      hitRate: `${hitRate}%`,
      size: cache.size,
      maxSize: config.maxSize,
    }
  }

  /**
   * Enable/disable debug logging
   */
  const setDebug = (enabled: boolean): void => {
    config.enableDebug = enabled
  }

  /**
   * Update cache configuration
   */
  const updateConfig = (newConfig: Partial<typeof config>): void => {
    Object.assign(config, newConfig)
  }

  /**
   * Get cache entries for debugging
   */
  const getEntries = (): Array<{ key: string; entry: CacheEntry }> => {
    return Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      entry,
    }))
  }

  /**
   * Wrapper function for API calls with caching
   */
  const cachedApiCall = async <T>(
    apiFunction: () => Promise<T>,
    endpoint: string,
    params?: any,
    ttl?: number
  ): Promise<T> => {
    // Try to get from cache first
    const cached = get(endpoint, params)
    if (cached !== null) {
      return cached
    }

    // Make API call
    const result = await apiFunction()
    
    // Cache the result
    set(endpoint, result, params, ttl)
    
    return result
  }

  return {
    // Core cache operations
    get,
    set,
    clearEndpoint,
    clearAll,
    
    // Configuration
    updateConfig,
    setDebug,
    
    // Statistics and debugging
    getStats,
    getEntries,
    
    // Convenience wrapper
    cachedApiCall,
  }
}

// Export singleton instance
export const apiCache = useApiCache() 