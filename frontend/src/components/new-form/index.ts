/**
 * New Form System Export Index
 * Provides centralized access to all form components and composables
 */

// Main Components
export { default as FormPage } from '../core/FormPage.vue'
export { default as FormHeader } from './FormHeader.vue'
export { default as FormContent } from './FormContent.vue'
export { default as FormFields } from './FormFields.vue'

// Field Components
export { default as LinkField } from './fields/LinkField.vue'
export { default as CheckField } from './fields/CheckField.vue'
export { default as SelectField } from './fields/SelectField.vue'
export { default as AttachField } from './fields/AttachField.vue'
export { default as DateField } from './fields/DateField.vue'
export { default as CurrencyField } from './fields/CurrencyField.vue'
export { default as TextFields } from './fields/TextFields.vue'
export { default as NumberFields } from './fields/NumberFields.vue'
export { default as TimeField } from './fields/TimeField.vue'

// Tab Content Components
export { default as AttachmentsTab } from './tabs/AttachmentsTab.vue'
export { default as FormTable } from './tabs/FormTable.vue'

// Utilities
export * from '@/utils/fieldFormatters'

// Composables
export { useFormValidation } from './composables/useFormValidation'
export type { ValidationError } from './composables/useFormValidation'

// Types
export type { FormFieldsInstance } from './FormFields.vue'