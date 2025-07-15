import { ref, computed, reactive, readonly } from 'vue'
import {
  useListService,
  useMetadataService,
  useSearchService,
} from '@/composables/services'
import type { ListRecord, SearchFilter } from '@/types/Lists'

/**
 * Composable for managing list page state
 * @param doctype - The doctype to manage
 */
export function useListPageState(doctype: string) {
  // -----------------------------------------------------------------------------
  // Services
  // -----------------------------------------------------------------------------
  const listService = useListService()
  const metadataService = useMetadataService()
  const searchService = useSearchService()

  // -----------------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------------
  const records = ref<ListRecord[]>([])
  const loading = ref(false)
  const searchLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const totalCount = ref(0)
  const currentFilters = ref<SearchFilter[]>([])

  // Sorting state
  const currentSort = reactive({
    field: 'modified' as string,
    order: 'desc' as 'asc' | 'desc',
  })

  // Pagination state for n-data-table
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 20, 50, 100],
    onChange: (page: number) => {
      loadRecords(page, pagination.pageSize)
    },
    onUpdatePageSize: (pageSize: number) => {
      pagination.pageSize = pageSize
      loadRecords(1, pageSize)
    }
  })

  // -----------------------------------------------------------------------------
  // Computed Properties
  // -----------------------------------------------------------------------------
  const hasActiveSearch = computed(() => currentFilters.value.length > 0)

  // -----------------------------------------------------------------------------
  // Methods
  // -----------------------------------------------------------------------------

  /**
   * Load records with pagination using SDK parameters
   */
  const loadRecords = async (page = 1, pageSize = pagination.pageSize) => {
    try {
      loading.value = true
      error.value = null

      // Update pagination state
      pagination.page = page
      pagination.pageSize = pageSize

      // Calculate limit_start for SDK
      const limit_start = (page - 1) * pageSize

      // Load records using SDK format
      const data = await listService.getList(doctype, {
        fields: ['*'],
        limit: pageSize,
        limit_start: limit_start,
        orderBy: {
          field: currentSort.field,
          order: currentSort.order,
        },
      })

      // Get total count for pagination
      const count = await listService.getCount(doctype)

      records.value = data || []
      totalCount.value = count
      pagination.itemCount = count

    } catch (err) {
      console.error(`🔍 ListPageState Error for ${doctype}:`, err)
      error.value = err instanceof Error ? err.message : 'Failed to load records'
      records.value = []
      totalCount.value = 0
      pagination.itemCount = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * Search records using searchInFields
   */
  const searchRecords = async (filters: SearchFilter[]) => {
    try {
      searchLoading.value = true
      error.value = null
      currentFilters.value = filters

      if (filters.length === 0) {
        // No filters, load regular records
        await loadRecords(1, pagination.pageSize)
        return
      }

      // Use the first filter for search (assuming single field search)
      const filter = filters[0]
      
      // Use searchInFields from listService
      const data = await listService.searchInFields(
        doctype,
        filter.value.replace(/%/g, ''), // Remove % wildcards
        [filter.fieldname],
        {
          limit: pagination.pageSize,
          limit_start: 0,
          orderBy: {
            field: currentSort.field,
            order: currentSort.order,
          },
        }
      )

      records.value = data || []
      totalCount.value = data?.length || 0
      pagination.itemCount = data?.length || 0
      pagination.page = 1 // Reset to first page when searching

    } catch (err) {
      console.error(`Error searching records for ${doctype}:`, err)
      error.value = err instanceof Error ? err.message : 'Search failed'
      records.value = []
      totalCount.value = 0
      pagination.itemCount = 0
    } finally {
      searchLoading.value = false
    }
  }

  /**
   * Clear search and reload records
   */
  const clearSearch = async () => {
    searchQuery.value = ''
    currentFilters.value = []
    await loadRecords(1, pagination.pageSize)
  }

  /**
   * Refresh current records
   */
  const refreshRecords = async () => {
    if (hasActiveSearch.value) {
      await searchRecords(currentFilters.value)
    } else {
      await loadRecords(pagination.page, pagination.pageSize)
    }
  }

  /**
   * Update sorting
   */
  const setSort = (field: string, order: 'asc' | 'desc') => {
    currentSort.field = field
    currentSort.order = order
  }

  /**
   * Get total count for a doctype
   */
  const getTotalCount = async () => {
    try {
      const count = await listService.getCount(doctype)
      totalCount.value = count
      pagination.itemCount = count
      return count
    } catch (err) {
      console.error(`Error getting count for ${doctype}:`, err)
      return 0
    }
  }

  return {
    // State
    records: readonly(records),
    loading: readonly(loading),
    searchLoading: readonly(searchLoading),
    error: readonly(error),
    pagination,
    searchQuery: readonly(searchQuery),
    totalCount: readonly(totalCount),
    
    // Computed
    hasActiveSearch,
    
    // Methods
    loadRecords,
    searchRecords,
    clearSearch,
    refreshRecords,
    setSort,
    getTotalCount,
  }
} 