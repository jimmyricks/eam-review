import type { FormContext } from '@/services/client-script'
import { useFrappeSDK } from '@/composables/useFrappeSDK'

// Form Load Hook - Called when form loads
export const formOnLoad = async ({ form, notify, setUIBehavior }: FormContext) => {
  // Check if this Maintenance Order Detail has a parent Maintenance Order with a Work Order
  if (form.maintenance_order) {
    await checkParentWorkOrderAndDisable(form.maintenance_order, setUIBehavior)
  }

  // disable edit button by default
  setUIBehavior?.({
    disabledEdit: true,
  })
}

// Field Change Hook - Called when specific fields change
export const formFieldChange = async ({ form }: FormContext) => {
  // Check if parent has work order and prevent save if it does
}

// Before Save Hook - Called before saving (can prevent save)
export const formBeforeSave = async ({ form }: FormContext) => {
  // Check if parent has work order and prevent save if it does
}

// After Save Hook - Called after successful save
export const formAfterSave = ({}: FormContext) => {
  // Success handling can be done here if needed
}

// Before Delete Hook - Called before deleting (can prevent delete)
export const formBeforeDelete = async ({ form }: FormContext) => {
  // Check if parent has work order and prevent delete if it does
}

// After Delete Hook - Called after successful delete
export const formAfterDelete = ({ redirect }: FormContext) => {
  redirect?.('/maintenance-order-detail')
}

// Helper function to check if parent Maintenance Order has a Work Order
// ✅ Safe inside the function
async function checkParentWorkOrder(maintenanceOrderId: string): Promise<boolean> {
  const { db } = useFrappeSDK() // move inside here

  try {
    const result = await db.getDoc('Maintenance Order', maintenanceOrderId)
    const hasWorkOrder = !!(result && result.work_order)
    return hasWorkOrder
  } catch (error) {
    console.error('Error checking parent work order:', error)
    return false
  }
}


// Helper function to check parent work order and disable form accordingly
async function checkParentWorkOrderAndDisable(
  maintenanceOrderId: string, 
  setUIBehavior?: (behavior: any) => void
) {
  const hasWorkOrder = await checkParentWorkOrder(maintenanceOrderId)
  console.log('hasWorkOrder', hasWorkOrder)
  
  if (hasWorkOrder && setUIBehavior) {
    // Disable form header buttons when parent has work order
    setUIBehavior({
      // disable all
      disabledEdit: true,
      disabledDelete: true,
      disabledSave: true,
      disabledCancel: true,
    })
    console.log('Parent Maintenance Order has Work Order - form header buttons disabled')
  }
} 