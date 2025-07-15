import type { FormContext } from '@/services/client-script'

// Form Load Hook - Called when form loads
export const formOnLoad = ({ form, setFieldQuery }: FormContext) => {
  // Set initial query for system field based on current location value
  if (form.location) {
    setFieldQuery?.('system', {
      filters: { location: form.location }
    })
  }
}

// Field Change Hook - Called when specific fields change
export const formFieldChange = ({ form, fieldname, value, setFieldQuery }: FormContext) => {
  // Update system field query when location changes
  if (fieldname === 'location') {
    setFieldQuery?.('system', {
      filters: value ? { location: value } : {}
    })
    
    // Clear system field when location changes (optional)
    if (form.system && form.system !== value) {
      form.system = null
    }
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
  redirect?.('/position')
}