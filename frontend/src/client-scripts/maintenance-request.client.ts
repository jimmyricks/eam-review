import type { FormContext } from '@/services/client-script'

// Form Load Hook - Called when form loads
export const formOnLoad = ({ form, setFieldQuery }: FormContext) => {
  // Set initial filter for asset field based on planned_maintenance_activity
  if (form.planned_maintenance_activity) {
    setFieldQuery?.('asset', {
      query:
        'ci_eam.maintenance_management.doctype.maintenance_request.maintenance_request.get_filtered_assets_for_maintenance_request',
      reference_doctype: 'Maintenance Request',
      ignore_user_permissions: false,
      page_length: 20,
      filters: {
        planned_maintenance_activity: form.planned_maintenance_activity,
      },
    })
  }
}

// Field Change Hook - Called when specific fields change
export const formFieldChange = ({ form, fieldname, value, setFieldQuery }: FormContext) => {
  // Update asset query when planned_maintenance_activity changes
  if (fieldname === 'planned_maintenance_activity') {
    setFieldQuery?.('asset', {
      query: 'ci_eam.maintenance_management.doctype.maintenance_request.maintenance_request.get_filtered_assets_for_maintenance_request',
      reference_doctype: 'Maintenance Request',
      ignore_user_permissions: false,
      page_length: 20,
      filters: value ? {
        planned_maintenance_activity: value,
      } : {}
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
  redirect?.('/maintenance-request')
} 