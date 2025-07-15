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
      :precision="2"
      :min="getMinValue()"
      :step="0.01"
      :show-button="!readonly"
      @update:value="handleUpdate"
    >
      <template #prefix>
        <span class="currency-symbol">PHP</span>
      </template>
    </n-input-number>
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

// Helper methods
const getPlaceholder = (): string => {
  return `Enter ${props.field.label?.toLowerCase() || 'amount'}...`
}

const getMinValue = (): number | undefined => {
  return props.field.non_negative ? 0 : undefined
}

const handleUpdate = (newValue: number | null) => {
  const formattedValue = formatValueForSave(props.field, newValue)
  emit('update:value', props.field.fieldname, formattedValue)
}
</script>

<style scoped>
.currency-symbol {
  color: var(--n-text-color-3);
  font-weight: 500;
}
</style>
