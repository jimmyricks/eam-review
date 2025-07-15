# Service Composables (`@/services`)

This directory provides feature-focused, TypeScript-first service composables for all core data and workflow operations in the app. Each service encapsulates a single responsibility, with a consistent, testable API and robust error handling.

## Available Services

- **useDocumentService**: CRUD, form loading, state ops (submit/cancel), duplication, docinfo refresh.
- **useMetadataService**: Metadata fetch, caching (5min, 50 doctypes), preloading, cache stats/clear.
- **useListService**: Paginated/filtered lists, counts, field search, sorting.
- **useSearchService**: Link field search, custom queries, multi-filter, quick/recent search.
- **useWorkflowService**: Workflow transitions, actions, bulk ops, state info.
- **useDocumentActionService**: Custom doc actions, bulk/permission checks, progress tracking.
- **useAttachmentService**: File upload (single/multi), validation, progress, attachment management.

## Service Details

### 1. `useDocumentService.ts`

**Purpose**: Document CRUD operations and form loading

**Key Features**:

- Uses `frappe.desk.form.load.getdoc` for complete form data including attachments, permissions, docinfo
- Handles create, read, update, delete operations
- Document state operations (submit, cancel)
- Document duplication

**Main Methods**:

```typescript
const {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  saveDocument,
  submitDocument,
  cancelDocument,
  duplicateDocument,
  refreshDocumentInfo,
} = useDocumentService()
```

### 2. `useMetadataService.ts`

**Purpose**: Metadata operations with caching

**Key Features**:

- Combines logic from `useMetadata.ts`, `useMetadataCache.ts`, `useMetadataPreloader.ts`
- Internal caching with configurable duration (5 minutes)
- Preloading for common doctypes
- Cache management and statistics

**Main Methods**:

```typescript
const {
  getMetadata,
  refreshMetadata,
  preloadMetadata,
  preloadCommonDoctypes,
  clearCache,
  getCacheStats,
} = useMetadataService()
```

### 3. `useListService.ts`

**Purpose**: List operations using frappeDB

**Key Features**:

- Paginated list retrieval
- Filtering and sorting
- Count operations
- Search within fields

**Main Methods**:

```typescript
const { getList, getCount, getPaginatedList, getFilteredList, searchInFields } =
  useListService()
```

### 4. `useSearchService.ts`

**Purpose**: Search operations for link fields

**Key Features**:

- Standard and custom query search
- Multiple filter support
- Quick search functionality
- Recent document search

**Main Methods**:

```typescript
const {
  searchLinkOptions,
  searchWithCustomQuery,
  searchWithFilters,
  quickSearch,
  searchRecent,
} = useSearchService()
```

### 5. `useWorkflowService.ts`

**Purpose**: Workflow operations (V2 implementations only)

**Key Features**:

- Get workflow transitions
- Apply workflow actions
- Bulk workflow operations
- Workflow state management

**Main Methods**:

```typescript
const {
  getWorkflowTransitions,
  applyWorkflowAction,
  getWorkflowInfo,
  hasWorkflow,
  bulkApplyWorkflowAction,
} = useWorkflowService()
```

### 6. `useDocumentActionService.ts`

**Purpose**: Custom document actions (form buttons, V2 implementations only)

**Key Features**:

- Execute custom document actions
- Bulk action execution
- Action permission checking
- Progress tracking for long-running actions

**Main Methods**:

```typescript
const {
  executeDocumentAction,
  getDocumentActions,
  bulkExecuteDocumentAction,
  canExecuteAction,
  executeDocumentActionWithProgress,
} = useDocumentActionService()
```

### 7. `useAttachmentService.ts`

**Purpose**: File and attachment operations

**Key Features**:

- Migrates all functionality from `useFileAttachment.ts`
- File upload with progress tracking
- File validation
- Multiple file upload support
- Document attachment management

**Main Methods**:

```typescript
const {
  uploadFile,
  removeAttachment,
  validateFile,
  uploadMultipleFiles,
  getDocumentAttachments,
} = useAttachmentService()
```

## Usage Example

```ts
import {
  useDocumentService,
  useMetadataService,
  useListService,
  useSearchService,
  useWorkflowService,
  useDocumentActionService,
  useAttachmentService,
} from '@/composables/services'

const { getDocument } = useDocumentService()
const doc = await getDocument('Asset', 'ASSET-001')
```

## New List Page System

A complete list page system has been created using these service composables:

- **ListPage.vue** (`@/components/core`): Main container component
- **ListHeader.vue** (`@/components/new-list`): Header with title, view switcher, add button
- **TableControls.vue** (`@/components/new-list`): Search controls with debounced input
- **DataTable.vue** (`@/components/new-list`): Main data table with sorting and pagination
- **ListSettingsModal.vue** (`@/components/new-list`): Column visibility management (max 6 columns)

### Supporting Composables

- **useListPageState**: Manages records, loading, search, pagination
- **useColumnManagement**: Handles column visibility and localStorage persistence
- **useListPageActions**: Navigation and routing actions
- **useSearchDebounce**: Debounced search with 300ms delay

## Principles

- **Single Responsibility**: Each service = one domain
- **Consistent API**: Similar method signatures
- **TypeScript**: Full type safety
- **Error Handling**: Graceful, informative
- **Performance**: Caching where needed
- **Testability**: Easy to mock/unit test

## Testing

See `@/pages/example/ExampleListPage.vue` for usage examples.

## Design Principles

1. **Single Responsibility**: Each service handles one specific area
2. **Consistent API**: Similar method signatures across services
3. **Error Handling**: Comprehensive error logging and handling
4. **TypeScript**: Full type safety with interfaces
5. **Performance**: Caching where appropriate
6. **Testability**: Easy to test individual services

## Configuration

### Metadata Service Cache

- **Duration**: 5 minutes
- **Max Size**: 50 doctypes
- **Common Doctypes**: Asset, Asset Class, Work Order, Item, Inventory, Location, Position

### List Service Defaults

- **Page Length**: 20
- **Order By**: modified desc
- **Fields**: ['name', '*']

## Error Handling

All services include:

- Comprehensive error logging
- Graceful error handling
- Meaningful error messages
- Console logging for debugging

## Future Enhancements

1. **Service Composition**: Combine services for complex operations
2. **Real-time Updates**: WebSocket integration for live data
3. **Offline Support**: Cache for offline functionality
4. **Performance Monitoring**: Track service performance
5. **Advanced Caching**: Redis or IndexedDB for larger caches
