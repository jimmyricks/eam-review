import { ref, computed, onMounted, readonly } from 'vue'
import { useMetadataService } from '@/composables/services'
import type { ColumnField, SearchableField } from '@/types/Lists'

/**
 * Composable for managing column visibility and settings
 * @param doctype - The doctype to manage columns for
 */
export function useColumnManagement(doctype: string) {
  // -----------------------------------------------------------------------------
  // Constants
  // -----------------------------------------------------------------------------
  const MAX_COLUMNS = 6
  const MAX_TOTAL_WIDTH = 10
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
  const columnWidths = ref<Record<string, number>>({})

  // -----------------------------------------------------------------------------
  // Local persistence helpers (visible columns / widths)
  // -----------------------------------------------------------------------------
  const STORAGE_KEY = `list-settings-${doctype}`

  const readFromStorage = (): Record<string, any> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  const writeToStorage = (payload: Record<string, any>): void => {
    try {
      const existing = readFromStorage()
      const merged = { ...existing, ...payload }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    } catch (err) {
      console.error('Failed persisting list settings to localStorage', err)
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
      const fieldWidth = columnWidths.value[field.fieldname] || getDefaultColumnWidth(field.fieldtype)
    
      return {
        fieldname: field.fieldname,
        label: isWorkflow ? 'Status' : (field.label || field.fieldname),
        type: field.fieldtype || 'Data',
        visible: visibleFieldNames.value.includes(field.fieldname),
        width: 0, // Will be recalculated in visibleColumns
        spanWidth: fieldWidth,
        in_list_view: field.in_list_view || 0,
      }
    })
    
    // Add "name" manually if not in metadata
    const nameWidth = columnWidths.value['name'] || 2
    const nameField: ColumnField = {
      fieldname: 'name',
      label: 'ID',
      type: 'Data',
      visible: visibleFieldNames.value.includes('name'),
      width: 0, // Will be recalculated in visibleColumns
      spanWidth: nameWidth,
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
   * Visible columns for table rendering with width validation
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

    // Calculate total span width to determine proportional sizing
    const totalSpanWidth = orderedFields.reduce(
      (sum, field) => sum + (field.spanWidth || 1),
      0,
    )

    // Set a large base width for each column, proportional to its spanWidth.
    // The browser will scale these down to fit the available container width.
    // A base unit of 100 ensures reasonable proportions.
    if (totalSpanWidth > 0) {
      orderedFields.forEach((field) => {
        field.width = ((field.spanWidth || 1) / totalSpanWidth) * 100
      })
    }

    return orderedFields.slice(0, MAX_COLUMNS)
  })

  /**
   * Current total width of visible columns
   */
  const totalWidth = computed(() => {
    return visibleColumns.value.reduce((sum, field) => sum + (field.spanWidth || 1), 0)
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
   * Get default column width span based on field type
   */
  const getDefaultColumnWidth = (fieldtype: string): number => {
    const widthMap: Record<string, number> = {
      'Check': 1,
      'Int': 1,
      'Float': 1,
      'Currency': 2,
      'Percent': 1,
      'Date': 2,
      'Time': 1,
      'Datetime': 2,
      'Small Text': 2,
      'Long Text': 3,
      'Text': 3,
      'Data': 2,
      'Link': 2,
      'Select': 2,
    }
    return widthMap[fieldtype] || 2
  }

  /**
   * Fetch persisted settings for this doctype from localStorage.
   */
  const fetchPersistedSettings = async () => {
    return readFromStorage()
  }

  /**
   * Save updated settings for this doctype to localStorage.
   */
  const persistSettings = async (payload: Record<string, any>) => {
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

      // Load persisted settings (or fall back to defaults)
      const persisted = await fetchPersistedSettings()

      if (persisted.visibleColumns && persisted.visibleColumns.length > 0) {
        visibleFieldNames.value = persisted.visibleColumns.slice(0, MAX_COLUMNS)
      } else {
        visibleFieldNames.value = getDefaultVisibleFields()
      }

      columnWidths.value = persisted.columnWidths || {}

      // console.log(`Loaded metadata for ${doctype} with ${visibleFieldNames.value.length} visible columns`)
    } catch (err) {
      console.error(`Failed to load metadata for ${doctype}:`, err)
      error.value = err instanceof Error ? err.message : 'Failed to load metadata'
    } finally {
      loading.value = false
    }
  }

  /**
   * Apply new column settings with optional width settings
   */
  const applyColumnSettings = async (fieldNames: string[], widths?: Record<string, number>) => {
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
      await persistSettings({ visibleColumns: finalFields, columnWidths: columnWidths.value })

      // Apply width settings if provided
      if (widths) {
        columnWidths.value = { ...columnWidths.value, ...widths }
        await persistSettings({ visibleColumns: visibleFieldNames.value, columnWidths: columnWidths.value })
      }

      // console.log(`Applied column settings for ${doctype}:`, finalFields)
    } catch (err) {
      console.error('Failed to apply column settings:', err)
      throw err
    }
  }

  /**
   * Update column width for a specific field
   */
  const updateColumnWidth = (fieldname: string, width: number) => {
    if (width < 1 || width > 3) {
      throw new Error('Column width must be between 1 and 3')
    }

    // Calculate total width with the new width
    const otherWidths = Object.entries(columnWidths.value)
      .filter(([key]) => key !== fieldname && visibleFieldNames.value.includes(key))
      .reduce((sum, [, w]) => sum + w, 0)

    if (otherWidths + width > MAX_TOTAL_WIDTH) {
      throw new Error(`Total width would exceed ${MAX_TOTAL_WIDTH}. Current other columns total: ${otherWidths}`)
    }

    columnWidths.value[fieldname] = width
    persistSettings({ visibleColumns: visibleFieldNames.value, columnWidths: columnWidths.value })
  }

  /**
   * Reset to default column settings including widths
   */
  const resetColumnSettings = () => {
    const defaultFields = getDefaultVisibleFields()
    visibleFieldNames.value = defaultFields

    // Reset widths to defaults
    const defaultWidths: Record<string, number> = {}
    defaultFields.forEach(fieldname => {
      const field = availableFields.value.find(f => f.fieldname === fieldname)
      if (field) {
        defaultWidths[fieldname] = getDefaultColumnWidth(field.type)
      }
    })
    columnWidths.value = defaultWidths
    persistSettings({ visibleColumns: defaultFields, columnWidths: defaultWidths })
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
    totalWidth,
    columnWidths: readonly(columnWidths),
    
    // Constants
    MAX_TOTAL_WIDTH,
    
    // Methods
    loadMetadata,
    applyColumnSettings,
    updateColumnWidth,
    resetColumnSettings,
    
    // Utilities
    isMandatoryField,
    isSearchableField,
    getDefaultColumnWidth,
  }
} 