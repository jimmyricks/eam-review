import type { FormContext } from '@/services/client-script'
import { useFrappeSDK } from '@/composables/useFrappeSDK'

// Form Load Hook - Called when form loads
export const formOnLoad = async ({ form }: FormContext) => {
  const { call } = useFrappeSDK()

  // Only run this for new documents (which have no 'name' yet)
  if (!form.name && form.purchase_request) {
    const result = await call.get('ci_eam.purchasing_and_stores.doctype.purchase_request_line.purchase_request_line.set_pr_line_query', {
      purchase_request: form.purchase_request
    })

    if (result.message.status === 'Success') {
      form.row_no = result.message.next_row_no
    } else {
      console.error('Error setting row number', result.message)
    }
  }

  // notify.success('Purchase Request Line Form Loaded')
}

// Field Change Hook - Called when specific fields change
export const formFieldChange = (_: FormContext) => {

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
export const formAfterDelete = ({ redirect, form }: FormContext) => {
  redirect?.('/purchase-request/'+form.purchase_request)
} 