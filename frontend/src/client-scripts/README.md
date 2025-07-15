# Client Scripts Documentation

This directory contains client-side scripts that provide dynamic behavior for forms and lists in the CI-EAM application. These scripts run in the browser and can modify form behavior, validate data, and provide custom business logic.

## File Naming Convention

- **Form Scripts**: `{doctype-slug}.client.ts` (e.g., `maintenance-request.client.ts`)
- **List Scripts**: `{doctype-slug}_list.ts` (e.g., `maintenance-request_list.ts`)

## Form Scripts API

Form scripts can export the following hooks that are called at specific points in the form lifecycle:

### Available Hooks

#### `formOnLoad(context: FormContext)`

**Called when**: Form is loaded (both new and existing records)
**Purpose**: Initialize form state, set field queries, apply default values

```typescript
export const formOnLoad = ({ form, notify, setFieldQuery }: FormContext) => {
  // Set initial field queries
  setFieldQuery?.('asset_class', {
    filters: { equipment: 1 },
  })
}
```

#### `formFieldChange(context: FormContext)`

**Called when**: Any field value changes
**Purpose**: React to field changes, update dependent fields, apply business rules

```typescript
export const formFieldChange = ({
  form,
  fieldname,
  value,
  setFieldQuery,
}: FormContext) => {
  if (fieldname === 'location') {
    setFieldQuery?.('system', {
      filters: { location: value },
    })
  }
}
```

#### `formBeforeSave(context: FormContext)`

**Called when**: User attempts to save the form
**Purpose**: Validate data, prevent save if validation fails

```typescript
export const formBeforeSave = ({ form, notify, preventSave }: FormContext) => {
  if (!form.required_field) {
    notify.error('Required field is missing')
    preventSave?.()
    return
  }
}
```

#### `formAfterSave(context: FormContext)`

**Called when**: Form is successfully saved
**Purpose**: Post-save actions, redirects, notifications

```typescript
export const formAfterSave = ({ form, notify, redirect }: FormContext) => {
  notify.success(`${form.name} saved successfully!`)
  redirect?.('/maintenance-request')
}
```

#### `formBeforeDelete(context: FormContext)`

**Called when**: User attempts to delete the form
**Purpose**: Validate deletion, prevent delete if validation fails

```typescript
export const formBeforeDelete = ({
  form,
  notify,
  preventDelete,
}: FormContext) => {
  if (form.status === 'Completed') {
    notify.error('Cannot delete completed records')
    preventDelete?.()
    return
  }
}
```

#### `formAfterDelete(context: FormContext)`

**Called when**: Form is successfully deleted
**Purpose**: Post-delete actions, redirects, notifications

```typescript
export const formAfterDelete = ({ notify, redirect }: FormContext) => {
  notify.success('Record deleted successfully!')
  redirect?.('/maintenance-request')
}
```

### Context Functions

Each hook receives a context object with these functions:

#### `setFieldQuery(fieldname: string, queryConfig: FieldQuery)`

Set custom query for link fields:

```typescript
setFieldQuery?.('asset', {
  query: 'custom.query.method',
  filters: { location: form.location },
  reference_doctype: 'Asset',
  ignore_user_permissions: false,
  page_length: 20,
})
```

#### `setFieldReadOnly(fieldname: string, readOnly: boolean)`

Make a field read-only or editable:

```typescript
setFieldReadOnly?.('breakdown_description', true)
```

#### `setFieldHidden(fieldname: string, hidden: boolean)`

Hide or show a field:

```typescript
setFieldHidden?.('optional_field', true)
```

#### `setFieldRequired(fieldname: string, required: boolean)`

Make a field required or optional:

```typescript
setFieldRequired?.('critical_field', true)
```

#### `setTabConfig(tabName: string, config: Partial<TabConfig>)`

Configure form table tabs (new functionality):

```typescript
// Disable add button for a specific tab
setTabConfig?.('maintenance_order_detail', {
  disableAddButton: true,
})

// Hide a tab completely
setTabConfig?.('attachments', {
  hideTab: true,
})
```

**Tab Configuration Options:**

- `disableAddButton?: boolean` - Hide the add button in the form table
- `hideTab?: boolean` - Hide the entire tab (not yet implemented)

**Example Usage:**

```typescript
// In maintenance-order.client.ts
export const formOnLoad = ({ form, setTabConfig }: FormContext) => {
  // Disable add button for Maintenance Order Detail tab by default
  setTabConfig?.('maintenance_order_detail', {
    disableAddButton: true,
  })

  // If work order exists, keep add button disabled
  if (form.work_order) {
    setTabConfig?.('maintenance_order_detail', {
      disableAddButton: true,
    })
  }
}

export const formFieldChange = ({
  form,
  fieldname,
  value,
  setTabConfig,
}: FormContext) => {
  // Dynamically control add button based on work order field
  if (fieldname === 'work_order') {
    setTabConfig?.('maintenance_order_detail', {
      disableAddButton: !!value, // Disable if work order exists
    })
  }
}
```

## List Scripts API

List scripts can export configuration and hooks for list views:

### Available Exports

#### `listConfig: ListConfig`

Configuration object for list behavior:

```typescript
export const listConfig: ListConfig = {
  availableViews: ['List', 'Tree'], // Available view types
  hideAddButton: false, // Hide global add button
  treeOptions: {
    // Tree view configuration
    parentKey: 'parent_id',
    idKey: 'name',
    labelField: 'title',
    doctype: 'Asset Class',
  },
}
```

#### `listOnLoad(context: ListContext)`

**Called when**: List data is loaded
**Purpose**: Initialize list state, apply custom logic

```typescript
export function listOnLoad({ list, notify }: ListContext) {
  // List loaded successfully
}
```

#### `customActions: CustomAction[]`

Array of custom actions available for selected rows:

```typescript
export const customActions = [
  {
    label: 'Generate Order',
    key: 'generate_order',
    endpoint: 'custom.method.endpoint',
    handler: async (selectedRows, context) => {
      // Custom action logic
    },
  },
]
```

### ListContext Interface

```typescript
interface ListContext {
  list: any // List data and methods
  router: Router // Vue router instance
  notify: Notify // Notification functions
  preventDelete?: () => void // Prevents delete operation
  redirect?: (path: string) => void // Redirects to specified path
}
```

## Examples

### Example 1: Asset Class with Equipment Filter

```typescript
// client-scripts/asset-class.client.ts
export const formOnLoad = ({ form, setFieldQuery }: FormContext) => {
  // Set custom query for parent asset class
  setFieldQuery?.('parent_asset_class_id', {
    filters: { equipment: form.equipment },
  })
}

export const formFieldChange = ({
  fieldname,
  value,
  setFieldQuery,
}: FormContext) => {
  if (fieldname === 'equipment') {
    setFieldQuery?.('parent_asset_class_id', {
      filters: value ? { equipment: value } : {},
    })
  }
}
```

### Example 2: Maintenance Request with Asset Filter

```typescript
// client-scripts/maintenance-request.client.ts
export const formOnLoad = ({ form, setFieldQuery }: FormContext) => {
  setFieldQuery?.('asset', {
    query:
      'ci_eam.maintenance_management.doctype.maintenance_request.maintenance_request.get_filtered_assets_for_maintenance_request',
    reference_doctype: 'Maintenance Request',
    filters: form.planned_maintenance_activity
      ? {
          planned_maintenance_activity: form.planned_maintenance_activity,
        }
      : {},
  })
}
```

### Example 3: Validation and Business Logic

```typescript
// client-scripts/work-order.client.ts
export const formBeforeSave = ({ form, notify, preventSave }: FormContext) => {
  if (!form.work_order_type) {
    notify.error('Work order type is required')
    preventSave?.()
    return
  }

  if (form.estimated_hours && form.estimated_hours < 0) {
    notify.error('Estimated hours cannot be negative')
    preventSave?.()
    return
  }
}

export const formAfterSave = ({ form, notify, redirect }: FormContext) => {
  notify.success(`Work Order ${form.name} saved successfully!`)

  // Redirect to list after save
  redirect?.('/work-order')
}
```

### Example 4: Tab Configuration

```typescript
// client-scripts/maintenance-order.client.ts
export const formOnLoad = ({ form, setTabConfig }: FormContext) => {
  // Disable add button for Maintenance Order Detail tab by default
  setTabConfig?.('maintenance_order_detail', {
    disableAddButton: true,
  })

  // If work order exists, keep add button disabled
  if (form.work_order) {
    setTabConfig?.('maintenance_order_detail', {
      disableAddButton: true,
    })
  }
}

export const formFieldChange = ({
  form,
  fieldname,
  value,
  setTabConfig,
}: FormContext) => {
  // Dynamically control add button based on work order field
  if (fieldname === 'work_order') {
    setTabConfig?.('maintenance_order_detail', {
      disableAddButton: !!value, // Disable if work order exists
    })
  }
}
```

## Migration from Existing Code

### From customFieldOptions

If you currently use `customFieldOptions` in your form components:

**Before:**

```typescript
// In Form.vue
const customFieldOptions = computed(() => ({
  asset: {
    doctype: 'Asset',
    filters: formData.location ? { location: formData.location } : {},
  },
}))
```

**After:**

```typescript
// In client-scripts/your-doctype.client.ts
export const formOnLoad = ({ form, setFieldQuery }: FormContext) => {
  setFieldQuery?.('asset', {
    doctype: 'Asset',
    filters: form.location ? { location: form.location } : {},
  })
}
```

## Benefits

1. **Separation of Concerns** - Business logic separated from UI components
2. **Reusability** - Client scripts can be shared across forms
3. **Maintainability** - Easier to maintain and update business logic
4. **Dynamic Behavior** - Tab configurations can change based on form state
5. **Type Safety** - Full TypeScript support with proper interfaces
