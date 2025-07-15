import {
  maintenanceActivity,
  maintenancePlan,
  plannedMaintenanceActivity,
  maintenanceSchedule,
} from './MaintenanceManagementOptions'

import {
  asset,
  assetClass,
  assetClassEquipment,
  location,
  system,
} from '../asset-management/AssetManagementOptions'
import { model, manufacturer, employee, trade } from '../core/CoreOptions'
import { items } from '../purchase-store/PurchaseStoreOptions'

type FormFieldType =
  | 'number'
  | 'input'
  | 'select'
  | 'textarea'
  | 'checkbox'
  | 'date'
  | 'datetime'

export const MaintenanceActivityFormFields = [
  {
    name: 'activity_name',
    label: 'Maintenance Activity Name',
    type: 'input' as FormFieldType,
  },
  {
    name: 'date',
    label: 'Date',
    type: 'date' as FormFieldType,
    disabled: false,
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea' as FormFieldType,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const MaintenancePlanFormFields = [
  {
    name: 'asset_class',
    label: 'Asset Class',
    type: 'select' as FormFieldType,
    options: assetClass,
  },
  {
    name: 'manufacturer',
    label: 'Manufacturer',
    type: 'select' as FormFieldType,
    options: manufacturer,
  },
  {
    name: 'model',
    label: 'Model',
    type: 'select' as FormFieldType,
    options: model,
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea' as FormFieldType,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const PlannedMaintenanceActivityFormFields = [
  {
    name: 'maintenance_plan',
    label: 'Maintenance Plan',
    type: 'select' as FormFieldType,
    options: maintenancePlan,
  },
  {
    name: 'maintenance_activity',
    label: 'Maintenance Activity',
    type: 'select' as FormFieldType,
    options: maintenanceActivity,
  },
  {
    name: 'checklist',
    label: 'Checklist',
    type: 'select' as FormFieldType,
    required: false,
  },
  {
    name: 'maintenance_type',
    label: 'Maintenance Type',
    type: 'select' as FormFieldType,
    options: [
      {
        label: 'Preventative',
        value: 'Preventative',
      },
      {
        label: 'Corrective',
        value: 'Corrective',
      },
      {
        label: 'Predictive',
        value: 'Predictive',
      },
    ],
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const MaintenanceRequestFormFields = [
  {
    name: 'requestor',
    label: 'Requestor',
    type: 'select' as FormFieldType,
    options: employee,
  },
  {
    name: 'planned_maintenance_activity',
    label: 'Planned Maintenance Activity',
    type: 'select' as FormFieldType,
    options: plannedMaintenanceActivity,
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea' as FormFieldType,
  },
  {
    name: 'asset',
    label: 'Asset',
    type: 'select' as FormFieldType,
    options: asset,
  },
  {
    name: 'request_date',
    label: 'Request Date',
    type: 'date' as FormFieldType,
  },
]

export const MaintenanceIntervalFormFields = [
  {
    name: 'planned_maintenance_activity',
    label: 'Planned Maintenance Activity',
    type: 'select' as FormFieldType,
    options: plannedMaintenanceActivity,
  },
  {
    name: 'maintenance_plan',
    label: 'Maintenance Plan',
    type: 'select' as FormFieldType,
    options: maintenancePlan,
  },
  {
    name: 'maintenance_activity',
    label: 'Maintenance Activity',
    type: 'select' as FormFieldType,
    options: maintenanceActivity,
  },
  {
    name: 'lead_interval',
    label: 'Lead Interval',
    type: 'number' as FormFieldType,
  },
  {
    name: 'interval',
    label: 'Interval',
    type: 'number' as FormFieldType,
  },
  {
    name: 'interval_unit_of_measure',
    label: 'Interval Unit of Measure',
    type: 'select' as FormFieldType,
  },
  {
    name: 'running_interval_property',
    label: 'Running Interval Property',
    type: 'select' as FormFieldType,
  },
  {
    name: 'last_interval_property',
    label: 'Last Interval Property',
    type: 'select' as FormFieldType,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const MaintenanceScheduleFormFields = [
  {
    name: 'planned_maintenance_activity',
    label: 'Planned Maintenance Activity',
    type: 'select' as FormFieldType,
    options: plannedMaintenanceActivity,
  },
  {
    name: 'asset',
    label: 'Asset',
    type: 'select' as FormFieldType,
    options: asset,
  },
  {
    name: 'next_maintenance_schedule',
    label: 'Next Maintenance Schedule',
    type: 'date' as FormFieldType,
  },
  {
    name: 'due_date',
    label: 'Due Date',
    type: 'date' as FormFieldType,
  },
  {
    name: 'closed_date',
    label: 'Closed Date',
    type: 'date' as FormFieldType,
  },
  {
    name: 'work_order_activity',
    label: 'Work Order Activity',
    type: 'select' as FormFieldType,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const MaintenanceOrderFormFields = [
  {
    name: 'asset_class',
    label: 'Asset Class',
    type: 'select' as FormFieldType,
    options: assetClass,
  },
  {
    name: 'location',
    label: 'Location',
    type: 'select' as FormFieldType,
    options: location,
  },
  {
    name: 'system',
    label: 'System',
    type: 'select' as FormFieldType,
    options: system,
  },
  {
    name: 'date_from',
    label: 'Date From',
    type: 'date' as FormFieldType,
    required: true,
  },
  // add new ui
  {
    name: 'date_to',
    label: 'Date To',
    type: 'date' as FormFieldType,
    required: true,
  },

  {
    name: 'work_order',
    label: 'Work Order',
    type: 'select' as FormFieldType,
    disabled: true,
    // hidden: true,
  },
  {
    name: 'asset',
    label: 'Asset',
    type: 'select' as FormFieldType,
    options: asset,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const MaintenanceTradeFormFields = [
  {
    name: 'maintenance_activity',
    label: 'Maintenance Activity',
    type: 'select' as FormFieldType,
    options: maintenanceActivity,
  },
  {
    name: 'trade',
    label: 'Trade',
    type: 'select' as FormFieldType,
    options: trade,
  },
  {
    name: 'required_qty',
    label: 'Required Quantity',
    type: 'number' as FormFieldType,
  },
  {
    name: 'required_hours',
    label: 'Required Hours',
    type: 'number' as FormFieldType,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const MaintenancePartsFormFields = [
  {
    name: 'maintenance_activity',
    label: 'Maintenance Activity',
    type: 'select' as FormFieldType,
    options: maintenanceActivity,
  },
  {
    name: 'item',
    label: 'Item',
    type: 'select' as FormFieldType,
    options: items,
  },
  {
    name: 'quantity',
    label: 'Quantity',
    type: 'number' as FormFieldType,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const MaintenanceEquipmentFormFields = [
  {
    name: 'maintenance_activity',
    label: 'Maintenance Activity',
    type: 'select' as FormFieldType,
    options: maintenanceActivity,
  },
  {
    name: 'asset_class',
    label: 'Asset Class',
    type: 'select' as FormFieldType,
    options: assetClassEquipment,
  },
  {
    name: 'required_qty',
    label: 'Required Quantity',
    type: 'number' as FormFieldType,
  },
  {
    name: 'required_hours',
    label: 'Required Hours',
    type: 'number' as FormFieldType,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const ChecklistFormFields = [
  {
    name: 'checklist_name',
    label: 'Checklist Name',
    type: 'input' as FormFieldType,
  },
  {
    name: 'checklist_type',
    label: 'Checklist Type',
    type: 'select' as FormFieldType,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const MaintenanceConditionFormFields = [
  {
    name: 'planned_maintenance_activity',
    label: 'Planned Maintenance Activity',
    type: 'select' as FormFieldType,
  },
  {
    name: 'condition',
    label: 'Condition',
    type: 'select' as FormFieldType,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const MaintenanceCalendarFormFields = [
  {
    name: 'planned_maintenance_activity',
    label: 'Planned Maintenance Activity',
    type: 'select' as FormFieldType,
  },
  {
    name: 'asset',
    label: 'Asset',
    type: 'select' as FormFieldType,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly
