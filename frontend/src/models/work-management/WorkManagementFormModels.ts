import {
  assetClass,
  location,
  asset,
  equipment,
} from '@/models/asset-management/AssetManagementOptions'
import { checklist } from '@/models/maintenance-management/MaintenanceManagementOptions'
import {
  items,
  stores,
  uoms,
  inventory,
} from '@/models/purchase-store/PurchaseStoreOptions'
import {
  workOrderActivities,
  workOrders,
  assetClassEquipmentQuery,
  workOrderAssets,
} from './WorkManagementOptions'
import { trade, employee } from '@/models/core/CoreOptions'

type FormFieldType =
  | 'number'
  | 'input'
  | 'select'
  | 'textarea'
  | 'checkbox'
  | 'date'
  | 'datetime'

// Exports
export const WorkOrderFormFields = [
  {
    name: 'work_order_type',
    label: 'Work Order Type',
    type: 'select' as FormFieldType,
    options: [
      { label: 'Maintenance', value: 'Maintenance' },
      { label: 'Repair', value: 'Repair' },
      { label: 'Inspection', value: 'Inspection' },
      { label: 'Installation', value: 'Installation' },
    ],
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea' as FormFieldType,
    required: false,
  },
  {
    name: 'location',
    label: 'Location',
    type: 'select' as FormFieldType,
    options: location,
  },
  {
    name: 'store',
    label: 'Store',
    type: 'select' as FormFieldType,
    options: stores,
    disabled: false,
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'select' as FormFieldType,
    options: [
      { label: 'Low', value: 'Low' },
      { label: 'Medium', value: 'Medium' },
      { label: 'High', value: 'High' },
    ],
  },
  {
    name: 'severity',
    label: 'Severity',
    type: 'select' as FormFieldType,
    options: [
      { label: 'Low', value: 'Low' },
      { label: 'Medium', value: 'Medium' },
      { label: 'High', value: 'High' },
    ],
  },
  // {
  //   name: 'categoryoffailure',
  //   label: 'Category of Failure',
  //   type: 'select' as FormFieldType,
  // },
  {
    name: 'due_date',
    label: 'Due Date',
    type: 'date' as FormFieldType,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const WorkOrderActivityFormFields = [
  {
    name: 'work_order',
    label: 'Work Order',
    type: 'select' as FormFieldType,
    options: workOrders,
    disabled: true,
  },
  {
    name: 'work_item_type',
    label: 'Work Item Type',
    type: 'select' as FormFieldType,
    options: [{ label: 'Asset', value: 'Asset' }],
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea' as FormFieldType,
    required: false,
    disabled: false,
  },
  {
    name: 'work_item',
    label: 'Work Item',
    type: 'select' as FormFieldType,
    options: workOrderAssets,
  },
  {
    name: 'start_date',
    label: 'Start Date',
    type: 'date' as FormFieldType,
  },
  {
    name: 'end_date',
    label: 'End Date',
    type: 'date' as FormFieldType,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const WorkOrderEquipmentFormFields = [
  {
    name: 'work_order_activity',
    label: 'Work Order Activity',
    type: 'select' as FormFieldType,
    options: workOrderActivities,
    disabled: true,
  },
  // {
  //   name: 'work_order_activity_desc',
  //   label: 'Work Order Activity Description',
  //   type: 'textarea' as FormFieldType,
  // },
  {
    name: 'asset_class',
    label: 'Asset Class',
    type: 'select' as FormFieldType,
    options: assetClassEquipmentQuery,
  },
  {
    name: 'start_date',
    label: 'Start Date',
    type: 'date' as FormFieldType,
  },
  {
    name: 'return_date',
    label: 'Return Date',
    type: 'date' as FormFieldType,
  },
  {
    name: 'estimated_hours',
    label: 'Estimated Hours',
    type: 'number' as FormFieldType,
  },
]

export const WorkOrderEquipmentAssignmentFormFields = [
  {
    name: 'work_order_equipment',
    label: 'Work Order Equipment',
    type: 'select' as FormFieldType,
    options: [],
    disabled: true,
  },
  {
    name: 'asset_class_id',
    label: 'Asset Class',
    type: 'select' as FormFieldType,
    options: assetClass,
    hidden: true,
  },
  {
    name: 'start_datetime',
    label: 'Estimated Start Date',
    type: 'datetime' as FormFieldType,
  },
  {
    name: 'end_datetime',
    label: 'Estimated End Date',
    type: 'datetime' as FormFieldType,
  },
  {
    name: 'equipment',
    label: 'Equipment',
    type: 'select' as FormFieldType,
    options: equipment,
  },
  {
    name: 'hours_used',
    label: 'Hours Used',
    type: 'number' as FormFieldType,
  },
]

export const WorkOrderPartsFormFields = [
  {
    name: 'work_order_activity',
    label: 'Work Order Activity',
    type: 'select' as FormFieldType,
    options: workOrderActivities,
  },
  // {
  //   name: 'work_order_activity_desc',
  //   label: 'Work Order Activity Description',
  //   type: 'textarea' as FormFieldType,
  // },
  {
    name: 'item',
    label: 'Item',
    type: 'select' as FormFieldType,
    options: items,
  },
  {
    name: 'unit_of_measure',
    label: 'Unit of Measure',
    type: 'select' as FormFieldType,
    options: uoms,
    disabled: true,
  },
  {
    name: 'total_actual_qty',
    label: 'Total Actual Quantity',
    type: 'number' as FormFieldType,
    disabled: true,
  },
  {
    name: 'total_avail_qty',
    label: 'Total Available Quantity',
    type: 'number' as FormFieldType,
    disabled: true,
  },
  {
    name: 'quantity_required',
    label: 'Quantity Required',
    type: 'number' as FormFieldType,
  },
  {
    name: 'quantity_issued',
    label: 'Quantity Issued',
    type: 'number' as FormFieldType,
  },
  {
    name: 'quantity_returned',
    label: 'Quantity Returned',
    type: 'number' as FormFieldType,
  },
  {
    name: 'date_required',
    label: 'Date Required',
    type: 'date' as FormFieldType,
  },
]

export const WorkOrderPartsIssueFormFields = [
  {
    name: 'work_order_parts',
    label: 'Work Order Parts',
    type: 'select' as FormFieldType,
    options: [],
  },
  // {
  //   name: 'item_id',
  //   label: 'Item',
  //   type: 'select' as FormFieldType,
  //   options: items,
  //   disabled: true,
  // },
  {
    name: 'inventory',
    label: 'Inventory',
    type: 'select' as FormFieldType,
    options: inventory,
  },
  {
    name: 'remaining_actual_quantity',
    label: 'Remaining Actual Quantity',
    type: 'number' as FormFieldType,
    disabled: true,
  },
  {
    name: 'date_issued',
    label: 'Date Issued',
    type: 'datetime' as FormFieldType,
  },
  {
    name: 'quantity_issued',
    label: 'Quantity Issued',
    type: 'number' as FormFieldType,
  },
  // {
  //   name: 'status',
  //   label: 'Status',
  //   type: 'select' as FormFieldType,
  //   options: [
  //     { label: 'Pending', value: 'Pending' },
  //     { label: 'Completed', value: 'Completed' },
  //     { label: 'Failed', value: 'Failed' },
  //     { label: 'In Progress', value: 'In Progress' },
  //   ],
  // },
]

export const WorkOrderPartsReturnFormFields = [
  {
    name: 'work_order_parts',
    label: 'Work Order Parts',
    type: 'select' as FormFieldType,
    options: [],
  },
  {
    name: 'item',
    label: 'Item',
    type: 'select' as FormFieldType,
    options: items,
    disabled: true,
  },
  {
    name: 'unit_of_measure',
    label: 'Unit of Measure',
    type: 'select' as FormFieldType,
    options: uoms,
    disabled: true,
  },
  {
    name: 'inventory',
    label: 'Inventory',
    type: 'select' as FormFieldType,
    options: inventory,
  },
  {
    name: 'date_returned',
    label: 'Date Returned',
    type: 'datetime' as FormFieldType,
  },
  {
    name: 'quantity_returned',
    label: 'Quantity Returned',
    type: 'number' as FormFieldType,
  },
]

export const WorkOrderPartsReservationFormFields = [
  {
    name: 'work_order_parts',
    label: 'Work Order Parts',
    type: 'select' as FormFieldType,
    options: [],
  },
  {
    name: 'item',
    label: 'Item',
    type: 'select' as FormFieldType,
    options: items,
  },
  {
    name: 'unit_of_measure',
    label: 'Unit of Measure',
    type: 'select' as FormFieldType,
    options: uoms,
    disabled: true,
  },
  {
    name: 'inventory',
    label: 'Inventory',
    type: 'select' as FormFieldType,
    options: [],
  },
  {
    name: 'date_reserved',
    label: 'Date Reserved',
    type: 'datetime' as FormFieldType,
  },
  {
    name: 'quantity_reserved',
    label: 'Quantity Reserved',
    type: 'number' as FormFieldType,
  },
]

export const WorkOrderLaborFormFields = [
  {
    name: 'work_order_activity',
    label: 'Work Order Activity',
    type: 'select' as FormFieldType,
    options: workOrderActivities,
  },
  // {
  //   name: 'work_order_activity_desc',
  //   label: 'Work Order Activity Description',
  //   type: 'textarea' as FormFieldType,
  // },
  {
    name: 'trade',
    label: 'Trade',
    type: 'select' as FormFieldType,
    options: trade,
  },
  // {
  //   name: 'trade_name',
  //   label: 'Trade Name',
  //   type: 'input' as FormFieldType,
  // },
  {
    name: 'start_date',
    label: 'Start Date',
    type: 'date' as FormFieldType,
  },
  {
    name: 'estimated_hours',
    label: 'Estimated Hours',
    type: 'number' as FormFieldType,
  },
  {
    name: 'total_hours_used',
    label: 'Total Hours Used',
    type: 'number' as FormFieldType,
  },
]

export const WorkOrderLaborAssignmentFormFields = [
  {
    name: 'work_order_labor',
    label: 'Work Order Labor',
    type: 'select' as FormFieldType,
    options: [],
  },
  {
    name: 'start_datetime',
    label: 'Start Date',
    type: 'datetime' as FormFieldType,
  },
  {
    name: 'end_datetime',
    label: 'End Date',
    type: 'datetime' as FormFieldType,
  },
  {
    name: 'labor',
    label: 'Labor',
    type: 'select' as FormFieldType,
    options: employee,
  },
  {
    name: 'hours_used',
    label: 'Hours Used',
    type: 'number' as FormFieldType,
  },
]

export const WorkOrderChecklistFormFields = [
  {
    name: 'work_order_activity',
    label: 'Work Order Activity',
    type: 'select' as FormFieldType,
    options: workOrderActivities,
  },
  {
    name: 'checklist',
    label: 'Checklist',
    type: 'select' as FormFieldType,
    options: checklist,
  },
  {
    name: 'inspector_id',
    label: 'Inspector ID',
    type: 'input' as FormFieldType,
  },
  {
    name: 'inspector_name',
    label: 'Inspector Name',
    type: 'input' as FormFieldType,
  },
  {
    name: 'inspection_date',
    label: 'Inspection Date',
    type: 'date' as FormFieldType,
  },
  {
    name: 'remarks',
    label: 'Remarks',
    type: 'textarea' as FormFieldType,
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select' as FormFieldType,
    options: [
      { label: 'Pending', value: 'Pending' },
      { label: 'Completed', value: 'Completed' },
      { label: 'Failed', value: 'Failed' },
      { label: 'In Progress', value: 'In Progress' },
    ],
  },
]

export const WorkOrderActivityLogsFormFields = [
  {
    name: 'work_order_activity',
    label: 'Work Order Activity',
    type: 'select' as FormFieldType,
    options: workOrderActivities,
  },
  {
    name: 'date',
    label: 'Date',
    type: 'date' as FormFieldType,
  },
  {
    name: 'log',
    label: 'Log',
    type: 'textarea' as FormFieldType,
  },
]
