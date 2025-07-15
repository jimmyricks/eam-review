<template>
  <div class="form-fields">
    <n-grid :cols="2" :x-gap="24" :y-gap="0">
      <template v-for="field in visibleFields" :key="field.fieldname">
        <!-- Field Grid Item -->
        <n-gi class="field-grid-item">
          <div class="field-wrapper">
            <!-- Field Component -->
            <component
              :is="getFieldComponent(field.fieldtype)"
              :field="field"
              :value="getFieldValue(field.fieldname)"
              :mode="mode"
              :metadata="metadata"
              :readonly="
                mode === 'view' || isFieldReadOnly(field) || !canEditForm
              "
              :required="isFieldRequired(field)"
              :error="getFieldError(field.fieldname)"
              @update:value="handleFieldUpdate"
              @update:document="handleDocumentUpdate"
            />
          </div>
        </n-gi>
      </template>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, provide } from 'vue'
import {
  isFieldHidden,
  isFieldReadOnly,
  validateField,
} from '../../utils/fieldFormatters'
import type { DoctypeMetadata, FormField } from '@/types/metadata'
import type { Document } from '@/types/document'
import { NGrid, NGi } from 'naive-ui'
import { useVisibility } from './composables'
import { usePermissionsStore } from '@/stores/permissions'

// Field Components
import {
  LinkField,
  CheckField,
  SelectField,
  AttachField,
  DateField,
  CurrencyField,
  TextFields,
  NumberFields,
  TimeField,
} from '@/components/new-form'

interface Props {
  doctype: string
  documentName: string
  mode: 'view' | 'edit'
  metadata: DoctypeMetadata
  documentData: Document
}

interface Emits {
  (e: 'update:field', fieldname: string, value: any): void
  (e: 'update:document', documentData: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Global permissions
const permissionsStore = usePermissionsStore()

const documentDataRef = computed(() => props.documentData)
const { isVisible, isConditionallyMandatory } = useVisibility(documentDataRef)

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

// SELECT: select = Enable search/link in forms (hide redirect button)
const canSearchLink = computed(() => {
  return canSelect.value
})

// Provide doctype context for field components (make them reactive)
provide(
  'formDoctype',
  computed(() => props.doctype),
)
provide(
  'formDocumentName',
  computed(() => props.documentName),
)
provide(
  'formDocumentData',
  computed(() => props.documentData),
)

// Field validation errors
const fieldErrors = ref<Record<string, string>>({})

// Clear errors when switching to view mode
watch(
  () => props.mode,
  (newMode) => {
    if (newMode === 'view') {
      fieldErrors.value = {}
    }
  },
)

// Computed properties
const visibleFields = computed(() => {
  if (!props.metadata.fields) return []

  // FORM ACCESS: read = View List + Form (read-only, hide edit/delete buttons)
  // If user can't view the form, return empty array
  if (!canAccessFormPage.value) {
    return []
  }

  return props.metadata.fields.filter(
    (field) =>
      !isFieldHidden(field) &&
      isVisible(field.depends_on) &&
      field.fieldtype !== 'Table' &&
      field.fieldtype !== 'Column Break' &&
      field.fieldtype !== 'Section Break' &&
      field.fieldtype !== 'HTML' &&
      field.fieldtype !== 'Heading' &&
      field.fieldtype !== 'Attach',
  )
})

// Field component mapping
const getFieldComponent = (fieldtype: string) => {
  switch (fieldtype) {
    case 'Link':
      return LinkField
    case 'Check':
      return CheckField
    case 'Select':
      return SelectField
    case 'Attach':
    case 'Attach Image':
      return AttachField
    case 'Date':
    case 'Datetime':
      return DateField
    case 'Currency':
      return CurrencyField
    case 'Data':
    case 'Small Text':
    case 'Long Text':
    case 'Text':
      return TextFields
    case 'Float':
    case 'Int':
      return NumberFields
    case 'Time':
      return TimeField
    default:
      return TextFields // Fallback to text field
  }
}

// Field value helpers
const getFieldValue = (fieldname: string) => {
  return props.documentData[fieldname]
}

const isFieldRequired = (field: FormField): boolean => {
  return (
    Boolean(field.reqd) || isConditionallyMandatory(field.mandatory_depends_on)
  )
}

const getFieldError = (fieldname: string): string | null => {
  return fieldErrors.value[fieldname] || null
}

// Field update handler
const handleFieldUpdate = (fieldname: string, value: any) => {
  // Validate field
  const field = props.metadata.fields?.find((f) => f.fieldname === fieldname)
  if (field) {
    let error: string | null = null
    const isMandatory = isFieldRequired(field)

    if (
      isMandatory &&
      (value === null || value === undefined || value === '')
    ) {
      error = `${field.label} is required`
    } else {
      error = validateField(field, value)
    }

    if (error) {
      fieldErrors.value[fieldname] = error
    } else {
      delete fieldErrors.value[fieldname]
    }
  }

  // Emit update
  emit('update:field', fieldname, value)
}

// Document update handler
const handleDocumentUpdate = (documentData: any) => {
  emit('update:document', documentData)
}

// Helper to determine if field is read-only based on field config and mode
const isFieldReadOnlyComputed = (
  field: FormField,
  mode: 'view' | 'edit',
): boolean => {
  if (mode === 'view') return true
  return isFieldReadOnly(field)
}

const validate = (): boolean => {
  let isValid = true
  fieldErrors.value = {} // Reset errors

  visibleFields.value.forEach((field) => {
    const value = getFieldValue(field.fieldname)
    const isMandatory = isFieldRequired(field)
    let error: string | null = null

    if (
      isMandatory &&
      (value === null || value === undefined || value === '')
    ) {
      error = `${field.label} is required`
    } else {
      error = validateField(field, value)
    }

    if (error) {
      isValid = false
      fieldErrors.value[field.fieldname] = error
    }
  })

  return isValid
}

defineExpose({
  validate,
})

export interface FormFieldsInstance {
  validate: () => boolean
}
</script>

<style scoped></style>
