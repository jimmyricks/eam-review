import { manufacturer, contractor, employee } from './CoreOptions'

export const ContractorFormFields = [
  {
    name: 'contractor_name',
    label: 'Contractor Name',
    type: 'input',
    required: true,
  },
]

export const EmployeeFormFields = [
  {
    name: 'employee_name',
    label: 'Employee Name',
    type: 'input',
    required: true,
  },
]

export const LaborFormFields = [
  {
    name: 'labor_type',
    label: 'Labor Type',
    type: 'select',
    options: [
      { label: 'Contractor', value: 'Contractor' },
      { label: 'Employee', value: 'Employee' },
    ],
  },
  // {
  //   name: 'labor_group',
  //   label: 'Labor Group',
  //   type: 'select',
  // },
  {
    name: 'employee',
    label: 'Employee',
    type: 'select',
    options: employee,
  },
  {
    name: 'location',
    label: 'Location',
    type: 'select',
  },
  {
    name: 'contractor',
    label: 'Contractor',
    type: 'select',
    options: contractor,
  },
  {
    name: 'pr_line_no',
    label: 'PR Line No',
    type: 'number',
  },
]

export const TradeFormFields = [
  {
    name: 'trade_name',
    label: 'Trade Name',
    type: 'input',
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
  },
  {
    name: 'available_capacity',
    label: 'Available Capacity',
    type: 'number',
  },
  {
    name: 'on_staff',
    label: 'On Staff',
    type: 'checkbox',
  },
  {
    name: 'licensed',
    label: 'Licensed',
    type: 'checkbox',
  },
]

export const TradeAvailabilityFormFields = [
  {
    name: 'trade',
    label: 'Trade',
    type: 'select',
    options: [],
    disabled: true,
  },
  {
    name: 'specific_datetime',
    label: 'Specific Datetime',
    type: 'datetime',
  },
  {
    name: 'remaining_capacity',
    label: 'Remaining Capacity',
    type: 'number',
  },
  {
    name: 'reserved_capacity',
    label: 'Reserved Capacity',
    type: 'number',
  },
  {
    name: 'available_capacity',
    label: 'Available Capacity',
    type: 'number',
  },
  {
    name: 'ordered_capacity',
    label: 'Ordered Capacity',
    type: 'number',
  },
]

export const ManufacturerFormFields = [
  {
    name: 'company_name',
    label: 'Manufacturer Name',
    type: 'input',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'input',
  },
]

export const ModelFormFields = [
  {
    name: 'name1',
    label: 'Model Name 1',
    type: 'input',
  },
  {
    name: 'manufacturer',
    label: 'Manufacturer',
    type: 'select',
    options: manufacturer,
  },
]

export const WorkScheduleFormFields = [
  {
    name: 'schedule_name',
    label: 'Schedule Name',
    type: 'input',
  },
  // {
  //   name: 'applicable_to_labor_group',
  //   label: 'Applicable to Labor Group',
  //   type: 'select',
  // },
  {
    name: 'specific_labor',
    label: 'Specific Labor',
    type: 'select',
  },
  // {
  //   name: 'laborer',
  //   label: 'Laborer',
  //   type: 'select',
  //   disabled: true,
  // },
  {
    name: 'start_date',
    label: 'Start Date',
    type: 'date',
  },
  {
    name: 'end_date',
    label: 'End Date',
    type: 'date',
  },
  // use naive ui daterange
]

export const LeaveApplicationFormFields = [
  {
    name: 'labor',
    label: 'Labor',
    type: 'select',
  },
  {
    name: 'leave_type',
    label: 'Leave Type',
    type: 'select',
  },
  {
    name: 'from_date',
    label: 'From Date',
    type: 'date',
  },
  {
    name: 'to_date',
    label: 'To Date',
    type: 'date',
  },
  {
    name: 'reason',
    label: 'Reason',
    type: 'textarea',
  },
]

export const HolidayFormFields = [
  {
    name: 'holiday_name',
    label: 'Holiday Name',
    type: 'input',
  },
  {
    name: 'holiday_date',
    label: 'Holiday Date',
    type: 'date',
  },
  // {
  //   name: 'applicable_to_labor_grp',
  //   label: 'Applicable to Labor Grp',
  //   type: 'select',
  // },
  {
    name: 'specific_labor',
    label: 'Specific Labor',
    type: 'select',
  },
]
