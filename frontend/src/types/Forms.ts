import type { FormItemRule } from 'naive-ui'
import type { ComputedRef } from 'vue'
import type { DoctypeMetadata, FormField, DocTypeAction, DocTypeLink } from './metadata'

export interface FieldOption {
  value: string
  label?: string
  description?: string
  display?: string // For display in UI components
  disabled?: boolean // For disabled options (like filter indicators)
}

// Custom query configuration for Link fields
export interface CustomFieldQuery {
  doctype?: string // Override the doctype for this field
  query?: string // Custom server-side method to call
  filters?: Record<string, any> // Static filters for now
  reference_doctype?: string // Reference doctype for the query
  ignore_user_permissions?: boolean // Whether to ignore user permissions
  page_length?: number // Number of results to return
}

export interface ValidatorRule {
  required?: boolean
  type?: string
  min?: number
  max?: number
  len?: number
  pattern?: RegExp
  message: string
  trigger?: string | string[]
  validator?: (
    rule: ValidatorRule,
    value: any,
  ) => boolean | Error | Promise<void>
}

export interface DynamicFormProps {
  doctype: string
  id?: string
  backPath?: string
}

// Form Context for provide/inject
export interface FormContext {
  formData: Record<string, any> | ComputedRef<Record<string, any>>
  customFieldOptions: Record<string, any> | ComputedRef<Record<string, any>>
  updateFormData: (field: string, value: any) => void
  isEditing: boolean
  getFieldValue: (fieldName: string) => any
  isFieldPrefilled: (fieldName: string) => boolean
  documentId?: string // Add document ID to form context
  doctype?: string // Add doctype to form context for metadata access
  refreshAttachments?: () => Promise<void> // Method to refresh document attachments
  reload?: () => Promise<void> // Method to reload document data
}

export interface WorkflowActionResult {
  action: string
  success: boolean
  documentId: string
  doctype: string
  workflowState?: string
  error?: any
}

// Standard response format from workflow actions
export interface WorkflowResponse {
  message: {
    status: 'Success' | 'Error'
    message: string
    action: string
    [key: string]: any // For any additional fields
  }
}

/**
 * CachedMetadata interface for cached doctype metadata
 */
export interface CachedMetadata {
  rawMetadata: DoctypeMetadata
  fields: FormField[]
  linkedTabs: DocTypeLink[]
  documentActions: DocTypeAction[]
  hasWorkflow: boolean
  maxAttachments: number
  timestamp: number
  linkOptionsLoaded: boolean
}

/**
 * MetadataCache interface for metadata cache
 */
export interface MetadataCache {
  [doctype: string]: CachedMetadata
}

/**
 * Doctype type for simplified doctype structure
 */
export type Doctype = {
  metadata: DoctypeMetadata
  fields: FormField[]
  links: DocTypeLink[]
  actions: DocTypeAction[]
  permissions: any[]
}
