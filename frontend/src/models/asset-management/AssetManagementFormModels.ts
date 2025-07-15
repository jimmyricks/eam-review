import {
  location,
  assetClass,
  system,
  property,
  propertyType,
  position,
  systemType,
  equipment,
  asset,
} from './AssetManagementOptions'
import { manufacturer, model } from '../core/CoreOptions'
import { inventory, stores, uoms } from '../purchase-store/PurchaseStoreOptions'

type FormFieldType =
  | 'number'
  | 'input'
  | 'select'
  | 'textarea'
  | 'checkbox'
  | 'date'
  | 'datetime'

// Exports
export const AssetFormFields = [
  {
    name: 'asset_tag',
    label: 'Asset Tag',
    type: 'input' as FormFieldType,
    required: true,
  },
  {
    name: 'series',
    label: 'Series',
    type: 'input' as FormFieldType,
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea' as FormFieldType,
  },
  {
    name: 'date_purchased',
    label: 'Purchase Date',
    type: 'date' as FormFieldType,
  },
  {
    name: 'manufacturer',
    label: 'Manufacturer',
    type: 'select' as FormFieldType,
    options: manufacturer,
  },
  {
    name: 'serial_number',
    label: 'Serial Number',
    type: 'input' as FormFieldType,
  },
  {
    name: 'model',
    label: 'Model',
    type: 'select' as FormFieldType,
    options: model,
  },
  {
    name: 'block_number',
    label: 'Block Number',
    type: 'number' as FormFieldType,
  },
  {
    name: 'cost',
    label: 'Cost',
    type: 'number' as FormFieldType,
  },
  {
    name: 'number_of_repairs',
    label: 'Number of Repairs',
    type: 'number' as FormFieldType,
  },
  {
    name: 'location',
    label: 'Location',
    type: 'select' as FormFieldType,
    options: location,
    required: true,
    disabled: false,
  },
  {
    name: 'asset_class',
    label: 'Asset Class',
    type: 'select' as FormFieldType,
    options: assetClass,
    required: true,
  },
  {
    name: 'system',
    label: 'System',
    type: 'select' as FormFieldType,
    options: system,
  },
  {
    name: 'inventory',
    label: 'Inventory',
    type: 'input' as FormFieldType,
    disabled: true,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const AssetClassFormFields = [
  {
    name: 'class_name',
    label: 'Class Name',
    type: 'input' as FormFieldType,
    disabled: false,
  },
  {
    name: 'due_date_lead_time',
    label: 'Due Date Lead Time',
    type: 'number' as FormFieldType,
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea' as FormFieldType,
  },
  // {
  //   name: 'class_icon',
  //   label: 'Class Icon',
  //   type: 'input' as FormFieldType,
  // },
  {
    name: 'parent_asset_class_id',
    label: 'Parent Asset Class ID',
    type: 'select' as FormFieldType,
    options: assetClass,
  },
  {
    name: 'available_capacity',
    label: 'Available Capacity',
    type: 'number' as FormFieldType,
  },
  {
    name: 'equipment',
    label: 'Equipment',
    type: 'checkbox' as FormFieldType,
  },
  {
    name: 'is_asset_item',
    label: 'Is Asset Item',
    type: 'checkbox' as FormFieldType,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const AssetClassPropertyFormFields = [
  {
    name: 'asset_class',
    label: 'Asset Class',
    type: 'select' as FormFieldType,
    options: assetClass,
  },
  {
    name: 'property',
    label: 'Property',
    type: 'select' as FormFieldType,
    options: property,
  },
  {
    name: 'default_value',
    label: 'Default Value',
    type: 'input' as FormFieldType,
  },
].map((field) => ({ ...field, disabled: field.disabled || false })) // Ensure disabled is set correctly

export const AssetPropertyFormFields = [
  {
    name: 'asset',
    label: 'Asset',
    type: 'select' as FormFieldType,
    options: [],
    disabled: true,
  },
  {
    name: 'property',
    label: 'Property',
    type: 'select' as FormFieldType,
    options: property, // only active
  },
  {
    name: 'property_value',
    label: 'Property Value',
    type: 'input' as FormFieldType,
  },
  {
    name: 'unit_of_measure',
    label: 'Unit of Measure',
    type: 'select' as FormFieldType,
    options: uoms,
    disabled: true,
  },
  // {
  //   name: 'property_type',
  //   label: 'Property Type',
  //   type: 'select',
  //   options: propertyType,
  // },
].map((field) => ({ ...field, disabled: field.disabled || false }))

export const PositionFormFields = [
  {
    name: 'description',
    label: 'Description',
    type: 'textarea' as FormFieldType,
  },
  {
    name: 'position_tag',
    label: 'Position Tag',
    type: 'input' as FormFieldType,
  },
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
    name: 'current_asset_id',
    label: 'Current Asset ID',
    type: 'select' as FormFieldType,
    options: [],
    disabled: true,
  },
].map((field) => ({ ...field, disabled: field.disabled || false }))

export const AssetPositionFormFields = [
  {
    name: 'position',
    label: 'Position',
    type: 'select' as FormFieldType,
    options: position,
  },
  {
    name: 'asset',
    label: 'Asset',
    type: 'select' as FormFieldType,
    options: asset, // options depend on position's asset class
  },
  {
    name: 'asset_name',
    label: 'Asset Name',
    type: 'input' as FormFieldType,
    hidden: true, // This field will be automatically populated
  },
  {
    name: 'date_installed',
    label: 'Date Installed',
    type: 'date' as FormFieldType,
    required: true,
  },
  {
    name: 'date_removed',
    label: 'Date Removed',
    type: 'date' as FormFieldType,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false }))

export const PositionRelationFormFields = [
  {
    name: 'position_a',
    label: 'Position A',
    type: 'select' as FormFieldType,
    options: position,
  },
  {
    name: 'position_relation_type',
    label: 'Position Relation Type',
    type: 'select' as FormFieldType,
    options: [
      { label: 'Connected to', value: 'Connected to' },
      { label: 'is Parent of', value: 'is Parent of' },
      { label: 'Linked to', value: 'Linked to' },
    ],
  },
  {
    name: 'position_b',
    label: 'Position B',
    type: 'select' as FormFieldType,
    options: position,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false }))

export const EquipmentFormFields = [
  {
    name: 'equipment_type',
    label: 'Equipment Type',
    type: 'select' as FormFieldType,
    options: [
      { label: 'Owned', value: 'Owned' },
      { label: 'Rented', value: 'Rented' },
    ],
  },
  // {
  //   name: 'equipment_group',
  //   label: 'Equipment Group',
  //   type: 'select' as FormFieldType,
  // },
  {
    name: 'asset',
    label: 'Asset',
    type: 'select' as FormFieldType,
    options: asset,
  },
  {
    name: 'location',
    label: 'Location',
    type: 'select' as FormFieldType,
    options: location,
    disabled: false,
  },
  {
    name: 'pr_line_no',
    label: 'PR Line No',
    type: 'select' as FormFieldType,
    options: [],
  },
  // fix show hide and query
].map((field) => ({ ...field, disabled: field.disabled || false }))

export const EquipmentScheduleFormFields = [
  {
    name: 'schedule_name',
    label: 'Schedule Name',
    type: 'input' as FormFieldType,
  },
  // {
  //   name: 'equipment_group',
  //   label: 'Equipment Group',
  //   type: 'select' as FormFieldType,
  //   options: [
  //     { label: 'Group 1', value: '1' },
  //     // Add other equipment groups if necessary
  //   ],
  // },
  {
    name: 'specific_equipment',
    label: 'Specific Equipment',
    type: 'select' as FormFieldType,
    options: equipment,
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
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false }))

export const EquipmentGroupFormFields = [
  {
    name: 'asset_grp_name',
    label: 'Equipment Group Name',
    type: 'input' as FormFieldType,
  },
]

export const EquipmentAvailabilityFormFields = [
  {
    name: 'equipment',
    label: 'Equipment',
    type: 'select' as FormFieldType,
    options: equipment,
  },
  {
    name: 'date',
    label: 'Date',
    type: 'date' as FormFieldType,
  },
]

export const BreakdownFormFields = [
  {
    name: 'equipment',
    label: 'Equipment',
    type: 'select' as FormFieldType,
    options: equipment,
  },
  {
    name: 'breakdown_date',
    label: 'Breakdown Date',
    type: 'date' as FormFieldType,
  },
  {
    name: 'start_time',
    label: 'Start Time',
    type: 'time' as FormFieldType,
  },
  {
    name: 'end_time',
    label: 'End Time',
    type: 'time' as FormFieldType,
  },
  {
    name: 'cause',
    label: 'Cause',
    type: 'textarea' as FormFieldType,
  },
]

export const PropertyFormFields = [
  {
    name: 'property_name',
    label: 'Property Name',
    type: 'input' as FormFieldType,
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea' as FormFieldType,
  },
  {
    name: 'unit_of_measure',
    label: 'Unit of Measure',
    type: 'select' as FormFieldType,
    options: uoms, // error with the display name
  },
  {
    name: 'property_type',
    label: 'Property Type',
    type: 'select' as FormFieldType,
    options: [
      { label: 'Decimal', value: '1' },
      // Add other property types if necessary
    ],
  },
  {
    name: 'system',
    label: 'System',
    type: 'checkbox' as FormFieldType,
  },
  {
    name: 'inactive',
    label: 'Inactive',
    type: 'checkbox' as FormFieldType,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false }))

export const SystemFormFields = [
  {
    name: 'name1',
    label: 'System Name',
    type: 'input' as FormFieldType,
  },
  {
    name: 'system_type',
    label: 'System Type',
    type: 'select' as FormFieldType,
    options: systemType,
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea' as FormFieldType,
  },
  {
    name: 'parent_system_id',
    label: 'Parent System ID',
    type: 'select' as FormFieldType,
    options: system,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false }))

export const LocationFormFields = [
  {
    name: 'name1',
    label: 'Name',
    type: 'input' as FormFieldType,
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea' as FormFieldType,
  },
  {
    name: 'latitude',
    label: 'Latitude',
    type: 'number' as FormFieldType,
  },
  {
    name: 'longitude',
    label: 'Longitude',
    type: 'number' as FormFieldType,
  },
  {
    name: 'address',
    label: 'Address',
    type: 'textarea' as FormFieldType,
  },
  {
    name: 'store',
    label: 'Store',
    type: 'select' as FormFieldType,
    options: stores,
  },
  {
    name: 'location_type',
    label: 'Location Type',
    type: 'select' as FormFieldType,
  },
  {
    name: 'parent_location',
    label: 'Parent Location',
    type: 'select' as FormFieldType,
    options: location,
  },
  {
    name: 'is_group',
    label: 'Is Group',
    type: 'checkbox' as FormFieldType,
    disabled: false,
  },
].map((field) => ({ ...field, disabled: field.disabled || false }))
