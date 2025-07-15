<template>
  <div class="form-page">
    <!-- Error on load message component -->
    <template v-if="error">
      <div class="flex justify-center items-center h-screen">
        <n-result
          status="500"
          title="500 Server Error"
          :description="error.message"
        >
          <template #footer>
            <n-button @click="retryLoad">Retry</n-button>
          </template>
        </n-result>
      </div>
    </template>

    <!-- Form Content -->
    <div class="px-8 py-4">
      <!-- Form Header -->
      <FormHeader
        v-if="metadata && formData && originalData"
        :doctype="doctype"
        :document-name="documentName"
        :mode="mode"
        :metadata="metadata"
        :document-data="formData"
        :is-dirty="isDirty"
        :is-saving="isSaving"
        :ui-behavior="effectiveUIBehavior"
        @toggle-mode="toggleMode"
        @save="handleSave"
        @cancel="handleCancel"
        @delete="handleDelete"
        @workflow-action="handleWorkflowAction"
        @document-action="handleDocumentAction"
      />

      <!-- Form Content with Tabs -->
      <div class="mt-4">
        <FormContent
          ref="formContentRef"
          v-if="metadata && formData && originalData"
          :doctype="doctype"
          :document-name="documentName"
          :mode="mode"
          :metadata="metadata"
          :document-data="formData"
          :original-data="originalData"
          :attachment-count="attachmentCount"
          :ui-behavior="effectiveUIBehavior"
          :loading="loading"
          @update:field="handleFieldUpdate"
          @update:document-data="handleDocumentUpdate"
        />
      </div>
    </div>

    <!-- Serial Number Update Modal -->
    <SerialNumberUpdateModal
      v-model:show="showSerialNumberModal"
      :inventory-ids="serialNumberInventoryIds"
      @success="handleSerialNumberSuccess"
      @error="handleSerialNumberError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useMessage,
  useDialog,
  useLoadingBar,
  NResult,
  NButton,
} from 'naive-ui'

import {
  useDocumentService,
  useMetadataService,
  useWorkflowService,
  useDocumentActionService,
  useClientScriptService,
} from '@/composables/services'
import { usePermissionsStore } from '@/stores/permissions'
import { isPermissionError } from '@/utils/permissionErrorHandler'

import { FormHeader, FormContent } from '@/components/new-form'
import SerialNumberUpdateModal from '@/components/feature/prcrmnt/SerialNumberUpdateModal.vue'

import type { DoctypeMetadata, FormField } from '@/types/metadata'
import type { Document } from '@/types/document'

// Define component name for KeepAlive
defineOptions({
  name: 'FormPage',
})

// ============================================================================
// INTERFACES
// ============================================================================
interface FormContentInstance {
  validate: () => boolean
}

interface Props {
  doctype?: string
  name?: string
  prefillData?: Record<string, any>
  isModal?: boolean
  uiBehavior?: {
    hideEdit?: boolean
    hideDelete?: boolean
    hideSave?: boolean
    hideCancel?: boolean
    hideWorkflow?: boolean
    hideDocumentActions?: boolean
  }
}

// ============================================================================
// PROPS & EMITS
// ============================================================================

const props = withDefaults(defineProps<Props>(), {
  doctype: '',
  name: 'new',
  prefillData: () => ({}),
  isModal: false,
  uiBehavior: () => ({
    hideEdit: false,
    hideDelete: false,
    hideSave: false,
    hideCancel: false,
    hideWorkflow: false,
    hideDocumentActions: false,
  }),
})

const emit = defineEmits(['close'])

// ============================================================================
// COMPOSABLES
// ============================================================================

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const loadingBar = useLoadingBar()

// Services
const { getDocument, saveDocument, deleteDocument } = useDocumentService()
const { getMetadata } = useMetadataService()
const { applyWorkflowAction } = useWorkflowService()
const { executeDocumentAction } = useDocumentActionService()

// Computed properties for doctype
const currentDoctype = computed(() => {
  return props.doctype || (route.params.doctype as string) || ''
})

const { runHook, clearFieldCustomizations, getTabConfig } =
  useClientScriptService(currentDoctype.value)

// Global permissions store
const permissionsStore = usePermissionsStore()

// ============================================================================
// REACTIVE STATE
// ============================================================================

const formContentRef = ref<FormContentInstance | null>(null)
const loading = ref(true)
const isSaving = ref(false)
const error = ref<{ title: string; message: string } | null>(null)
const metadata = ref<DoctypeMetadata | null>(null)
const formData = ref<Document | null>(null)
const originalData = ref<Document | null>(null)
const mode = ref<'view' | 'edit'>('view')
const attachmentCount = ref(0)

// Serial Number Modal state
const showSerialNumberModal = ref(false)
const serialNumberInventoryIds = ref<string[]>([])

// UI Behavior state - can be modified by client scripts
const uiBehaviorState = ref({
  hideEdit: false,
  hideDelete: false,
  hideSave: false,
  hideCancel: false,
  hideWorkflow: false,
  hideDocumentActions: false,
})

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================

const doctype = computed(() => {
  return props.doctype || (route.params.doctype as string) || ''
})

const documentName = computed(() => {
  return props.name || (route.params.name as string) || 'new'
})

const isNewDocument = computed(() => {
  return documentName.value === 'new'
})

const isDirty = computed(() => {
  if (!formData.value || !originalData.value) return false
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

// Combine UI behavior with global permissions
const effectiveUIBehavior = computed(() => {
  return {
    hideEdit:
      uiBehaviorState.value.hideEdit ||
      !permissionsStore.canWrite(doctype.value),
    hideDelete:
      uiBehaviorState.value.hideDelete ||
      !permissionsStore.canDelete(doctype.value),
    hideSave:
      uiBehaviorState.value.hideSave ||
      (!permissionsStore.canCreate(doctype.value) &&
        !permissionsStore.canWrite(doctype.value)),
    hideCancel: uiBehaviorState.value.hideCancel,
    hideWorkflow: uiBehaviorState.value.hideWorkflow,
    hideDocumentActions: uiBehaviorState.value.hideDocumentActions,
  }
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Initialize form mode based on route
 */
const initializeMode = () => {
  if (isNewDocument.value) {
    mode.value = 'edit'
  } else {
    mode.value = 'view'
  }
}

/**
 * Get default values for fields based on field type
 */
const getDefaultValues = (fields: FormField[]): Record<string, any> => {
  const defaults: Record<string, any> = {}

  fields.forEach((field) => {
    switch (field.fieldtype) {
      case 'Check':
        defaults[field.fieldname] = 0
        break
      case 'Currency':
      case 'Float':
      case 'Int':
        defaults[field.fieldname] = null
        break
      case 'Date':
      case 'Datetime':
      case 'Time':
        defaults[field.fieldname] = null
        break
      default:
        defaults[field.fieldname] = ''
    }
  })

  return defaults
}

// ============================================================================
// CLIENT SCRIPT HOOKS
// ============================================================================

/**
 * Run client script hook with proper context
 */
const executeClientScriptHook = async (
  hookName: string,
  fieldname?: string,
  value?: any,
) => {
  try {
    const context = {
      form: formData.value || {},
      fieldname,
      value,
      router,
      notify: {
        success: message.success,
        error: message.error,
        warning: message.warning,
        info: message.info,
      },
      setUIBehavior: (behavior: Partial<typeof uiBehaviorState.value>) => {
        Object.assign(uiBehaviorState.value, behavior)
      },
      redirect: (path: string) => {
        router.push(path)
      },
    }

    await runHook(
      hookName as any,
      context as any,
      formData.value || undefined,
      documentName.value !== 'new' ? documentName.value : undefined,
    )
  } catch (error) {
    console.error(`Error executing client script hook ${hookName}:`, error)

    if (
      error instanceof Error &&
      error.message !== 'Save prevented by client script' &&
      error.message !== 'Delete prevented by client script'
    ) {
      message.error(`Client script error: ${error.message}`)
    } else {
      throw error // Re-throw validation errors to prevent save/delete
    }
  }
}

// ============================================================================
// DATA LOADING
// ============================================================================

/**
 * Load document data
 */
const loadDocument = async () => {
  try {
    loading.value = true
    loadingBar.start()
    error.value = null

    if (!doctype.value) {
      throw new Error('Doctype is required')
    }

    // Ensure permissions are loaded
    if (!permissionsStore.isLoaded) {
      await permissionsStore.fetchBootInfo()
    }

    // Clear field customizations when switching documents/doctypes
    clearFieldCustomizations()

    // Load metadata
    metadata.value = await getMetadata(doctype.value)

    // Load document data
    if (isNewDocument.value) {
      // Create new document with default values
      const newDoc: Document = {
        name: '',
        owner: '',
        creation: '',
        modified: '',
        modified_by: '',
        docstatus: 0,
        idx: 0,
        doctype: doctype.value,
        ...getDefaultValues(metadata.value?.fields || []),
        ...props.prefillData,
        ...route.query,
      }

      formData.value = newDoc
      originalData.value = JSON.parse(JSON.stringify(newDoc))
    } else {
      // Load existing document
      const response = await getDocument(doctype.value, documentName.value)

      if (response.docs && response.docs.length > 0) {
        formData.value = response.docs[0]
        originalData.value = JSON.parse(JSON.stringify(response.docs[0]))

        // Set attachment count
        attachmentCount.value = response.docinfo?.attachments?.length || 0
      } else {
        throw new Error('Document not found')
      }
    }

    initializeMode()

    // Execute form load hook
    await executeClientScriptHook('form:onLoad')
  } catch (err: any) {
    console.error('Error loading document:', err)

    // Check if it's a permission error that wasn't handled by the service layer
    if (isPermissionError(err)) {
      // Let the service layer handle permission errors
      throw err
    }

    error.value = {
      title: 'Failed to Load Document',
      message: err instanceof Error ? err.message : 'An unknown error occurred',
    }
  } finally {
    loading.value = false
    loadingBar.finish()
  }
}

/**
 * Retry loading
 */
const retryLoad = () => {
  loadDocument()
}

// ============================================================================
// FORM INTERACTIONS
// ============================================================================

/**
 * Toggle between view and edit modes
 */
const toggleMode = (newMode: 'view' | 'edit') => {
  if (newMode === 'edit' && mode.value === 'view') {
    mode.value = 'edit'
  } else if (newMode === 'view' && mode.value === 'edit') {
    if (isDirty.value) {
      dialog.warning({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Do you want to discard them?',
        positiveText: 'Discard',
        negativeText: 'Cancel',
        onPositiveClick: () => {
          handleCancel()
        },
      })
    } else {
      mode.value = 'view'
    }
  }
}

/**
 * Handle field updates
 */
const handleFieldUpdate = async (fieldname: string, value: any) => {
  if (formData.value) {
    formData.value[fieldname] = value

    // Execute field change hook
    try {
      await executeClientScriptHook('form:fieldChange', fieldname, value)
    } catch (error) {
      // Revert the field value if client script prevents the change
      console.error('Field change prevented by client script:', error)
    }
  }
}

/**
 * Handle document updates
 */
const handleDocumentUpdate = (updatedData: Partial<Document>) => {
  if (formData.value) {
    Object.assign(formData.value, updatedData)
  }
}

// ============================================================================
// DOCUMENT ACTIONS
// ============================================================================

/**
 * Handle save
 */
const handleSave = async () => {
  if (formContentRef.value && !formContentRef.value.validate()) {
    message.error(
      'Please fill out all mandatory fields and correct any errors.',
    )
    return
  }

  try {
    if (!formData.value || !doctype.value) return

    isSaving.value = true

    // Execute before save hook
    await executeClientScriptHook('form:beforeSave')

    const result = await saveDocument(
      doctype.value,
      documentName.value,
      formData.value,
    )

    message.success('Document saved successfully')

    // Update form data and original data
    if (result) {
      formData.value = result
      originalData.value = JSON.parse(JSON.stringify(result))
    }

    // Execute after save hook
    await executeClientScriptHook('form:afterSave')

    // Switch to view mode after save
    mode.value = 'view'

    // If this was a new document, navigate to the saved document
    if (isNewDocument.value && result?.name) {
      if (props.isModal) {
        // In modal, update the name and emit close event with the new document
        if (formData.value) {
          formData.value.name = result.name
        }

        // Emit close event with the new document info for parent to handle
        emit('close', {
          action: 'saved',
          doctype: doctype.value,
          name: result.name,
          document: result,
        })
      } else {
        // For non-modal, navigate to the newly created document
        const targetPath = `/${doctype.value}/${result.name}`
        await router.push(targetPath)
      }
    }
  } catch (err: any) {
    console.error('Error saving document:', err)

    // Check if it's a permission error
    if (isPermissionError(err)) {
      // Let the service layer handle permission errors
      throw err
    }

    message.error(
      err instanceof Error ? err.message : 'Failed to save document',
    )
  } finally {
    isSaving.value = false
  }
}

/**
 * Handle cancel
 */
const handleCancel = () => {
  if (originalData.value) {
    formData.value = JSON.parse(JSON.stringify(originalData.value))
  }

  if (props.isModal) {
    emit('close')
    return
  }

  if (isNewDocument.value) {
    router.back()
  } else {
    mode.value = 'view'
  }
}

/**
 * Handle workflow actions
 */
const handleWorkflowAction = async (action: string) => {
  try {
    if (!formData.value || !doctype.value) return

    isSaving.value = true

    const result = await applyWorkflowAction(
      doctype.value,
      formData.value.name,
      action,
    )

    if (result.message?.status === 'Success') {
      message.success(result.message?.message || 'Success')

      // Handle workflow navigation if specified
      if (result.message?.action === 'generate_id' && result.message?.path) {
        router.push(result.message.path)
        return // Exit early since we're navigating away
      }
    } else {
      message.error(
        result.message?.message || 'Failed to execute workflow action',
      )
    }

    // Reload document to get updated state
    await loadDocument()
    mode.value = 'view'
  } catch (err: any) {
    console.error('Error executing workflow action:', err)

    // Check if it's a permission error
    if (isPermissionError(err)) {
      // Let the service layer handle permission errors
      throw err
    }

    message.error(
      err instanceof Error ? err.message : 'Failed to execute workflow action',
    )
  } finally {
    isSaving.value = false
  }
}

/**
 * Handle document actions
 */
const handleDocumentAction = async (action: string) => {
  try {
    if (!formData.value || !doctype.value) return

    isSaving.value = true

    const result = await executeDocumentAction(
      action,
      formData.value,
      doctype.value,
    )

    if (result.status == 'Success') {
      if (result.reload_doc) {
        await loadDocument()
      }

      if (result.action?.action == 'generate_id' && result.action.path) {
        router.push(result.action.path)
      } else if (
        result.action?.action == 'update_inventory' &&
        result.data?.inventory_ids
      ) {
        // Show the serial number update modal
        serialNumberInventoryIds.value = result.data.inventory_ids
        showSerialNumberModal.value = true
      }

      message.success(result.message || 'Action executed successfully.')
    }

    if (result.status == 'Error') {
      let errorMessage = result.message || 'Failed to execute document action'

      if (result.data?.message?.exception) {
        errorMessage += ' ' + result.data.message.exception
      }

      message.error(errorMessage)
    }
  } catch (err: any) {
    console.error('Error executing document action:', err)

    // Check if it's a permission error
    if (isPermissionError(err)) {
      // Let the service layer handle permission errors
      throw err
    }

    message.error(err.message || 'Failed to execute document action')
  } finally {
    isSaving.value = false
  }
}

/**
 * Handle delete
 */
const handleDelete = async () => {
  try {
    if (!formData.value || !doctype.value || isNewDocument.value) return

    isSaving.value = true

    // Execute before delete hook
    await executeClientScriptHook('form:beforeDelete')

    await deleteDocument(doctype.value, formData.value.name)

    message.success('Document deleted successfully')

    // Execute after delete hook
    await executeClientScriptHook('form:afterDelete')

    // Navigate back to list view
    if (props.isModal) {
      emit('close', {
        action: 'deleted',
        doctype: doctype.value,
        name: formData.value.name,
      })
    } else {
      const targetPath = `/${doctype.value}`
      await router.push(targetPath)
    }
  } catch (err: any) {
    console.error('Error deleting document:', err)

    // Check if it's a permission error
    if (isPermissionError(err)) {
      // Let the service layer handle permission errors
      throw err
    }

    message.error(
      err instanceof Error ? err.message : 'Failed to delete document',
    )
  } finally {
    isSaving.value = false
  }
}

// ============================================================================
// SERIAL NUMBER MODAL HANDLERS
// ============================================================================

/**
 * Handle Serial Number Modal Success
 */
const handleSerialNumberSuccess = (successMessage: string) => {
  message.success(successMessage)
  showSerialNumberModal.value = false
  serialNumberInventoryIds.value = []

  // Reload document to get updated state
  loadDocument()
}

/**
 * Handle Serial Number Modal Error
 */
const handleSerialNumberError = (errorMessage: string) => {
  message.error(errorMessage)
  showSerialNumberModal.value = false
  serialNumberInventoryIds.value = []
}

// ============================================================================
// WATCHERS & LIFECYCLE
// ============================================================================

// Watch for route changes
watch(
  () => [route.params.doctype, route.params.name],
  () => {
    if (props.isModal) return // Don't react to route changes in modal mode

    if (route.params.doctype && route.params.name) {
      loadDocument()
    }
  },
)

// After permissions loaded, enforce mode restrictions
watch(
  () => permissionsStore.isLoaded,
  (loaded) => {
    if (loaded) {
      // If existing document and no write permission, force view mode
      if (!isNewDocument.value && !permissionsStore.canWrite(doctype.value)) {
        mode.value = 'view'
      }
    }
  },
  { immediate: true },
)

onMounted(async () => {
  // Check if we already have document data loaded (from keep-alive cache)
  if (formData.value && originalData.value && metadata.value) {
    // If we have cached data, don't reload
    return
  }

  await loadDocument()
})
</script>

<style scoped></style>
