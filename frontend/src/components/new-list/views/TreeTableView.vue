<template>
  <div class="tree-table-view">
    <div class="pb-4">
      <TableControls
        :searchable-fields="searchableFields"
        @search="handleSearch"
        @clear-search="handleClearSearch"
        @sort-change="handleSortChange"
      />
    </div>
    <n-data-table
      v-if="!loading && records.length"
      :columns="columns"
      :data="filteredTreeData"
      :row-key="(row) => row.name"
      :default-expanded-row-keys="expandedRowKeys"
      :children-key="childrenKey"
      v-model:checked-row-keys="checkedRowKeys"
    />
    <n-spin v-if="loading" size="large" />
    <n-empty
      v-if="!loading && !records.length"
      description="No records found"
    />

    <!-- Form Modal for Viewing/Editing -->
    <FormModal
      v-if="selectedRecord"
      v-model:show="showFormModal"
      :doctype="doctype"
      :name="selectedRecord.name"
    />
    <!-- Settings Modal -->
    <ListSettingsModal
      v-model:show="showSettingsModal"
      :available-fields="availableFields"
      :visible-fields="[...visibleFieldNames]"
      :widths="columnWidths"
      @apply="handleApplySettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NDataTable,
  NSpin,
  NEmpty,
  NButton,
  NIcon,
  NTag,
  NCheckbox,
} from 'naive-ui'
import { Plus, Eye, Settings } from '@vicons/tabler'
import { useMetadataService } from '@/composables/services'
import { useTreeTableRecords } from '@/components/new-list/views/composables/useTreeTableRecords'
import { useColumnManagement } from '../composables/useColumnManagement'

import FormModal from '@/components/new-form/FormModal.vue'
import TableControls from '../TableControls.vue'
import ListSettingsModal from '../ListSettingsModal.vue'

import type {
  ListRecord,
  SearchFilter,
  SearchableField,
  ColumnField,
} from '@/types/Lists'
import type { DoctypeMetadata, FormField } from '@/types/metadata'
import { getWorkflowStateType } from '@/utils/workflowStates'

interface Props {
  doctype: string
  treeConfig?: {
    parentKey: string
    idKey: string
    labelField: string
  }
  // Column management props from ListPage
  columns?: ColumnField[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'apply-settings': [
    settings: { fieldNames: string[]; widths: Record<string, number> },
  ]
}>()

const router = useRouter()
const { getMetadata } = useMetadataService()

// Use column management composable only if columns prop is not provided
const {
  availableFields: composableAvailableFields,
  visibleFieldNames: composableVisibleFieldNames,
  visibleColumns: composableVisibleColumns,
  columnWidths: composableColumnWidths,
  searchableFields: composableSearchableFields,
  loadMetadata,
  applyColumnSettings,
} = useColumnManagement(props.doctype)

// Use props if provided, otherwise use composable values
const availableFields = computed(
  () => props.columns || composableAvailableFields.value,
)
const visibleFieldNames = computed(
  () =>
    props.columns?.map((c) => c.fieldname) || composableVisibleFieldNames.value,
)
const columnWidths = computed(() => composableColumnWidths.value)
const searchableFields = computed(() => composableSearchableFields.value)

// Get the properly calculated visible columns with widths
const visibleColumns = computed(() => {
  if (props.columns) {
    // Use the pre-calculated columns from ListPage
    return props.columns
  } else {
    // Use the composable's calculated visibleColumns
    return composableVisibleColumns.value
  }
})

const { records, loading, loadRecords, setSort } = useTreeTableRecords(
  props.doctype,
)

const metadata = ref<DoctypeMetadata | null>(null)
const parentField = ref<string | null>(null)
const childrenKey = 'children' // Key for child records in the tree structure
const showFormModal = ref(false)
const selectedRecord = ref<ListRecord | null>(null)
const checkedRowKeys = ref<Array<string | number>>([])
const searchQuery = ref('')
const showSettingsModal = ref(false)

// Data fetching
onMounted(async () => {
  try {
    // Load metadata using the composable
    await loadMetadata()
    metadata.value = await getMetadata(props.doctype)
    parentField.value = findParentField(metadata.value?.fields || [])

    if (!parentField.value) {
      console.warn(
        `No suitable parent field found for tree view in ${props.doctype}`,
      )
    }

    await loadRecords()
  } catch (error) {
    console.error('Failed to load data for tree view:', error)
  }
})

// Find the parent field based on metadata
const findParentField = (fields: FormField[]): string | null => {
  // Use config if provided
  if (props.treeConfig?.parentKey) {
    return props.treeConfig.parentKey
  }

  // Heuristic: find a Link field that points to the same doctype
  const linkToSelf = fields.find(
    (field) => field.fieldtype === 'Link' && field.options === props.doctype,
  )
  return linkToSelf?.fieldname || null
}

const labelField = computed(() => props.treeConfig?.labelField || 'name')

// Convert flat list to tree structure
const treeData = computed(() => {
  if (!parentField.value || !records.value.length) {
    return records.value
  }
  return buildTree(records.value, parentField.value)
})

const filteredTreeData = computed(() => {
  if (!searchQuery.value) {
    return treeData.value
  }

  const q = searchQuery.value.toLowerCase()

  // Helper to determine if node matches query (by label or name)
  const nodeMatches = (node: ListRecord) => {
    const label = String(node[labelField.value] || '').toLowerCase()
    const id = String(node.name || '').toLowerCase()
    return label.includes(q) || id.includes(q)
  }

  function filter(nodes: ListRecord[]): ListRecord[] {
    return nodes
      .map((node): ListRecord | null => {
        const originalChildren: ListRecord[] = node[childrenKey] || []
        const filteredChildren = filter(originalChildren)

        // If this node matches, include entire untouched subtree
        if (nodeMatches(node)) {
          return { ...node }
        }

        // Otherwise include only if any child matched
        if (filteredChildren.length) {
          return { ...node, [childrenKey]: filteredChildren }
        }

        return null
      })
      .filter((node): node is ListRecord => node !== null)
  }

  return filter(treeData.value)
})

const buildTree = (
  nodes: ListRecord[],
  parentIdField: string,
): ListRecord[] => {
  const nodeMap = new Map<string, ListRecord>()
  const tree: ListRecord[] = []

  // Initialize map and add children array to each node
  nodes.forEach((node) => {
    node[childrenKey] = []
    nodeMap.set(node.name, node)
  })

  // Build the tree
  nodes.forEach((node) => {
    const parentId = node[parentIdField]
    if (parentId && nodeMap.has(parentId)) {
      const parent = nodeMap.get(parentId)
      parent?.[childrenKey]?.push(node)
    } else {
      tree.push(node) // Root node
    }
  })

  return tree
}

// Expand all nodes by default (up to a limit)
const expandedRowKeys = computed(() => {
  if (searchQuery.value) {
    // Expand all nodes when searching
    return records.value.map((r) => r.name)
  }
  return records.value.map((r) => r.name).slice(0, 500) // Limit expansion for performance
})

// Columns for the data table
const columns = computed(() => {
  // Use the pre-calculated columns from visibleColumns
  const dynamicColumns = visibleColumns.value
    .filter((f) => f.fieldname !== labelField.value)
    .map((f) => ({
      title: f.label,
      key: f.fieldname,
      width: `${f.width}%`,
      ellipsis: {
        tooltip: true,
      },
      render: (row: ListRecord) => {
        const value = row[f.fieldname]

        if (f.fieldname.includes('workflow_state')) {
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

        if (f.type === 'Link' && value) {
          return h(
            'span',
            {
              class: 'text-blue-500 cursor-pointer',
            },
            value,
          )
        }

        if ((f.type === 'Date' || f.type === 'Datetime') && value) {
          return h('span', formatDate(value))
        }

        if (f.type === 'Currency' && value) {
          return h('span', formatCurrency(value))
        }

        if (f.type === 'Check') {
          return formatCheckboxes(value)
        }

        return h('span', value || '')
      },
    }))

  return [
    {
      title: 'Name',
      key: labelField.value,
      width: '25%',
      ellipsis: {
        tooltip: true,
      },
      // Client-side sorting disabled; server-side sorting handled via TableControls
    },
    ...dynamicColumns,
    {
      title: 'Actions',
      key: 'actions',
      width: '15%',
      ellipsis: {
        tooltip: true,
      },
      render(row: ListRecord) {
        return h('div', { class: 'space-x-2' }, [
          h(
            NButton,
            {
              size: 'small',
              onClick: () => handleAddChild(row),
            },
            { default: () => h(NIcon, null, { default: () => h(Plus) }) },
          ),
          h(
            NButton,
            {
              size: 'small',
              onClick: () => handleView(row),
            },
            { default: () => h(NIcon, null, { default: () => h(Eye) }) },
          ),
        ])
      },
    },
  ]
})

// Action handlers
const handleAddChild = (parent: ListRecord) => {
  if (!parentField.value) return
  // Route to form view with parent pre-filled
  const routeName = props.doctype.toLowerCase().replace(/ /g, '-')
  router.push({
    path: `/${routeName}/new`,
    query: {
      [`prefill_${parentField.value}`]: parent.name,
    },
  })
}

const handleView = (record: ListRecord) => {
  selectedRecord.value = record
  showFormModal.value = true
}

const handleSearch = (filters: SearchFilter[]) => {
  if (filters.length > 0) {
    searchQuery.value = String(filters[0].value).replace(/%/g, '')
  } else {
    searchQuery.value = ''
  }
}

const handleClearSearch = () => {
  searchQuery.value = ''
}

const handleSortChange = (sort: { field: string; order: 'asc' | 'desc' }) => {
  setSort(sort.field, sort.order)
}

const handleApplySettings = async (settings: {
  fieldNames: string[]
  widths: Record<string, number>
}) => {
  try {
    // If props are provided, we're using ListPage's column management
    // Emit the settings to the parent ListPage
    if (props.columns) {
      emit('apply-settings', settings)
      showSettingsModal.value = false
    } else {
      // Use the composable's applyColumnSettings
      await applyColumnSettings(settings.fieldNames, settings.widths)
      showSettingsModal.value = false
    }
  } catch (error) {
    console.error('Failed to apply column settings:', error)
  }
}

defineExpose({
  openSettings: () => {
    showSettingsModal.value = true
  },
})

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------
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
</script>

<style scoped>
.tree-table-view {
  width: 100%;
  height: 100%;
}
</style>
