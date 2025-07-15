<template>
  <n-modal
    v-model:show="localShow"
    preset="card"
    title="Update Serial Numbers"
    style="width: 600px"
    :bordered="false"
    size="huge"
    role="dialog"
    aria-modal="true"
    @close="handleCancel"
  >
    <div class="serial-number-form">
      <n-form ref="formRef" :model="formData" :rules="rules">
        <div
          v-for="(inventoryId, index) in inventoryIds"
          :key="inventoryId"
          class="inventory-item"
        >
          <n-form-item
            :label="`Serial Number for ${inventoryId}`"
            :path="`items.${index}.serial_number`"
          >
            <n-input
              v-if="formData.items[index]"
              v-model:value="formData.items[index].serial_number"
              placeholder="Enter serial number"
              :disabled="loading"
            />
          </n-form-item>
        </div>
      </n-form>
    </div>

    <template #footer>
      <n-space justify="end" class="mt-4">
        <n-button @click="handleCancel" :disabled="loading"> Cancel </n-button>
        <n-button
          type="primary"
          @click="handleSubmit"
          :loading="loading"
          :disabled="loading"
        >
          Update
        </n-button>
      </n-space>
    </template>

    <n-alert type="info">
      Please enter serial numbers for the newly created inventory items.
    </n-alert>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NAlert,
  NButton,
  NSpace,
  useMessage,
} from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

interface InventoryItem {
  inventory_id: string
  serial_number: string
}

interface FormData {
  items: InventoryItem[]
}

const props = defineProps<{
  show: boolean
  inventoryIds: string[]
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  success: [message: string]
  error: [message: string]
}>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const localShow = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const formData = ref<FormData>({
  items: [],
})

const rules: FormRules = {
  items: {
    type: 'array',
    fields: {
      serial_number: {
        type: 'string',
        required: true,
        message: 'Serial number is required',
        trigger: ['blur', 'input'],
      },
    },
  },
}

// Initialize form data when inventory IDs change
watch(
  () => props.inventoryIds,
  (newIds) => {
    if (newIds && newIds.length > 0) {
      formData.value.items = newIds.map((id) => ({
        inventory_id: id,
        serial_number: '',
      }))
    } else {
      // Clear items when no IDs
      formData.value.items = []
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  try {
    // Validate form
    await formRef.value?.validate()

    loading.value = true

    // Import frappe call
    const { frappeCall } = await import('@/composables/useFrappeSDK')

    // Prepare data for the backend
    const serializedData = JSON.stringify(formData.value.items)

    // Call the backend function to update serial numbers
    const response = await frappeCall.post(
      'ci_eam.purchasing_and_stores.doctype.purchase_receipt.purchase_receipt.update_inventory_serialno',
      {
        list_inventory: serializedData,
      },
    )

    // Handle the response - the backend returns the object directly in response.message
    const responseData = response.message || response

    // Check for success - handle multiple possible success indicators
    const isSuccess =
      responseData?.status === 'Success' ||
      responseData?.status === 'success' ||
      (responseData && !responseData.status && !responseData.error) || // fallback for simple responses
      response.status === 200 // HTTP success

    if (isSuccess) {
      const successMessage =
        responseData?.message || 'Serial numbers updated successfully'

      message.success(successMessage)
      emit('success', successMessage)

      // Close modal first, then reset form to avoid render issues
      localShow.value = false

      // Reset form after a short delay to ensure modal is closed
      setTimeout(() => {
        formData.value.items = []
      }, 100)
    } else {
      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        'Failed to update serial numbers'
      console.error('Backend returned error:', responseData)

      message.error(errorMessage)
      emit('error', errorMessage)
    }
  } catch (error: any) {
    console.error('Error updating serial numbers:', error)

    const errorMessage =
      error?.message || error?.exc || 'Failed to update serial numbers'

    message.error(errorMessage)
    emit('error', errorMessage)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  localShow.value = false
  // Reset form after a short delay to ensure modal is closed
  setTimeout(() => {
    formData.value.items = []
  }, 100)
}
</script>

<style scoped></style>
