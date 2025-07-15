import { ref, reactive } from 'vue'
import { useListService } from '@/composables/services'
import type { ListRecord } from '@/types/Lists'

interface SortState {
  field: string
  order: 'asc' | 'desc'
}

/**
 * Composable that handles loading tree-table records with server-side sorting support.
 * Keeps its own sort state so it doesn’t interfere with the main list page sorting.
 */
export function useTreeTableRecords(doctype: string) {
  const listService = useListService()

  const records = ref<ListRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const currentSort = reactive<SortState>({
    field: 'modified',
    order: 'desc',
  })

  /**
   * Load records using currentSort state
   */
  const loadRecords = async () => {
    try {
      loading.value = true
      error.value = null

      const data = await listService.getList(doctype, {
        limit: 1000,
        orderBy: { ...currentSort },
      })

      records.value = data || []
    } catch (err) {
      console.error('Failed to load tree table records:', err)
      error.value = err instanceof Error ? err.message : String(err)
      records.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Update sort field/order then reload
   */
  const setSort = (field: string, order: 'asc' | 'desc') => {
    currentSort.field = field
    currentSort.order = order
    loadRecords()
  }

  return {
    // state
    records,
    loading,
    error,
    currentSort,
    // methods
    loadRecords,
    setSort,
  }
} 