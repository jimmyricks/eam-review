<template>
  <n-form-item
    :label="field.label"
    :required="required"
    :validation-status="error ? 'error' : undefined"
    :feedback="error || undefined"
  >
    <n-input-number
      :value="displayValue"
      :placeholder="getPlaceholder()"
      :disabled="readonly"
      :precision="getPrecision()"
      :min="getMinValue()"
      :step="getStep()"
      :show-button="!readonly"
      @update:value="handleUpdate"
    />
  </n-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NFormItem, NInputNumber } from 'naive-ui'
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

const isInteger = computed(() => {
  return props.field.fieldtype === 'Int'
})

// Helper methods
const getPlaceholder = (): string => {
  return `Enter ${props.field.label?.toLowerCase() || 'number'}...`
}

const getPrecision = (): number | undefined => {
  if (isInteger.value) {
    return 0
  }

  // Use field precision if available, otherwise default to 2 for floats
  if (props.field.precision) {
    const precision = parseInt(props.field.precision.toString())
    return isNaN(precision) ? 2 : precision
  }

  return 2
}

const getMinValue = (): number | undefined => {
  return props.field.non_negative ? 0 : undefined
}

const getStep = (): number => {
  if (isInteger.value) {
    return 1
  }

  const precision = getPrecision() || 2
  return Math.pow(10, -precision)
}

const handleUpdate = (newValue: number | null) => {
  const formattedValue = formatValueForSave(props.field, newValue)
  emit('update:value', props.field.fieldname, formattedValue)
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
