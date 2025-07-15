import type { ListConfig, ListContext } from '@/services/client-script/types'

// Configuration for the Location list view
export const listConfig: ListConfig = {
  // Views that should be available in this list page
  availableViews: ['List', 'Tree', 'Map'],

  // Tree configuration
  treeOptions: {
    parentKey: 'parent_location',
    idKey: 'name',
    labelField: 'name1',
    doctype: 'Location',
  },
}

// Example onLoad hook – runs once the list records are loaded
export function listOnLoad({ list, notify }: ListContext) {

} 