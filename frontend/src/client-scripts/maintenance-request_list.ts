import type { ListConfig } from '@/services/client-script/types'

// Configuration for the Maintenance Request list view
export const listConfig: ListConfig = {
  // Views that should be available in this list page
  availableViews: ['List'],

  // Show the global "Add" button
  hideAddButton: false,
}

// Example onLoad hook – runs once the list records are loaded
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function listOnLoad({}: any) {
  // List loaded successfully
}

// Custom actions for Maintenance Request list
export const customActions = [
  {
    label: 'Generate Maintenance Order',
    key: 'generate_maintenance_order',
    endpoint:
      'ci_eam.maintenance_management.doctype.maintenance_request.maintenance_request.generate_maintenance_order',
  },
] 