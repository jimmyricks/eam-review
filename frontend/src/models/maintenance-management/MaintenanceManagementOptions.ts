import { ref } from 'vue'
import MaintenanceManagementAPI from '../../services/MaintenanceManagementAPI'
import {
  MaintenancePlan,
  MaintenanceActivity,
  PlannedMaintenanceActivity,
  MaintenanceSchedule,
  Checklist,
} from '../../types/Maintenance'

const maintenancePlan = ref<{ label: string; value: string }[]>([])
const loadMaintenancePlanOptions = async () => {
  try {
    const response = await MaintenanceManagementAPI.getMaintenancePlans([])
    if (response && response.length > 0) {
      maintenancePlan.value = response.map((m: MaintenancePlan) => ({
        label: m.name, // Display Name
        value: m.name, // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading maintenance plans:', error)
  }
}
loadMaintenancePlanOptions()

const maintenanceActivity = ref<{ label: string; value: string }[]>([])
const loadMaintenanceActivityOptions = async () => {
  try {
    const response = await MaintenanceManagementAPI.getMaintenanceActivities([])
    if (response && response.length > 0) {
      maintenanceActivity.value = response.map((m: MaintenanceActivity) => ({
        label: m.activity_name, // Display Name
        value: m.name, // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading maintenance activities:', error)
  }
}
loadMaintenanceActivityOptions()

const plannedMaintenanceActivity = ref<{ label: string; value: string }[]>([])
const loadPlannedMaintenanceActivityOptions = async () => {
  try {
    const response =
      await MaintenanceManagementAPI.getPlannedMaintenanceActivities([])
    if (response && response.length > 0) {
      plannedMaintenanceActivity.value = response.map(
        (m: PlannedMaintenanceActivity) => ({
          label: `${m.name} (${m.maintenance_plan_name}, ${m.maintenance_activity_name}, ${m.checklist ? m.checklist : ''}, ${m.maintenance_type})`, // Display Name
          value: m.name, // Save ID
        }),
      )
    }
  } catch (error) {
    console.error('Error loading planned maintenance activities:', error)
  }
}
loadPlannedMaintenanceActivityOptions()

const maintenanceSchedule = ref<{ label: string; value: string }[]>([])
const loadMaintenanceScheduleOptions = async () => {
  try {
    const response = await MaintenanceManagementAPI.getMaintenanceSchedules([])
    if (response && response.length > 0) {
      maintenanceSchedule.value = response.map((m: MaintenanceSchedule) => ({
        label: `${m.name} (${m.asset_name}, ${new Date(m.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})`, // Display Name
        value: m.name, // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading maintenance schedules:', error)
  }
}
loadMaintenanceScheduleOptions()

const checklist = ref<{ label: string; value: string }[]>([])
const loadChecklistOptions = async () => {
  try {
    const response = await MaintenanceManagementAPI.getChecklists([])
    if (response && response.length > 0) {
      checklist.value = response.map((m: Checklist) => ({
        label: m.checklist_name || '', // Display Name
        value: m.name, // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading checklists:', error)
  }
}
loadChecklistOptions()

export {
  maintenancePlan,
  maintenanceActivity,
  plannedMaintenanceActivity,
  maintenanceSchedule,
  checklist,
}
