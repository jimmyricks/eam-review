<template>
  <div class="form-table">
    <div class="tab-header">
      <n-space justify="space-between" align="center">
        <FormTableControl
          :searchableFields="searchableFields"
          :searchLoading="loading"
          :current-view="currentView"
          :available-views="availableViews"
          @search="handleSearch"
          @clear-search="handleClearSearch"
          @settings="showSettingsModal = true"
          @view-change="handleViewChange"
        />

        <div>
          <n-dropdown
            v-if="checkedRowKeys.length > 0"
            trigger="hover"
            :options="[
              {
                label: 'Delete',
                key: 'delete',
              },
            ]"
            placement="bottom-start"
            @select="handleAction"
          >
            <n-button type="primary">
              <template #icon>
                <n-icon><ChevronDown /></n-icon>
              </template>
              Actions
            </n-button>
          </n-dropdown>
          <n-button
            v-else-if="!props.disableAddButton"
            type="primary"
            @click="handleCreate"
          >
            <template #icon>
              <n-icon><Plus /></n-icon>
            </template>
            Add {{ linkDoctype }}
          </n-button>
        </div>
      </n-space>
    </div>

    <div class="pt-4">
      <!-- Loading skeleton -->
      <div v-if="loading && linkedDocuments.length === 0" class="p-4">
        <n-skeleton text :repeat="5" />
      </div>

      <!-- Data table -->
      <n-data-table
        v-else
        :columns="tableColumns"
        :data="linkedDocuments"
        :pagination="pagination"
        :loading="loading"
        :row-key="rowKeyFunction"
        :row-props="rowProps"
        :checked-row-keys="checkedRowKeys"
        size="medium"
        remote
        @update:checked-row-keys="handleCheckedRowKeysChange"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>

    <!-- Column Settings Modal -->
    <FormTableSettingsModal
      v-model:show="showSettingsModal"
      :available-fields="availableFields"
      :visible-fields="visibleFieldNames.slice()"
      :max-columns="MAX_COLUMNS"
      :is-mandatory-field="isMandatoryField"
      @apply="applyColumnSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  NDataTable,
  NButton,
  NIcon,
  NTag,
  NSkeleton,
  NSpace,
  NDropdown,
  useMessage,
  useDialog,
  type DataTableColumns,
} from 'naive-ui'
import { Plus, ChevronDown } from '@vicons/tabler'
import { useFrappeSDK } from '@/composables/useFrappeSDK'
import FormTableControl from './FormTableControl.vue'
import FormTableSettingsModal from './FormTableSettingsModal.vue'
import { useColumnManagement } from './composables/useColumnManagement'
import {
  useListService,
  useMetadataService,
  useDocumentService,
} from '@/composables/services'
import { doctypeToRoute } from '@/utils/slugify'
import type { DocTypeLink } from '@/types/metadata'
import type {
  ListRecord,
  ColumnField,
  SearchableField,
  SearchFilter,
} from '@/types/Lists'
import { getWorkflowStateType } from '@/utils/workflowStates'

interface Props {
  doctype: string
  documentName: string
  linkInfo: DocTypeLink
  mode: 'view' | 'edit'
  disableAddButton?: boolean
}

const props = defineProps<Props>()
const message = useMessage()
const dialog = useDialog()
const router = useRouter()

// Composables
const { getList, getCount, cache: listCache } = useListService()
const { getMetadata } = useMetadataService()
const { deleteDocument } = useDocumentService()
const {
  loading: columnsLoading,
  error: columnsError,
  visibleColumns,
  searchableFields,
  availableFields,
  visibleFieldNames,
  loadMetadata: loadColumnsMetadata,
  applyColumnSettings,
  resetColumnSettings,
  isMandatoryField,
  MAX_COLUMNS,
} = useColumnManagement(props.linkInfo.link_doctype)

// Reactive state
const loading = ref(false)
const searchFilters = ref<SearchFilter[]>([])
const linkedDocuments = ref<ListRecord[]>([])
const totalCount = ref(0)
const checkedRowKeys = ref<Array<string | number>>([])
const showSettingsModal = ref(false)
const currentView = ref('list')
const availableViews = ref([{ label: 'List', value: 'list' }])

const pagination = ref({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

// -----------------------------------------------------------------------------
// Linked Doc Caching & Utilities (shared with DataTable.vue)
// -----------------------------------------------------------------------------
const linkLabelCache = reactive<{ [key: string]: string }>({})
const cacheVersion = ref(0) // increments whenever cache updates to force re-render

// SDK instance
const { db } = useFrappeSDK()

// -----------------------------------------------------------------------------
// Link Replacement Rules (loaded from My Settings.link_replacement)
// -----------------------------------------------------------------------------

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

// Fetch helper – retrieves replacement label for linked docs
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

// Computed properties
const linkDoctype = computed(() => props.linkInfo.link_doctype)
const linkFieldname = computed(() => props.linkInfo.link_fieldname)

const tableColumns = computed((): DataTableColumns<ListRecord> => {
  // Establish reactive dependency on label cache updates
  void cacheVersion.value

  const selectionCol = {
    type: 'selection' as const,
  }

  const baseColumns = [
    selectionCol,
    // Data columns
    ...visibleColumns.value.map((col: ColumnField) => ({
      title: col.label,
      key: col.fieldname,
      width: col.width,
      ellipsis: {
        tooltip: true,
      },
      render: (row: ListRecord) => {
        const value = row[col.fieldname]

        // Handle workflow state fields with tags
        if (col.fieldname.includes('workflow_state')) {
          return h(
            NTag,
            {
              type: getTagType(value),
              size: 'small',
              bordered: false,
            },
            { default: () => value || '' },
          )
        }

        // Handle link fields
        if (col.type === 'Link' && value) {
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

        // Handle date fields
        if ((col.type === 'Date' || col.type === 'Datetime') && value) {
          return h('span', formatDate(value))
        }

        // Handle currency fields
        if (col.type === 'Currency' && value) {
          return h('span', formatCurrency(value))
        }

        // Default rendering
        return h('span', value || '')
      },
    })),
  ]

  return baseColumns
})

// Methods
const loadMetadata = async () => {
  try {
    loading.value = true
    await loadColumnsMetadata()
  } catch (error) {
    console.error('Error loading metadata for', linkDoctype.value, error)
    message.error('Failed to load column configuration')
  } finally {
    loading.value = false
  }
}

const loadLinkedDocuments = async () => {
  try {
    loading.value = true

    if (!props.documentName || props.documentName === 'new') {
      linkedDocuments.value = []
      totalCount.value = 0
      pagination.value.itemCount = 0
      return
    }

    const allFilters: any[] = [[linkFieldname.value, '=', props.documentName]]

    if (searchFilters.value.length > 0) {
      searchFilters.value.forEach((filter) => {
        allFilters.push([filter.fieldname, filter.operator, filter.value])
      })
    }

    const fieldNames = [...visibleFieldNames.value]

    // Load documents with pagination
    const [documents, count] = await Promise.all([
      getList(linkDoctype.value, {
        fields: fieldNames,
        filters: allFilters,
        limit: pagination.value.pageSize,
        limit_start: (pagination.value.page - 1) * pagination.value.pageSize,
        orderBy: {
          field: 'modified',
          order: 'desc',
        },
        useCache: true,
      }),
      getCount(linkDoctype.value, { filters: allFilters }),
    ])

    linkedDocuments.value = documents || []
    totalCount.value = count || 0
    pagination.value.itemCount = count || 0
  } catch (error) {
    console.error('Error loading linked documents:', error)
    message.error('Failed to load linked documents')
    linkedDocuments.value = []
    totalCount.value = 0
    pagination.value.itemCount = 0
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  loadLinkedDocuments()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  loadLinkedDocuments()
}

const rowKeyFunction = (row: ListRecord) => row.name

const rowProps = (row: ListRecord) => ({
  style: 'cursor: pointer;',
  onClick: () => {
    handleRowClick(row)
  },
})

const handleRowClick = (row: any) => {
  const doctypeSlug = doctypeToRoute(linkDoctype.value)
  router.push(`/${doctypeSlug}/${row.name}`)
}

const handleCheckedRowKeysChange = (keys: Array<string | number>) => {
  checkedRowKeys.value = keys
}

const handleSearch = (filters: SearchFilter[]) => {
  pagination.value.page = 1
  searchFilters.value = filters
  loadLinkedDocuments()
}

const handleClearSearch = () => {
  pagination.value.page = 1
  searchFilters.value = []
  loadLinkedDocuments()
}

const handleViewChange = (view: string) => {
  currentView.value = view
  // Future logic to handle different views can be added here
}

const handleAction = (action: string) => {
  if (action === 'delete') {
    handleDeleteSelected()
  }
}

const handleDeleteSelected = () => {
  dialog.warning({
    title: 'Confirm Deletion',
    content: `Are you sure you want to delete ${checkedRowKeys.value.length} selected document(s)? This action cannot be undone.`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      const docsToDelete = [...checkedRowKeys.value]
      const toDeleteCount = docsToDelete.length
      loading.value = true
      try {
        const deletionPromises = docsToDelete.map((name) =>
          deleteDocument(linkDoctype.value, name as string),
        )
        await Promise.all(deletionPromises)

        message.success(`${toDeleteCount} document(s) deleted successfully.`)
        checkedRowKeys.value = []
        listCache.clear()
        await loadLinkedDocuments()
      } catch (error) {
        console.error('Error deleting documents:', error)
        message.error('An error occurred while deleting documents.')
      } finally {
        loading.value = false
      }
    },
  })
}

const handleCreate = () => {
  listCache.clear()

  const doctypeSlug = doctypeToRoute(linkDoctype.value)
  const route = {
    path: `/${doctypeSlug}/new`,
    query: {
      [linkFieldname.value]: props.documentName,
    },
  }
  router.push(route)
}

const getTagType = (
  value: string,
): 'default' | 'error' | 'warning' | 'success' | 'primary' | 'info' => {
  return getWorkflowStateType(value)
}

const formatDate = (value: string): string => {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

const formatCurrency = (value: number): string => {
  if (isNaN(value)) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

const getColumnWidth = (fieldtype: string): number | undefined => {
  const widthMap: Record<string, number> = {
    Check: 80,
    Int: 100,
    Float: 120,
    Currency: 120,
    Date: 120,
    Time: 100,
    Datetime: 160,
  }
  return widthMap[fieldtype]
}

// Watch for document changes
watch(
  () => props.linkInfo.link_doctype,
  async (newDoctype) => {
    if (newDoctype) {
      await loadMetadata()
      await loadLinkedDocuments()
    }
  },
  { immediate: true },
)

// Watch for document changes to reload list
watch(
  () => props.documentName,
  async (newDocName) => {
    if (newDocName) {
      await loadLinkedDocuments()
    }
  },
)

// Load data on mount
onMounted(async () => {
  await loadMetadata()
  await loadLinkedDocuments()
})
</script>

<style scoped></style>
