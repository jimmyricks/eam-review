# Vue.js Dynamic Form System

A comprehensive form page system using Vue 3, TypeScript, and Naive UI that handles all doctypes with dynamic field generation, tabs, and state management.

## Architecture Overview

The form system is built with a service-oriented architecture and follows Vue 3 Composition API best practices.

### Key Features

- **Dynamic Field Generation**: Automatically generates form fields based on doctype metadata
- **Tab System**: Supports Details, Child Tables, and Attachments tabs with lazy loading
- **State Management**: Handles view/edit modes with proper dirty state tracking
- **Validation**: Real-time field validation with form-level error handling
- **Responsive Design**: Mobile-first design with 2-column grid layout
- **Service Integration**: Uses existing composables from `@/composables/services`

## Component Structure

```
new-form/
├── components/
│   ├── FormPage.vue           # Main container with routing & state
│   ├── FormHeader.vue         # Mode toggle, actions, workflow
│   ├── FormContent.vue        # Tabs container
│   ├── FormFields.vue         # Dynamic field renderer
│   ├── FieldComponents/       # Individual field components
│   │   ├── LinkField.vue
│   │   ├── CheckField.vue
│   │   ├── SelectField.vue
│   │   ├── AttachField.vue
│   │   ├── DateField.vue
│   │   ├── CurrencyField.vue
│   │   ├── TextFields.vue
│   │   ├── NumberFields.vue
│   │   └── TimeField.vue
│   └── TabContent/
│       ├── ChildTableTab.vue  # Child table functionality
│       └── AttachmentsTab.vue # Attachment management
├── composables/
│   └── useFormValidation.ts   # Form validation logic
├── utils/
│   └── fieldFormatters.ts     # Data conversion utilities
├── index.ts                   # Export index
└── README.md                  # This file
```

## Usage

### Basic Usage

```vue
<template>
  <FormPage
    :doctype="doctype"
    :name="documentName"
    :prefill-data="prefillData"
  />
</template>

<script setup lang="ts">
import { FormPage } from '@/new-form'

const doctype = 'Asset'
const documentName = 'new' // or existing document name
const prefillData = {
  /* optional prefill data */
}
</script>
```

### With Router

```typescript
// In your router configuration
{
  path: '/:doctype/:name',
  component: () => import('@/new-form/components/FormPage.vue'),
  props: true
}
```

### Programmatic Usage

```vue
<script setup lang="ts">
import { FormPage } from '@/new-form'
import { ref } from 'vue'

const formRef = ref()

// Access form methods
const saveForm = () => {
  formRef.value?.handleSave()
}

const toggleMode = () => {
  formRef.value?.toggleMode('edit')
}
</script>
```

## Field Components

Each field component follows a consistent interface:

```typescript
interface FieldProps {
  field: FormField // Metadata for the field
  value: any // Current field value
  mode: 'view' | 'edit' // Form mode
  readonly?: boolean // Override readonly state
  required?: boolean // Field is required
  error?: string | null // Validation error message
}

interface FieldEmits {
  (e: 'update:value', fieldname: string, value: any): void
}
```

### Supported Field Types

- **Text Fields**: Data, Small Text, Long Text, Text
- **Number Fields**: Int, Float, Currency
- **Date/Time Fields**: Date, Date and Time, Time
- **Selection Fields**: Select, Link
- **Special Fields**: Check, Attach, Attach Image

### Adding New Field Types

1. Create a new component in `FieldComponents/`
2. Follow the standard field interface
3. Update `FormFields.vue` component mapping
4. Add to `fieldFormatters.ts` if custom formatting is needed

## Data Flow

### Loading Documents

1. **Route Detection**: FormPage detects `/new` for create mode
2. **Metadata Loading**: Uses `useMetadataService` to load doctype metadata
3. **Document Loading**: Uses `useDocumentService` for existing documents
4. **Field Generation**: FormFields dynamically creates fields based on metadata

### Saving Documents

1. **Validation**: All fields validated using `useFormValidation`
2. **Data Formatting**: Field values converted using `fieldFormatters`
3. **Service Call**: Uses `useDocumentService.saveDocument`
4. **State Update**: Form switches to view mode on success

### Tab System

- **Details Tab**: Always present, contains form fields
- **Child Table Tabs**: Generated for Table fieldtype fields
- **Attachments Tab**: Conditional on attach fields or max_attachments

## State Management

### Form Modes

- **View Mode**: Read-only display with action buttons
- **Edit Mode**: Editable fields with save/cancel buttons
- **Create Mode**: Always in edit mode for new documents

### Dirty State Tracking

- Tracks changes between current and original data
- Prevents accidental navigation with unsaved changes
- Shows visual indicators for unsaved state

## Validation

### Field-Level Validation

- Real-time validation as user types
- Required field checking
- Type-specific validation (numbers, dates, etc.)
- Custom validation rules

### Form-Level Validation

- Cross-field validation
- Business rule validation
- Pre-save validation

### Error Display

- Inline errors for individual fields
- Toast notifications for save errors
- Form-level error summary

## Styling

### CSS Variables

The form system uses Naive UI's CSS variables for theming:

```css
--n-color              /* Background color */
--n-border-color       /* Border color */
--n-text-color         /* Primary text color */
--n-text-color-3       /* Secondary text color */
--n-error-color        /* Error color */
```

### Responsive Design

- **Desktop**: 2-column grid layout
- **Tablet**: 2-column with adjusted spacing
- **Mobile**: Single column layout

### Grid Behavior

- Small Text fields span 2 columns
- Long Text fields span 2 columns
- Regular fields span 1 column
- Custom column spanning via field.columns

## Integration with Services

### Required Services

- `useDocumentService`: Document CRUD operations
- `useMetadataService`: Doctype metadata loading
- `useWorkflowService`: Workflow action execution
- `useSearchService`: Link field search functionality

### Service Configuration

Ensure all required services are properly configured in your application:

```typescript
// In your main.ts or plugin configuration
import { useDocumentService, useMetadataService } from '@/composables/services'
```

## Performance Considerations

### Lazy Loading

- Tab content is lazily loaded
- Child table metadata loaded on demand
- Attachments loaded when tab is accessed

### Caching

- Metadata is cached via `useMetadataService`
- Form state preserved during tab switches
- Original data cached for cancel functionality

### Optimization

- Virtual scrolling for large child tables (future enhancement)
- Debounced validation for better UX
- Minimal re-renders through computed properties

## Extensibility

### Custom Field Components

Create custom field components by extending the base interface:

```vue
<template>
  <n-form-item
    :label="field.label"
    :required="required"
    :validation-status="error ? 'error' : undefined"
    :feedback="error || undefined"
  >
    <!-- Your custom field implementation -->
  </n-form-item>
</template>

<script setup lang="ts">
// Implement standard field interface
</script>
```

### Custom Validation

Add custom validation rules in `useFormValidation`:

```typescript
const validateFormLevel = (): ValidationError[] => {
  const errors: ValidationError[] = []

  // Add your custom validation logic
  if (customCondition) {
    errors.push({
      fieldname: 'custom_field',
      message: 'Custom validation message',
    })
  }

  return errors
}
```

### Custom Actions

Extend FormHeader with custom document actions:

```typescript
// In your doctype configuration
const customActions = [
  {
    label: 'Custom Action',
    action: 'custom_action',
    icon: 'custom-icon',
  },
]
```

## Migration Guide

### From Existing Forms

1. Replace existing form components with `FormPage`
2. Update routing to use new form structure
3. Migrate custom field logic to new field components
4. Update validation logic to use `useFormValidation`

### Breaking Changes

- Field component interface has changed
- State management is now centralized
- Custom actions need to be reconfigured

## Troubleshooting

### Common Issues

1. **Fields not showing**: Check metadata loading and field visibility
2. **Validation not working**: Ensure field types match metadata
3. **Save failures**: Check service configuration and data formatting
4. **Tab loading issues**: Verify child doctype metadata

### Debug Mode

Enable debug logging:

```typescript
// In FormPage.vue
const DEBUG = true

if (DEBUG) {
  console.log('Form state:', formData.value)
  console.log('Metadata:', metadata.value)
}
```

## Future Enhancements

- [ ] Virtual scrolling for large datasets
- [ ] Advanced search in Link fields
- [ ] Bulk operations in child tables
- [ ] Custom field layouts
- [ ] Form templates and presets
- [ ] Offline support
- [ ] Advanced workflow integration
- [ ] Print format integration
- [ ] Export/import functionality
