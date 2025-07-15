import type { FormContext } from '@/services/client-script'

// Form Load Hook - Called when form loads
export const formOnLoad = ({ form, setFieldQuery }: FormContext) => {
  // Set filter for asset_class field to only show asset classes with equipment: 1
  setFieldQuery?.('asset_class', {
    filters: { equipment: 1 }
  })
}

// Field Change Hook - Called when specific fields change
export const formFieldChange = ({ fieldname, setFieldQuery }: FormContext) => {
  // Update asset_class query when needed
  if (fieldname === 'asset_class') {
    setFieldQuery?.('asset_class', {
      filters: { equipment: 1 }
    })
  }
}

// Before Save Hook - Called before saving (can prevent save)
export const formBeforeSave = ({ preventSave }: FormContext) => {
 
}

// After Save Hook - Called after successful save
export const formAfterSave = ({}: FormContext) => {
  // Success handling can be done here if needed
}

// Before Delete Hook - Called before deleting (can prevent delete)
export const formBeforeDelete = ({ preventDelete }: FormContext) => {
 
}

// After Delete Hook - Called after successful delete
export const formAfterDelete = ({ redirect }: FormContext) => {
  redirect?.('/maintenance-equipment')
} 