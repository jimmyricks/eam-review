import { frappeCall, frappeFile } from '@/composables/useFrappeSDK'
import type { UploadFileInfo } from 'naive-ui'
import type { Document } from '@/types/document'
import { useDocumentService } from './useDocumentService'

interface UploadOptions {
  doctype?: string
  docname?: string
  fieldname?: string
  filename?: string
  isPrivate?: boolean
  folder?: string
  onProgress?: (bytesUploaded: number, totalBytes?: number) => void
}

interface AttachmentCallbacks {
  onAttachmentAdded?: (fileUrl: string) => void
  onAttachmentRemoved?: (fileId: string) => void
  onAttachmentsRefreshed?: (attachments: AttachmentInfo[]) => void
}

interface AttachmentInfo {
  name: string
  file_name: string
  file_url: string
  file_size?: number
  is_private?: number
}

interface MaxAttachments {
  max_attachments: number
}

/**
 * Attachment Service
 * Handles file and attachment operations
 * Uses document service for getting attachment data from docinfo
 */
export const useAttachmentService = (callbacks?: AttachmentCallbacks) => {
  const { getDocument } = useDocumentService()

  /**
   * Get maximum file size allowed by Frappe
   * @returns Maximum file size in bytes
   */
  const getMaxFileSize = async (): Promise<number> => {
    try {
      console.log('Getting maximum file size from Frappe')
      
      const response = await frappeCall.get('frappe.core.api.file.get_max_file_size')
      const maxSize = response || 25 * 1024 * 1024 // Default 25MB if no response
      
      console.log(`Maximum file size: ${Math.round(maxSize / (1024 * 1024))}MB`)
      return maxSize
    } catch (error) {
      console.error('Error getting max file size:', error)
      return 25 * 1024 * 1024 // Default 25MB
    }
  }

  /**
   * Upload a file to Frappe using the SDK
   * @param file - The file to upload
   * @param options - Upload options
   * @returns File URL or null if upload failed
   */
  const uploadFile = async (
    file: File,
    options: UploadOptions = {}
  ): Promise<string | null> => {
    try {
      console.log('Uploading file with SDK:', {
        fileName: file.name,
        fileSize: file.size,
        options,
      })

      const fileArgs: any = { ...options }

      // Get attachments before upload to compare later, if uploading to a document
      const attachmentsBefore =
        options.doctype && options.docname && options.docname !== 'new'
          ? await getDocumentAttachments(options.doctype, options.docname)
          : []

      // Use the SDK's file upload method
      const result = await frappeFile.uploadFile(
        file,
        fileArgs,
        options.onProgress ||
          ((completed, total) => {
            if (total) {
              console.log(`Upload progress: ${Math.round((completed / total) * 100)}%`)
            }
          }),
      )

      console.log('Upload result:', result)

      // The SDK should handle attaching the file if doctype & docname are passed.
      // We no longer call our custom endpoint here.
      // We now need to get the URL of the file that was just uploaded.

      // First, try to get the fileUrl directly from the response.
      const directFileUrl = result?.data?.file_url || result?.data?.message?.file_url

      if (directFileUrl) {
        console.log('Got file URL directly from response:', directFileUrl)
        callbacks?.onAttachmentAdded?.(directFileUrl)
        if (options.doctype && options.docname) {
          await refreshDocumentAttachments(options.doctype, options.docname)
        }
        return directFileUrl
      }

      // If no URL in response, but upload was for a doc, try to find the new attachment by diffing.
      if (options.doctype && options.docname && options.docname !== 'new') {
        console.log('No URL in response, refreshing attachments to find the new file.')
        const attachmentsAfter = await refreshDocumentAttachments(
          options.doctype,
          options.docname,
        )

        const newAttachment = attachmentsAfter.find(
          (attAfter) => !attachmentsBefore.some((attBefore) => attBefore.name === attAfter.name),
        )

        if (newAttachment) {
          console.log('Found new attachment by diffing:', newAttachment.file_url)
          callbacks?.onAttachmentAdded?.(newAttachment.file_url)
          return newAttachment.file_url
        }
      }

      console.error('Upload failed: Could not determine the uploaded file URL.')
      return null
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  /**
   * Remove an attachment from Frappe
   * @param fileId - The file ID to remove
   * @param doctype - The doctype of the document (optional)
   * @param docname - The name of the document (optional)
   * @returns Success status
   */
  const removeAttachment = async (
    fileId: string,
    doctype?: string,
    docname?: string,
  ): Promise<boolean> => {
    try {
      console.log('Removing file:', { fileId, doctype, docname })

      // Step 1: Update document fields to remove the attachment URL
      // This is a custom endpoint to handle clearing Attach/Attach Image fields
      // COMMENTED OUT FOR TESTING - Standard Frappe remove_attach should handle this
      // if (doctype && docname) {
      //   await frappeCall.post('ci_eam.custom_apis.get_fields.update_document_attachments', {
      //     doctype,
      //     name: docname,
      //     file_id: fileId,
      //     action: 'remove',
      //   })
      //   console.log('Document attachment fields updated for removal.')
      // }

      // Step 2: Call the standard Frappe utility to remove the attachment itself
      // This handles removing the file from the system and from the docinfo.
      const removeArgs: any = { fid: fileId }
      if (doctype) removeArgs.dt = doctype
      if (docname) removeArgs.dn = docname
      await frappeCall.post('frappe.desk.form.utils.remove_attach', removeArgs)

      console.log('File removed successfully')

      // Call callback if provided
      callbacks?.onAttachmentRemoved?.(fileId)

      return true
    } catch (error) {
      console.error('Remove error:', error)
      throw error
    }
  }

  /**
   * Get attachments for a document using document service
   * This gets attachment data from docinfo.attachments instead of making separate API calls
   * @param doctype - The document type
   * @param docname - The document name
   * @returns Array of attachment info
   */
  const getDocumentAttachments = async (doctype: string, docname: string): Promise<AttachmentInfo[]> => {
    try {
      if (docname === 'new') {
        return []
      }

      console.log(`Getting attachments for ${doctype}/${docname} from document service`)
      
      const response = await getDocument(doctype, docname)
      
      if (response?.docinfo?.attachments) {
        console.log('Document attachments retrieved from docinfo:', response.docinfo.attachments)
        return response.docinfo.attachments
      }

      return []
    } catch (error) {
      console.error('Error getting document attachments:', error)
      return []
    }
  }

  /**
   * Validate file before upload
   * @param file - The file to validate
   * @param maxSize - Maximum file size in bytes (optional, will fetch from Frappe if not provided)
   * @param allowedTypes - Array of allowed MIME types
   * @returns Validation result
   */
  const validateFile = async (
    file: File,
    maxSize?: number,
    allowedTypes?: string[]
  ): Promise<{ isValid: boolean; errorMessage?: string }> => {
    try {
      console.log('Validating file:', { 
        name: file.name, 
        size: file.size, 
        type: file.type 
      })

      // Get max size from Frappe if not provided
      const actualMaxSize = maxSize || (await getMaxFileSize())
      
      if (file.size > actualMaxSize) {
        const errorMessage = `File size exceeds ${Math.round(actualMaxSize / (1024 * 1024))}MB limit`
        console.log('File validation failed:', errorMessage)
        return {
          isValid: false,
          errorMessage,
        }
      }

      if (
        allowedTypes &&
        !allowedTypes.some((type) => {
          const trimmed = type.trim()
          if (trimmed === '*' || trimmed === '*/*') return true
          if (trimmed.endsWith('/*')) {
            const mainType = trimmed.split('/')[0]
            return file.type.startsWith(`${mainType}/`)
          }
          return file.type === trimmed
        })
      ) {
        const errorMessage = `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        console.log('File validation failed:', errorMessage)
        return {
          isValid: false,
          errorMessage,
        }
      }
      

      console.log('File validation passed')
      return { isValid: true }
    } catch (error) {
      console.error('Error validating file:', error)
      return {
        isValid: false,
        errorMessage: 'Error validating file',
      }
    }
  }

  /**
   * Refresh document attachments from server
   * @param doctype - The document type
   * @param docname - The document name
   * @returns Array of attachment info
   */
  const refreshDocumentAttachments = async (doctype: string, docname: string): Promise<AttachmentInfo[]> => {
    try {
      if (docname === 'new') {
        const emptyAttachments: AttachmentInfo[] = []
        callbacks?.onAttachmentsRefreshed?.(emptyAttachments)
        return emptyAttachments
      }

      console.log(`Refreshing attachments for ${doctype}/${docname}`)
      
      // First, refresh the document to get latest state
      await frappeCall.post('ci_eam.custom_apis.get_fields.refresh_document_info', {
        doctype,
        name: docname
      })
      
      // Then get the updated attachments
      const response = await getDocument(doctype, docname)
      
      if (response?.docinfo?.attachments) {
        console.log('Document attachments refreshed:', response.docinfo.attachments)
        callbacks?.onAttachmentsRefreshed?.(response.docinfo.attachments)
        return response.docinfo.attachments
      }

      const emptyAttachments: AttachmentInfo[] = []
      callbacks?.onAttachmentsRefreshed?.(emptyAttachments)
      return emptyAttachments
    } catch (error) {
      console.error('Error refreshing document attachments:', error)
      const emptyAttachments: AttachmentInfo[] = []
      callbacks?.onAttachmentsRefreshed?.(emptyAttachments)
      return emptyAttachments
    }
  }

  /**
   * Update attachment state (add or remove) with proper state management
   * @param action - 'add' or 'remove'
   * @param fileId - The file ID
   * @param doctype - The document type
   * @param docname - The document name
   * @returns Success status, updated attachments, and updated document data
   */
  const updateAttachmentState = async (
    action: 'add' | 'remove',
    fileId: string,
    doctype: string,
    docname: string
  ): Promise<{ success: boolean; attachments: AttachmentInfo[]; documentData?: any }> => {
    try {
      console.log(`Updating attachment state: ${action} ${fileId} for ${doctype}/${docname}`)

      if (action === 'remove') {
        // Step 1: Update document fields to remove the attachment URL
        // COMMENTED OUT FOR TESTING - Standard Frappe remove_attach should handle this
        // await frappeCall.post('ci_eam.custom_apis.get_fields.update_document_attachments', {
        //   doctype,
        //   name: docname,
        //   file_id: fileId,
        //   action: 'remove',
        // })
        // console.log('Document attachment fields updated for removal.')

        // Step 2: Call the standard Frappe utility to remove the attachment itself
        const removeArgs: any = { fid: fileId }
        if (doctype) removeArgs.dt = doctype
        if (docname) removeArgs.dn = docname
        await frappeCall.post('frappe.desk.form.utils.remove_attach', removeArgs)

        console.log('File removed successfully')
        callbacks?.onAttachmentRemoved?.(fileId)
      } else if (action === 'add') {
        // For add action, we need the file_url, not file_id
        // This is typically called after uploadFile has already updated the document
        console.log('Add action - document should already be updated by uploadFile')
      }

      // Step 3: Refresh attachments to get the latest state
      const updatedAttachments = await refreshDocumentAttachments(doctype, docname)

      // Step 4: Get the updated document data to prevent timestamp conflicts
      const updatedDocument = await getDocument(doctype, docname)

      return {
        success: true,
        attachments: updatedAttachments,
        documentData: updatedDocument?.docs?.[0] || null
      }
    } catch (error) {
      console.error('Error updating attachment state:', error)
      throw error
    }
  }
  

  const getMaxAttachments = async (doctype: string): Promise<number> => {
    try {
      // Get metadata for the doctype to access max_attachments
      const { useMetadataService } = await import('./useMetadataService')
      const { getMetadata } = useMetadataService()
      const metadata = await getMetadata(doctype)

      return metadata.max_attachments || 0
    } catch (error) {
      console.error('Error getting max attachments:', error)
      return 0
    }
  }

  return {
    uploadFile,
    removeAttachment,
    validateFile,
    getMaxFileSize,
    getDocumentAttachments,
    refreshDocumentAttachments,
    updateAttachmentState,
    getMaxAttachments,
  }
} 