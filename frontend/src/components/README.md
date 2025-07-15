# Components - Organized Structure

This directory contains all Vue components for the Enterprise Asset Management frontend, now organized into logical categories for better maintainability and development experience.

## Directory Structure

```bash
components/
├── README.md
├── forms/                      # Form-related components
│   ├── DynamicMetaField.vue    # Main form field container
│   ├── NewDynamicMetaField.vue # New version of form field container
│   ├── DynamicField.vue        # Individual field wrapper
│   ├── NewDynamicField.vue     # New version of field wrapper
│   ├── FormHeader.vue          # Enhanced form header with actions, workflow, and state management
│   └── FormSkeleton.vue        # Loading skeleton for forms
├── forms/
│   ├── form-fields/             # Individual field type components
│   ├── index.ts                # Field type exports
│   ├── BaseField.vue           # Base field component
│   ├── DynamicField.vue        # Dynamic field router
│   ├── TextField.vue           # Text input field
│   ├── TextareaField.vue       # Textarea field
│   ├── NumberField.vue         # Number input field
│   ├── DateField.vue           # Date picker field
│   ├── DatetimeField.vue       # Datetime picker field
│   ├── TimeField.vue           # Time picker field
│   ├── CheckboxField.vue       # Checkbox field
│   ├── SelectField.vue         # Select dropdown field
│   └── LinkField.vue           # Link field with search
├── tables/                     # Table and list components
│   └── DataTable.vue           # Generic data table
├── list/                       # List-specific components
│   └── ListTable.vue           # Dynamic list table (renamed from BaseDynamicListDataTable)
├── navigation/                 # Navigation components
│   └── Breadcrumb.vue          # Breadcrumb navigation
├── ui/                         # Common UI components
│   ├── Header.vue              # Main header component
│   ├── Navbar.vue              # Navigation bar
│   ├── Modal.vue               # Modal wrapper
│   └── Search.vue              # Search component
├── common/                     # Common view components
│   ├── Calendar.vue            # Calendar view
│   ├── TreeView.vue            # Tree view
│   ├── Map.vue                 # Map view
│   └── Cytoscape.vue           # Graph/diagram view
└── dashboard/                  # Dashboard-specific components
    └── [dashboard components]
```

## Component Categories

### Forms (`/forms/`)

Form-related components that work with the new `useFormPage` composable:

**DynamicMetaField.vue** - Main form field container

- Renders multiple form fields in a grid layout
- Handles form validation and field visibility
- Integrates with `useFormPage` for field data and options
- **Usage**: Used in `BaseDynamicForm.vue` layout

**FormHeader.vue** - Enhanced form header with workflow and actions

- Displays form title, workflow state, and action buttons
- Handles save, delete, edit, cancel operations
- Shows workflow transitions and document actions
- **Usage**: Used in `BaseDynamicForm.vue` layout

### Form Fields (`/forms/form-fields/`)

Individual field type components for different data types:

**DynamicField.vue** - Field type router

- Determines which field component to render based on field type
- Handles common field props and events
- **Usage**: Used by `DynamicMetaField.vue`

**Specific Field Types**:

- `TextField.vue` - Text, Data, and other string fields
- `NumberField.vue` - Int, Float, Currency fields
- `DateField.vue` - Date picker
- `LinkField.vue` - Link field with search and autocomplete
- `SelectField.vue` - Select dropdown with options
- `CheckboxField.vue` - Boolean checkbox field

All field components integrate with:

- The new `useFormUtils` composable for field handling
- The `useApi` composable for option searching
- Form validation from `useFormPage`

### Tables (`/tables/`)

Table and list view components:

**ListTable.vue** - Dynamic list with actions (now in list/)

- Displays data in table format with search and filters
- Supports custom actions and row selection
- Integrates with list management composables
- **Usage**: Used in `BaseList.vue` layout

**DataTable.vue** - Generic data table

- Simple table component for linked tabs and other data
- Supports row click and basic actions
- **Usage**: Used for linked tabs in forms

### Navigation (`/navigation/`)

Navigation and routing components:

**Breadcrumb.vue** - Breadcrumb navigation

- Shows current location in the app hierarchy
- Integrates with Vue Router for navigation

### UI (`/ui/`)

Common UI and layout components:

**Header.vue** - Main application header
**Navbar.vue** - Main navigation bar
**Modal.vue** - Modal dialog wrapper
**Search.vue** - Global search component

### Common (`/common/`)

Reusable view components:

**Calendar.vue** - Calendar view for date-based data
**TreeView.vue** - Hierarchical tree view
**Map.vue** - Geographic map view
**Cytoscape.vue** - Graph and diagram view

## Integration with New Composables

### Form Components Integration

Form components now integrate with the simplified composables:

```vue
<!-- Example: Updated form component -->
<template>
  <DynamicMetaField
    v-model="form.visibleFields"
    :form-data="form.data"
    @update:form-data="form.updateData"
    :disabled="!isEditing"
  />
</template>

<script setup>
import { useFormPage } from '@/composables/core/useFormPage'

const form = useFormPage('Asset', emit)
await form.initialize(documentId)
</script>
```

### Field Component Integration

Field components integrate with form utilities:

```vue
<!-- Example: Field component with new composables -->
<script setup>
import { useFormUtils } from '@/composables/form/useFormUtils'

const formUtils = useFormUtils()

const handleDateChange = (timestamp) => {
  const updatedData = formUtils.handleDateUpdate(
    field.fieldname,
    timestamp,
    formData,
  )
  emit('update:modelValue', updatedData[field.fieldname])
}

const searchOptions = async (searchTerm) => {
  return await formUtils.searchLinkFieldOptions(field, searchTerm)
}
</script>
```

## Migration Guide

### Updated Import Paths

Old paths:

```typescript
import FormHeader from '@/components/FormHeader.vue'
import DataTable from '@/components/DataTable.vue'
import TreeView from '@/components/TreeView.vue'
```

New paths:

```typescript
import FormHeader from '@/components/forms/FormHeader.vue'
import DataTable from '@/components/tables/DataTable.vue'
import TreeView from '@/components/common/TreeView.vue'
```

### Component Updates

1. **Form Components**: Now use `useFormPage` instead of multiple composables
2. **Field Components**: Use `useFormUtils` for field handling
3. **Table Components**: May use simplified list composables (to be created)
4. **All Components**: Updated import paths for other components

## Best Practices

### Component Organization

1. **Single Responsibility**: Each component has a clear, single purpose
2. **Logical Grouping**: Related components are grouped together
3. **Consistent Naming**: Components follow consistent naming conventions
4. **Clear Dependencies**: Import relationships are clear and minimal

### Integration Patterns

1. **Composable Integration**: Components use appropriate composables for their functionality
2. **Event Handling**: Components emit events for parent handling rather than direct API calls
3. **State Management**: State is managed through composables, not component-level refs
4. **Type Safety**: All components use proper TypeScript typing

### Development Workflow

1. **Find Components**: Use the logical folder structure to locate components
2. **Update Components**: Follow the integration patterns when modifying components
3. **Add Components**: Place new components in the appropriate category folder
4. **Test Integration**: Ensure new components work with the simplified composables

This organized structure makes the codebase more maintainable while providing clear integration with the new simplified composables.

## FormHeader

A reusable header component for form pages that provides consistent styling and functionality. Supports both view and edit states.

### Usage

```vue
<FormHeader
  :title="itemID"
  :isEditing="isEditing"
  :saving="isSaving"
  :deleting="isDeleting"
  doctype="Employee"
  @save="handleSave"
  @delete="handleDelete"
  @back="handleBack"
  @edit="handleEdit"
  @cancel="handleCancel"
>
  <!-- Optional slot for additional buttons -->
  <template #additional-buttons>
    <n-button type="info">Custom Action</n-button>
  </template>
</FormHeader>
```

### Props

| Prop      | Type    | Default    | Description                                |
| --------- | ------- | ---------- | ------------------------------------------ |
| title     | String  | required   | The title to display in the header         |
| isEditing | Boolean | false      | Whether the form is in edit mode           |
| saving    | Boolean | false      | Loading state for the save button          |
| deleting  | Boolean | false      | Loading state for the delete button        |
| doctype   | String  | 'Document' | The document type for confirmation dialogs |

### Events

| Event  | Description                               |
| ------ | ----------------------------------------- |
| save   | Emitted when the save button is clicked   |
| delete | Emitted when delete is confirmed          |
| back   | Emitted when the back button is clicked   |
| edit   | Emitted when the edit button is clicked   |
| cancel | Emitted when the cancel button is clicked |

### Features

1. **Delete Confirmation**: Shows a confirmation dialog before emitting the delete event
2. **View/Edit States**: Toggles between different button sets based on the current state
3. **Loading States**: Supports loading indicators for save and delete operations
4. **Back Navigation**: Includes a back button with proper handling

### States

The component has two states:

1. **View State** (isEditing = false)

   - Shows Edit and Delete buttons
   - Back button is enabled

2. **Edit State** (isEditing = true)
   - Shows Save and Cancel buttons
   - Back button is disabled to prevent accidental navigation during editing

### Implementation Example

```typescript
// In your form component
const isEditing = ref(false)
const originalFormData = ref({})

const handleEdit = () => {
  isEditing.value = true
}

const handleSave = async () => {
  // Save logic here
  isEditing.value = false
}

const handleCancel = () => {
  // Restore original data
  formData.value = JSON.parse(JSON.stringify(originalFormData.value))
  isEditing.value = false
}

const handleDelete = () => {
  // Delete logic here - will only be called after user confirms
}
```

## DynamicForm

A reusable form component that renders different form fields based on a configuration.

### Usage with View/Edit Mode

```vue
<DynamicForm
  ref="formRef"
  v-model="fields"
  :form-data="formData"
  :disabled="!isEditing"
/>
```

### Props

| Prop          | Type    | Default  | Description                                |
| ------------- | ------- | -------- | ------------------------------------------ |
| modelValue    | Array   | required | Array of field configurations              |
| formData      | Object  | {}       | Form data object                           |
| filterContext | String  | 'none'   | Context for filtering fields               |
| disabled      | Boolean | false    | Whether all form fields should be disabled |

### Integration with FormHeader

When using DynamicForm with FormHeader, you can easily implement view/edit mode:

```vue
<template>
  <FormHeader
    :title="itemID"
    :isEditing="isEditing"
    doctype="YourDocType"
    @save="handleSave"
    @edit="handleEdit"
    @cancel="handleCancel"
    @delete="handleDelete"
  />
  <DynamicForm
    ref="formRef"
    v-model="fields"
    :form-data="formData"
    :disabled="!isEditing"
  />
</template>

<script setup>
const isEditing = ref(false)
const originalFormData = ref({})

// When switching to edit mode
const handleEdit = () => {
  isEditing.value = true
}

// When saving changes
const handleSave = async () => {
  // Save logic
  isEditing.value = false
}

// When canceling changes
const handleCancel = () => {
  formData.value = JSON.parse(JSON.stringify(originalFormData.value))
  isEditing.value = false
}

// When deleting (after confirmation)
const handleDelete = async () => {
  // Delete logic
}
</script>
```
