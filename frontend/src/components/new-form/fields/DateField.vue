<template>
  <n-form-item
    :label="field.label"
    :required="required"
    :validation-status="error ? 'error' : undefined"
    :feedback="error || undefined"
  >
    <n-date-picker
      :value="displayValue"
      :type="dateType"
      :placeholder="getPlaceholder()"
      :disabled="readonly"
      :clearable="!required"
      :format="dateFormat"
      style="width: 100%"
      @update:value="handleUpdate"
    />
  </n-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NFormItem, NDatePicker } from 'naive-ui'
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
const displayValue = computed(() => {
  const formatted = formatFieldValue(props.field, props.value)
  return formatted.value
})

const dateType = computed(() => {
  return props.field.fieldtype === 'Datetime' ? 'datetime' : 'date'
})

const dateFormat = computed(() => {
  return props.field.fieldtype === 'Datetime'
    ? 'yyyy-MM-dd HH:mm:ss'
    : 'yyyy-MM-dd'
})

// Helper methods
const getPlaceholder = (): string => {
  return props.field.fieldtype === 'Datetime'
    ? 'Select date and time...'
    : 'Select date...'
}

const handleUpdate = (newValue: number | null) => {
  const formattedValue = formatValueForSave(props.field, newValue)
  emit('update:value', props.field.fieldname, formattedValue)
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
