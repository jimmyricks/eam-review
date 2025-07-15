import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { frappeCall } from '@/composables/useFrappeSDK'

export interface BootInfoPermissions {
  can_create: string[]
  can_write: string[]
  can_read: string[]
  can_delete: string[]
  can_submit: string[]
  can_cancel: string[]
  can_get_report: string[]
  allow_modules: string[]
  all_read: string[]
  can_search: string[]
  in_create: string[]
  can_export: string[]
  can_import: string[]
  can_print: string[]
  can_email: string[]
  all_reports: Record<string, any>
}

export interface BootInfoUser {
  name: string
  roles: string[]
  defaults: Record<string, any>
  can_create: string[]
  can_write: string[]
  can_read: string[]
  can_delete: string[]
  can_submit: string[]
  can_cancel: string[]
  can_get_report: string[]
  allow_modules: string[]
  all_read: string[]
  can_search: string[]
  in_create: string[]
  can_export: string[]
  can_import: string[]
  can_print: string[]
  can_email: string[]
  all_reports: Record<string, any>
}

export interface BootInfo {
  user: BootInfoUser
  sitename: string
  sysdefaults: Record<string, any>
  server_date: string
  user_info: Record<string, any>
  modules: Record<string, any>
  module_list: string[]
  module_wise_workspaces: Record<string, string[]>
  dashboards: any[]
  app_data: any[]
  letter_heads: Record<string, any>
  active_domains: string[]
  all_domains: string[]
  doctype_layouts: any[]
  module_app: Record<string, string>
  single_types: string[]
  nested_set_doctypes: string[]
  home_page: string
  lang: string
  timezone_info: Record<string, any>
  max_file_size: number
  developer_mode: number
  socketio_port: number
  file_watcher_port: number
  home_folder: string
  notification_settings: Record<string, any>
  onboarding_tours: any[]
  time_zone: Record<string, string>
  versions: Record<string, string>
  error_report_email: string | null
  calendars: string[]
  treeviews: string[]
  success_action: any[]
  email_accounts: any[]
  all_accounts: string
  sms_gateway_enabled: boolean
  link_preview_doctypes: string[]
  additional_filters_config: Record<string, any>
  desk_settings: Record<string, any>
  app_logo_url: string
  link_title_doctypes: string[]
}

export const usePermissionsStore = defineStore('permissions', () => {
  // State
  const bootInfo = ref<BootInfo | null>(null)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Cache key for localStorage
  const BOOT_INFO_CACHE_KEY = 'eam_boot_info_cache'
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

  // Getters
  const userPermissions = computed(() => {
    return bootInfo.value?.user || null
  })

  const userRoles = computed(() => {
    return bootInfo.value?.user?.roles || []
  })

  const userName = computed(() => {
    return bootInfo.value?.user?.name || ''
  })

  // Permission checking methods
  const canCreate = (doctype: string): boolean => {
    if (!bootInfo.value?.user?.can_create) return false
    return bootInfo.value.user.can_create.includes(doctype)
  }

  const canWrite = (doctype: string): boolean => {
    if (!bootInfo.value?.user?.can_write) return false
    return bootInfo.value.user.can_write.includes(doctype)
  }

  const canRead = (doctype: string): boolean => {
    if (!bootInfo.value?.user?.can_read) return false
    return bootInfo.value.user.can_read.includes(doctype)
  }

  const canDelete = (doctype: string): boolean => {
    if (!bootInfo.value?.user?.can_delete) return false
    return bootInfo.value.user.can_delete.includes(doctype)
  }

  const canSubmit = (doctype: string): boolean => {
    if (!bootInfo.value?.user?.can_submit) return false
    return bootInfo.value.user.can_submit.includes(doctype)
  }

  const canCancel = (doctype: string): boolean => {
    if (!bootInfo.value?.user?.can_cancel) return false
    return bootInfo.value.user.can_cancel.includes(doctype)
  }

  const canExport = (doctype: string): boolean => {
    if (!bootInfo.value?.user?.can_export) return false
    return bootInfo.value.user.can_export.includes(doctype)
  }

  const canImport = (doctype: string): boolean => {
    if (!bootInfo.value?.user?.can_import) return false
    return bootInfo.value.user.can_import.includes(doctype)
  }

  const canPrint = (doctype: string): boolean => {
    if (!bootInfo.value?.user?.can_print) return false
    return bootInfo.value.user.can_print.includes(doctype)
  }

  const canEmail = (doctype: string): boolean => {
    if (!bootInfo.value?.user?.can_email) return false
    return bootInfo.value.user.can_email.includes(doctype)
  }

  const canSearch = (doctype: string): boolean => {
    if (!bootInfo.value?.user?.can_search) return false
    return bootInfo.value.user.can_search.includes(doctype)
  }

  const hasRole = (role: string): boolean => {
    if (!bootInfo.value?.user?.roles) return false
    return bootInfo.value.user.roles.includes(role)
  }

  const hasAnyRole = (roles: string[]): boolean => {
    if (!bootInfo.value?.user?.roles) return false
    return roles.some(role => bootInfo.value!.user.roles.includes(role))
  }

  const getAllowedModules = (): string[] => {
    return bootInfo.value?.user?.allow_modules || []
  }

  // Helper function to get cached boot info
  const getCachedBootInfo = (): BootInfo | null => {
    try {
      const cached = localStorage.getItem(BOOT_INFO_CACHE_KEY)
      if (!cached) return null

      const { data, timestamp } = JSON.parse(cached)
      const now = Date.now()

      // Check if cache is still valid
      if (now - timestamp < CACHE_DURATION) {
        console.log('Using cached boot info')
        return data
      } else {
        console.log('Cache expired, will fetch fresh data')
        localStorage.removeItem(BOOT_INFO_CACHE_KEY)
        return null
      }
    } catch (error) {
      console.warn('Failed to read cached boot info:', error)
      localStorage.removeItem(BOOT_INFO_CACHE_KEY)
      return null
    }
  }

  // Helper function to cache boot info
  const cacheBootInfo = (data: BootInfo): void => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(BOOT_INFO_CACHE_KEY, JSON.stringify(cacheData))
      console.log('Boot info cached successfully')
    } catch (error) {
      console.warn('Failed to cache boot info:', error)
    }
  }

  // Actions
  const fetchBootInfo = async (forceRefresh = false): Promise<void> => {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh && !isLoaded.value) {
      const cached = getCachedBootInfo()
      if (cached) {
        bootInfo.value = cached
        isLoaded.value = true
        console.log('Boot info loaded from cache')
        return
      }
    }

    if (isLoaded.value && !forceRefresh) {
      console.log('Boot info already loaded, skipping fetch')
      return
    }

    try {
      isLoading.value = true
      error.value = null

      console.log('Fetching boot info...')
      const response = await frappeCall.post(
        'ci_eam.custom_apis.boot_info.get_filtered_bootinfo'
      )

      const result = response && (response as any).message !== undefined
        ? (response as any).message
        : response

      bootInfo.value = result as BootInfo
      isLoaded.value = true

      // Cache the fresh data
      cacheBootInfo(result as BootInfo)

      console.log('Boot info loaded successfully:', {
        user: bootInfo.value?.user?.name,
        roles: bootInfo.value?.user?.roles?.length,
        canCreate: bootInfo.value?.user?.can_create?.length,
        canWrite: bootInfo.value?.user?.can_write?.length,
        canRead: bootInfo.value?.user?.can_read?.length,
        canDelete: bootInfo.value?.user?.can_delete?.length,
      })
    } catch (err: any) {
      console.error('Error fetching boot info:', err)
      error.value = err?.message || err?.toString() || 'Failed to fetch permissions'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Force refresh boot info (for development)
  const refreshBootInfo = async (): Promise<void> => {
    console.log('Force refreshing boot info...')
    isLoaded.value = false
    await fetchBootInfo(true)
  }

  const clearPermissions = (): void => {
    bootInfo.value = null
    isLoaded.value = false
    error.value = null
    // Clear cache as well
    try {
      localStorage.removeItem(BOOT_INFO_CACHE_KEY)
    } catch (error) {
      console.warn('Failed to clear cached boot info:', error)
    }
    console.log('Permissions cleared')
  }

  return {
    // State
    bootInfo,
    isLoaded,
    isLoading,
    error,

    // Getters
    userPermissions,
    userRoles,
    userName,

    // Permission methods
    canCreate,
    canWrite,
    canRead,
    canDelete,
    canSubmit,
    canCancel,
    canExport,
    canImport,
    canPrint,
    canEmail,
    canSearch,
    hasRole,
    hasAnyRole,
    getAllowedModules,

    // Actions
    fetchBootInfo,
    refreshBootInfo,
    clearPermissions,
  }
}) 