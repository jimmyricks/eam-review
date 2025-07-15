import { 
  useStorage, 
  usePreferredDark, 
  useDebounceFn, 
  useThrottleFn, 
  useBreakpoints,
  useWindowSize,
  useClipboard,
  useEventBus,
  useInfiniteScroll,
  breakpointsTailwind,
  type MaybeRefOrGetter
} from '@vueuse/core'
import { ref, computed, type Ref } from 'vue'

/**
 * Reactive storage utilities
 */
export const useReactiveStorage = () => {
  // Theme storage that syncs with system preference
  const prefersDark = usePreferredDark()
  const theme = useStorage('eam_theme', prefersDark.value)
  
  // User preferences storage
  const userPreferences = useStorage('eam_user_prefs', {
    sidebarCollapsed: false,
    defaultPageSize: 20,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  })

  // Recent items storage (limited to 10 items)
  const recentItems = useStorage('eam_recent_items', [] as Array<{
    doctype: string
    name: string
    title: string
    timestamp: number
  }>)

  const addRecentItem = (item: { doctype: string; name: string; title: string }) => {
    const newItem = { ...item, timestamp: Date.now() }
    const filtered = recentItems.value.filter(
      existing => !(existing.doctype === item.doctype && existing.name === item.name)
    )
    recentItems.value = [newItem, ...filtered].slice(0, 10)
  }

  // View persistence storage
  const viewPreferences = useStorage('eam_view_prefs', {} as Record<string, string>)
  
  const getViewPreference = (doctype: string, defaultView: string = 'List') => {
    return viewPreferences.value[doctype] || defaultView
  }
  
  const setViewPreference = (doctype: string, view: string) => {
    viewPreferences.value[doctype] = view
  }

  // Column settings storage
  const columnSettings = useStorage('eam_column_settings', {} as Record<string, {
    visibleColumns: string[]
    columnOrder: string[]
    hiddenColumns: string[]
  }>)
  
  const getColumnSettings = (doctype: string) => {
    return columnSettings.value[doctype] || {
      visibleColumns: [],
      columnOrder: [],
      hiddenColumns: []
    }
  }
  
  const setColumnSettings = (doctype: string, settings: {
    visibleColumns: string[]
    columnOrder?: string[]
    hiddenColumns?: string[]
  }) => {
    columnSettings.value[doctype] = {
      visibleColumns: settings.visibleColumns,
      columnOrder: settings.columnOrder || [],
      hiddenColumns: settings.hiddenColumns || []
    }
  }

  return {
    theme,
    userPreferences,
    recentItems,
    addRecentItem,
    viewPreferences,
    getViewPreference,
    setViewPreference,
    columnSettings,
    getColumnSettings,
    setColumnSettings
  }
}

/**
 * Performance optimized function utilities
 */
export const useOptimizedFunctions = () => {
  // Debounced search function (300ms delay)
  const debouncedSearch = useDebounceFn((searchTerm: string, callback: (term: string) => void) => {
    if (searchTerm.trim()) {
      callback(searchTerm)
    }
  }, 300)

  // Throttled scroll handler (100ms interval)
  const throttledScrollHandler = useThrottleFn((callback: () => void) => {
    callback()
  }, 100)

  // Debounced form validation (500ms delay)
  const debouncedValidation = useDebounceFn((formData: any, validator: (data: any) => void) => {
    validator(formData)
  }, 500)

  // Throttled API calls (1 second interval)
  const throttledApiCall = useThrottleFn(async (apiFunction: () => Promise<any>) => {
    try {
      return await apiFunction()
    } catch (error) {
      console.error('Throttled API call failed:', error)
      throw error
    }
  }, 1000)

  // Debounced settings save (100ms delay)
  const debouncedSettingsSave = useDebounceFn((settings: any, saveFunction: (data: any) => void) => {
    saveFunction(settings)
  }, 100)

  // Throttled permission checks (500ms interval)
  const throttledPermissionCheck = useThrottleFn(async (
    doctype: string, 
    permission: string, 
    checkFunction: (doctype: string, permission: string) => Promise<boolean>
  ) => {
    return await checkFunction(doctype, permission)
  }, 500)

  return {
    debouncedSearch,
    throttledScrollHandler,
    debouncedValidation,
    throttledApiCall,
    debouncedSettingsSave,
    throttledPermissionCheck
  }
}

/**
 * Enhanced search utilities with VueUse
 */
export const useEnhancedSearch = () => {
  const searchTerm = ref('')
  const isSearching = ref(false)
  const searchResults = ref<any[]>([])

  // Debounced search with loading state
  const debouncedSearch = useDebounceFn(async (
    term: string, 
    searchFunction: (term: string) => Promise<any[]>
  ) => {
    if (!term.trim()) {
      searchResults.value = []
      return
    }

    isSearching.value = true
    try {
      searchResults.value = await searchFunction(term)
    } catch (error) {
      console.error('Search failed:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)

  const performSearch = (term: string, searchFunction: (term: string) => Promise<any[]>) => {
    searchTerm.value = term
    debouncedSearch(term, searchFunction)
  }

  const clearSearch = () => {
    searchTerm.value = ''
    searchResults.value = []
    isSearching.value = false
  }

  return {
    searchTerm,
    isSearching,
    searchResults,
    performSearch,
    clearSearch
  }
}

/**
 * Responsive utilities
 */
export const useResponsiveUtils = () => {
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const { width, height } = useWindowSize()

  const isMobile = breakpoints.smaller('md')
  const isTablet = breakpoints.between('md', 'lg')
  const isDesktop = breakpoints.greater('lg')

  const getResponsiveColumns = computed(() => {
    if (isMobile.value) return 1
    if (isTablet.value) return 2
    return 3
  })

  const getResponsivePageSize = computed(() => {
    if (isMobile.value) return 10
    if (isTablet.value) return 20
    return 50
  })

  return {
    isMobile,
    isTablet,
    isDesktop,
    width,
    height,
    getResponsiveColumns,
    getResponsivePageSize
  }
}

/**
 * Clipboard utilities
 */
export const useClipboardUtils = () => {
  const { copy, copied, isSupported } = useClipboard()

  const copyToClipboard = async (text: string) => {
    if (isSupported.value) {
      await copy(text)
      return copied.value
    }
    return false
  }

  return {
    copyToClipboard,
    copied,
    isSupported
  }
}

/**
 * Event bus utilities
 */
export const useEventBusUtils = () => {
  const globalBus = useEventBus('global')
  const formBus = useEventBus('form')
  const listBus = useEventBus('list')

  const emitGlobalEvent = (event: string, data?: any) => {
    globalBus.emit({ event, data })
  }

  const emitFormEvent = (event: string, data?: any) => {
    formBus.emit({ event, data })
  }

  const emitListEvent = (event: string, data?: any) => {
    listBus.emit({ event, data })
  }

  return {
    globalBus,
    formBus,
    listBus,
    emitGlobalEvent,
    emitFormEvent,
    emitListEvent
  }
}

/**
 * Infinite scroll utilities for large lists
 */
export const useInfiniteScrollUtils = (
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  onLoadMore: () => void | Promise<void>,
  options?: {
    distance?: number
    interval?: number
    disabled?: Ref<boolean>
  }
) => {
  const { distance = 100, interval = 100, disabled } = options || {}

  useInfiniteScroll(
    target,
    async () => {
      if (disabled?.value) return
      await onLoadMore()
    },
    { distance, interval }
  )

  return {
    distance,
    interval
  }
}

/**
 * All-in-one VueUse utilities export
 */
export const useVueUseUtils = () => {
  return {
    ...useReactiveStorage(),
    ...useOptimizedFunctions(),
    ...useResponsiveUtils(),
    ...useClipboardUtils(),
    ...useEventBusUtils()
  }
} 