<template>
  <n-form-item
    :label="field.label"
    :required="required"
    :validation-status="error ? 'error' : undefined"
    :feedback="error || undefined"
  >
    <n-time-picker
      :value="displayValue"
      :placeholder="getPlaceholder()"
      :disabled="readonly"
      style="width: 100%"
      :clearable="!required"
      format="HH:mm:ss"
      @update:value="handleUpdate"
    />
  </n-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NFormItem, NTimePicker } from 'naive-ui'
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
  return formatFieldValue(props.field, props.value).value || null
})

// Helper methods
const getPlaceholder = (): string => {
  return props.field.label || 'Select time'
}

const handleUpdate = (newValue: number | null) => {
  const formattedValue = formatValueForSave(props.field, newValue)
  emit('update:value', props.field.fieldname, formattedValue)
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
