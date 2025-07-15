<template>
  <div class="flex flex-col h-full">
    <!-- List Header -->
    <ListHeader
      :doctype="doctype"
      :total-count="totalCount"
      :current-view="currentView"
      :available-views="availableViews"
      :loading="loading || clientScriptLoading"
      :has-selections="hasSelections"
      :action-options="filteredActionOptions"
      :ui-settings="{ ...uiSettings, ...permissionBasedUISettings }"
      :settings-options="settingsOptions"
      @add-record="handleAddRecord"
      @view-change="handleViewChange"
      @settings="handleSettings"
      @action="handleAction"
    />

    <n-divider style="margin: 0rem" />

    <!-- Scrollable content area -->
    <div class="flex-1 py-4 overflow-auto">
      <!-- Table Controls -->
      <!-- will only show if List view is selected -->
      <div v-if="currentView === 'List'" class="px-8 pb-4">
        <TableControls
          :searchable-fields="searchableFields"
          :search-loading="searchLoading"
          :has-selections="hasSelections"
          :selected-count="selectedRows.length"
          :current-field="currentSearchField"
          :current-value="currentSearchValue"
          @search="handleSearch"
          @clear-search="handleClearSearch"
          @sort-change="handleSortChange"
        />
      </div>

      <n-alert
        v-if="viewError"
        type="error"
        title="View Error"
        :bordered="false"
        class="mx-8 mb-4"
      >
        {{ viewError }}
      </n-alert>

      <Suspense v-else>
        <template #default>
          <div class="px-8">
            <component
              :is="activeViewComponent"
              ref="viewRef"
              v-bind="viewProps"
              @apply-settings="handleApplySettings"
            />
          </div>
        </template>
      </Suspense>
    </div>

    <!-- Settings Modal -->
    <ListSettingsModal
      v-model:show="showSettings"
      :available-fields="availableFields"
      :visible-fields="[...visibleFieldNames]"
      :widths="{ ...columnWidths }"
      @apply="handleApplySettings"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  watch,
  defineAsyncComponent,
  Suspense,
} from 'vue'
import { useRouter } from 'vue-router'
import {
  useMessage,
  useLoadingBar,
  NDivider,
  NAlert,
  NSpin,
  NDataTable,
  useDialog,
  NSkeleton,
} from 'naive-ui'
import ListHeader from '../new-list/ListHeader.vue'
import TableControls from '../new-list/TableControls.vue'
import { useListPageState } from '../new-list/composables/useListPageState'

import ListSettingsModal from '../new-list/ListSettingsModal.vue'
import { useColumnManagement } from '../new-list/composables/useColumnManagement'
import { useListPageActions } from '../new-list/composables/useListPageActions'
import { useListSelectionActions } from '../new-list/composables/useListSelectionActions'
import { useListPageClientScript } from '../new-list/composables/useListPageClientScript'
import { useViewPersistence } from '../new-list/composables/useViewPersistence'
import { useDocumentService } from '@/composables/services'
import { usePermissionsStore } from '@/stores/permissions'
import { handlePermissionError } from '@/utils/permissionErrorHandler'

import type { ListRecord, SearchFilter } from '@/types/Lists'
import type { DropdownOption } from 'naive-ui'

// Define component name for KeepAlive
defineOptions({
  name: 'ListPage',
})

// View Components (Async)
const DataTable = defineAsyncComponent(
  () => import('../new-list/DataTable.vue'),
)
const TreeTableView = defineAsyncComponent(
  () => import('../new-list/views/TreeTableView.vue'),
)
const DiagramView = defineAsyncComponent(
  () => import('../new-list/views/DiagramView.vue'),
)
const MapView = defineAsyncComponent(
  () => import('../new-list/views/MapView.vue'),
)

const viewMap = {
  List: DataTable,
  Tree: TreeTableView,
  Diagram: DiagramView,
  Map: MapView,
}

// -----------------------------------------------------------------------------
// Props & Emits
// -----------------------------------------------------------------------------
interface Props {
  doctype: string
  recordLabel?: string
  routePath?: string
}

const props = withDefaults(defineProps<Props>(), {
  recordLabel: 'Records',
  routePath: '',
})

const emit = defineEmits<{
  error: [error: Error]
  'records-loaded': [records: ListRecord[]]
  'selection-changed': [keys: Array<string | number>, rows: ListRecord[]]
}>()

// -----------------------------------------------------------------------------
// Composables
// -----------------------------------------------------------------------------
const router = useRouter()
const message = useMessage()
const loadingBar = useLoadingBar()
const dialog = useDialog()

// Document service for delete operations
const { deleteDocument } = useDocumentService()

// Global permissions store
const permissionsStore = usePermissionsStore()

// Proper Permission Logic using FrappePermissions logic
// Only can_read grants list and form access

// Permission-based computed properties
const canRead = computed(() => {
  return permissionsStore.canRead(props.doctype)
})

const canWrite = computed(() => {
  return permissionsStore.canWrite(props.doctype)
})

const canCreate = computed(() => {
  return permissionsStore.canCreate(props.doctype)
})

const canDelete = computed(() => {
  return permissionsStore.canDelete(props.doctype)
})

const canSelect = computed(() => {
  return permissionsStore.canSearch(props.doctype)
})

// LIST ACCESS: Only can_read grants list access
const canAccessListPage = computed(() => {
  return canRead.value
})

// FORM ACCESS: Only can_read grants form access
const canAccessFormPage = computed(() => {
  return canRead.value
})

// EDITING: read + write = Edit capabilities
const canEditForm = computed(() => {
  return canRead.value && canWrite.value
})

// CREATING: create = Show "Add" buttons + /new Form access
const canCreateRecord = computed(() => {
  return canCreate.value
})

// DELETING: delete + list access = Delete from List Page
const canDeleteFromList = computed(() => {
  return canDelete.value && canAccessListPage.value
})

// Permission-based UI settings using proper permission logic
const permissionBasedUISettings = computed(() => ({
  hideAddButton: !canCreateRecord.value,
  hideEditButtons: !canEditForm.value,
  hideDeleteButtons: !canDeleteFromList.value,
  allowRowClick: canAccessFormPage.value,
}))

// Client script
const {
  loading: clientScriptLoading,
  error: clientScriptError,
  listConfig,
  availableViews,
  uiSettings,
  runHook,
} = useListPageClientScript(props.doctype)

// State management
const {
  records,
  loading,
  searchLoading,
  error,
  pagination,
  searchQuery,
  totalCount,
  loadRecords,
  searchRecords,
  clearSearch,
  refreshRecords,
  setSort,
} = useListPageState(props.doctype)

// -----------------------------------------------------------------------------
// Local reactive state for search controls (to persist across view switches)
// -----------------------------------------------------------------------------
const currentSearchField = ref<string | null>(null)
const currentSearchValue = ref('')

// Column management
const {
  availableFields,
  visibleFields,
  visibleFieldNames,
  visibleColumns,
  searchableFields,
  columnWidths,
  applyColumnSettings,
} = useColumnManagement(props.doctype)

// Actions
const { handleAddRecord: addRecord, handleRowClick: rowClick } =
  useListPageActions(props.doctype, props.routePath)

// Selection actions
const {
  checkedRowKeys,
  selectedRows,
  hasSelections,
  actionOptions,
  handleAction: doHandleAction,
  updateSelection,
  customActions,
} = useListSelectionActions()

// Filter action options based on global permissions
const filteredActionOptions = computed(() =>
  actionOptions.value.filter(
    (opt) => !(opt.key === 'delete' && !canDeleteFromList.value),
  ),
)

// View management
const { currentView, setView: setPersistentView } = useViewPersistence(
  props.doctype,
)
const viewError = ref<string | null>(null)
const viewRef = ref<any>(null)

// -----------------------------------------------------------------------------
// Local State
// -----------------------------------------------------------------------------
const showSettings = ref(false)

// Active view component
const activeViewComponent = computed(() => {
  return viewMap[currentView.value as keyof typeof viewMap] || DataTable
})

const settingsOptions = computed((): DropdownOption[] => {
  const options: DropdownOption[] = []
  if (availableViews.value.includes('List')) {
    options.push({ label: 'List Settings', key: 'list' })
  }
  if (availableViews.value.includes('Tree')) {
    options.push({ label: 'Tree Settings', key: 'tree' })
  }
  return options
})

// Props for the active view
const viewProps = computed(() => {
  switch (currentView.value) {
    case 'Tree':
      return {
        doctype: props.doctype,
        treeConfig: listConfig.value?.treeOptions,
        // Pass the same columns that DataTable uses for consistency
        columns: visibleColumns.value,
      }
    case 'Diagram':
      return {
        doctype: props.doctype,
        diagramConfig: listConfig.value?.diagramOptions,
        // Pass any other necessary props
      }
    case 'Map':
      return {
        doctype: props.doctype,
        // Pass any other necessary props
      }
    case 'List':
    default:
      return {
        doctype: props.doctype,
        data: [...records.value],
        columns: visibleColumns.value,
        loading: loading.value,
        pagination: pagination,
        onRowClick: handleRowClick,
        'onChecked-rows-change': handleCheckedRowsChange,
        onRefresh: handleRefresh,
      }
  }
})

// -----------------------------------------------------------------------------
// Event Handlers
// -----------------------------------------------------------------------------
const handleAddRecord = () => {
  addRecord()
}

const handleRowClick = (record: ListRecord) => {
  rowClick(record)
}

const handleViewChange = (view: string) => {
  if (availableViews.value.includes(view)) {
    viewError.value = null
    setPersistentView(view)
  } else {
    viewError.value = `View "${view}" is not available for this doctype.`
  }
}

const handleSettings = (key: string | number) => {
  if (key === 'list') {
    showSettings.value = true
  } else if (key === 'tree') {
    viewRef.value?.openSettings()
  }
}

const handleSearch = async (filters: SearchFilter[]) => {
  try {
    loadingBar.start()
    // Persist current search params for TableControls
    if (filters.length > 0) {
      currentSearchField.value = filters[0].fieldname
      currentSearchValue.value = String(filters[0].value).replace(/%/g, '')
    }
    await searchRecords(filters)
    emit('records-loaded', [...records.value])
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Search failed')
    emit('error', error)
    message.error(error.message)
  } finally {
    loadingBar.finish()
  }
}

const handleClearSearch = async () => {
  try {
    loadingBar.start()
    // Reset persisted search params
    currentSearchField.value = null
    currentSearchValue.value = ''
    await clearSearch()
    emit('records-loaded', [...records.value])
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Clear search failed')
    emit('error', error)
    message.error(error.message)
  } finally {
    loadingBar.finish()
  }
}

const handleSortChange = async (sort: {
  field: string
  order: 'asc' | 'desc'
}) => {
  try {
    loadingBar.start()
    setSort(sort.field, sort.order)
    await refreshRecords()
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Sort failed')
    emit('error', error)
    message.error(error.message)
  } finally {
    loadingBar.finish()
  }
}

const handleCheckedRowsChange = (
  keys: Array<string | number>,
  rows: ListRecord[],
) => {
  updateSelection(keys, rows)
  emit('selection-changed', keys, rows)
}

const handleAction = async (actionKey: string) => {
  const result = doHandleAction(actionKey)

  if (actionKey === 'delete') {
    await handleBulkDelete(result.selectedRows)
  } else {
    message.info(
      `Action: ${result.actionKey} on ${result.selectedRows.length} rows`,
    )
  }
}

const handleBulkDelete = async (selectedRows: ListRecord[]) => {
  if (selectedRows.length === 0) {
    message.warning('No records selected for deletion')
    return
  }

  const count = selectedRows.length
  const messageText =
    count === 1
      ? `Are you sure you want to delete "${selectedRows[0].name}"?`
      : `Are you sure you want to delete ${count} records? This action cannot be undone.`

  dialog.warning({
    title: 'Confirm Bulk Deletion',
    content: messageText,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        loadingBar.start()

        // Delete each document
        const deletePromises = selectedRows.map((row) =>
          deleteDocument(props.doctype, row.name),
        )

        await Promise.all(deletePromises)

        message.success(`${count} record(s) deleted successfully`)

        // Clear selection and reload records
        updateSelection([], [])
        await loadRecords()
        emit('records-loaded', [...records.value])
      } catch (err) {
        console.error('Error deleting records:', err)
        const error =
          err instanceof Error ? err : new Error('Failed to delete records')
        emit('error', error)
        message.error(error.message)
      } finally {
        loadingBar.finish()
      }
    },
  })
}

const handleRefresh = async () => {
  try {
    loadingBar.start()
    // Clear selections on refresh
    updateSelection([], [])
    await loadRecords()
    emit('records-loaded', [...records.value])
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Refresh failed')
    emit('error', error)
    message.error(error.message)
  } finally {
    loadingBar.finish()
  }
}

const handleApplySettings = async (settings: {
  fieldNames: string[]
  widths: Record<string, number>
}) => {
  try {
    loadingBar.start()
    await applyColumnSettings(settings.fieldNames, settings.widths)
    showSettings.value = false
    message.success('Column settings applied')
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error('Apply settings failed')
    emit('error', error)
    message.error(error.message)
  } finally {
    loadingBar.finish()
  }
}

// -----------------------------------------------------------------------------
// Lifecycle
// -----------------------------------------------------------------------------
onMounted(async () => {
  try {
    loadingBar.start()

    // Ensure permissions are loaded
    if (!permissionsStore.isLoaded) {
      await permissionsStore.fetchBootInfo()
    }

    // Check if we already have records loaded (from keep-alive cache)
    if (records.value.length > 0) {
      // If we have cached records, don't reload
      emit('records-loaded', [...records.value])
      return
    }

    await loadRecords()
    emit('records-loaded', [...records.value])
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error('Failed to load records')
    emit('error', error)
    message.error(error.message)
  } finally {
    loadingBar.finish()
  }
})

// Watch for errors from the list page state
watch(error, (newError) => {
  if (newError) {
    emit('error', new Error(newError))
    message.error(newError)
  }
})

// Watch for errors from the client script
watch(clientScriptError, (newError) => {
  if (newError) {
    // Optionally emit this error or just log it
    console.error('Client script error:', newError)
    message.error('A client script error occurred.')
  }
})

// Watch for permission changes and redirect if forbidden
watch(
  [canRead, () => permissionsStore.isLoaded],
  ([canReadVal, isLoaded]) => {
    if (isLoaded && !canReadVal) {
      handlePermissionError(
        router,
        {
          _error_message: `You do not have permission to view ${props.doctype}`,
        },
        props.doctype,
      )
    }
  },
  { immediate: true },
)

// Event handlers
const handleError = (error: Error) => {
  console.error('🔍 ListPage Error Handler:', error)
  message.error(error.message)
}

const handleRecordsLoaded = (records: ListRecord[]) => {
  console.log('🔍 ListPage Records Loaded:', records.length, 'records')
}

const handleSelectionChanged = (
  keys: Array<string | number>,
  rows: ListRecord[],
) => {
  console.log('🔍 ListPage Selection Changed:', keys.length, 'selected')
}
</script>

<style scoped>
.list-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
