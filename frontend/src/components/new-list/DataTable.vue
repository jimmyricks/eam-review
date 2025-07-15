<template>
  <div class="data-table">
    <!-- Loading skeleton -->
    <div v-if="loading && data.length === 0" class="p-4">
      <n-skeleton text :repeat="10" />
    </div>

    <!-- Data table -->
    <n-data-table
      remote
      v-else
      :columns="tableColumns"
      :data="data"
      :pagination="pagination"
      :loading="loading"
      :row-key="rowKeyFunction"
      :row-props="rowProps"
      :checked-row-keys="checkedRowKeys"
      size="large"
      @update:checked-row-keys="handleCheckedRowKeysChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, reactive, onMounted } from 'vue'
import { useFrappeSDK } from '@/composables/useFrappeSDK'
import {
  NDataTable,
  NSkeleton,
  NTag,
  NCheckbox,
  type DataTableColumns,
} from 'naive-ui'
import type { ListRecord, ColumnField } from '@/types/Lists'
import { getWorkflowStateType } from '@/utils/workflowStates'

// -----------------------------------------------------------------------------
// Props & Emits
// -----------------------------------------------------------------------------
interface Props {
  doctype: string
  data: ListRecord[]
  columns: ColumnField[]
  loading?: boolean
  pagination: any // Using n-data-table's pagination format
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'row-click': [record: ListRecord]
  'checked-rows-change': [keys: Array<string | number>, rows: ListRecord[]]
  refresh: []
}>()

// -----------------------------------------------------------------------------
// Local State
// -----------------------------------------------------------------------------
const checkedRowKeys = ref<Array<string | number>>([])

// -----------------------------------------------------------------------------
// Linked Doc Caching & Utilities
// -----------------------------------------------------------------------------

// Simple reactive cache so rendered cells update once data arrives
const linkLabelCache = reactive<{ [key: string]: string }>({})
const cacheVersion = ref(0) // increments whenever cache updates to force re-render

// SDK instance
const { db } = useFrappeSDK()

// -----------------------------------------------------------------------------
// Link Replacement Rules (loaded from My Settings.link_replacement)
// -----------------------------------------------------------------------------

// Reactive store for rules – keyed by fieldname e.g. 'asset_class'
const linkReplacementRules = ref<
  Record<string, { doctype: string; label_field: string }>
>({})

const loadLinkReplacementRules = async () => {
  try {
    const raw = await db.getSingleValue<any>(
      'Global Settings',
      'link_replacement',
    )
    // Frappe returns an object { message: <value> }
    let rawValue = (raw && raw.message !== undefined ? raw.message : raw) ?? {}

    let rules: any = rawValue

    // The field may be stored as JSON string – parse if necessary
    if (typeof rules === 'string') {
      try {
        rules = JSON.parse(rules)
      } catch (err) {
        console.error('Failed parsing link_replacement JSON', err)
        rules = {}
      }
    }

    linkReplacementRules.value = rules
  } catch (err) {
    console.error('Failed loading link replacement rules from My Settings', err)
  }
}

onMounted(loadLinkReplacementRules)

// Fetch helper – currently only handles Asset Class look-ups
const fetchLinkedLabel = async (
  fieldname: string,
  id: string,
): Promise<void> => {
  const cacheKey = `${fieldname}:${id}`
  if (linkLabelCache[cacheKey]) return // Cached or in-flight

  const rule = linkReplacementRules.value[fieldname]
  if (!rule) {
    return // No rule → don't replace
  }

  try {
    const doc = await db.getDoc(rule.doctype, id)

    linkLabelCache[cacheKey] = doc[rule.label_field] ?? id
    cacheVersion.value++
  } catch (err) {
    console.error(
      `Failed fetching linked label for field ${fieldname} → ${id}:`,
      err,
    )
    linkLabelCache[cacheKey] = id
    cacheVersion.value++
  }
}

// -----------------------------------------------------------------------------
// Computed Properties
// -----------------------------------------------------------------------------
const tableColumns = computed((): DataTableColumns<ListRecord> => {
  // Establish reactive dependency on label cache updates
  void cacheVersion.value
  const baseColumns = [
    // Selection column
    {
      type: 'selection' as const,
      width: 60,
    },
    // Data columns
    ...props.columns.map((col) => ({
      title: col.label,
      key: col.fieldname,
      width: `${col.width}%`,
      ellipsis: {
        tooltip: true,
      },
      render: (row: ListRecord) => {
        const value = row[col.fieldname]

        if (col.fieldname.includes('workflow_state')) {
          return h(
            NTag,
            {
              type: getTagType(value),
              size: 'medium',
              bordered: false,
            },
            { default: () => value || '' },
          )
        }

        if (col.type === 'Link' && value) {
          // If replacement rule exists, use replacement label
          const rule = linkReplacementRules.value[col.fieldname]

          if (rule) {
            const cacheKey = `${col.fieldname}:${value}`
            // Trigger async fetch if not in cache
            if (!linkLabelCache[cacheKey]) {
              fetchLinkedLabel(col.fieldname, value)
            }

            return h(
              'span',
              {
                class: 'text-blue-500 cursor-pointer',
              },
              linkLabelCache[cacheKey] || value,
            )
          }

          // No replacement rule – default behaviour
          return h(
            'span',
            {
              class: 'text-blue-500 cursor-pointer',
            },
            value,
          )
        }

        if ((col.type === 'Date' || col.type === 'Datetime') && value) {
          return h('span', formatDate(value))
        }

        if (col.type === 'Currency' && value) {
          return h('span', formatCurrency(value))
        }

        if (col.type === 'Check') {
          return formatCheckboxes(value)
        }

        return h('span', value || '')
      },
    })),
  ]

  return baseColumns
})

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------
const rowKeyFunction = (row: ListRecord) => row.name

const rowProps = (row: ListRecord) => ({
  style: 'cursor: pointer;',
  onClick: (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (
      target.closest('.n-data-table-selection') ||
      target.closest('.n-checkbox') ||
      target.tagName === 'INPUT' ||
      target.tagName === 'LABEL'
    ) {
      return
    }
    emit('row-click', row)
  },
})

const getTagType = (
  value: string,
): 'default' | 'error' | 'warning' | 'success' | 'primary' | 'info' => {
  return getWorkflowStateType(value)
}

const formatDate = (value: string): string => {
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

const formatCurrency = (value: number | string): string => {
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
    }).format(num)
  } catch {
    return String(value)
  }
}

const formatCheckboxes = (value: boolean) => {
  return h(NCheckbox, {
    checked: Boolean(value),
    disabled: true,
    size: 'large',
  })
}

// -----------------------------------------------------------------------------
// Event Handlers
// -----------------------------------------------------------------------------
const handleCheckedRowKeysChange = (keys: Array<string | number>) => {
  checkedRowKeys.value = keys
  const selectedRows = props.data.filter((row) => keys.includes(row.name))
  emit('checked-rows-change', keys, selectedRows)
}
</script>

<style scoped>
.data-table {
  flex: 1;
  overflow: hidden;
}
</style>
