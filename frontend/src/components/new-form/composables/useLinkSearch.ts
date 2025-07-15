import { ref } from 'vue'
import { frappeCall } from '@/composables/useFrappeSDK'
import type { SearchLinkRequest, SearchLinkResult, SearchLinkResponse } from '@/types/search'
import type { FieldQuery } from '@/services/client-script/types'
import { useMessage } from 'naive-ui'

function extractFormattedPermissionMessage(err: any, doctype: string): { html: string, text: string } {
  // Try to extract from _server_messages
  if (err && typeof err._server_messages === 'string') {
    try {
      const arr = JSON.parse(err._server_messages)
      if (Array.isArray(arr) && arr.length > 0) {
        const msgObj = JSON.parse(arr[0])
        if (msgObj && msgObj.message) {
          // Remove HTML tags for plain text toast
          const text = msgObj.message.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
          return { html: msgObj.message, text }
        }
      }
    } catch {}
  }
  // Fallback
  const fallback = `${doctype} cannot query. Forbidden.`
  const text = err?._error_message || fallback
  return { html: text, text }
}

export function useLinkSearch() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const message = useMessage()

  const searchLink = async (
    txt: string,
    doctype: string,
    referenceDoctype?: string,
    pageLength: number = 10,
    customQuery?: FieldQuery,
    formData?: Record<string, any>,
    documentId?: string
  ): Promise<SearchLinkResult[]> => {
    try {
      loading.value = true
      error.value = null

      // If custom query is provided, use it
      if (customQuery) {
        return await searchWithCustomQuery(txt, doctype, customQuery, pageLength, formData, documentId)
      }

      // Default search
      const params: SearchLinkRequest = {
        txt,
        doctype,
        ignore_user_permissions: '0',
        page_length: pageLength.toString(),
      }

      if (referenceDoctype) {
        params.reference_doctype = referenceDoctype
      }

      const response = await frappeCall.post(
        'frappe.desk.search.search_link',
        params,
      )

      // Map the response to format: "label (description)"
      return response.message || []
    } catch (err: any) {
      if (err?.httpStatus === 403 || err?.status === 403) {
        const { html, text } = extractFormattedPermissionMessage(err, doctype)
        error.value = html
        message.error(text)
      } else {
        console.error('Error searching links:', err)
        error.value = err instanceof Error ? err.message : 'Failed to search links'
      }
      return []
    } finally {
      loading.value = false
    }
  }

  const searchWithCustomQuery = async (
    txt: string,
    doctype: string,
    customQuery: FieldQuery,
    pageLength: number,
    formData?: Record<string, any>,
    documentId?: string
  ): Promise<SearchLinkResult[]> => {
    try {
      // Use the original doctype (no doctype property in FieldQuery)
      const targetDoctype = doctype

      // Prepare the base arguments
      const args: any = {
        txt,
        doctype: targetDoctype,
        ignore_user_permissions: customQuery.ignore_user_permissions ?? 0,
        reference_doctype: customQuery.reference_doctype || '',
        page_length: customQuery.page_length ?? pageLength,
      }

      // Add filters if provided - Frappe expects filters as JSON string
      if (customQuery.filters && Object.keys(customQuery.filters).length > 0) {
        args.filters = JSON.stringify(customQuery.filters)
      }

      // Add document ID for dynamic custom queries
      if (customQuery.query && documentId) {
        const existingFilters = customQuery.filters || {}
        const combinedFilters = {
          ...existingFilters,
          document_id: documentId,
        }
        args.filters = JSON.stringify(combinedFilters)
      }

      // Choose the appropriate API endpoint
      let response
      if (customQuery.query) {
        // Use custom server-side method
        response = await frappeCall.get(customQuery.query, args)
      } else {
        // Use standard search_link with filters
        response = await frappeCall.get('frappe.desk.search.search_link', args)
      }

      return response?.message || []
    } catch (err: any) {
      if (err?.httpStatus === 403 || err?.status === 403) {
        const { html, text } = extractFormattedPermissionMessage(err, doctype)
        error.value = html
        message.error(text)
      } else {
        console.error('Error searching with custom query:', err)
        error.value = err instanceof Error ? err.message : 'Failed to search links'
      }
      return []
    }
  }

  return {
    searchLink,
    loading,
    error,
  }
} 