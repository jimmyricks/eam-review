/**
 * Form Validation Composable
 * Handles form-wide validation logic
 */

import { ref, computed, type Ref } from 'vue'
import { validateField } from '../../../utils/fieldFormatters'
import type { FormField } from '@/types/metadata'
import type { Document } from '@/types/document'
import { useVisibility } from './useVisibility'

export interface ValidationError {
  fieldname: string
  message: string
}

export const useFormValidation = (
  fields: Ref<FormField[]>,
  formData: Ref<Document | null>
) => {
  const { isConditionallyMandatory } = useVisibility(formData)
  // Field-level errors
  const fieldErrors = ref<Record<string, string>>({})
  
  // Form-level errors
  const formErrors = ref<ValidationError[]>([])

  // Computed validation state
  const hasErrors = computed(() => {
    return Object.keys(fieldErrors.value).length > 0 || formErrors.value.length > 0
  })

  const errorCount = computed(() => {
    return Object.keys(fieldErrors.value).length + formErrors.value.length
  })

  /**
   * Validate a single field
   */
  const validateSingleField = (fieldname: string, value: any): string | null => {
    const field = fields.value.find((f) => f.fieldname === fieldname)
    if (!field) return null

    let error: string | null = null
    const isMandatory = field.reqd || isConditionallyMandatory(field.mandatory_depends_on)

    if (isMandatory && (value === null || value === undefined || value === '')) {
      error = `${field.label} is required`
    } else {
      error = validateField(field, value)
    }

    if (error) {
      fieldErrors.value[fieldname] = error
    } else {
      delete fieldErrors.value[fieldname]
    }

    return error
  }

  /**
   * Validate all fields
   */
  const validateAllFields = (): ValidationError[] => {
    const errors: ValidationError[] = []
    
    if (!formData.value) return errors

    // Clear existing errors
    fieldErrors.value = {}
    formErrors.value = []

    // Validate each field
    fields.value.forEach((field) => {
      const value = formData.value![field.fieldname]
      let error: string | null = null
      const isMandatory = field.reqd || isConditionallyMandatory(field.mandatory_depends_on)

      if (isMandatory && (value === null || value === undefined || value === '')) {
        error = `${field.label} is required`
      } else {
        error = validateField(field, value)
      }

      if (error) {
        fieldErrors.value[field.fieldname] = error
        errors.push({
          fieldname: field.fieldname,
          message: error
        })
      }
    })

    // Add form-level validation
    const formLevelErrors = validateFormLevel()
    errors.push(...formLevelErrors)
    formErrors.value = formLevelErrors

    return errors
  }

  /**
   * Form-level validation (cross-field validation)
   */
  const validateFormLevel = (): ValidationError[] => {
    const errors: ValidationError[] = []
    
    if (!formData.value) return errors

    // Example: Custom validation rules
    // Add your custom form-level validation logic here
    
    return errors
  }

  /**
   * Get error for a specific field
   */
  const getFieldError = (fieldname: string): string | null => {
    return fieldErrors.value[fieldname] || null
  }

  /**
   * Clear errors for a specific field
   */
  const clearFieldError = (fieldname: string) => {
    delete fieldErrors.value[fieldname]
  }

  /**
   * Clear all errors
   */
  const clearAllErrors = () => {
    fieldErrors.value = {}
    formErrors.value = []
  }

  /**
   * Set custom field error
   */
  const setFieldError = (fieldname: string, message: string) => {
    fieldErrors.value[fieldname] = message
  }

  /**
   * Set form-level error
   */
  const setFormError = (message: string) => {
    formErrors.value.push({
      fieldname: '_form',
      message
    })
  }

  /**
   * Check if form is valid for submission
   */
  const isFormValid = (): boolean => {
    const errors = validateAllFields()
    return errors.length === 0
  }

  return {
    // State
    fieldErrors,
    formErrors,
    hasErrors,
    errorCount,
    
    // Methods
    validateSingleField,
    validateAllFields,
    getFieldError,
    clearFieldError,
    clearAllErrors,
    setFieldError,
    setFormError,
    isFormValid
  }
} 