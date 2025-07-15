import type { ListConfig, ListContext } from '@/services/client-script/types'

// Configuration for the System list view
export const listConfig: ListConfig = {
  // Views that should be available in this list page
  availableViews: ['List', 'Tree'],

  // Tree configuration
  treeOptions: {
    parentKey: 'parent_system_id',
    idKey: 'name',
    labelField: 'name1',
    doctype: 'System',
  },
}

// Example onLoad hook – runs once the list records are loaded
export function listOnLoad({ list, notify }: ListContext) {

} 