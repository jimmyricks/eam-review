<template>
  <div class="form-header">
    <div class="">
      <n-space justify="space-between" align="center">
        <!-- Left Section: Document Info -->
        <n-space align="center">
          <!-- Document Name -->
          <h1 class="text-2xl font-medium">
            {{ isNewDocument ? `New ${doctype}` : documentName }}
          </h1>

          <div
            v-if="
              !isNewDocument &&
              documentData.workflow_state &&
              !props.uiBehavior.hideWorkflow
            "
          >
            <!-- Workflow State -->
            <span>
              <!-- Dropdown if actions available -->
              <n-dropdown
                v-if="workflowActions.length > 0"
                :options="workflowActionOptions"
                @select="handleWorkflowAction"
              >
                <n-button :type="workflowStateType" size="medium">
                  <template #icon>
                    <n-icon><ChevronDown /></n-icon>
                  </template>
                  {{ documentData.workflow_state }}
                </n-button>
              </n-dropdown>
              <!-- Read-only button if no actions -->
              <n-button v-else :type="workflowStateType" size="medium" disabled>
                {{ documentData.workflow_state }}
              </n-button>
            </span>
          </div>
        </n-space>

        <!-- Right Section: Actions -->
        <div>
          <n-space>
            <n-dropdown
              v-if="
                documentActions.length > 0 &&
                !props.uiBehavior.hideDocumentActions
              "
              trigger="hover"
              :options="documentActionOptions"
              @select="handleDocumentAction"
              placement="bottom-start"
            >
              <n-button>
                <template #icon>
                  <n-icon><ChevronDown /></n-icon>
                </template>
                Actions
              </n-button>
            </n-dropdown>
            <!-- View Mode Actions -->
            <div
              v-if="
                mode === 'view' &&
                !isNewDocument &&
                (showEditButton || showDeleteButton)
              "
              class="flex items-center"
            >
              <n-button-group size="medium">
                <n-button
                  v-if="showEditButton"
                  @click="$emit('toggle-mode', 'edit')"
                  type="primary"
                >
                  <template #icon>
                    <n-icon><Edit /></n-icon>
                  </template>
                  Edit
                </n-button>
                <n-button
                  v-if="showDeleteButton"
                  type="error"
                  @click="handleDelete"
                >
                  <template #icon>
                    <n-icon><TrashX /></n-icon>
                  </template>
                  Delete
                </n-button>
              </n-button-group>
            </div>

            <!-- Edit Mode Actions -->
            <div
              v-if="
                mode === 'edit' &&
                (showSaveButton || !props.uiBehavior?.hideCancel)
              "
            >
              <n-button-group size="medium">
                <n-button
                  v-if="showSaveButton"
                  type="primary"
                  @click="$emit('save')"
                  :loading="isSaving"
                  :disabled="!canSave"
                >
                  <template #icon>
                    <n-icon><Check /></n-icon>
                  </template>
                  {{ isNewDocument ? 'Create' : 'Save' }}
                </n-button>
                <n-button
                  v-if="!props.uiBehavior?.hideCancel"
                  @click="$emit('cancel')"
                  :disabled="isSaving"
                >
                  <template #icon>
                    <n-icon><X /></n-icon>
                  </template>
                  Cancel
                </n-button>
              </n-button-group>
            </div>

            <!-- Additional Actions (View Mode) -->

            <!-- <div
              v-if="mode === 'view' && !isNewDocument"
              class="flex items-center"
            >
              <n-dropdown
                trigger="hover"
                :options="menuOptions"
                @select="handleMenuAction"
              >
                <n-button quaternary circle>
                  <template #icon>
                    <n-icon><MenuIcon /></n-icon>
                  </template>
                </n-button>
              </n-dropdown>
            </div> -->
          </n-space>
        </div>
      </n-space>
    </div>

    <!-- Dirty State Indicator -->
    <!-- <div v-if="isDirty" class="dirty-indicator">
      <n-alert type="warning" size="small" :closable="false">
        <template #icon>
          <n-icon><UnsavedIcon /></n-icon>
        </template>
        You have unsaved changes
      </n-alert>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import {
  NButton,
  NButtonGroup,
  NTag,
  NPopover,
  NDropdown,
  NIcon,
  NSpace,
  NAlert,
  useDialog,
  type DropdownOption,
} from 'naive-ui'
import { Printer, Edit, TrashX, Check, X, ChevronDown } from '@vicons/tabler'
import { useWorkflowService } from '@/composables/services'
import { usePermissionsStore } from '@/stores/permissions'
import type { DoctypeMetadata, DocumentAction } from '@/types/metadata'
import type { Document } from '@/types/document'
import { getWorkflowStateType } from '@/utils/workflowStates'

interface Props {
  doctype: string
  documentName: string
  mode: 'view' | 'edit'
  metadata: DoctypeMetadata
  documentData: Document
  isDirty: boolean
  isSaving: boolean
  uiBehavior?: {
    hideEdit?: boolean
    hideDelete?: boolean
    hideSave?: boolean
    hideCancel?: boolean
    hideWorkflow?: boolean
    hideDocumentActions?: boolean
  }
}

interface Emits {
  (e: 'toggle-mode', mode: 'view' | 'edit'): void
  (e: 'save'): void
  (e: 'cancel'): void
  (e: 'delete'): void
  (e: 'workflow-action', action: string): void
  (e: 'document-action', action: string): void
}

const props = withDefaults(defineProps<Props>(), {
  uiBehavior: () => ({
    hideEdit: false,
    hideDelete: false,
    hideSave: false,
    hideCancel: false,
    hideWorkflow: false,
    hideDocumentActions: false,
  }),
})
const emit = defineEmits<Emits>()
const dialog = useDialog()

// Global permissions
const permissionsStore = usePermissionsStore()

const { getWorkflowTransitions, getAvailableActions, hasWorkflow } =
  useWorkflowService()

// Permission-based computed properties
const canRead = computed(() => {
  return permissionsStore.canRead(props.doctype)
})

const canWrite = computed(() => {
  return permissionsStore.canWrite(props.doctype)
})

const canCreate = computed(() => {
  return permissionsStore.canCreate(props.doctype)
})

const canDelete = computed(() => {
  return permissionsStore.canDelete(props.doctype)
})

const canSelect = computed(() => {
  return permissionsStore.canSearch(props.doctype)
})

const isNewDocument = computed(() => {
  return props.documentName === 'new'
})

// Proper Permission Logic using FrappePermissions logic
// Only can_read grants form access

// FORM ACCESS: Only can_read grants form access
const canAccessFormPage = computed(() => {
  return canRead.value
})

// EDITING: read + write = Edit capabilities
const canEditForm = computed(() => {
  return canRead.value && canWrite.value
})

// CREATING: create = Show "Add" buttons + /new Form access
const canCreateRecord = computed(() => {
  return canCreate.value
})

// For new documents: create permission is required
const canAccessNewRoute = computed(() => {
  return canCreate.value && canRead.value
})

// DELETING: delete + read = Delete from Form
const canDeleteFromForm = computed(() => {
  if (isNewDocument.value) {
    return false // Can't delete a new document
  }
  return canRead.value && canDelete.value
})

// UI visibility based on proper permission logic
const showEditButton = computed(() => {
  // EDITING: read + write = Edit capabilities
  return !props.uiBehavior?.hideEdit && canEditForm.value
})

const showDeleteButton = computed(() => {
  // DELETING: delete + read = Delete from Form
  return !props.uiBehavior?.hideDelete && canDeleteFromForm.value
})

const showSaveButton = computed(() => {
  // For new documents: create permission required
  // For existing documents: read + write required
  if (isNewDocument.value) {
    return !props.uiBehavior?.hideSave && canCreate.value
  }
  return !props.uiBehavior?.hideSave && canEditForm.value
})

// Determine if form should be in view-only mode
const shouldBeViewOnly = computed(() => {
  if (isNewDocument.value) {
    return !canCreate.value
  }
  return !canEditForm.value
})

const workflowActions = ref<string[]>([])

const fetchWorkflowActions = async () => {
  if (
    isNewDocument.value ||
    !hasWorkflow(props.metadata) ||
    !props.documentData.workflow_state
  ) {
    workflowActions.value = []
    return
  }
  try {
    const transitions = await getWorkflowTransitions(
      props.doctype,
      props.documentName,
      props.documentData,
    )
    workflowActions.value = getAvailableActions(transitions)
  } catch (error) {
    console.error('Failed to fetch workflow actions', error)
    workflowActions.value = []
  }
}

watch(
  () => [props.documentName, props.documentData.workflow_state],
  () => {
    fetchWorkflowActions()
  },
  { immediate: true, deep: true },
)

const canSave = computed(() => {
  return props.isDirty || isNewDocument.value
})

const documentActions = computed((): DocumentAction[] => {
  // Get document actions from metadata
  if (props.metadata.actions) {
    return props.metadata.actions.filter((action) => !action.hidden)
  }
  return []
})

const workflowActionOptions = computed((): DropdownOption[] => {
  return workflowActions.value.map((action) => ({
    label: action,
    key: action,
  }))
})

const documentActionOptions = computed((): DropdownOption[] => {
  return documentActions.value.map((action) => ({
    label: action.label,
    key: action.action,
  }))
})

const menuOptions = computed((): DropdownOption[] => {
  const options: DropdownOption[] = []

  if (!isNewDocument.value) {
    options.push({
      label: 'Print',
      key: 'print',
      icon: () => h(NIcon, null, { default: () => h(Printer) }),
    })
  }

  return options
})

const workflowStateType = computed(() =>
  getWorkflowStateType(props.documentData.workflow_state || ''),
)

// Helper functions
const getDocstatusType = (docstatus: number) => {
  switch (docstatus) {
    case 0:
      return 'default'
    case 1:
      return 'success'
    case 2:
      return 'error'
    default:
      return 'default'
  }
}

const getDocstatusLabel = (docstatus: number) => {
  switch (docstatus) {
    case 0:
      return 'Draft'
    case 1:
      return 'Submitted'
    case 2:
      return 'Cancelled'
    default:
      return 'Unknown'
  }
}

// Event handlers
const handleWorkflowAction = (action: string) => {
  emit('workflow-action', action)
}

const handleDocumentAction = (action: string) => {
  emit('document-action', action)
}

const handleDelete = () => {
  dialog.warning({
    title: 'Confirm Deletion',
    content: `Are you sure you want to delete ${props.doctype} "${props.documentName}"? This action cannot be undone.`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      emit('delete')
    },
  })
}

const handleMenuAction = (action: string) => {
  // console.log('Menu action:', action)
  // TODO: Implement menu actions
}
</script>

<style scoped></style>
