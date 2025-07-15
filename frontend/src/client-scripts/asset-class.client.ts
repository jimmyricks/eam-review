import type { FormContext } from '@/services/client-script'

// Form Load Hook - Called when form loads
export const formOnLoad = ({ form, setFieldQuery, notify }: FormContext) => {

  if (form.equipment) {
    setFieldQuery?.('parent_asset_class_id', {
      filters: { equipment: form.equipment }
    })
  }

  notify.success('CLIENT SCRIPT LOADED')
}

// Field Change Hook - Called when specific fields change
export const formFieldChange = ({ setFieldQuery }: FormContext) => {
  // Example: Update parent asset class query when equipment changes
}

// Before Save Hook - Called before saving (can prevent save)
export const formBeforeSave = ({ preventSave }: FormContext) => {
  // Validation example
}

// After Save Hook - Called after successful save
export const formAfterSave = ({ redirect }: FormContext) => {
  // Example: Redirect to list after save
  // redirect?.('/asset-class')
}

// Before Delete Hook - Called before deleting (can prevent delete)
export const formBeforeDelete = ({ preventDelete }: FormContext) => {
  // Example: Prevent deletion of system classes
}

// After Delete Hook - Called after successful delete
export const formAfterDelete = ({ redirect }: FormContext) => {
  redirect?.('/asset-class')
} 