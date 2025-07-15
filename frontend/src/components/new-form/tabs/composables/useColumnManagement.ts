import { ref, computed, onMounted, readonly } from 'vue'
import { useMetadataService } from '@/composables/services'
import { useStorage } from '@vueuse/core'
// Removed Frappe persistence – now using browser localStorage
import type { ColumnField, SearchableField } from '@/types/Lists'

/**
 * Composable for managing column visibility and settings
 * @param doctype - The doctype to manage columns for
 */
export function useColumnManagement(doctype: string) {
  // -----------------------------------------------------------------------------
  // Constants
  // -----------------------------------------------------------------------------
  const MAX_COLUMNS = 4
  const MANDATORY_FIELDS = ['name']
  const WORKFLOW_FIELDS = ['workflow_state']

  // -----------------------------------------------------------------------------
  // Services
  // -----------------------------------------------------------------------------
  const metadataService = useMetadataService()

  // -----------------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------------
  const metadata = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const visibleFieldNames = ref<string[]>([])

  // -----------------------------------------------------------------------------
  // Local persistence helpers (visible columns) - Using VueUse useStorage
  // -----------------------------------------------------------------------------
  const STORAGE_KEY = `form-table-settings-${doctype}`

  // Use VueUse's useStorage for reactive localStorage management
  const persistedSettings = useStorage(STORAGE_KEY, {} as Record<string, any>)

  const readFromStorage = (): Record<string, any> => {
    return persistedSettings.value || {}
  }

  const writeToStorage = (payload: Record<string, any>): void => {
    try {
      const existing = readFromStorage()
      const merged = { ...existing, ...payload }
      persistedSettings.value = merged
    } catch (err) {
      console.error('Failed persisting form table settings to localStorage', err)
    }
  }

  // -----------------------------------------------------------------------------
  // Computed Properties
  // -----------------------------------------------------------------------------

  /**
   * Available fields from metadata
   */
  const availableFields = computed((): ColumnField[] => {
    if (!metadata.value?.fields) return []
  
    const normalFields = metadata.value.fields.map((field: any) => {
      const isWorkflow = field.fieldname === 'workflow_state'
    
      return {
        fieldname: field.fieldname,
        label: isWorkflow ? 'Status' : (field.label || field.fieldname),
        type: field.fieldtype || 'Data',
        visible: visibleFieldNames.value.includes(field.fieldname),
        width: getColumnWidth(field.fieldtype),
        in_list_view: field.in_list_view || 0,
      }
    })
    
    // Add "name" manually if not in metadata
    const nameField: ColumnField = {
      fieldname: 'name',
      label: 'ID',
      type: 'Data',
      visible: visibleFieldNames.value.includes('name'),
      width: 150,
      in_list_view: 1,
    }
  
    return [nameField, ...normalFields]
  })
  
  /**
   * Currently visible fields only
   */
  const visibleFields = computed((): ColumnField[] => {
    return availableFields.value.filter(field => field.visible)
  })

  /**
   * Visible columns for table rendering
   */
  const visibleColumns = computed((): ColumnField[] => {
    // Ensure proper ordering: name first, workflow last
    const nameField = visibleFields.value.find(f => f.fieldname === 'name')
    const workflowFields = visibleFields.value.filter(f => 
      WORKFLOW_FIELDS.some(wf => f.fieldname.includes(wf))
    )
    const otherFields = visibleFields.value.filter(f => 
      f.fieldname !== 'name' && 
      !WORKFLOW_FIELDS.some(wf => f.fieldname.includes(wf))
    )

    const orderedFields = []
    if (nameField) orderedFields.push(nameField)
    orderedFields.push(...otherFields)
    orderedFields.push(...workflowFields)

    return orderedFields.slice(0, MAX_COLUMNS)
  })

  /**
   * Searchable fields from metadata
   */
  const searchableFields = computed((): SearchableField[] => {
    if (!metadata.value?.fields) return []

    return metadata.value.fields
      .filter((field: any) => isSearchableField(field.fieldtype))
      .map((field: any) => ({
        label: field.label || field.fieldname,
        value: field.fieldname,
        type: field.fieldtype,
      }))
  })

  // -----------------------------------------------------------------------------
  // Utility Functions
  // -----------------------------------------------------------------------------

  /**
   * Check if a field is mandatory (always visible)
   */
  const isMandatoryField = (fieldname: string): boolean => {
    return MANDATORY_FIELDS.includes(fieldname) || 
           WORKFLOW_FIELDS.some(wf => fieldname.includes(wf))
  }

  /**
   * Check if a field type is searchable
   */
  const isSearchableField = (fieldtype: string): boolean => {
    const searchableTypes = [
      'Data', 'Text', 'Small Text', 'Long Text',
      'Link', 'Dynamic Link', 'Select',
      'Int', 'Float', 'Currency',
      'Date', 'Datetime', 'Time'
    ]
    return searchableTypes.includes(fieldtype)
  }

  /**
   * Get appropriate column width based on field type
   */
  const getColumnWidth = (fieldtype: string): number | undefined => {
    const widthMap: Record<string, number> = {
      'Check': 80,
      'Int': 100,
      'Float': 120,
      'Currency': 120,
      'Percent': 100,
      'Date': 120,
      'Time': 100,
      'Datetime': 160,
    }
    return widthMap[fieldtype]
  }

  /**
   * Get default visible fields (first 6 with in_list_view = 1)
   */
  const getDefaultVisibleFields = (): string[] => {
    const mandatory = ['name', ...(
      metadata.value?.fields
        ?.filter((field: any) => isMandatoryField(field.fieldname) && field.fieldname !== 'name')
        .map((field: any) => field.fieldname) || []
    )]
  
    const listViewFields = metadata.value?.fields
      ?.filter((field: any) => field.in_list_view && !isMandatoryField(field.fieldname))
      .map((field: any) => field.fieldname) || []
  
    const combined = [...mandatory, ...listViewFields]
    return combined.slice(0, MAX_COLUMNS)
  }  

  /**
   * Fetch persisted settings for this doctype from localStorage.
   */
  const fetchPersisted = async () => {
    return readFromStorage()
  }

  /**
   * Save updated settings for this doctype to localStorage.
   */
  const persist = async (payload: Record<string, any>) => {
    writeToStorage(payload)
  }

  // -----------------------------------------------------------------------------
  // Methods
  // -----------------------------------------------------------------------------

  /**
   * Load metadata for the doctype
   */
  const loadMetadata = async () => {
    try {
      loading.value = true
      error.value = null

      metadata.value = await metadataService.getMetadata(doctype)

      // Load persisted settings or use defaults
      const persisted = await fetchPersisted()

      if (persisted.visibleColumns && persisted.visibleColumns.length > 0) {
        visibleFieldNames.value = persisted.visibleColumns.slice(0, MAX_COLUMNS)
      } else {
        visibleFieldNames.value = getDefaultVisibleFields()
      }

      console.log(`Loaded metadata for ${doctype} with ${visibleFieldNames.value.length} visible columns`)
    } catch (err) {
      console.error(`Failed to load metadata for ${doctype}:`, err)
      error.value = err instanceof Error ? err.message : 'Failed to load metadata'
    } finally {
      loading.value = false
    }
  }

  /**
   * Apply new column settings
   */
  const applyColumnSettings = async (fieldNames: string[]) => {
    try {
      // Ensure mandatory fields are included
      const mandatoryFields = availableFields.value
        .filter(f => isMandatoryField(f.fieldname))
        .map(f => f.fieldname)

      const finalFields = [
        ...mandatoryFields,
        ...fieldNames.filter(f => !isMandatoryField(f)),
      ].slice(0, MAX_COLUMNS)

      visibleFieldNames.value = finalFields
      await persist({ visibleColumns: finalFields })

      console.log(`Applied column settings for ${doctype}:`, finalFields)
    } catch (err) {
      console.error('Failed to apply column settings:', err)
      throw err
    }
  }

  /**
   * Reset to default column settings
   */
  const resetColumnSettings = () => {
    const defaultFields = getDefaultVisibleFields()
    visibleFieldNames.value = defaultFields
    persist({ visibleColumns: defaultFields })
  }

  // -----------------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------------
  onMounted(() => {
    loadMetadata()
  })

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    availableFields,
    visibleFields,
    visibleFieldNames: readonly(visibleFieldNames),
    visibleColumns,
    searchableFields,
    
    // Methods
    loadMetadata,
    applyColumnSettings,
    resetColumnSettings,
    
    // Constants
    MAX_COLUMNS,

    // Utilities
    isMandatoryField,
    isSearchableField,
  }
} 