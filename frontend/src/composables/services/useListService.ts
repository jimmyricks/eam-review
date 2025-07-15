import { frappeDB } from '@/composables/useFrappeSDK'
import { apiCache } from './useApiCache'
import { useMessage } from 'naive-ui'

interface ListOptions {
  fields?: string[]
  filters?: any[]
  limit?: number
  limit_start?: number
  orderBy?: {
    field: string
    order: 'asc' | 'desc'
  }
  groupBy?: string
  asDict?: boolean
  debug?: boolean
  useCache?: boolean
}

interface CountOptions {
  filters?: any[]
  cache?: boolean
}

/**
 * List Service
 * Handles list operations using frappeDB
 * Now includes API caching for improved performance
 */
export const useListService = () => {
  const message = useMessage()

  /**
   * Get a list of documents
   * @param doctype - The document type
   * @param options - List query options
   * @returns Array of documents
   */
  const getList = async (doctype: string, options: ListOptions = {}) => {
    const { useCache = true, ...restOptions } = options
    const cacheKey = `${doctype}-list-${JSON.stringify(restOptions)}`

    if (useCache) {
      // Try to get from API cache first
      const cached = apiCache.get('frappe.db.get_list', { doctype, ...restOptions })
      if (cached) {
        return cached
      }
    }

    try {
      
      // Set default options using correct SDK parameters
      const queryOptions = {
        fields: ['*'],
        limit: 10,
        limit_start: 0,
        orderBy: {
          field: 'modified',
          order: 'desc' as const,
        },
        ...restOptions,
      }

      const result = await frappeDB.getDocList(doctype, queryOptions)
      
      if (useCache) {
        // Cache the result with 1-minute TTL for list data
        apiCache.set('frappe.db.get_list', result, { doctype, ...restOptions }, 60 * 1000)  
      }

      return result
    } catch (error: any) {
      if (error.httpStatus === 403) {
        message.error('You are not authorized to access this page')
      } else {
        console.error(`ListService Error for ${doctype}:`, error)

      }
      throw error
    }
  }

  /**
   * Get count of documents
   * @param doctype - The document type
   * @param options - Count options including filters
   * @returns Document count
   */
  const getCount = async (doctype: string, options: CountOptions = {}) => {
    const { cache = true, filters = [] } = options

    if (cache) {
      // Try to get from API cache first
      const cached = apiCache.get('frappe.db.get_count', { doctype, filters })
      if (cached) {
        return cached
      }
    }

    try {
      
      const result = await frappeDB.getCount(doctype, filters, cache)
      
      if (cache) {
        // Cache the result with 2-minute TTL for count data
        apiCache.set('frappe.db.get_count', result, { doctype, filters }, 2 * 60 * 1000)
      }
      
      return result
    } catch (error) {
      console.error(`Error getting count for ${doctype}:`, error)
      throw error
    }
  }

  /**
   * Get paginated list with count
   * @param doctype - The document type
   * @param options - List options
   * @returns Object with data and total count
   */
  const getPaginatedList = async (doctype: string, options: ListOptions = {}) => {
    const { useCache = true, ...restOptions } = options
    const cacheKey = `${doctype}-paginated-${JSON.stringify(restOptions)}`

    if (useCache) {
      // Try to get from API cache first
      const cached = apiCache.get('frappe.db.get_paginated_list', { doctype, ...restOptions })
      if (cached) {
        return cached
      }
    }

    try {
      
      // Get the data
      const data = await getList(doctype, options)
      
      // Get the total count (using same filters)
      const total = await getCount(doctype, { 
        filters: options.filters 
      })
      
      const result = {
        data,
        total,
        pageSize: options.limit || 10,
        start: options.limit_start || 0,
      }
      
      if (useCache) {
        // Cache the result with 1-minute TTL for paginated data
        apiCache.set('frappe.db.get_paginated_list', result, { doctype, ...restOptions }, 60 * 1000)
      }
      
      return result
    } catch (error) {
      console.error(`Error getting paginated list for ${doctype}:`, error)
      throw error
    }
  }

  /**
   * Search documents by text in specific fields
   * @param doctype - The document type
   * @param searchTerm - Text to search for
   * @param searchFields - Fields to search in
   * @param options - Additional list options
   * @returns Array of matching documents
   */
  const searchInFields = async (
    doctype: string,
    searchTerm: string,
    searchFields: string[],
    options: ListOptions = {}
  ) => {
    const { useCache = true, ...restOptions } = options

    if (!searchTerm.trim()) {
      return []
    }

    if (useCache) {
      // Try to get from API cache first
      const cached = apiCache.get('frappe.db.search_in_fields', { 
        doctype, 
        searchTerm, 
        searchFields, 
        ...restOptions 
      })
      if (cached) {
        return cached
      }
    }

    try {
      
      // Create filters for each field to search in
      const searchFilters = searchFields.map(field => 
        [field, 'like', `%${searchTerm}%`]
      )
      
      const result = await getList(doctype, {
        ...options,
        filters: searchFilters,
      })
      
      if (useCache) {
        // Cache the result with 30-second TTL for search data
        apiCache.set('frappe.db.search_in_fields', result, { 
          doctype, 
          searchTerm, 
          searchFields, 
          ...restOptions 
        }, 30 * 1000)
      }
      
      return result
    } catch (error) {
      console.error(`Error searching in ${doctype}:`, error)
      throw error
    }
  }

  /**
   * Clear cache for a specific doctype
   * @param doctype - The document type
   */
  const clearDoctypeCache = (doctype: string) => {
    apiCache.clearEndpoint('frappe.db.get_list')
    apiCache.clearEndpoint('frappe.db.get_count')
    apiCache.clearEndpoint('frappe.db.get_paginated_list')
    apiCache.clearEndpoint('frappe.db.search_in_fields')
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  const getCacheStats = () => {
    return apiCache.getStats()
  }

  return {
    getList,
    getCount,
    getPaginatedList,
    searchInFields,
    clearDoctypeCache,
    getCacheStats,
  }
} 