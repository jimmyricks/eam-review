import { frappeCall } from '@/composables/useFrappeSDK'
import type { DoctypeMetadata, DocTypeAction } from '@/types/metadata'
import type { Document } from '@/types/document'

interface DocumentActionResult {
  status: string
  message?: string
  data?: any
  reload_doc?: boolean
  action?: {
    action: string
    path: string
  }
}

interface DocumentAction {
  label: string
  action_type: string
  action: string
  hidden: boolean
}

/**
 * Document Action Service
 * Handles custom document actions (form buttons) using doctype metadata
 */
export const useDocumentActionService = () => {
  /**
   * Execute a custom document action using the method from doctype metadata
   * @param actionMethod - The action method from doctype.actions[].action
   * @param formData - Current form data 
   * @param doctype - The document type (will be added to form data)
   * @returns Result of document action execution
   */
  const executeDocumentAction = async (
    actionMethod: string,
    formData: Record<string, any>,
    doctype: string
  ): Promise<DocumentActionResult> => {
    try {
      console.log(`Executing document action "${actionMethod}" for ${doctype}`, { formData })

      // Prepare payload with form data and doctype
      const payload = {
        doc: {
        ...formData,
        doctype: doctype,
      },
      }

      const response = await frappeCall.post(actionMethod, payload)

      console.log(`Document action executed successfully:`, response)
      
      // Normalize response format
      const result: DocumentActionResult = {
        status: response?.message.status,
        message: response?.message.message,
        data: response?.data || response,
        reload_doc: response?.reload_doc || false,
        action: {
          action: response?.message.action,
          path: response?.message.path || 'No path provided',
        },
      }

      return result
    } catch (error) {
      console.error(`Error executing document action "${actionMethod}" for ${doctype}:`, error)
      
      const errorResult: DocumentActionResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Action execution failed',
      }
      
      throw errorResult
    }
  }

  /**
   * Get available document actions from doctype metadata
   * @param doctypeMetadata - The doctype metadata object containing actions
   * @returns Array of available document actions
   */
  const getDocumentActions = (doctypeMetadata: any): DocumentAction[] => {
    try {
      console.log(`Getting document actions from doctype metadata`)

      if (!doctypeMetadata?.actions || !Array.isArray(doctypeMetadata.actions)) {
        console.log(`No actions found in doctype metadata`)
        return []
      }

      const actions = doctypeMetadata.actions.filter((action: any) => !action.hidden)
      console.log(`Document actions retrieved:`, actions)
      return actions
    } catch (error) {
      console.error(`Error getting document actions from metadata:`, error)
      return []
    }
  }

  /**
   * Check if doctype has any document actions
   * @param doctypeMetadata - The doctype metadata object
   * @returns Boolean indicating if doctype has actions
   */
  const hasDocumentActions = (doctypeMetadata: any): boolean => {
    try {
      const actions = getDocumentActions(doctypeMetadata)
      return actions.length > 0
    } catch (error) {
      console.error(`Error checking if doctype has actions:`, error)
      return false
    }
  }

  /**
   * Execute document action with confirmation
   * @param actionMethod - The action method from doctype metadata
   * @param formData - Current form data
   * @param doctype - The document type
   * @param confirmationMessage - Confirmation message to show user
   * @returns Result of document action execution
   */
  const executeDocumentActionWithConfirmation = async (
    actionMethod: string,
    formData: Record<string, any>,
    doctype: string,
    confirmationMessage: string
  ): Promise<DocumentActionResult> => {
    try {
      // In a real implementation, you would show a confirmation dialog here
      // For now, we'll just log the confirmation message
      console.log(`Confirmation required: ${confirmationMessage}`)
      console.log(`Proceeding with action execution...`)

      return await executeDocumentAction(actionMethod, formData, doctype)
    } catch (error) {
      console.error(`Error in confirmed document action:`, error)
      throw error
    }
  }

  /**
   * Bulk execute document action on multiple documents
   * @param actionMethod - The action method from doctype metadata
   * @param documentsData - Array of document form data
   * @param doctype - The document type
   * @returns Results of bulk action execution
   */
  const bulkExecuteDocumentAction = async (
    actionMethod: string,
    documentsData: Record<string, any>[],
    doctype: string
  ) => {
    try {
      console.log(`Bulk executing document action "${actionMethod}" on ${documentsData.length} ${doctype} documents`)

      const results = await Promise.allSettled(
        documentsData.map(formData => executeDocumentAction(actionMethod, formData, doctype))
      )

      const successes = results.filter(r => r.status === 'fulfilled')
      const failures = results.filter(r => r.status === 'rejected')

      console.log(`Bulk document action completed: ${successes.length} successes, ${failures.length} failures`)
      
      return {
        successes: successes.length,
        failures: failures.length,
        results,
        successRate: (successes.length / documentsData.length) * 100,
      }
    } catch (error) {
      console.error(`Error in bulk document action:`, error)
      throw error
    }
  }

  /**
   * Find a specific action by label in doctype metadata
   * @param doctypeMetadata - The doctype metadata object
   * @param actionLabel - The action label to find
   * @returns The action object or null if not found
   */
  const findActionByLabel = (doctypeMetadata: any, actionLabel: string): DocumentAction | null => {
    try {
      const actions = getDocumentActions(doctypeMetadata)
      const action = actions.find(a => a.label === actionLabel)
      
      if (action) {
        console.log(`Found action "${actionLabel}":`, action)
        return action
      }
      
      console.log(`Action "${actionLabel}" not found`)
      return null
    } catch (error) {
      console.error(`Error finding action by label:`, error)
      return null
    }
  }

  /**
   * Execute action with progress tracking (for long-running actions)
   * @param actionMethod - The action method from doctype metadata
   * @param formData - Current form data
   * @param doctype - The document type
   * @param onProgress - Progress callback function
   * @returns Result of document action execution
   */
  const executeDocumentActionWithProgress = async (
    actionMethod: string,
    formData: Record<string, any>,
    doctype: string,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<DocumentActionResult> => {
    try {
      console.log(`Executing document action with progress tracking: "${actionMethod}" for ${doctype}`)

      // Start progress
      onProgress?.(0, 'Starting action...')

      // Execute the action
      onProgress?.(50, 'Executing action...')
      const result = await executeDocumentAction(actionMethod, formData, doctype)

      // Complete progress
      onProgress?.(100, 'Action completed')

      return result
    } catch (error) {
      onProgress?.(100, 'Action failed')
      console.error(`Error in action with progress:`, error)
      throw error
    }
  }

  /**
   * Get action method from action configuration
   * @param action - The action object from doctype metadata
   * @returns The action method string
   */
  const getActionMethod = (action: DocumentAction): string => {
    return action.action
  }

  /**
   * Check if action is of specific type
   * @param action - The action object from doctype metadata
   * @param actionType - The action type to check ('Server Action', 'Client Action', etc.)
   * @returns Boolean indicating if action is of specified type
   */
  const isActionType = (action: DocumentAction, actionType: string): boolean => {
    return action.action_type === actionType
  }

  return {
    executeDocumentAction,
    getDocumentActions,
    hasDocumentActions,
    executeDocumentActionWithConfirmation,
    bulkExecuteDocumentAction,
    findActionByLabel,
    executeDocumentActionWithProgress,
    getActionMethod,
    isActionType,
  }
} 