<template>
  <n-modal
    :show="show"
    @update:show="closeModal"
    preset="card"
    :title="title"
    style="width: 600px"
    :mask-closable="!isUploading"
  >
    <div class="upload-container">
      <n-upload
        ref="uploadRef"
        :default-upload="false"
        :multiple="false"
        @change="handleFileChange"
        :show-file-list="false"
        :accept="accept"
      >
        <n-upload-dragger>
          <div style="margin-bottom: 12px">
            <n-icon size="48" :depth="3">
              <archive-icon />
            </n-icon>
          </div>
          <n-text style="font-size: 16px">
            Click or drag a file to this area
          </n-text>
          <n-p depth="3" style="margin: 8px 0 0 0">
            The file will be validated before uploading.
          </n-p>
        </n-upload-dragger>
      </n-upload>

      <div v-if="selectedFile" class="file-info">
        <div class="file-details">
          <p>
            <strong>File:</strong>
            <span>{{ selectedFile.name }}</span>
          </p>
          <p>
            <strong>Size:</strong>
            <span>{{ (selectedFile.size / 1024).toFixed(2) }} KB</span>
          </p>
          <p v-if="validationMessage" class="validation-error">
            <strong>Error:</strong>
            <span>{{ validationMessage }}</span>
          </p>
        </div>
      </div>
    </div>
    <template #footer>
      <n-space justify="end">
        <n-button @click="closeModal" :disabled="isUploading">
          Cancel
        </n-button>
        <n-button
          type="primary"
          :disabled="!canUpload"
          :loading="isUploading"
          @click="handleUpload"
        >
          Upload
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NModal,
  NButton,
  NUpload,
  NUploadDragger,
  NIcon,
  NText,
  NSpace,
  NP,
  useMessage,
  type UploadFileInfo,
} from 'naive-ui'
import { Archive as ArchiveIcon } from '@vicons/tabler'
import { useAttachmentService } from '@/composables/services/useAttachmentService'

// Props
const props = withDefaults(
  defineProps<{
    show: boolean
    title?: string
    doctype?: string
    docname?: string
    fieldname?: string
    folder?: string
    accept?: string
    maxSize?: number // in MB
  }>(),
  {
    title: 'Upload File',
    doctype: undefined,
    docname: undefined,
    fieldname: undefined,
    folder: 'Home/Attachments',
    accept: 'image/*',
    maxSize: 25,
  },
)

// Emits
const emit = defineEmits(['update:show', 'upload-complete'])

// Refs
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const validationMessage = ref<string | null>(null)

const { uploadFile, validateFile } = useAttachmentService()
const message = useMessage()

// Computed
const canUpload = computed(() => {
  return selectedFile.value && !isUploading.value && !validationMessage.value
})

// Methods
const handleFileChange = (data: { fileList: UploadFileInfo[] }) => {
  const fileInfo = data.fileList[0]
  if (fileInfo && fileInfo.file) {
    selectedFile.value = fileInfo.file
    validateSelectedFile()
  } else {
    selectedFile.value = null
    validationMessage.value = null
  }
}

const validateSelectedFile = async () => {
  if (!selectedFile.value) {
    validationMessage.value = null
    return
  }

  const { isValid, errorMessage } = await validateFile(
    selectedFile.value,
    props.maxSize * 1024 * 1024,
    [props.accept],
  )
  if (!isValid) {
    validationMessage.value = errorMessage || 'Invalid file.'
  } else {
    validationMessage.value = null
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) return

  isUploading.value = true
  try {
    const fileUrl = await uploadFile(selectedFile.value, {
      isPrivate: false,
      folder: props.folder,
      doctype: props.doctype,
      docname: props.docname,
      fieldname: props.fieldname,
    })

    if (fileUrl) {
      message.success('File uploaded successfully')
      emit('upload-complete', fileUrl)
      closeModal()
    } else {
      throw new Error('Upload failed: No file URL returned.')
    }
  } catch (error) {
    console.error('Upload error:', error)
    message.error('Failed to upload file.')
  } finally {
    isUploading.value = false
  }
}

const closeModal = () => {
  if (!isUploading.value) {
    selectedFile.value = null
    validationMessage.value = null
    emit('update:show', false)
  }
}
</script>

<style scoped>
.upload-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-info {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.file-details p {
  margin: 0 0 8px 0;
  display: flex;
  justify-content: space-between;
}

.file-details p:last-child {
  margin-bottom: 0;
}

.file-details span {
  text-align: right;
  max-width: 70%;
  word-break: break-all;
}

.validation-error span {
  color: #d03050;
}
</style>
