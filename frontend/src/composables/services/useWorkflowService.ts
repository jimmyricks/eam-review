import { frappeCall } from '@/composables/useFrappeSDK'
import type { WorkflowTransition } from '@/types/workflow'

interface WorkflowActionResult {
  message: {
    message: string
    status: string
    action: string
    path?: string
  }
}

/**
 * Workflow Service
 * Handles workflow operations using the correct CI-EAM workflow endpoint
 */
export const useWorkflowService = () => {
  /**
   * Get workflow transitions for a document
   * Uses the correct Frappe API: frappe.model.workflow.get_transitions
   * @param doctype - The document type
   * @param name - Document name/ID
   * @param formData - Document form data (optional)
   * @returns Array of available workflow transitions
   */
  const getWorkflowTransitions = async (
    doctype: string,
    name: string,
    formData?: Record<string, any>
  ): Promise<WorkflowTransition[]> => {
    try {
      // console.log(`Getting workflow transitions for ${doctype}/${name}`, { formData })

      // Prepare payload with form data and doctype
      const payload = {
        doc: {
          ...(formData || {}),
          doctype: doctype,
          name: name,
        },
      }

      const response = await frappeCall.post(
        'frappe.model.workflow.get_transitions',
        payload
      )

      if (response?.message) {
        // console.log(`Workflow transitions retrieved:`, response.message)
        return response.message
      }

      return []
    } catch (error) {
      console.error(`Error getting workflow transitions for ${doctype}/${name}:`, error)
      throw error
    }
  }

  /**
   * Apply a workflow action to a document
   * Uses the CI-EAM specific workflow endpoint
   * @param doctype - The document type
   * @param name - Document name/ID
   * @param action - Workflow action to apply (from transition.action)
   * @returns Result of workflow action
   */
  const applyWorkflowAction = async (
    doctype: string,
    name: string,
    action: string
  ): Promise<WorkflowActionResult> => {
    try {
      // console.log(`Applying workflow action "${action}" to ${doctype}/${name}`)

      const response = await frappeCall.post(
        'ci_eam.asset_management.doctype.asset.asset.dynamic_application_workflow_state',
        {
          doctype: doctype,
          doc_id: name,
          action: action,
        }
      )

      return response
    } catch (error) {
      console.error(`Error applying workflow action "${action}" to ${doctype}/${name}:`, error)
      throw error
    }
  }

  /**
   * Get available workflow actions from transitions
   * @param transitions - Array of workflow transitions
   * @returns Array of unique action names
   */
  const getAvailableActions = (transitions: WorkflowTransition[]): string[] => {
    const actions = transitions.map(t => t.action)
    return [...new Set(actions)]
  }

  /**
   * Get next possible states from transitions
   * @param transitions - Array of workflow transitions
   * @returns Array of unique next states
   */
  const getNextStates = (transitions: WorkflowTransition[]): string[] => {
    const states = transitions.map(t => t.next_state)
    return [...new Set(states)]
  }

  /**
   * Check if doctype has workflow from metadata
   * @param metadata - The doctype metadata object
   * @returns Boolean indicating if doctype has workflow
   */
  const hasWorkflow = (metadata: any): boolean => {
    try {
      const hasWf = !!(metadata?.__workflow_docs && metadata.__workflow_docs.length > 0)
      // console.log(`Doctype has workflow:`, hasWf)
      return hasWf
    } catch (error) {
      console.error(`Error checking workflow from metadata:`, error)
      return false
    }
  }

  return {
    getWorkflowTransitions,
    applyWorkflowAction,
    getAvailableActions,
    getNextStates,
    hasWorkflow,
  }
} 