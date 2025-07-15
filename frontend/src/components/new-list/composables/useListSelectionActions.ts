import { ref, computed } from 'vue'
import type { ListRecord, CustomAction } from '@/types/Lists'

export function useListSelectionActions() {
  // Selected row keys and row objects
  const checkedRowKeys = ref<Array<string | number>>([])
  const selectedRows = ref<ListRecord[]>([])

  // Whether any rows are selected
  const hasSelections = computed(() => checkedRowKeys.value.length > 0)

  // Action dropdown options (can be extended with custom actions)
  const defaultActions = [
    { key: 'delete', label: 'Delete', type: 'error' },
    // { key: 'export', label: 'Export', type: 'default' },
  ]
  const customActions = ref<CustomAction[]>([])

  const actionOptions = computed(() => [
    ...customActions.value.map(a => ({ key: a.key, label: a.label, type: 'default' })),
    ...defaultActions,
  ])

  // Handle action selection
  const handleAction = (actionKey: string) => {
    // You can expand this to emit events or call handlers as needed
    // For now, just return the action key and selected rows
    return { actionKey, selectedRows: selectedRows.value }
  }

  // Update selection state
  const updateSelection = (keys: Array<string | number>, rows: ListRecord[]) => {
    checkedRowKeys.value = keys
    selectedRows.value = rows
  }

  return {
    checkedRowKeys,
    selectedRows,
    hasSelections,
    actionOptions,
    handleAction,
    updateSelection,
    customActions,
  }
} 