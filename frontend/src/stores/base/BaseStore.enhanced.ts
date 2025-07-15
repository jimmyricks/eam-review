import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn, useThrottleFn } from '@vueuse/core'
import { frappeDB } from '@/services/PurchaseStoreAPI'
import { useAppEventBus } from '@/composables/useVueUseUtils'

export interface BaseDoc {
  name: string
  [key: string]: any
}

export interface BaseStoreOptions<T extends BaseDoc> {
  storeName: string
  doctype: string
  formatLabel?: (doc: T) => string
  searchFields?: string[]
  defaultFilters?: Record<string, any>
  cacheEnabled?: boolean
  persistPaths?: string[]
}

export function createEnhancedBaseStore<T extends BaseDoc>(options: BaseStoreOptions<T>) {
  return defineStore(options.storeName, () => {
    // State
    const documents = ref<T[]>([])
    const loaded = ref(false)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const searchTerm = ref('')
    const filters = ref<Record<string, any>>(options.defaultFilters || {})
    
    // Dependencies
    const router = useRouter()
    const { emitDocumentSaved, emitDocumentDeleted, emitError, emitSuccess } = useAppEventBus()

    // Computed
    const filteredDocuments = computed(() => {
      let filtered = documents.value

      // Apply search filter
      if (searchTerm.value.trim() && options.searchFields) {
        const search = searchTerm.value.toLowerCase()
        filtered = filtered.filter(doc => 
          options.searchFields!.some(field => 
            doc[field]?.toString().toLowerCase().includes(search)
          )
        )
      }

      // Apply additional filters
      Object.entries(filters.value).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filtered = filtered.filter(doc => doc[key] === value)
        }
      })

      return filtered
    })

    const documentOptions = computed(() =>
      documents.value.map((doc) => ({
        label: options.formatLabel ? options.formatLabel(doc) : doc.name,
        value: doc.name,
      }))
    )

    const documentsByStatus = computed(() => {
      if (!documents.value.some(doc => doc.workflow_state)) return {}
      
      const grouped: Record<string, any[]> = {}
      documents.value.forEach(doc => {
        const status = doc.workflow_state || 'Unknown'
        if (!grouped[status]) grouped[status] = []
        grouped[status].push(doc)
      })
      return grouped
    })

    // Optimized search function with debouncing
    const debouncedSearch = useDebounceFn((term: string) => {
      searchTerm.value = term
    }, 300)

    // Throttled fetch to prevent excessive API calls
    const throttledFetch = useThrottleFn(async (fetchFilters = {}, forceRefresh = false) => {
      if (loaded.value && !forceRefresh) return
      
      loading.value = true
      error.value = null

      try {
        const fetchedDocs = await frappeDB.getDocList(options.doctype, {
          fields: ['*'],
          filters: { ...options.defaultFilters, ...fetchFilters },
        })
        documents.value = fetchedDocs
        loaded.value = true
        console.log(`${options.doctype} loaded:`, documents.value.length)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : `Failed to fetch ${options.doctype}`
        error.value = errorMsg
        emitError(`Failed to load ${options.doctype}`, err)
        console.error(`Error fetching ${options.doctype}:`, err)
      } finally {
        loading.value = false
      }
    }, 1000)

    // Actions
    const fetchDocuments = async (fetchFilters = {}, forceRefresh = false) => {
      await throttledFetch(fetchFilters, forceRefresh)
    }

    const addDocument = async (newDoc: Omit<T, 'name'>) => {
      loading.value = true
      error.value = null

      try {
        const doc = await frappeDB.createDoc(options.doctype, newDoc)
        documents.value.push(doc as T)
        
        // Emit success events
        emitDocumentSaved(options.doctype, doc.name, doc)
        emitSuccess(`${options.doctype} "${doc.name}" created successfully`)
        
        // Navigate to new document
        router.push(`/${options.doctype.toLowerCase().replace(' ', '-')}/${doc.name}`)
        
        return { success: true, data: doc }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : `Failed to create ${options.doctype}`
        error.value = errorMsg
        emitError(`Failed to create ${options.doctype}`, err)
        console.error(`Error adding ${options.doctype}:`, err)
        return { success: false, error: err }
      } finally {
        loading.value = false
      }
    }

    const updateDocument = async (docID: string, updatedData: Partial<T>) => {
      loading.value = true
      error.value = null

      try {
        const updatedDoc = await frappeDB.updateDoc<T>(options.doctype, docID, updatedData)
        
        // Update local state
        const index = documents.value.findIndex((d) => d.name === docID)
        if (index !== -1) {
          documents.value[index] = updatedDoc
        }

        // Emit success events
        emitDocumentSaved(options.doctype, updatedDoc.name, updatedDoc)
        emitSuccess(`${options.doctype} "${docID}" updated successfully`)
        
        return { success: true, data: updatedDoc }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : `Failed to update ${options.doctype}`
        error.value = errorMsg
        emitError(`Failed to update ${options.doctype}`, err)
        console.error(`Error updating ${options.doctype}:`, err)
        return { success: false, error: err }
      } finally {
        loading.value = false
      }
    }

    const deleteDocument = async (docName: string) => {
      loading.value = true
      error.value = null

      try {
        await frappeDB.deleteDoc(options.doctype, docName)
        
        // Update local state
        documents.value = documents.value.filter((d) => d.name !== docName)
        
        // Emit success events
        emitDocumentDeleted(options.doctype, docName)
        emitSuccess(`${options.doctype} "${docName}" deleted successfully`)
        
        return { success: true }
      } catch (err: any) {
        const errorMsg = err.message || `Failed to delete ${options.doctype}`
        error.value = errorMsg
        emitError(`Failed to delete ${options.doctype}`, err)
        console.error(`Error deleting ${options.doctype}:`, err)
        return { success: false, error: errorMsg }
      } finally {
        loading.value = false
      }
    }

    // Filter management
    const setFilter = (key: string, value: any) => {
      filters.value[key] = value
    }

    const clearFilters = () => {
      filters.value = { ...options.defaultFilters }
      searchTerm.value = ''
    }

    const getDocumentById = (id: string) => {
      return documents.value.find(doc => doc.name === id)
    }

    const refreshDocuments = async () => {
      await fetchDocuments({}, true)
    }

    // Bulk operations
    const bulkDelete = async (docNames: string[]) => {
      loading.value = true
      error.value = null

      try {
        const results = await Promise.allSettled(
          docNames.map(name => frappeDB.deleteDoc(options.doctype, name))
        )

        const successful = results.filter(result => result.status === 'fulfilled').length
        const failed = results.filter(result => result.status === 'rejected').length

        // Update local state for successful deletions
        documents.value = documents.value.filter(doc => !docNames.includes(doc.name))

        if (failed === 0) {
          emitSuccess(`Successfully deleted ${successful} ${options.doctype} records`)
        } else {
          emitError(`Deleted ${successful} records, ${failed} failed`, new Error(`${failed} deletions failed`))
        }

        return { success: true, successful, failed }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : `Failed to bulk delete ${options.doctype}`
        error.value = errorMsg
        emitError(`Failed to bulk delete ${options.doctype}`, err)
        return { success: false, error: err }
      } finally {
        loading.value = false
      }
    }

    return {
      // State
      documents: filteredDocuments,
      allDocuments: computed(() => documents.value),
      loaded,
      loading,
      error,
      searchTerm,
      filters,

      // Computed
      documentOptions,
      documentsByStatus,

      // Actions
      fetchDocuments,
      addDocument,
      updateDocument,
      deleteDocument,
      refreshDocuments,
      bulkDelete,
      
      // Search & Filter
      debouncedSearch,
      setFilter,
      clearFilters,
      getDocumentById,

      // Configuration
      doctype: options.doctype,
      searchFields: options.searchFields || []
    }
  }, options.cacheEnabled ? {
    persist: {
      key: `eam_${options.storeName.toLowerCase()}`,
      paths: options.persistPaths || ['documents', 'loaded']
    }
  } : undefined)
} 