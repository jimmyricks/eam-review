import type { ListConfig, ListContext } from '@/services/client-script/types'

// Configuration for the Position list view
export const listConfig: ListConfig = {
  // Views that should be available in this list page
  availableViews: ['List', 'Diagram'],

  // Diagram configuration
  diagramOptions: {
    getElements: (positions: any[]) => {
      // This will be handled by the composable in the component
      return []
    },
  },
}

// Example onLoad hook – runs once the list records are loaded
export function listOnLoad({ list, notify }: ListContext) {

} 