<template>
  <n-form-item
    v-if="field.fieldtype === 'Attach Image'"
    :label="field.label"
    :required="required"
    :validation-status="error ? 'error' : undefined"
    :feedback="error || undefined"
  >
    <div class="attach-image-field">
      <!-- State when an image is selected -->
      <n-input-group v-if="displayValue">
        <n-input :value="displayValue" disabled placeholder="Image URL" />

        <n-button @click="viewImage" secondary>
          <template #icon><n-icon :component="EyeIcon" /></template>
        </n-button>

        <n-button v-if="!readonly" @click="clearImage" secondary type="error">
          <template #icon><n-icon :component="DeleteIcon" /></template>
        </n-button>
      </n-input-group>

      <!-- State when no image is selected -->
      <n-input-group v-else>
        <n-button
          type="primary"
          :disabled="readonly"
          @click="showUploadModal = true"
        >
          Upload
        </n-button>
        <n-input placeholder="No image selected" disabled />
      </n-input-group>
    </div>

    <AttachmentUploadModal
      v-model:show="showUploadModal"
      :doctype="doctypeValue"
      :docname="docnameValue"
      :fieldname="field.fieldname"
      @upload-complete="handleUploadComplete"
    />
  </n-form-item>

  <!-- For Attach field type, we don't render anything as it's handled by AttachmentsTab -->
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue'
import {
  NFormItem,
  NInput,
  NButton,
  NIcon,
  NInputGroup,
  useMessage,
  useDialog,
} from 'naive-ui'
import {
  Eye as EyeIcon,
  Trash as DeleteIcon,
  SwapHorizontal as ReplaceIcon,
} from '@vicons/tabler'
import { formatFieldValue, formatValueForSave } from '@/utils/fieldFormatters'
import type { FormField } from '@/types/metadata'
import AttachmentUploadModal from './AttachmentUploadModal.vue'
import { useAttachmentService } from '@/composables/services/useAttachmentService'
import { ComputedRef } from 'vue'

interface Props {
  field: FormField
  value: any
  mode: 'view' | 'edit'
  readonly?: boolean
  required?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:value', fieldname: string, value: any): void
  (e: 'update:document', documentData: any): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  required: false,
  error: null,
})

const emit = defineEmits<Emits>()

// Inject doctype and documentName from parent FormFields component
const doctype = inject<ComputedRef<string> | string>('formDoctype')
const docname = inject<ComputedRef<string> | string>('formDocumentName')

// Get the actual values (handle both computed and direct values)
const doctypeValue = computed(() => {
  if (doctype && typeof doctype === 'object' && 'value' in doctype) {
    return doctype.value
  }
  return doctype as string
})

const docnameValue = computed(() => {
  if (docname && typeof docname === 'object' && 'value' in docname) {
    return docname.value
  }
  return docname as string
})

// Debug logging
// console.log('AttachField injected values:', {
//   doctype: doctypeValue.value,
//   docname: docnameValue.value,
//   fieldname: props.field.fieldname,
// })

const message = useMessage()
const dialog = useDialog()
const showUploadModal = ref(false)
const { getDocumentAttachments, removeAttachment, updateAttachmentState } =
  useAttachmentService()

// Only render for Attach Image fields
const shouldRender = computed(() => {
  return props.field.fieldtype === 'Attach Image'
})

// Computed properties
const displayValue = computed(() => {
  const formatted = formatFieldValue(props.field, props.value)
  return formatted.displayValue || ''
})

// Handle upload complete from modal
const handleUploadComplete = (fileUrl: string) => {
  if (fileUrl) {
    const formattedValue = formatValueForSave(props.field, fileUrl)
    emit('update:value', props.field.fieldname, formattedValue)
    showUploadModal.value = false
  }
}

// View image in new tab
const viewImage = () => {
  if (displayValue.value) {
    window.open(displayValue.value, '_blank')
  }
}

// Clear image
const clearImage = () => {
  dialog.warning({
    title: 'Confirm Deletion',
    content:
      'Are you sure you want to remove this image? This will delete the attachment permanently.',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      if (!doctypeValue.value || !docnameValue.value || !props.value) {
        message.error('Cannot remove attachment: missing document context.')
        return
      }

      try {
        // Find the attachment's file ID (name) from its URL
        const attachments = await getDocumentAttachments(
          doctypeValue.value,
          docnameValue.value,
        )
        const attachment = attachments.find((a) => a.file_url === props.value)

        if (!attachment) {
          // If not found in attachments, maybe it's a new unsaved file. Just clear the field.
          message.info('Image cleared from field.')
          emit('update:value', props.field.fieldname, null)
          return
        }

        // We found the attachment, now remove it using its name (which is the fid)
        const result = await updateAttachmentState(
          'remove',
          attachment.name,
          doctypeValue.value,
          docnameValue.value,
        )

        if (result.success) {
          // After successful removal, update the field value to null
          const formattedValue = formatValueForSave(props.field, null)
          emit('update:value', props.field.fieldname, formattedValue)

          // Update the document data to prevent timestamp conflicts
          if (result.documentData) {
            emit('update:document', result.documentData)
          }

          message.success('Image removed successfully.')
        } else {
          throw new Error('Failed to remove attachment')
        }
      } catch (error) {
        console.error('Error removing attachment:', error)
        message.error('Failed to remove image.')
      }
    },
  })
}
</script>

<style scoped>
.attach-image-field {
  width: 100%;
}
</style>
