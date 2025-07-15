import type { FormContext } from '@/services/client-script'

// Form Load Hook - Called when form loads
export const formOnLoad = ({ form, notify, setFieldQuery }: FormContext) => {
  // Set filter for item field to only show Inventory Item or Non Inventory Item
  setFieldQuery?.('item', {
    filters: {
      item_type: ['in', ['Inventory Item', 'Non Inventory Item']]
    }
  })
}

// Field Change Hook - Called when specific fields change
export const formFieldChange = ({ form, fieldname, value, setFieldQuery }: FormContext) => {
  // Update item query when needed
  if (fieldname === 'item') {
    setFieldQuery?.('item', {
      filters: {
        item_type: ['in', ['Inventory Item', 'Non Inventory Item']]
      }
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
  redirect?.('/maintenance-parts')
} 