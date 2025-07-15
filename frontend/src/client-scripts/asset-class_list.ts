import type { ListConfig, ListContext } from '@/services/client-script/types'

// Configuration for the Asset Class list view
export const listConfig: ListConfig = {
  // Views that should be available in this list page
  availableViews: ['List', 'Tree'],

  // Hide the global "Add" button (we only allow adds via Tree view)
  hideAddButton: false,

  // Tree configuration
  treeOptions: {
    parentKey: 'parent_asset_class_id',
    idKey: 'name',
    labelField: 'class_name',
    doctype: 'Asset Class',
  },
}

// Example onLoad hook – runs once the list records are loaded
export function listOnLoad(_context: ListContext) {
  // console.debug('Asset Class list loaded – records:', list)
  // notify.info(
  //   `Loaded ${Array.isArray(list) ? list.length : 0} Asset Class records`,
  // )
} 