<template>
  <n-form-item
    :label="field.label"
    :required="required"
    :validation-status="error ? 'error' : undefined"
    :feedback="error || undefined"
  >
    <!-- Multi-line text fields -->
    <n-input
      v-if="isMultiline"
      :value="displayValue"
      type="textarea"
      :placeholder="getPlaceholder()"
      :disabled="readonly"
      :autosize="{ minRows: 3, maxRows: 6 }"
      :maxlength="field.length || undefined"
      :show-count="Boolean(field.length)"
      @update:value="handleUpdate"
    />

    <!-- Single-line text fields -->
    <n-input
      v-else
      :value="displayValue"
      :placeholder="getPlaceholder()"
      :disabled="readonly"
      :maxlength="field.length || undefined"
      :show-count="Boolean(field.length)"
      @update:value="handleUpdate"
    />
  </n-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NFormItem, NInput } from 'naive-ui'
import { formatFieldValue, formatValueForSave } from '@/utils/fieldFormatters'
import type { FormField } from '@/types/metadata'

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
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  required: false,
  error: null,
})

const emit = defineEmits<Emits>()

// Computed properties
const isMultiline = computed(() => {
  return (
    props.field.fieldtype === 'Small Text' ||
    props.field.fieldtype === 'Long Text' ||
    props.field.fieldtype === 'Text'
  )
})

const displayValue = computed(() => {
  const formatted = formatFieldValue(props.field, props.value)
  return formatted.value || ''
})

// Helper methods
const getPlaceholder = (): string => {
  switch (props.field.fieldtype) {
    case 'Small Text':
      return 'Enter short description...'
    case 'Long Text':
    case 'Text':
      return 'Enter detailed text...'
    case 'Data':
    default:
      return `Enter ${props.field.label?.toLowerCase() || 'value'}...`
  }
}

const handleUpdate = (newValue: string) => {
  const formattedValue = formatValueForSave(props.field, newValue)
  emit('update:value', props.field.fieldname, formattedValue)
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
