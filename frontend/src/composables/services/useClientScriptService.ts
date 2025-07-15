import { ref, computed } from 'vue'
import type { 
  ClientScript, 
  HookName, 
  FormContext, 
  ListContext,
  FieldQuery,
  ListConfig,
  TabConfig,
} from '../../services/client-script/types'
import type { CustomAction } from '@/types/componentTypes'
import type { Document } from '@/types/document'

// In-memory registry for loaded client scripts
const scriptRegistry = ref<Map<string, ClientScript>>(new Map())

// Field query registry for dynamic field customization (per doctype)
const fieldQueries = ref<Map<string, Map<string, FieldQuery>>>(new Map())

// Field state registry for dynamic field control (per doctype)
const fieldStates = ref<Map<string, Map<string, { readOnly: boolean; hidden: boolean; required: boolean }>>>(new Map())

// Registry for list view configuration (views, add/delete visibility, etc.)
const listConfigRegistry = ref<Map<string, ListConfig>>(new Map())

// Registry for custom actions defined in *_list.ts
const listCustomActionsRegistry = ref<Map<string, CustomAction[]>>(new Map())

// Registry for tab configurations (per doctype)
const tabConfigRegistry = ref<Map<string, Map<string, TabConfig>>>(new Map())

export function useClientScriptService(doctype: string | null) {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Convert doctype to script key (e.g., "Asset Class" -> "asset-class")
  const getScriptKey = (doctype: string) => {
    if (!doctype || typeof doctype !== 'string') {
      return ''
    }
    return doctype.toLowerCase().replace(/\s+/g, '-')
  }

  // Get or create doctype-specific registries
  const getDoctypeFieldQueries = (doctype: string) => {
    const key = getScriptKey(doctype)
    if (!fieldQueries.value.has(key)) {
      fieldQueries.value.set(key, new Map())
    }
    return fieldQueries.value.get(key)!
  }

  const getDoctypeFieldStates = (doctype: string) => {
    const key = getScriptKey(doctype)
    if (!fieldStates.value.has(key)) {
      fieldStates.value.set(key, new Map())
    }
    return fieldStates.value.get(key)!
  }

  const getDoctypeTabConfigs = (doctype: string) => {
    const key = getScriptKey(doctype)
    if (!tabConfigRegistry.value.has(key)) {
      tabConfigRegistry.value.set(key, new Map())
    }
    return tabConfigRegistry.value.get(key)!
  }

  // Convert function name to hook name
  const functionToHookName = (functionName: string): HookName | null => {
    const mappings: Record<string, HookName> = {
      'formOnLoad': 'form:onLoad',
      'formFieldChange': 'form:fieldChange',
      'formBeforeSave': 'form:beforeSave',
      'formAfterSave': 'form:afterSave',
      'formBeforeDelete': 'form:beforeDelete',
      'formAfterDelete': 'form:afterDelete',
      'listOnLoad': 'list:onLoad',
      'listBeforeDelete': 'list:beforeDelete',
      'listAfterDelete': 'list:afterDelete'
    }
    
    return mappings[functionName] || null
  }

  // Load client script for a doctype (form hooks + list hooks)
  const loadClientScript = async (doctype: string) => {
    if (!doctype) return null

    const scriptKey = getScriptKey(doctype)
    
    // Check if already loaded
    if (scriptRegistry.value.has(scriptKey)) {
      return scriptRegistry.value.get(scriptKey)!
    }

    loading.value = true
    error.value = null

    try {
      const clientScript: ClientScript = {}

      // 1) Load form script (legacy *.client.ts)
      try {
        const formModule = await import(`@/client-scripts/${scriptKey}.client.ts`)
        Object.entries(formModule).forEach(([key, value]) => {
          if (typeof value === 'function') {
            const hookName = functionToHookName(key)
            if (hookName) {
              clientScript[hookName] = value as any
            }
          }
        })
      } catch (e) {
        /* Form script is optional – ignore missing file */
      }

      // 2) Load list script (new *_list.ts)
      try {
        const listModule = await import(`@/client-scripts/${scriptKey}_list.ts`)

        Object.entries(listModule).forEach(([key, value]) => {
          if (typeof value === 'function') {
            const hookName = functionToHookName(key)
            if (hookName) {
              clientScript[hookName] = value as any
            }
          }

          // Capture listConfig export
          if (key === 'listConfig' && typeof value === 'object') {
            listConfigRegistry.value.set(scriptKey, value as ListConfig)
          }

          // Capture customActions export
          if (key === 'customActions' && Array.isArray(value)) {
            listCustomActionsRegistry.value.set(
              scriptKey,
              value as CustomAction[],
            )
          }
        })

        // If default export is a config object with listConfig property
        if (
          !listConfigRegistry.value.has(scriptKey) &&
          listModule.default &&
          typeof listModule.default === 'object' &&
          (listModule.default as any).listConfig
        ) {
          listConfigRegistry.value.set(
            scriptKey,
            (listModule.default as any).listConfig as ListConfig,
          )
        }

        // If default export is directly a config object (legacy support)
        if (
          !listConfigRegistry.value.has(scriptKey) &&
          listModule.default &&
          typeof listModule.default === 'object' &&
          !(listModule.default as any).listConfig &&
          ((listModule.default as any).availableViews || (listModule.default as any).hideAddButton)
        ) {
          listConfigRegistry.value.set(
            scriptKey,
            listModule.default as ListConfig,
          )
        }

        // If default export contains customActions
        if (
          !listCustomActionsRegistry.value.has(scriptKey) &&
          listModule.default &&
          Array.isArray((listModule.default as any).customActions)
        ) {
          listCustomActionsRegistry.value.set(
            scriptKey,
            (listModule.default as any).customActions as CustomAction[],
          )
        }
      } catch (e) {
        /* List script is optional – ignore missing file */
      }

      // Cache combined hooks if any
      if (Object.keys(clientScript).length > 0) {
        scriptRegistry.value.set(scriptKey, clientScript)
        return clientScript
      }

      return null
    } finally {
      loading.value = false
    }
  }

  // Run a specific hook
  const runHook = async (
    hookName: HookName, 
    context: FormContext | ListContext,
    formData?: Document,
    documentId?: string
  ) => {
    if (!doctype) {
      return
    }
    
    const clientScript = await loadClientScript(doctype)
    if (!clientScript) {
      return
    }
    
    if (clientScript && typeof clientScript[hookName] === 'function') {
      const hook = clientScript[hookName] as (
        context: FormContext | ListContext
      ) => Promise<void> | void

      // Inject field customization methods into context
      const doctypeFieldQueries = getDoctypeFieldQueries(doctype)
      const doctypeFieldStates = getDoctypeFieldStates(doctype)
      const doctypeTabConfigs = getDoctypeTabConfigs(doctype)
      
      const enhancedContext = {
        ...context,
        setFieldQuery: (fieldname: string, query: FieldQuery | null) => {
          if (query) {
            doctypeFieldQueries.set(fieldname, query)
          } else {
            doctypeFieldQueries.delete(fieldname)
          }
        },
        setFieldState: (fieldname: string, state: { readOnly?: boolean; hidden?: boolean; required?: boolean }) => {
          const currentState = doctypeFieldStates.get(fieldname) || { readOnly: false, hidden: false, required: false }
          doctypeFieldStates.set(fieldname, { ...currentState, ...state })
        },
        setTabConfig: (tabName: string, config: Partial<TabConfig>) => {
          const currentConfig = doctypeTabConfigs.get(tabName) || { tabName }
          doctypeTabConfigs.set(tabName, { ...currentConfig, ...config })
        },
        setUIBehavior: (context as any).setUIBehavior,
        preventSave: () => {
          throw new Error('Save prevented by client script')
        },
        preventDelete: () => {
          throw new Error('Delete prevented by client script')
        }
      }

      try {
        await Promise.resolve(hook(enhancedContext))
      } catch (e) {
        // Log the error but re-throw it so the calling component can handle it
        // (e.g., stop the save process)
        console.error(`Error in hook ${hookName} for ${doctype}:`, e)
        throw e
      }
    }
  }

  // Get field query for a specific field
  const getFieldQuery = (fieldname: string): FieldQuery | undefined => {
    if (!doctype) return undefined
    const doctypeFieldQueries = getDoctypeFieldQueries(doctype)
    return doctypeFieldQueries.get(fieldname)
  }

  // Get field state for a specific field
  const getFieldState = (fieldname: string) => {
    if (!doctype) return { readOnly: false, hidden: false, required: false }
    const doctypeFieldStates = getDoctypeFieldStates(doctype)
    return doctypeFieldStates.get(fieldname) || { readOnly: false, hidden: false, required: false }
  }

  // Clear field customizations for a specific doctype
  const clearFieldCustomizations = (targetDoctype?: string) => {
    const key = getScriptKey(targetDoctype || doctype || '')
    if (!key) {
      return // Skip if no valid doctype
    }
    if (fieldQueries.value.has(key)) {
      fieldQueries.value.get(key)!.clear()
    }
    if (fieldStates.value.has(key)) {
      fieldStates.value.get(key)!.clear()
    }
  }

  // Retrieve list configuration for the current doctype
  const getListConfig = (): ListConfig | null => {
    if (!doctype) return null
    return listConfigRegistry.value.get(getScriptKey(doctype)) || null
  }

  // Retrieve available views for the current doctype
  const getAvailableViews = (): string[] | undefined => {
    const config = getListConfig()
    return config?.availableViews
  }

  // Retrieve custom actions for the current doctype
  const getCustomActions = (): CustomAction[] => {
    if (!doctype) return []
    return listCustomActionsRegistry.value.get(getScriptKey(doctype)) || []
  }

  // Get tab configuration for a specific tab
  const getTabConfig = (tabName: string): TabConfig | undefined => {
    if (!doctype) return undefined
    const doctypeTabConfigs = getDoctypeTabConfigs(doctype)
    return doctypeTabConfigs.get(tabName)
  }

  // Clear script cache (useful for development hot-reload)
  const clearScriptCache = () => {
    scriptRegistry.value.clear()
    listConfigRegistry.value.clear()
    listCustomActionsRegistry.value.clear()
    tabConfigRegistry.value.clear()
  }

  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    runHook,
    getFieldQuery,
    getFieldState,
    getTabConfig,
    clearFieldCustomizations,
    clearScriptCache,
    loadClientScript,
    fieldQueries: computed(() => fieldQueries.value),
    getListConfig,
    getAvailableViews,
    getCustomActions,
  }
} 