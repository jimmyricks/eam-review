<template>
  <n-form-item
    :label="field.label"
    :required="required"
    :validation-status="error ? 'error' : undefined"
    :feedback="error || undefined"
  >
    <n-select
      :value="displayValue"
      :placeholder="getPlaceholder()"
      :disabled="readonly"
      :options="selectOptions"
      :clearable="true"
      style="width: 100%"
      @update:value="handleUpdate"
    />
  </n-form-item>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { NFormItem, NSelect } from 'naive-ui'
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

const dynamicOptions = ref<{ label: string; value: string }[]>([])

const isLinkToDoctype = computed(
  () =>
    !!props.field.fieldtype?.toLowerCase?.() === 'select' &&
    !!props.field.options &&
    /^[A-Z]/.test(props.field.options), // crude way to detect Doctype
)

// Fetch options if it's a link to another Doctype
const fetchDynamicOptions = async () => {
  try {
    const doctype = props.field.options
    const res = await getList(doctype, { fields: ['name'], limit: 100 })
    dynamicOptions.value = res.map((item: any) => ({
      label: item.name,
      value: item.name,
    }))
  } catch (err) {
    console.warn('Failed to fetch options for', props.field.options, err)
    dynamicOptions.value = []
  }
}

// Auto-fetch if needed
watch(
  () => props.field.options,
  (newOptions) => {
    if (isLinkToDoctype.value) {
      fetchDynamicOptions()
    }
  },
  { immediate: true },
)

// Computed final options
const selectOptions = computed(() => {
  if (!props.field.options) return []

  // Split by newlines (handles actual \n characters)
  const options = props.field.options
    .split('\n')
    .map((opt) => opt.trim())
    .filter(Boolean)

  return options.map((option) => ({
    label: option,
    value: option,
  }))
})

const displayValue = computed(() => {
  const formatted = formatFieldValue(props.field, props.value)
  return formatted.value || null
})

const getPlaceholder = (): string => {
  return `Select ${props.field.label?.toLowerCase() || 'option'}...`
}

const handleUpdate = (newValue: string | null) => {
  const formattedValue = formatValueForSave(props.field, newValue)
  emit('update:value', props.field.fieldname, formattedValue)
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
