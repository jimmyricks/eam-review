import type { Router } from 'vue-router'

export interface Notify {
  success: (msg: string) => void
  error: (msg: string) => void
  warning: (msg: string) => void
  info: (msg: string) => void
}

export interface FieldQuery {
  query?: string
  filters?: Record<string, any>
  reference_doctype?: string
  ignore_user_permissions?: boolean
  page_length?: number
}

// Tab configuration for form tables
export interface TabConfig {
  tabName: string
  disableAddButton?: boolean
  hideTab?: boolean
}

export interface UIBehavior {
  disabledEdit?: boolean
  disabledDelete?: boolean
  disabledSave?: boolean
  disabledCancel?: boolean
  hideWorkflow?: boolean
  hideDocumentActions?: boolean
}

export interface FormContext {
  form: Record<string, any>
  fieldname?: string
  value?: any
  router: Router
  notify: Notify
  setFieldQuery?: (fieldname: string, queryConfig: FieldQuery) => void
  setFieldReadOnly?: (fieldname: string, readOnly: boolean) => void
  setFieldHidden?: (fieldname: string, hidden: boolean) => void
  setFieldRequired?: (fieldname: string, required: boolean) => void
  setTabConfig?: (tabName: string, config: Partial<TabConfig>) => void
  setUIBehavior?: (behavior: Partial<UIBehavior>) => void
  preventSave?: () => void
  preventDelete?: () => void
  redirect?: (path: string) => void
}

export interface ListContext {
  list: any
  router: Router
  notify: Notify
  preventDelete?: () => void
  redirect?: (path: string) => void
}

export type FormHookName = 
  | 'form:onLoad'
  | 'form:beforeSave'
  | 'form:afterSave'
  | 'form:beforeDelete'
  | 'form:afterDelete'
  | 'form:fieldChange'

export type ListHookName = 
  | 'list:onLoad'
  | 'list:beforeDelete'
  | 'list:afterDelete'

export type HookName = FormHookName | ListHookName

export interface ClientScript {
  [key: string]: (context: FormContext | ListContext) => void | Promise<void>
}

export interface ClientScriptRegistry {
  [doctype: string]: ClientScript
}

// List configuration for List Views
export interface ListConfig {
  /**
   * Defines the available views for the list page (e.g., 'List', 'Tree', 'Map').
   * If not provided, defaults to just 'List'.
   */
  availableViews?: string[];

  hideAddButton?: boolean
  hideDeleteButton?: boolean // not yet implemented but reserved
  treeOptions?: {
    parentKey: string
    idKey: string
    labelField: string
    doctype: string
  }
  diagramOptions?: {
    elements?: any[]
    getElements?: (records: any[]) => any[]
  }
  calendarOptions?: {
    titleField: string
    startField: string
    endField: string
  }
} 