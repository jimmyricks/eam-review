# New List Page System

A complete Vue 3 + TypeScript list page system built with Naive UI and service composables for enterprise document management.

## 🏗️ Architecture

### Component Hierarchy

```
ListPage.vue (Main Container)
├── ListHeader.vue (Title, Actions, View Switcher)
├── TableControls.vue (Search & Filters)
├── DataTable.vue (Table Display)
└── ListSettingsModal.vue (Column Management)
```

### Composable Structure

```
composables/
├── useListPageState.ts (Records, Loading, Search, Pagination)
├── useColumnManagement.ts (Column Visibility, localStorage)
├── useListPageActions.ts (Navigation & Routing)
└── useSearchDebounce.ts (Debounced Search Input)
```

## 🧩 Components

### ListPage.vue (`@/components/core`)

**Main container component** that orchestrates all list functionality.

```vue
<template>
  <ListPage
    doctype="Asset"
    record-label="Assets"
    route-path="/assets"
    :available-views="['list', 'tree', 'map']"
    default-view="list"
    @error="handleError"
    @records-loaded="handleRecordsLoaded"
  />
</template>
```

**Props**:

- `doctype` (required): Frappe doctype name
- `recordLabel`: Display name for records (default: "Records")
- `routePath`: Custom route path for navigation
- `availableViews`: Array of available view types
- `defaultView`: Default view to display

**Events**:

- `error`: Emitted when errors occur
- `records-loaded`: Emitted when records are loaded

### ListHeader.vue

**Header component** with title, record count, view switcher, and action buttons.

**Features**:

- Dynamic title and record count display
- View switcher (when multiple views available)
- Settings button for column management
- Add record button with navigation
- Responsive design with mobile optimizations

### TableControls.vue

**Search and filter controls** with debounced input for performance.

**Features**:

- Field selector with all searchable fields
- Search input with 300ms debounce
- Active search indicator
- Clear search functionality
- Responsive layout

### DataTable.vue

**Main data table** using Naive UI's n-data-table with advanced features.

**Features**:

- Dynamic column rendering based on field types
- Special handling for workflow states (tags)
- Date and currency formatting
- Sorting and pagination
- Loading skeletons and empty states
- Row click navigation

### ListSettingsModal.vue

**Column management modal** for customizing visible columns.

**Features**:

- Checkbox selection with 6-column limit
- Mandatory field enforcement (name, workflow_state)
- Default field indicators
- Real-time selection count
- Reset to defaults option
- localStorage persistence

## 🔧 Composables

### useListPageState

**Core state management** for list operations using service composables.

```typescript
const {
  records,
  loading,
  searchLoading,
  error,
  pagination,
  totalCount,
  loadRecords,
  searchRecords,
  clearSearch,
  refreshRecords,
} = useListPageState('Asset')
```

**Key Features**:

- Uses `useListService` for data operations
- Reactive pagination state
- Search filter management
- Error handling and logging

### useColumnManagement

**Column visibility and metadata management** with localStorage persistence.

```typescript
const {
  availableFields,
  visibleFields,
  visibleColumns,
  searchableFields,
  applyColumnSettings,
  resetColumnSettings,
} = useColumnManagement('Asset')
```

**Key Features**:

- Uses `useMetadataService` for field metadata
- 6-column limit enforcement
- Mandatory field handling
- Smart column ordering (name first, workflow last)
- localStorage persistence per doctype

### useListPageActions

**Navigation and routing actions** for list interactions.

```typescript
const { handleAddRecord, handleRowClick, navigateToRecord, navigateToList } =
  useListPageActions('Asset', '/assets')
```

### useSearchDebounce

**Debounced search utility** for performance optimization.

```typescript
const { debouncedSearch } = useSearchDebounce(300, (value) => {
  // Perform search
})
```

## ✨ Key Features

### Column Management

- **6-column limit**: Maximum columns displayed for optimal UX
- **Mandatory fields**: Name and workflow_state always visible
- **Default selection**: Fields with `in_list_view = 1` shown initially
- **localStorage**: Settings persisted per doctype
- **Smart ordering**: Logical column arrangement

### Search & Filtering

- **Field-based search**: Select field + enter value
- **300ms debounce**: Optimized API calls
- **Visual indicators**: Active search status display
- **Clear functionality**: Reset search with one click

### Performance

- **Service composables**: Efficient data fetching with caching
- **Skeleton loading**: Better perceived performance
- **Debounced search**: Reduced API calls
- **Reactive state**: Optimized re-renders

### User Experience

- **Responsive design**: Mobile and desktop support
- **Loading states**: Comprehensive feedback
- **Error handling**: Graceful error management
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🛠️ Usage

### Basic Implementation

```vue
<script setup lang="ts">
import ListPage from '@/components/core/ListPage.vue'

const handleError = (error: Error) => {
  console.error('List error:', error)
}

const handleRecordsLoaded = (records) => {
  console.log(`Loaded ${records.length} records`)
}
</script>

<template>
  <ListPage
    doctype="Asset"
    record-label="Assets"
    @error="handleError"
    @records-loaded="handleRecordsLoaded"
  />
</template>
```

### Custom Configuration

```vue
<template>
  <ListPage
    doctype="Work Order"
    record-label="Work Orders"
    route-path="/work-orders"
    :available-views="['list', 'calendar', 'kanban']"
    default-view="list"
  />
</template>
```

## 🎯 Design Principles

1. **Service-Oriented**: Uses dedicated service composables
2. **TypeScript-First**: Complete type safety throughout
3. **Composable-Driven**: Reusable logic in focused composables
4. **Performance-Optimized**: Debouncing, caching, efficient rendering
5. **User-Centric**: 6-column limit, responsive design, clear feedback
6. **Maintainable**: Clean separation of concerns, documented code

## 🚀 Service Integration

The list system leverages these service composables:

- **useListService**: Paginated data fetching, filtering, counting
- **useMetadataService**: Field metadata with caching
- **useSearchService**: Advanced search capabilities
- **useDocumentService**: Individual record operations

This ensures consistency with the broader application architecture and enables easy testing and maintenance.

## 📱 Responsive Behavior

- **Desktop**: Full feature set with optimal layout
- **Tablet**: Adjusted spacing and column management
- **Mobile**: Stacked layout, hidden view switcher, simplified controls

## 🔄 Migration Path

To migrate existing list pages:

1. Replace existing list components with `ListPage.vue`
2. Update route configurations if needed
3. Add error handling for the new events
4. Test column management and search functionality
5. Verify responsive behavior across devices

The new system is designed to be a drop-in replacement for most existing list implementations while providing enhanced functionality and better performance.
