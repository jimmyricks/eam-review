import { frappeCall, frappeDB } from '@/composables/useFrappeSDK'
import type { GetDocResponse } from '@/types/document'
import type { PostSavingResponse } from '@/types/post-saving'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { apiCache } from './useApiCache'
import { handlePermissionError } from '@/utils/permissionErrorHandler'

/**
 * Document Service
 * Handles document CRUD operations and form loading
 * Uses frappe.desk.form.load.getdoc for complete form data including attachments, permissions, docinfo
 * Now includes API caching for improved performance
 */
export const useDocumentService = () => {
  const message = useMessage()
  const router = useRouter()
  
  /**
   * Create a new document
   * @param doctype - The document type
   * @param data - Document data
   * @returns Created document response
   */
  const createDocument = async (doctype: string, data: any) => {
    try {
      // console.log(`Creating new ${doctype} document:`, data)
      
      const result = await frappeDB.createDoc(doctype, data)
      
      // Invalidate cache for this doctype since we created a new document
      apiCache.clearEndpoint('frappe.desk.form.load.getdoc')
      
      // console.log(`Document created successfully:`, result)
      return result
    } catch (error) {
      console.error(`Error creating ${doctype} document:`, error)
      throw error
    }
  }

  /**
   * Get document with complete form data
   * Uses frappe.desk.form.load.getdoc for complete form data including attachments, docinfo, permissions
   * Now cached for improved performance
   * @param doctype - The document type
   * @param name - Document name/ID
   * @returns Complete document response with attachments and metadata
   */
  const getDocument = async (
    doctype: string, 
    name: string
  ): Promise<GetDocResponse> => {
    try {
      if (name === 'new') {
        throw new Error('Cannot fetch document with name "new"')
      }

      // console.log(`Fetching document ${doctype}/${name}`)
      
      // Use cached API call with 2-minute TTL for document data
      const response = await apiCache.cachedApiCall(
        () => frappeCall.get<GetDocResponse>(
          'frappe.desk.form.load.getdoc',
          {
            doctype: doctype,
            name: name,
          }
        ),
        'frappe.desk.form.load.getdoc',
        { doctype, name },
        2 * 60 * 1000 // 2 minutes TTL
      )

      // console.log(`Document fetched successfully:`, response)
      return response
    } catch (error: any) {
      console.error(`Error fetching document ${doctype}/${name}:`, error)
      
      // Check if it's a 403 Forbidden error
      if (error?.httpStatus === 403 || error?.status === 403) {
        handlePermissionError(router, error, doctype, name)
        return Promise.reject(error) // Reject to prevent further processing
      }
      
      throw error
    }
  }

  /**
   * Update an existing document
   * @param doctype - The document type
   * @param name - Document name/ID
   * @param data - Updated document data
   * @returns Updated document response
   */
  const updateDocument = async (doctype: string, name: string, data: any) => {
    try {
      // console.log(`Updating ${doctype} document ${name}:`, data)
      
      const result = await frappeDB.updateDoc(doctype, name, data)
      
      // Invalidate cache for this specific document and doctype
      apiCache.clearEndpoint('frappe.desk.form.load.getdoc')
      
      //  console.log(`Document updated successfully:`, result)
      return result
    } catch (error) {
      console.error(`Error updating ${doctype} document ${name}:`, error)
      throw error
    }
  }

  /**
   * Delete a document
   * @param doctype - The document type
   * @param name - Document name/ID
   * @returns Delete operation result
   */
  const deleteDocument = async (doctype: string, name: string) => {
    try {
      // console.log(`Deleting ${doctype} document ${name}`)
      
      const result = await frappeDB.deleteDoc(doctype, name)
      
      // Invalidate cache for this doctype since we deleted a document
      apiCache.clearEndpoint('frappe.desk.form.load.getdoc')
      
      // console.log(`Document deleted successfully:`, result)
      return result
    } catch (error) {
      console.error(`Error deleting ${doctype} document ${name}:`, error)
      throw error
    }
  }

  /**
   * Execute post-saving operations for a document
   * Calls the dynamic_post_saving API to handle document-specific post-save logic
   * @param doctype - The document type
   * @param doc - The document data object
   * @returns Post-saving operation result
   */
  const postSavingDocument = async (doctype: string, doc: any): Promise<PostSavingResponse> => {
    try {
      // console.log(`Executing post-saving operations for ${doctype}:`, doc)
      
      const result = await frappeCall.post<PostSavingResponse>('ci_eam.asset_management.doctype.asset.asset.dynamic_post_saving', {
        doctype: doctype,
        doc: doc,
      })
      
      // console.log(`Post-saving operations completed successfully:`, result)
      return result
    } catch (error) {
      console.error(`Error executing post-saving operations for ${doctype}:`, error)
      throw error
    }
  }

  /**
   * Save document (create or update based on existence)
   * @param doctype - The document type
   * @param name - Document name/ID ('new' for new documents)
   * @param data - Document data
   * @returns Save operation result
   */
  const saveDocument = async (doctype: string, name: string, data: any) => {
    try {
      // Check if this is a new document
      const isNew = name === 'new' || !name

      let result
      if (isNew) {
        // console.log(`Creating new ${doctype} document`)
        result = await createDocument(doctype, data)
      } else {
        // console.log(`Updating existing ${doctype} document ${name}`)
        result = await updateDocument(doctype, name, data)
      }

      // Execute post-saving operations after successful save
      try {
        const postSaveResult = await postSavingDocument(doctype, result)
        
        // Display the post-saving message
        if (postSaveResult.message) {
          if (postSaveResult.message.status === 'Success') {
            console.log(`✅ ${postSaveResult.message.message}`)
            message.success(postSaveResult.message.message)
          } else {
            console.warn(`⚠️ ${postSaveResult.message.message}`)
            message.error(postSaveResult.message.message)
            if (postSaveResult.message.exception) {
              console.error('Post-saving exception:', postSaveResult.message.exception)
            }
          }
        }
      } catch (postSaveError) {
        console.warn(`Post-saving operations failed for ${doctype}, but document was saved:`, postSaveError)
        // Don't throw the error since the main save operation was successful
      }

      return result
    } catch (error) {
      console.error(`Error saving ${doctype} document:`, error)
      throw error
    }
  }

  /**
   * Refresh document info (attachments, comments, etc.)
   * @param doctype - The document type
   * @param name - Document name/ID
   * @returns Refreshed document info
   */
  const refreshDocumentInfo = async (doctype: string, name: string) => {
    try {
      // console.log(`Refreshing docinfo for ${doctype}/${name}`)

      const result = await frappeCall.get('ci_eam.custom_apis.get_fields.refresh_document_info', {
        doctype: doctype,
        name: name,
      })
      
      // Invalidate cache for this document since we refreshed its info
      apiCache.clearEndpoint('frappe.desk.form.load.getdoc')
      
      //  console.log(`Document info refreshed successfully:`, result)
      return result
    } catch (error) {
      console.error(`Error refreshing docinfo for ${doctype}/${name}:`, error)
      throw error
    }
  }

  return {
    createDocument,
    getDocument,
    updateDocument,
    deleteDocument,
    saveDocument,
    refreshDocumentInfo,
  }
} 