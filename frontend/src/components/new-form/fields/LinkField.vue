<template>
  <n-form-item
    :label="field.label"
    :required="required"
    :validation-status="error ? 'error' : undefined"
    :feedback="error || undefined"
  >
    <div class="link-field">
      <n-input-group>
        <n-select
          :value="sanitizedValue"
          :placeholder="getPlaceholder()"
          :disabled="readonly"
          :options="linkOptions"
          :loading="searchLoading"
          :remote="true"
          :filterable="true"
          :clearable="true"
          :render-label="renderLabel"
          :render-tag="renderSingleSelectTag"
          @search="handleSearch"
          @update:value="handleUpdate"
          @focus="handleFocus"
        >
          <template #action>
            <div v-if="hasCustomQuery" class="custom-query-info">
              <n-tag size="medium" type="info" :bordered="false">
                <template #icon>
                  <n-icon><FilterIcon /></n-icon>
                </template>
                {{ filterLabel }}
              </n-tag>
            </div>
          </template>
        </n-select>
        <n-button
          v-if="sanitizedValue && !searchLoading && canNavigateToRecord"
          @click="openLinkedRecord"
        >
          <template #icon>
            <n-icon><ChevronRight /></n-icon>
          </template>
        </n-button>
      </n-input-group>
    </div>
  </n-form-item>
</template>

<script setup lang="ts">
import { computed, ref, watch, inject, watchEffect, h } from 'vue'
import type { ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import {
  NFormItem,
  NSelect,
  NButton,
  NIcon,
  NInputGroup,
  NTag,
  type SelectOption,
  type SelectRenderLabel,
  type SelectRenderTag,
} from 'naive-ui'
import { ChevronRight, Filter as FilterIcon } from '@vicons/tabler'
import { useLinkSearch } from '../composables/useLinkSearch'
import { formatFieldValue, formatValueForSave } from '@/utils/fieldFormatters'
import { useClientScriptService } from '@/composables/services/useClientScriptService'
import { useGlobalPermissions } from '@/composables/useGlobalPermissions'
import type { FormField, DoctypeMetadata } from '@/types/metadata'
import type { Document } from '@/types/document'

// Props
interface Props {
  field: FormField
  value: any
  mode: 'view' | 'edit'
  metadata?: DoctypeMetadata
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

const sanitizedValue = computed(() => (props.value === '' ? null : props.value))

const emit = defineEmits<Emits>()
const router = useRouter()

// Inject form context
const formDoctype = inject<ComputedRef<string> | string>('formDoctype', '')
const formDocumentName = inject<ComputedRef<string> | string | undefined>(
  'formDocumentName',
)
const formData = inject<ComputedRef<Document> | Document | undefined>(
  'formDocumentData',
)

// Resolve injected values whether raw or computed
const formDoctypeValue = computed(() =>
  typeof formDoctype === 'object' && 'value' in formDoctype
    ? formDoctype.value
    : formDoctype,
)
const formDocumentNameValue = computed(() =>
  typeof formDocumentName === 'object' && 'value' in formDocumentName
    ? formDocumentName.value
    : formDocumentName,
)
const formDataValue = computed(() =>
  typeof formData === 'object' && 'value' in formData
    ? formData.value
    : formData,
)

// Composables
const { searchLink, loading: searchLoading } = useLinkSearch()
const { canRead } = useGlobalPermissions()

// Handle dynamic client script
const getFieldQueryRef = ref<(fieldname: string) => any>(() => undefined)

watchEffect(() => {
  if (formDoctypeValue.value) {
    const { getFieldQuery } = useClientScriptService(formDoctypeValue.value)
    getFieldQueryRef.value = getFieldQuery
  }
})

// Computed
const customQuery = computed(() =>
  getFieldQueryRef.value(props.field.fieldname),
)
const hasCustomQuery = computed(() => !!customQuery.value)

const linkedDoctype = computed(() => props.field.options || '')
const referenceDoctype = computed(() => props.field.parent || '')

const filterLabel = computed(() => {
  if (!customQuery.value) return 'Filter Applied'
  try {
    return `Filter: ${JSON.stringify(customQuery.value.filters)}`
  } catch {
    return 'Filter Applied'
  }
})

// State
const linkOptions = ref<SelectOption[]>([])
const canNavigateToRecord = ref(false)

// Check if user can navigate to linked records
const checkNavigationPermission = async () => {
  if (linkedDoctype.value) {
    try {
      // Convert doctype name to URL format for permission check
      const urlDoctype = linkedDoctype.value.toLowerCase().replace(/\s+/g, '-')
      canNavigateToRecord.value = await canRead(urlDoctype)
    } catch (error) {
      console.error('Error checking navigation permission:', error)
      canNavigateToRecord.value = false
    }
  }
}

// Watch linkedDoctype and check permissions
watch(
  linkedDoctype,
  () => {
    checkNavigationPermission()
  },
  { immediate: true },
)

const formatLinkOptions = (results: any[]): SelectOption[] => {
  return (results || []).map((item: any) => {
    if (typeof item === 'object' && item !== null && 'value' in item) {
      // The backend will now always return value, description and label.
      const { value, label, description } = item
      return {
        value,
        label: label || value,
        // Always include description if it exists to allow renderLabel to make display decisions.
        ...(description ? { description } : {}),
      }
    }

    if (Array.isArray(item)) {
      const label = item[1] || item[0]
      const description = item[2]
      return {
        value: item[0],
        label,
        ...(description && description !== label ? { description } : {}),
      }
    }

    return {
      value: item,
      label: String(item),
    }
  })
}

// Watchers
watch(
  sanitizedValue,
  async (newValue) => {
    if (
      newValue &&
      linkedDoctype.value &&
      typeof linkedDoctype.value === 'string'
    ) {
      const hasOption = linkOptions.value.some((opt) => opt.value === newValue)
      if (!hasOption) {
        try {
          const results = await searchLink(
            newValue,
            linkedDoctype.value,
            referenceDoctype.value,
            10,
            customQuery.value,
            formDataValue.value,
            formDocumentNameValue.value !== 'new'
              ? formDocumentNameValue.value
              : undefined,
          )
          const formattedResults = formatLinkOptions(results)
          if (formattedResults.length > 0) {
            linkOptions.value = [
              formattedResults[0],
              ...linkOptions.value.filter(
                (opt) => opt.value !== formattedResults[0].value,
              ),
            ]
          }
        } catch (error) {
          console.error('Error loading link value:', error)
        }
      }
    }
  },
  { immediate: true },
)

watch(
  () => customQuery.value,
  () => {
    linkOptions.value = []
    if (sanitizedValue.value) handleSearch(sanitizedValue.value)
  },
  { deep: true },
)

// Methods
const getPlaceholder = (): string => {
  return hasCustomQuery.value
    ? `Select ${linkedDoctype.value || 'records'} (filtered)`
    : `Select ${linkedDoctype.value || 'records'}`
}

const handleFocus = () => {
  if (!sanitizedValue.value) handleSearch(' ')
}

const handleSearch = async (query: string) => {
  if (!linkedDoctype.value || typeof linkedDoctype.value !== 'string') {
    linkOptions.value = []
    return
  }

  if (query === '' && linkOptions.value.length > 0 && !sanitizedValue.value)
    return

  try {
    const results = await searchLink(
      query,
      linkedDoctype.value,
      referenceDoctype.value,
      20,
      customQuery.value,
      formDataValue.value,
      formDocumentNameValue.value !== 'new'
        ? formDocumentNameValue.value
        : undefined,
    )

    linkOptions.value = formatLinkOptions(results)
  } catch (error) {
    console.error('Error searching links:', error)
    linkOptions.value = []
  }
}

const handleUpdate = (newValue: string | null) => {
  const formattedValue = formatValueForSave(props.field, newValue)
  emit('update:value', props.field.fieldname, formattedValue)
}

const openLinkedRecord = () => {
  if (
    sanitizedValue.value &&
    linkedDoctype.value &&
    typeof linkedDoctype.value === 'string'
  ) {
    const doctype = linkedDoctype.value.replace(/ /g, '-')
    router.push(`/${doctype.toLowerCase()}/${sanitizedValue.value}`)
  }
}

const renderSingleSelectTag: SelectRenderTag = ({ option }) => {
  return option.label as string
}

const renderLabel: SelectRenderLabel = (option) => {
  const mainText = option.label
  const subText = option.description

  return h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        padding: '4px 0',
      },
    },
    [
      h(
        'div',
        { style: { fontWeight: 600, fontSize: '14px' } },
        String(mainText),
      ),
      subText && subText !== mainText
        ? h(
            'div',
            {
              style: {
                fontSize: '13px',
                color: 'var(--n-option-text-color-disabled)',
              },
            },
            String(subText),
          )
        : null,
    ],
  )
}
</script>

<style scoped>
.link-field {
  display: flex;
  flex-direction: column;

  width: 100%;
}
.link-field .n-input-group {
  display: flex;
  align-items: center;
  width: 100%;
}
.link-field .n-select {
  flex: 1;
}
</style>
