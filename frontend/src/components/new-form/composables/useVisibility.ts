import { type Ref } from 'vue'
import type { Document } from '@/types/document'

/**
 * Evaluates a `depends_on` or `mandatory_depends_on` expression.
 *
 * @param expression - The expression string, e.g., 'eval:doc.item_type == "Asset Item"'.
 * @param doc - The document data to evaluate against.
 * @returns `true` if the condition is met, `false` otherwise.
 */
const evaluateDependsOn = (expression: string, doc: Document): boolean => {
  let script = expression
  if (expression.startsWith('eval:')) {
    script = expression.substring(5)
  }

  try {
    const func = new Function('doc', `return ${script}`)
    return !!func(doc)
  } catch (e) {
    console.error(`Error evaluating expression: "${expression}"`, e)
    return false
  }
}

/**
 * A composable to manage field visibility and conditional states based on metadata dependencies.
 * @param formData - A ref to the form's document data.
 */
export const useVisibility = (formData: Ref<Document | null>) => {
  /**
   * Checks if a field should be visible based on its `depends_on` property.
   *
   * @param depends_on - The `depends_on` expression from the field metadata.
   * @returns `true` if the field should be visible, `false` otherwise.
   */
  const isVisible = (depends_on: string | undefined): boolean => {
    if (!depends_on) {
      return true // Always visible if no dependency
    }
    if (!formData.value) {
      return false // Not visible if form data is not available
    }
    return evaluateDependsOn(depends_on, formData.value)
  }

  /**
   * Checks if a field is mandatory based on its `mandatory_depends_on` property.
   *
   * @param mandatory_depends_on - The `mandatory_depends_on` expression from the field metadata.
   * @returns `true` if the field is conditionally mandatory, `false` otherwise.
   */
  const isConditionallyMandatory = (
    mandatory_depends_on: string | undefined,
  ): boolean => {
    if (!mandatory_depends_on) {
      return false // Not conditionally mandatory if no dependency
    }
    if (!formData.value) {
      return false // Not mandatory if form data is not available
    }
    return evaluateDependsOn(mandatory_depends_on, formData.value)
  }

  return {
    isVisible,
    isConditionallyMandatory,
  }
} 