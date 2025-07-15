<template>
  <n-modal
    v-model:show="isVisible"
    preset="card"
    title="Column Settings"
    :mask-closable="false"
    :style="{ width: '600px', maxHeight: '80vh' }"
  >
    <div class="overflow-y-auto">
      <!-- Header info -->
      <n-alert
        :type="selectedCount >= maxColumns ? 'warning' : 'info'"
        size="small"
        :show-icon="false"
        class="mb-4"
      >
        <n-space justify="space-between" align="center">
          <n-text strong>Select columns to display</n-text>
          <n-text> {{ selectedCount }} / {{ maxColumns }} selected </n-text>
        </n-space>
      </n-alert>

      <!-- Column selection -->
      <div class="mb-4">
        <n-checkbox-group v-model:value="selectedFields">
          <n-grid :cols="2" :x-gap="6" :y-gap="8">
            <n-gi v-for="field in availableFields" :key="field.fieldname">
              <n-checkbox
                :value="field.fieldname"
                :disabled="isFieldDisabled(field.fieldname)"
                :label="field.label"
              >
                <div class="flex items-center gap-2 w-full">
                  <span class="flex-1 truncate">{{ field.label }}</span>
                  <n-tag
                    v-if="isMandatoryField(field.fieldname)"
                    size="tiny"
                    type="primary"
                  >
                    Required
                  </n-tag>
                  <n-tag v-else-if="field.in_list_view" size="tiny" type="info">
                    Default
                  </n-tag>
                </div>
              </n-checkbox>
            </n-gi>
          </n-grid>
        </n-checkbox-group>
      </div>
    </div>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleReset">Reset to Default</n-button>
        <n-button @click="handleCancel" tertiary>
          <template #icon>
            <n-icon><x /></n-icon>
          </template>
          Cancel
        </n-button>
        <n-button
          type="primary"
          @click="handleApply"
          :disabled="selectedCount === 0"
        >
          <template #icon>
            <n-icon><check /></n-icon>
          </template>
          Apply
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NModal,
  NCheckboxGroup,
  NCheckbox,
  NButton,
  NSpace,
  NText,
  NTag,
  NGrid,
  NGi,
  NAlert,
  NIcon,
} from 'naive-ui'
import type { ColumnField } from '@/types/Lists'
import { Check, X } from '@vicons/tabler'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const MAX_COLUMNS = 4
const MANDATORY_FIELDS = ['name']
const WORKFLOW_FIELDS = ['workflow_state']

// -----------------------------------------------------------------------------
// Props & Emits
// -----------------------------------------------------------------------------
interface Props {
  show: boolean
  availableFields: ColumnField[]
  visibleFields: string[]
  maxColumns: number
  isMandatoryField: (fieldname: string) => boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  apply: [fieldNames: string[]]
  cancel: []
}>()

// -----------------------------------------------------------------------------
// Local State
// -----------------------------------------------------------------------------
const isVisible = ref(props.show)
const selectedFields = ref<string[]>([])

// -----------------------------------------------------------------------------
// Computed Properties
// -----------------------------------------------------------------------------
const selectedCount = computed(() => selectedFields.value.length)

const defaultFields = computed(() => {
  // Get first 6 fields with in_list_view = 1, ensuring mandatory fields are included
  const mandatory = props.availableFields.filter((f) =>
    props.isMandatoryField(f.fieldname),
  )
  const listViewFields = props.availableFields.filter(
    (f) => f.in_list_view && !props.isMandatoryField(f.fieldname),
  )

  const combined = [...mandatory, ...listViewFields]
  return combined.slice(0, props.maxColumns).map((f) => f.fieldname)
})

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------
const isFieldDisabled = (fieldname: string): boolean => {
  // Mandatory fields are always disabled (always selected)
  if (props.isMandatoryField(fieldname)) {
    return true
  }

  // If we've reached max columns and this field isn't selected, disable it
  return (
    selectedCount.value >= props.maxColumns &&
    !selectedFields.value.includes(fieldname)
  )
}

// -----------------------------------------------------------------------------
// Event Handlers
// -----------------------------------------------------------------------------
const handleApply = () => {
  if (selectedCount.value === 0) return

  // Ensure mandatory fields are always included
  const mandatoryFields = props.availableFields
    .filter((f) => props.isMandatoryField(f.fieldname))
    .map((f) => f.fieldname)

  const finalFields = [
    ...mandatoryFields,
    ...selectedFields.value.filter((f) => !props.isMandatoryField(f)),
  ].slice(0, props.maxColumns)

  emit('apply', finalFields)
  isVisible.value = false
}

const handleCancel = () => {
  // Reset to current visible fields
  selectedFields.value = [...props.visibleFields]
  isVisible.value = false
  emit('cancel')
}

const handleReset = () => {
  selectedFields.value = [...defaultFields.value]
}

// -----------------------------------------------------------------------------
// Watchers
// -----------------------------------------------------------------------------
watch(
  () => props.show,
  (newValue) => {
    isVisible.value = newValue
    if (newValue) {
      // Initialize with current visible fields
      selectedFields.value = [...props.visibleFields]
    }
  },
)

watch(isVisible, (newValue) => {
  emit('update:show', newValue)
})

// Ensure mandatory fields are always selected
watch(
  selectedFields,
  (newFields) => {
    const mandatoryFields = props.availableFields
      .filter((f) => props.isMandatoryField(f.fieldname))
      .map((f) => f.fieldname)

    const missingMandatory = mandatoryFields.filter(
      (f) => !newFields.includes(f),
    )

    if (missingMandatory.length > 0) {
      selectedFields.value = [...newFields, ...missingMandatory]
    }
  },
  { deep: true },
)
</script>
