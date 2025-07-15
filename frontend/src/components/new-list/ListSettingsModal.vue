<template>
  <n-modal
    v-model:show="isVisible"
    preset="card"
    title="Column Settings"
    :mask-closable="false"
    :style="{ width: '620px' }"
  >
    <div class="overflow-y-auto">
      <!-- Header info -->
      <n-alert
        :type="selectedCount >= MAX_COLUMNS ? 'warning' : 'info'"
        size="medium"
        :show-icon="false"
        class="mb-4"
      >
        <n-space justify="space-between" align="center">
          <n-text strong>Select columns to display</n-text>
          <n-text>{{ selectedCount }} / {{ MAX_COLUMNS }} selected</n-text>
        </n-space>
      </n-alert>

      <!-- Column selection -->
      <div class="mb-4">
        <n-checkbox-group v-model:value="selectedFields">
          <n-grid :cols="2" :y-gap="6" :x-gap="6">
            <n-gi v-for="field in availableFields" :key="field.fieldname">
              <div class="flex items-center gap-4 w-full">
                <div
                  class="bg-gray-50 dark:bg-gray-800 rounded-md px-4 w-full h-14 flex items-center"
                >
                  <n-space
                    justify="space-between"
                    align="center"
                    class="w-full"
                  >
                    <!-- Left: Label and "Required" tag -->
                    <div class="flex items-center gap-2 flex-1">
                      <n-checkbox
                        :value="field.fieldname"
                        :disabled="isFieldDisabled(field.fieldname)"
                      >
                        <span class="truncate">{{ field.label }}</span>
                      </n-checkbox>
                      <n-tag
                        v-if="isMandatoryField(field.fieldname)"
                        size="tiny"
                        type="primary"
                      >
                        Required
                      </n-tag>
                    </div>

                    <!-- Right: Column width input -->
                    <n-input-number
                      v-if="selectedFields.includes(field.fieldname)"
                      v-model:value="columnWidths[field.fieldname]"
                      :min="1"
                      :max="3"
                      size="small"
                      style="width: 70px"
                      placeholder="0"
                    />
                  </n-space>
                </div>
              </div>
            </n-gi>
          </n-grid>
        </n-checkbox-group>
      </div>

      <!-- Width summary -->
      <n-alert
        :type="totalWidth > MAX_WIDTH ? 'error' : 'success'"
        size="medium"
        :show-icon="false"
        class="mb-4"
      >
        <n-space justify="space-between" align="center">
          <n-text strong>Total Column Width</n-text>
          <n-text :class="{ 'text-red-500': totalWidth > MAX_WIDTH }">
            {{ totalWidth }} / {{ MAX_WIDTH }}
          </n-text>
        </n-space>
      </n-alert>
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
          :disabled="selectedCount === 0 || totalWidth > MAX_WIDTH"
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
  NInputNumber,
  NCard,
} from 'naive-ui'
import { Check, X } from '@vicons/tabler'

import type { ColumnField } from '@/types/Lists'

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_COLUMNS = 6
const MAX_WIDTH = 10
const MANDATORY_FIELDS = ['name']
const WORKFLOW_FIELDS = ['workflow_state']

// ============================================================================
// PROPS & EMITS
// ============================================================================

interface Props {
  show: boolean
  availableFields: ColumnField[]
  visibleFields: string[]
  widths: Record<string, number>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  apply: [settings: { fieldNames: string[]; widths: Record<string, number> }]
  cancel: []
}>()

// ============================================================================
// REACTIVE STATE
// ============================================================================

const isVisible = ref(props.show)
const selectedFields = ref<string[]>([])
const columnWidths = ref<Record<string, number>>({})

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================

const selectedCount = computed(() => selectedFields.value.length)

const totalWidth = computed(() => {
  return selectedFields.value.reduce(
    (sum, fieldname) => sum + (columnWidths.value[fieldname] || 1),
    0,
  )
})

const defaultFields = computed(() => {
  // Get first 6 fields with in_list_view = 1, ensuring mandatory fields are included
  const mandatory = props.availableFields.filter((f) =>
    isMandatoryField(f.fieldname),
  )
  const listViewFields = props.availableFields.filter(
    (f) => f.in_list_view && !isMandatoryField(f.fieldname),
  )

  const combined = [...mandatory, ...listViewFields]
  return combined.slice(0, MAX_COLUMNS).map((f) => f.fieldname)
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a field is mandatory (always required)
 */
const isMandatoryField = (fieldname: string): boolean => {
  return (
    MANDATORY_FIELDS.includes(fieldname) ||
    WORKFLOW_FIELDS.some((wf) => fieldname.includes(wf))
  )
}

/**
 * Check if a field should be disabled in the selection
 */
const isFieldDisabled = (fieldname: string): boolean => {
  // Mandatory fields are always disabled (always selected)
  if (isMandatoryField(fieldname)) {
    return true
  }

  // If we've reached max columns and this field isn't selected, disable it
  return (
    selectedCount.value >= MAX_COLUMNS &&
    !selectedFields.value.includes(fieldname)
  )
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle apply button click
 */
const handleApply = () => {
  if (selectedCount.value === 0) return

  // Ensure mandatory fields are always included
  const mandatoryFields = props.availableFields
    .filter((f) => isMandatoryField(f.fieldname))
    .map((f) => f.fieldname)

  const finalFields = [
    ...mandatoryFields,
    ...selectedFields.value.filter((f) => !isMandatoryField(f)),
  ].slice(0, MAX_COLUMNS)

  emit('apply', { fieldNames: finalFields, widths: columnWidths.value })
  isVisible.value = false
}

/**
 * Handle cancel button click
 */
const handleCancel = () => {
  // Reset to current visible fields
  selectedFields.value = [...props.visibleFields]
  isVisible.value = false
  emit('cancel')
}

/**
 * Handle reset to default button click
 */
const handleReset = () => {
  selectedFields.value = [...defaultFields.value]

  // Also reset widths to defaults
  const defaultWidths: Record<string, number> = {}
  props.availableFields.forEach((field) => {
    if (field.fieldname) {
      defaultWidths[field.fieldname] = field.spanWidth || 2
    }
  })
  columnWidths.value = defaultWidths
}

// ============================================================================
// WATCHERS
// ============================================================================

// Watch for show prop changes
watch(
  () => props.show,
  (newValue) => {
    isVisible.value = newValue
    if (newValue) {
      // Initialize with current visible fields and widths
      selectedFields.value = [...props.visibleFields]
      columnWidths.value = { ...props.widths }
    }
  },
)

// Watch for modal visibility changes
watch(isVisible, (newValue) => {
  emit('update:show', newValue)
})

// Ensure mandatory fields are always selected
watch(
  selectedFields,
  (newFields) => {
    const mandatoryFields = props.availableFields
      .filter((f) => isMandatoryField(f.fieldname))
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

<style scoped></style>
