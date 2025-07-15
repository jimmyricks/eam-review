import type { FormContext } from '@/services/client-script'

// Helper function to get datetime values from form data
function getDatetimeValues(form: any) {
  // Try to get values from individual fields first (these are the actual database fields)
  const startDatetime = form.start_datetime || form.start_datetime_range?.[0]
  const endDatetime = form.end_datetime || form.start_datetime_range?.[1]

  return {
    start_datetime: startDatetime,
    end_datetime: endDatetime
  }
}

// Form Load Hook - Called when form loads
export const formOnLoad = ({ form, setFieldQuery }: FormContext) => {
  const { start_datetime, end_datetime } = getDatetimeValues(form)
  
  // Set initial filter for equipment field based on existing form values
  if (form.work_order_equipment || start_datetime || end_datetime) {
    setFieldQuery?.('equipment', {
      query: 'ci_eam.work_management.doctype.work_order_equipment_assignment.work_order_equipment_assignment.search_equipment_query',
      ignore_user_permissions: false,
      page_length: 20,
      filters: {
        work_order_equipment: form.work_order_equipment || '',
        start_datetime: start_datetime || '',
        end_datetime: end_datetime || '',
      }
    })
  }
  
  console.log('start_datetime', start_datetime)
  console.log('end_datetime', end_datetime)
  console.log('Form data keys:', Object.keys(form))
}

// Field Change Hook - Called when specific fields change
export const formFieldChange = ({ form, fieldname, setFieldQuery, notify }: FormContext) => {
  // Update equipment query when any of the filter fields change
  if (fieldname && ['work_order_equipment', 'start_datetime', 'end_datetime', 'start_datetime_range'].includes(fieldname)) {
    const { start_datetime, end_datetime } = getDatetimeValues(form)
    
    // Check if required fields are missing and notify user
    const missingFields = []
    if (!form.work_order_equipment) missingFields.push('Work Order Equipment')
    if (!start_datetime) missingFields.push('Start Datetime')
    if (!end_datetime) missingFields.push('End Datetime')

    if (missingFields.length > 0) {
      notify.warning(`Please fill in the following fields to filter equipment: ${missingFields.join(', ')}`)
    }

    setFieldQuery?.('equipment', {
      query: 'ci_eam.work_management.doctype.work_order_equipment_assignment.work_order_equipment_assignment.search_equipment_query',
      ignore_user_permissions: false,
      page_length: 20,
      filters: {
        work_order_equipment: form.work_order_equipment || '',
        start_datetime: start_datetime || '',
        end_datetime: end_datetime || '',
      }
    })
  }
}

// Before Save Hook - Called before saving (can prevent save)
export const formBeforeSave = ({ preventSave }: FormContext) => {
  
}

// After Save Hook - Called after successful save
export const formAfterSave = ({ form }: FormContext) => {

}

// Before Delete Hook - Called before deleting (can prevent delete)
export const formBeforeDelete = ({ preventDelete }: FormContext) => {
 
}

// After Delete Hook - Called after successful delete
export const formAfterDelete = ({ redirect }: FormContext) => {
  redirect?.('/work-order-equipment-assignment')
} 