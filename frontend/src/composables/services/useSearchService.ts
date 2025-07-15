import { frappeCall } from '@/composables/useFrappeSDK'
import type { DoctypeMetadata, FormField } from '@/types/metadata'
import type { Document } from '@/types/document'

interface SearchLinkOptions {
  customQuery?: string
  filters?: Record<string, any>
  fields?: string[]
  referenceDoctype?: string
  ignoreUserPermissions?: boolean
  pageLength?: number
}

interface SearchResult {
  value: string
  label: string
  description?: string
}

/**
 * Search Service
 * Handles search operations for link fields using search_link and custom queries
 */
export const useSearchService = () => {
  /**
   * Search for link field options
   * For link fields only (with optional custom query)
   * @param doctype - The target document type to search in
   * @param searchText - Text to search for
   * @param options - Search options including custom query and filters
   * @returns Array of search results
   */
  const searchLinkOptions = async (
    doctype: string,
    searchText: string = '',
    options: SearchLinkOptions = {}
  ): Promise<SearchResult[]> => {
    try {
      console.log(`Searching link options for ${doctype} with text "${searchText}"`, options)

      let response

      if (options.customQuery) {
        // Use custom query endpoint
        console.log(`Using custom query: ${options.customQuery}`)
        
        const args: any = {
          txt: searchText,
          doctype: doctype,
          ignore_user_permissions: options.ignoreUserPermissions ?? 0,
          reference_doctype: options.referenceDoctype || '',
          page_length: options.pageLength ?? 10,
        }

        // Add filters if provided - Frappe expects filters as JSON string
        if (options.filters && Object.keys(options.filters).length > 0) {
          args.filters = JSON.stringify(options.filters)
        }

        response = await frappeCall.get(options.customQuery, args)
      } else {
        // Use standard search_link
        console.log('Using standard search_link')
        
        const args: any = {
          txt: searchText,
          doctype: doctype,
          ignore_user_permissions: options.ignoreUserPermissions ?? 0,
          reference_doctype: options.referenceDoctype || '',
          page_length: options.pageLength ?? 10,
        }

        // Add filters if provided
        if (options.filters && Object.keys(options.filters).length > 0) {
          args.filters = JSON.stringify(options.filters)
        }

        response = await frappeCall.get('frappe.desk.search.search_link', args)
      }

      // Process response and normalize format
      if (response?.message) {
        const results = response.message.map((item: any) => {
          // Handle custom backend format (direct objects)
          if (typeof item === 'object' && item.value && item.label) {
            return {
              value: item.value,
              label: item.label,
              description: item.description || '',
            }
          }
          // Handle standard Frappe format (arrays)
          else if (Array.isArray(item)) {
            return {
              value: item[0],
              label: item[1] || item[0],
              description: item[2] || '',
            }
          }
          // Handle standard Frappe search response (objects)
          else {
            return {
              value: item.value || item,
              label: item.label || item.value || item,
              description: item.description || '',
            }
          }
        })

        console.log(`Search completed for ${doctype}:`, results)
        return results
      }

      return []
    } catch (error) {
      console.error(`Error searching link options for ${doctype}:`, error)
      return []
    }
  }

  /**
   * Advanced search with custom query and document context
   * @param doctype - The target document type to search in
   * @param searchText - Text to search for
   * @param customQuery - Custom query method name
   * @param referenceDoctype - Reference document type for context
   * @param formData - Current form data for dynamic queries
   * @param documentId - Current document ID for context
   * @returns Array of search results
   */
  const searchWithCustomQuery = async (
    doctype: string,
    searchText: string = '',
    customQuery: string,
    referenceDoctype?: string,
    formData?: Record<string, any>,
    documentId?: string
  ): Promise<SearchResult[]> => {
    try {
      console.log(`Advanced search for ${doctype} using custom query ${customQuery}`)

      const args: any = {
        txt: searchText,
        doctype: doctype,
        ignore_user_permissions: 0,
        reference_doctype: referenceDoctype || '',
        page_length: 10,
      }

      // Add document ID for dynamic custom queries (more reliable than form data)
      if (documentId) {
        args.filters = JSON.stringify({ document_id: documentId })
      }

      const response = await frappeCall.get(customQuery, args)

      if (response?.message) {
        const results = response.message.map((item: any) => {
          if (typeof item === 'object' && item.value && item.label) {
            return {
              value: item.value,
              label: item.label,
              description: item.description || '',
            }
          } else if (Array.isArray(item)) {
            return {
              value: item[0],
              label: item[1] || item[0],
              description: item[2] || '',
            }
          } else {
            return {
              value: item.value || item,
              label: item.label || item.value || item,
              description: item.description || '',
            }
          }
        })

        console.log(`Advanced search completed:`, results)
        return results
      }

      return []
    } catch (error) {
      console.error(`Error in advanced search for ${doctype}:`, error)
      return []
    }
  }

  return {
    searchLinkOptions,
    searchWithCustomQuery,
  }
} 