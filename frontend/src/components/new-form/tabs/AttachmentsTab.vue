<template>
  <div class="attachments-tab">
    <div class="flex flex-col">
      <n-space align="center" justify="start">
        <n-upload
          ref="uploadRef"
          :custom-request="handleUpload"
          :show-file-list="false"
          multiple
          :max="maxAttachments"
          :disabled="loading"
        >
          <n-button type="primary" :loading="loading" size="medium">
            <template #icon>
              <n-icon><Upload /></n-icon>
            </template>
            Upload Files
          </n-button>
        </n-upload>

        <n-tag type="warning" round size="medium" :bordered="false"
          >Max Attachments [{{ maxAttachments }}]</n-tag
        >
      </n-space>
    </div>

    <div class="attachments-content">
      <div v-if="attachments.length === 0" class="empty-state">
        <n-card class="mt-4">
          <n-empty description="No attachments yet">
            <template #icon>
              <n-icon><Paperclip /></n-icon>
            </template>
            <template #extra>
              <n-upload
                ref="uploadRef"
                :custom-request="handleUpload"
                :show-file-list="false"
                multiple
                :max="maxAttachments"
                :disabled="loading"
              >
                <n-button type="primary"> Upload First File </n-button>
              </n-upload>
            </template>
          </n-empty>
        </n-card>
      </div>

      <div v-else>
        <n-upload abstract :default-file-list="fileList" @remove="handleRemove">
          <n-card style="margin-top: 12px" title="File List">
            <n-upload-file-list />
          </n-card>
        </n-upload>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import {
  NButton,
  NIcon,
  NEmpty,
  NUpload,
  NCard,
  NUploadFileList,
  NSpace,
  useMessage,
  useDialog,
  type UploadCustomRequestOptions,
  type UploadFileInfo,
  NTag,
} from 'naive-ui'
import { Paperclip, Upload, FileUpload, Trash } from '@vicons/tabler'
import { useAttachmentService } from '@/composables/services/useAttachmentService'

interface Props {
  doctype: string
  documentName: string
  mode: 'view' | 'edit'
  maxAttachments?: number
}

interface Emits {
  (e: 'update:attachments', attachments: any[]): void
  (e: 'update:attachment-count', count: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const message = useMessage()
const dialog = useDialog()
const {
  uploadFile,
  removeAttachment,
  getDocumentAttachments,
  updateAttachmentState,
  refreshDocumentAttachments,
  getMaxAttachments,
} = useAttachmentService()

interface AttachmentInfo {
  name: string
  file_name: string
  file_url: string
  file_size?: number
  is_private?: number
}

const attachments = ref<AttachmentInfo[]>([])
const loading = ref(false)
const uploadRef = ref()
const maxAttachments = ref(props.maxAttachments || 10)

const fetchMaxAttachments = async () => {
  try {
    const value = await getMaxAttachments(props.doctype)
    maxAttachments.value = value > 0 ? value : props.maxAttachments || 10
  } catch (error) {
    console.error('Error fetching max attachments:', error)
    maxAttachments.value = props.maxAttachments || 10
  }
}

// Fetch max attachments when doctype or document changes
watch(() => [props.doctype, props.documentName], fetchMaxAttachments, {
  immediate: true,
})

const fileList = computed<UploadFileInfo[]>(() =>
  attachments.value.map((att) => ({
    id: att.name,
    name: att.file_name,
    status: 'finished',
    url: att.file_url,
    percentage: 100,
    type: 'text/plain',
  })),
)

const handleRemove = ({ file }: { file: UploadFileInfo }) => {
  dialog.warning({
    title: 'Confirm Deletion',
    content: `Are you sure you want to remove ${file.name}? This action cannot be undone.`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        loading.value = true
        const result = await updateAttachmentState(
          'remove',
          file.id,
          props.doctype,
          props.documentName,
        )

        if (result.success) {
          message.success(`${file.name} removed successfully.`)
          attachments.value = result.attachments
          emit('update:attachments', attachments.value)
          emit('update:attachment-count', attachments.value.length)
        } else {
          throw new Error('Failed to remove attachment')
        }
      } catch (error) {
        console.error('Removal error:', error)
        message.error(`Failed to remove ${file.name}.`)
      } finally {
        loading.value = false
      }
    },
  })
  return false
}

const handleUpload = async (options: UploadCustomRequestOptions) => {
  const { file, onFinish, onError } = options

  try {
    loading.value = true

    // Check file size (25MB limit)
    if (file.file && file.file.size > 25 * 1024 * 1024) {
      message.error('File size exceeds 25MB limit')
      onError()
      return
    }

    if (
      maxAttachments.value > 0 &&
      attachments.value.length >= maxAttachments.value
    ) {
      message.error(
        `Maximum attachment limit of ${maxAttachments.value} reached.`,
      )
      onError()
      return
    }

    // Upload file using attachment service
    const fileUrl = await uploadFile(file.file as File, {
      isPrivate: false,
      folder: 'Home/Attachments',
      doctype: props.doctype,
      docname: props.documentName !== 'new' ? props.documentName : undefined,
    })

    if (fileUrl) {
      message.success(`${file.name} uploaded successfully`)

      const updatedAttachments = await refreshDocumentAttachments(
        props.doctype,
        props.documentName,
      )
      attachments.value = updatedAttachments
      emit('update:attachments', attachments.value)
      emit('update:attachment-count', attachments.value.length)
      onFinish()
    } else {
      throw new Error('Upload failed')
    }
  } catch (error) {
    console.error('Upload error:', error)
    message.error(`Failed to upload ${file.name}`)
    onError()
  } finally {
    loading.value = false
  }
}

const loadAttachments = async () => {
  if (props.documentName === 'new') {
    attachments.value = []
    emit('update:attachment-count', 0)
    return
  }

  try {
    loading.value = true
    const result = await refreshDocumentAttachments(
      props.doctype,
      props.documentName,
    )
    attachments.value = Array.isArray(result) ? result : []
    emit('update:attachments', attachments.value)
    emit('update:attachment-count', attachments.value.length)
  } catch (error) {
    console.error('Error loading attachments:', error)
    attachments.value = []
    emit('update:attachment-count', 0)
  } finally {
    loading.value = false
  }
}

// Load attachments on mount
onMounted(() => {
  loadAttachments()
})
</script>

<style scoped></style>
