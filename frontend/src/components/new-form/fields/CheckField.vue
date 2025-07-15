<template>
  <n-form-item
    :show-label="false"
    :required="required"
    :validation-status="error ? 'error' : undefined"
    :feedback="error || undefined"
  >
    <n-checkbox
      :checked="displayValue"
      :disabled="readonly"
      @update:checked="handleUpdate"
    >
      {{ field.label }}
    </n-checkbox>
  </n-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NFormItem, NCheckbox } from 'naive-ui'
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
  return Boolean(formatted.value)
})

const handleUpdate = (checked: boolean) => {
  const formattedValue = formatValueForSave(props.field, checked)
  emit('update:value', props.field.fieldname, formattedValue)
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
