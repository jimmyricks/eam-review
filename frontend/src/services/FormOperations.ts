import { frappeDB } from '@/composables/useFrappeSDK'
import { MessageApi } from 'naive-ui'

/**
 * Generic save handler for form data
 * @param doctype The Frappe doctype
 * @param id The document ID
 * @param formRef The form reference with validate method
 * @param message The Naive UI message API
 * @param onSuccess Callback function to execute on successful save
 * @returns Promise<boolean> True if save was successful
 */
export async function handleSaveOperation<T extends Record<string, any>>(
  doctype: string,
  id: string,
  formRef: { validate: () => Promise<any> } | null,
  message: MessageApi,
  onSuccess?: (data: Partial<T>) => void,
): Promise<boolean> {
  try {
    // Type assertion for formRef.value
    const validatedFormData = await formRef?.validate()

    if (!validatedFormData) {
      message.warning('No form data available')
      return false
    }

    const updatedData = Object.fromEntries(
      Object.entries(validatedFormData).filter(
        ([_, value]) => value !== undefined,
      ),
    ) as Partial<T>

    if (Object.keys(updatedData).length === 0) {
      message.warning('No changes detected')
      return false
    }

    // Update the document dynamically
    await frappeDB.updateDoc<T>(doctype, id, updatedData)
    message.success(`${doctype} updated successfully`)

    // Call the success callback if provided
    if (onSuccess) {
      onSuccess(updatedData)
    }

    return true
  } catch (errors) {
    console.error('Validation errors:', errors)
    message.error('Please fix the form errors')
    return false
  }
}

/**
 * Generic delete handler for documents
 * @param doctype The Frappe doctype
 * @param id The document ID
 * @param message The Naive UI message API
 * @param onSuccess Callback function to execute on successful delete
 * @returns Promise<boolean> True if delete was successful
 */
export async function handleDeleteOperation(
  doctype: string,
  id: string,
  message: MessageApi,
  onSuccess?: () => void,
): Promise<boolean> {
  try {
    await frappeDB.deleteDoc(doctype, id)
    message.success(`${doctype} deleted successfully`)

    // Call the success callback if provided
    if (onSuccess) {
      onSuccess()
    }

    return true
  } catch (error: any) {
    console.error(`Error deleting ${doctype}:`, error)
    message.error(`${error.message} ${error.exception}`)
    return false
  }
}

/**
 * Create a composable for form operations
 * @param doctype The Frappe doctype
 * @param message The Naive UI message API
 * @returns Object with save and delete handlers
 */
export function useFormOperations<T extends Record<string, any>>(
  doctype: string,
  message: MessageApi,
) {
  const saveHandler = async (
    id: string,
    formRef: { validate: () => Promise<any> } | null,
    onSuccess?: (data: Partial<T>) => void,
  ): Promise<boolean> => {
    return handleSaveOperation<T>(doctype, id, formRef, message, onSuccess)
  }

  const deleteHandler = async (
    id: string,
    onSuccess?: () => void,
  ): Promise<boolean> => {
    return handleDeleteOperation(doctype, id, message, onSuccess)
  }

  return {
    saveHandler,
    deleteHandler,
  }
}
