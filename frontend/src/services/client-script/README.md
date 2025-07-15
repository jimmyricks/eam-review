# Client Script Service

This service provides Frappe-style client scripts for your Vue.js frontend, allowing you to customize form and list behavior per doctype without modifying core components.

## Overview

The client script system enables you to:

1. **Create custom queries** for link fields
2. **Control form states** (read-only, hidden fields, required fields)
3. **Add validation logic** before save/delete operations
4. **Handle post-operation actions** (redirects, notifications)
5. **Customize list behavior** (filters, bulk operations)

## Architecture

### Core Components

- `useClientScriptService` - Main service for loading and executing scripts
- `GenericList.vue` - Generic list component that handles any doctype
- `GenericForm.vue` - Generic form component that handles any doctype
- `types.ts` - TypeScript interfaces for type safety

### File Structure

```
src/
├── services/client-script/
│   ├── useClientScriptService.ts  # Main service
│   ├── types.ts                   # TypeScript interfaces
│   └── index.ts                   # Exports
├── client-scripts/
│   ├── asset-class.client.ts      # Example implementation
│   └── [doctype].client.ts        # Doctype-specific scripts
├── pages/
│   ├── GenericList.vue            # Generic list component
│   └── GenericForm.vue            # Generic form component
└── utils/
    └── doctype-converter.ts       # Doctype name utilities
```

## Usage

### 1. Generic Routes

The system uses generic routes that can handle any doctype:

```typescript
// List route: /asset-class
{
  path: '/:doctype',
  name: 'GenericList',
  component: () => import('@/pages/GenericList.vue'),
  meta: { layout: 'list' },
}

// Form route: /asset-class/AC001
{
  path: '/:doctype/:id',
  name: 'GenericForm',
  component: () => import('@/pages/GenericForm.vue'),
  meta: { layout: 'form' },
}
```

### 2. Creating Client Scripts

Create a client script file at `src/client-scripts/{doctype-name}.client.ts`:

```typescript
import type { FormContext, ListContext } from '@/services/client-script/types'

// Form Load Hook
export const formOnLoad = ({ form, notify, setFieldQuery }: FormContext) => {
  // Set default values
  if (!form.due_date_lead_time) {
    form.due_date_lead_time = 30
  }

  // Set custom query for link field
  setFieldQuery?.('parent_asset_class_id', {
    filters: { equipment: form.equipment },
  })

  notify.success('Form loaded successfully')
}

// Field Change Hook
export const formFieldChange = ({
  form,
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

// Before Save Hook
export const formBeforeSave = ({ form, notify, preventSave }: FormContext) => {
  if (!form.class_name) {
    notify.error('Class name is required')
    preventSave?.()
  }
}

// After Save Hook
export const formAfterSave = ({ form, notify, redirect }: FormContext) => {
  notify.success(`${form.class_name} saved successfully!`)
  redirect?.('/asset-class')
}
```

### 3. Available Hooks

#### Form Hooks

- `formOnLoad` - Called when form loads
- `formFieldChange` - Called when specific fields change
- `formBeforeSave` - Called before saving (can prevent save)
- `formAfterSave` - Called after successful save
- `formBeforeDelete` - Called before deleting (can prevent delete)
- `formAfterDelete` - Called after successful delete

#### List Hooks

- `listOnLoad` - Called when list loads
- `listBeforeDelete` - Called before deleting from list
- `listAfterDelete` - Called after deleting from list

### 4. Context Functions

Each hook receives a context object with these functions:

#### Form Context

```typescript
interface FormContext {
  form: Record<string, any> // Form data
  fieldname?: string // Changed field name (for fieldChange)
  value?: any // New field value (for fieldChange)
  router: Router // Vue router instance
  notify: Notify // Notification functions
  setFieldQuery?: (fieldname: string, queryConfig: FieldQuery) => void
  setFieldReadOnly?: (fieldname: string, readOnly: boolean) => void
  setFieldHidden?: (fieldname: string, hidden: boolean) => void
  setFieldRequired?: (fieldname: string, required: boolean) => void
  preventSave?: () => void // Prevents save operation
  preventDelete?: () => void // Prevents delete operation
  redirect?: (path: string) => void // Redirects to specified path
}
```

#### List Context

```typescript
interface ListContext {
  list: any // List data and methods
  router: Router // Vue router instance
  notify: Notify // Notification functions
  preventDelete?: () => void // Prevents delete operation
  redirect?: (path: string) => void // Redirects to specified path
}
```

### 5. Field Query Configuration

```typescript
interface FieldQuery {
  query?: string // Custom query method
  filters?: Record<string, any> // Filter conditions
  reference_doctype?: string // Reference doctype
  ignore_user_permissions?: boolean // Ignore user permissions
  page_length?: number // Number of results per page
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
4. **Type Safety** - Full TypeScript support
5. **Developer Experience** - Hot-reload, better debugging
6. **Frappe Compatibility** - Familiar patterns for developers

## Development

### Hot Reload

Client scripts support hot reload during development. Changes to `.client.ts` files will automatically reload.

### Debugging

Use console.log in your client scripts for debugging:

```typescript
export const formOnLoad = ({ form }: FormContext) => {
  console.log('Form loaded:', form)
}
```

### Error Handling

Errors in client scripts are caught and logged. Failed hooks don't break core functionality, but validation hooks can prevent operations by throwing errors.

## Best Practices

1. **Keep scripts focused** - Each script should handle one doctype
2. **Use TypeScript** - Leverage type safety for better development experience
3. **Handle errors gracefully** - Don't let script errors break the UI
4. **Document complex logic** - Add comments for business rules
5. **Test thoroughly** - Client scripts can affect critical operations
