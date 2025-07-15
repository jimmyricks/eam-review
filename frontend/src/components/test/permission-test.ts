// Frappe Permissions Logic
// Reference: boot_info.user permissions

interface BootInfoUser {
  can_read: string[]
  can_write: string[]
  can_create: string[]
  can_delete: string[]
  can_select: string[]
}

interface BootInfo {
  user: BootInfoUser
}

interface Permissions {
  can_read: string[]
  can_write: string[]
  can_create: string[]
  can_delete: string[]
  can_select: string[]
}

interface PermissionsSummary {
  // Direct boot_info permissions
  canRead: boolean
  canWrite: boolean
  canCreate: boolean
  canDelete: boolean
  canSelect: boolean
  
  // Access permissions (derived from boot_info)
  listAccess: boolean
  formAccess: boolean
  newFormAccess: boolean
  
  // Action permissions (derived from boot_info)
  canEdit: boolean
  canDeleteFromList: boolean
  canDeleteFromForm: boolean
  canSearchLink: boolean
  
  // UI control flags
  hideEditButtons: boolean
  hideAddButtons: boolean
  hideDeleteButtons: boolean
  hideRedirectButton: boolean
  showSearchLinkError: boolean
}

interface UIControls {
  showEditButton?: boolean
  showAddButton?: boolean
  showDeleteButton?: boolean
  showViewButton?: boolean
  allowRowClick?: boolean
  showSaveButton?: boolean
  makeReadOnly?: boolean
}

class FrappePermissions {
  private permissions: Permissions

  constructor(bootInfo: BootInfo) {
    this.permissions = {
      can_read: bootInfo.user.can_read || [],
      can_write: bootInfo.user.can_write || [],
      can_create: bootInfo.user.can_create || [],
      can_delete: bootInfo.user.can_delete || [],
      can_select: bootInfo.user.can_select || []
    }
  }

  // Direct boot_info permission checks
  canRead(doctype: string): boolean {
    return this.permissions.can_read.includes(doctype)
  }

  canWrite(doctype: string): boolean {
    return this.permissions.can_write.includes(doctype)
  }

  canCreate(doctype: string): boolean {
    return this.permissions.can_create.includes(doctype)
  }

  canDelete(doctype: string): boolean {
    return this.permissions.can_delete.includes(doctype)
  }

  canSelect(doctype: string): boolean {
    return this.permissions.can_select.includes(doctype)
  }

  // Access permissions (derived from boot_info)
  canAccessListPage(doctype: string): boolean {
    return this.canRead(doctype)
  }

  canAccessFormPage(doctype: string): boolean {
    return this.canRead(doctype)
  }

  canAccessNewForm(doctype: string): boolean {
    return this.canCreate(doctype)
  }

  // Action permissions (derived from boot_info)
  canEditForm(doctype: string): boolean {
    return this.canWrite(doctype)
  }

  canDeleteFromList(doctype: string): boolean {
    return this.canDelete(doctype)
  }

  canDeleteFromForm(doctype: string): boolean {
    return this.canDelete(doctype)
  }

  canSearchLink(doctype: string): boolean {
    return this.canSelect(doctype)
  }

  // Get complete permissions summary for a doctype
  getPermissionsSummary(doctype: string): PermissionsSummary {
    return {
      // Direct boot_info permissions
      canRead: this.canRead(doctype),
      canWrite: this.canWrite(doctype),
      canCreate: this.canCreate(doctype),
      canDelete: this.canDelete(doctype),
      canSelect: this.canSelect(doctype),
      
      // Access permissions (derived from boot_info)
      listAccess: this.canAccessListPage(doctype),
      formAccess: this.canAccessFormPage(doctype),
      newFormAccess: this.canAccessNewForm(doctype),
      
      // Action permissions (derived from boot_info)
      canEdit: this.canEditForm(doctype),
      canDeleteFromList: this.canDeleteFromList(doctype),
      canDeleteFromForm: this.canDeleteFromForm(doctype),
      canSearchLink: this.canSearchLink(doctype),
      
      // UI control flags
      hideEditButtons: !this.canEditForm(doctype),
      hideAddButtons: !this.canCreate(doctype),
      hideDeleteButtons: !this.canDelete(doctype),
      hideRedirectButton: !this.canAccessFormPage(doctype),
      showSearchLinkError: !this.canSearchLink(doctype)
    }
  }

  // Helper method to check what UI elements to show/hide
  getUIControls(doctype: string, currentPage: 'list' | 'form' = 'list'): UIControls {
    const summary = this.getPermissionsSummary(doctype)
    
    if (currentPage === 'list') {
      return {
        showEditButton: summary.canEdit,
        showAddButton: summary.canCreate,
        showDeleteButton: summary.canDeleteFromList,
        showViewButton: summary.formAccess,
        allowRowClick: summary.formAccess
      }
    }
    
    if (currentPage === 'form') {
      return {
        showEditButton: summary.canEdit,
        showDeleteButton: summary.canDeleteFromForm,
        showSaveButton: summary.canEdit,
        makeReadOnly: !summary.canEdit
      }
    }
    
    return {}
  }
}

export { FrappePermissions, type BootInfo, type PermissionsSummary, type UIControls }