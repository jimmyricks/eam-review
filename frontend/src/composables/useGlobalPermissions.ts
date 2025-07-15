import { usePermissionsStore } from '@/stores/permissions'

/**
 * Global permissions composable
 * Provides a simple interface for components to access global permissions
 */
export const useGlobalPermissions = () => {
  const permissionsStore = usePermissionsStore()

  /**
   * Initialize global permissions (should be called on app startup)
   */
  const initializePermissions = async () => {
    try {
      if (!permissionsStore.isLoaded) {
        await permissionsStore.fetchBootInfo()
      }
    } catch (error) {
      console.error('Failed to initialize global permissions:', error)
      throw error
    }
  }

  /**
   * Check if user can create documents of the specified doctype
   */
  const canCreate = (doctype: string): boolean => {
    return permissionsStore.canCreate(doctype)
  }

  /**
   * Check if user can write/edit documents of the specified doctype
   */
  const canWrite = (doctype: string): boolean => {
    return permissionsStore.canWrite(doctype)
  }

  /**
   * Check if user can read documents of the specified doctype
   */
  const canRead = (doctype: string): boolean => {
    return permissionsStore.canRead(doctype)
  }

  /**
   * Check if user can delete documents of the specified doctype
   */
  const canDelete = (doctype: string): boolean => {
    return permissionsStore.canDelete(doctype)
  }

  /**
   * Check if user can submit documents of the specified doctype
   */
  const canSubmit = (doctype: string): boolean => {
    return permissionsStore.canSubmit(doctype)
  }

  /**
   * Check if user can cancel documents of the specified doctype
   */
  const canCancel = (doctype: string): boolean => {
    return permissionsStore.canCancel(doctype)
  }

  /**
   * Check if user can export documents of the specified doctype
   */
  const canExport = (doctype: string): boolean => {
    return permissionsStore.canExport(doctype)
  }

  /**
   * Check if user can import documents of the specified doctype
   */
  const canImport = (doctype: string): boolean => {
    return permissionsStore.canImport(doctype)
  }

  /**
   * Check if user can print documents of the specified doctype
   */
  const canPrint = (doctype: string): boolean => {
    return permissionsStore.canPrint(doctype)
  }

  /**
   * Check if user can email documents of the specified doctype
   */
  const canEmail = (doctype: string): boolean => {
    return permissionsStore.canEmail(doctype)
  }

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string): boolean => {
    return permissionsStore.hasRole(role)
  }

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: string[]): boolean => {
    return permissionsStore.hasAnyRole(roles)
  }

  /**
   * Get all allowed modules for the user
   */
  const getAllowedModules = (): string[] => {
    return permissionsStore.getAllowedModules()
  }

  /**
   * Get user information
   */
  const getUserInfo = () => {
    return {
      name: permissionsStore.userName,
      roles: permissionsStore.userRoles,
      permissions: permissionsStore.userPermissions,
    }
  }

  /**
   * Clear permissions (useful for logout)
   */
  const clearPermissions = () => {
    permissionsStore.clearPermissions()
  }

  return {
    // Initialization
    initializePermissions,
    
    // Permission checks
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
    
    // Role checks
    hasRole,
    hasAnyRole,
    
    // Module checks
    getAllowedModules,
    
    // User info
    getUserInfo,
    
    // Utilities
    clearPermissions,
    
    // Store access (for advanced usage)
    store: permissionsStore,
  }
}

/**
 * Form tab permissions composable
 * For backward compatibility with existing components
 */
export const useFormTabPermissions = (doctype: string) => {
  const permissionsStore = usePermissionsStore()

  const loadTabPermissions = async (linkTabs: any[]) => {
    try {
      // Ensure permissions are loaded
      if (!permissionsStore.isLoaded) {
        await permissionsStore.fetchBootInfo()
      }

      // Filter tabs based on read permissions
      return linkTabs.filter((tab: any) => {
        if (tab.doctype) {
          return permissionsStore.canRead(tab.doctype)
        }
        return true
      })
    } catch (error) {
      console.error('Error loading tab permissions:', error)
      return linkTabs // Return all tabs on error
    }
  }

  const filterLinkedTabs = (linkTabs: any[]): any[] => {
    return linkTabs.filter((tab: any) => {
      const doctype = tab.doctype || tab.link_doctype
      if (doctype) {
        return permissionsStore.canRead(doctype)
      }
      return true
    })
  }

  const canViewLinkedTab = (linkDoctype: string): boolean => {
    return permissionsStore.canRead(linkDoctype)
  }

  return {
    loadTabPermissions,
    filterLinkedTabs,
    canViewLinkedTab,
  }
}

/**
 * Create permission guard for router
 * For backward compatibility with existing router setup
 */
export const createPermissionGuard = () => {
  return async (to: any, from: any, next: any) => {
    try {
      // Only check permissions for doctype routes
      const doctype = to.params.doctype
      if (!doctype) {
        next()
        return
      }

      // Get the permissions store
      const permissionsStore = usePermissionsStore()
      
      // Ensure permissions are loaded
      if (!permissionsStore.isLoaded) {
        await permissionsStore.fetchBootInfo()
      }

      // Check if user can read this doctype
      if (!permissionsStore.canRead(doctype)) {
        console.log(`Permission denied for doctype: ${doctype}`)
        // For now, allow access even without permissions (development mode)
        // TODO: Re-enable access denied redirect after global permissions are complete
        console.log('Allowing access despite missing permissions (development mode)')
      }

      next()
    } catch (error) {
      console.error('Permission guard error:', error)
      // On error, allow navigation but log the issue
      next()
    }
  }
} 