import { ref } from 'vue'
import WorkManagementAPI, { frappeCall } from '../../services/WorkManagementAPI'
import { WorkOrderActivity } from '@/types/Work'
import { WorkOrder } from '@/types/Work'

const workOrders = ref<{ label: string; value: string }[]>([])
const loadWorkOrdersOptions = async () => {
  try {
    const response = await WorkManagementAPI.getWorkOrders()
    // console.log('API Response for items:', response)
    if (response && response.length > 0) {
      workOrders.value = response.map((m: WorkOrder) => ({
        label: `${m.description} (${m.name})`,
        value: m.name,
      }))
      // console.log('Processed items:', items.value)
    }
  } catch (error) {
    console.error('Error loading assets:', error)
  }
}
loadWorkOrdersOptions()

const workOrderActivities = ref<{ label: string; value: string }[]>([])
const loadWorkOrderActivitiesOptions = async () => {
  try {
    const response = await WorkManagementAPI.getWorkOrderActivities()
    if (response && response.length > 0) {
      workOrderActivities.value = response.map((m: WorkOrderActivity) => ({
        label: `${m.description} (${m.name})`,
        value: m.name,
      }))
      // console.log('Processed items:', items.value)
    }
  } catch (error) {
    console.error('Error loading assets:', error)
  }
}
loadWorkOrderActivitiesOptions()

const assetClassEquipmentQuery = ref<{ label: string; value: string }[]>([])
const getAssetClassEquipmentQuery = async () => {
  try {
    const response = await frappeCall.get(
      'ci_eam.asset_management.doctype.asset_class_availability.asset_class_availability.set_asset_class_query',
    )
    if (
      response.message.list_asset_class &&
      response.message.list_asset_class.length > 0
    ) {
      assetClassEquipmentQuery.value = response.message.list_asset_class.map(
        (m: any) => ({
          label: `${m.class_name} (${m.name})`,
          value: m.name,
        }),
      )
    }
  } catch (error) {
    console.error('Error loading assets:', error)
  }
}
getAssetClassEquipmentQuery()

const workOrderAssets = ref<{ label: string; value: string }[]>([])
const loadWorkOrderAssetsOptions = async () => {
  try {
    const response = await frappeCall.get(
      'ci_eam.asset_management.doctype.asset.asset.set_dynamic_query',
      {
        doctype: 'Asset',
        filters: {
          workflow_state: ['in', ['Acquired', 'Active', 'Under Maintenance']],
        },
        field_descriptors: [
          'description',
          'name',
          'asset_tag',
          'asset_class_name',
        ],
      },
    )
    workOrderAssets.value = response.message.set_list_query
  } catch (error) {
    console.error('Error loading assets:', error)
  }
}
loadWorkOrderAssetsOptions()

export {
  workOrders,
  workOrderActivities,
  assetClassEquipmentQuery,
  workOrderAssets,
}
