// =============================================================================
// Services Export Index
// =============================================================================
// This file provides centralized access to all service composables.
// Import pattern: import { useDocumentService, useMetadataService } from '@/composables/services'

// Core Service Layer
// -------------------------
// New unified service composables

// Document Operations
export { useDocumentService } from './useDocumentService'

// Metadata Management
export { useMetadataService } from './useMetadataService'

// List Operations
export { useListService } from './useListService'

// Search Operations
export { useSearchService } from './useSearchService'

// Workflow Operations
export { useWorkflowService } from './useWorkflowService'

// Document Actions
export { useDocumentActionService } from './useDocumentActionService'

// File and Attachment Operations
export { useAttachmentService } from './useAttachmentService' 

// Client Script Operations
export { useClientScriptService } from './useClientScriptService' 