import { ref } from 'vue'
import { frappeDB, frappeCall } from '@/composables/useFrappeSDK'
import {
  Contractor,
  Employee,
  Labor,
  Trade,
  Manufacturer,
  Model,
} from '../../types/Core'

const contractor = ref<{ label: string; value: string }[]>([])
const loadContractorOptions = async () => {
  try {
    const response = await frappeDB.getDocList('Contractor', {
      fields: ['*'],
    })
    if (response && response.length > 0) {
      contractor.value = response.map((m: Contractor) => ({
        label: m.contractor_name || m.name,
        value: m.name,
      }))
    }
  } catch (error) {
    console.error('Error loading contractors:', error)
  }
}
loadContractorOptions()

const employee = ref<{ label: string; value: string }[]>([])
const loadEmployeeOptions = async () => {
  try {
    const response = await frappeDB.getDocList('Employee', {
      fields: ['*'],
    })
    if (response && response.length > 0) {
      employee.value = response.map((m: Employee) => ({
        label: m.employee_name || m.name,
        value: m.name,
      }))
    }
  } catch (error) {
    console.error('Error loading employees:', error)
  }
}
loadEmployeeOptions()

const labor = ref<{ label: string; value: string }[]>([])
const loadLaborOptions = async () => {
  try {
    const response = await frappeDB.getDocList('Labor', {
      fields: ['*'],
    })
    if (response && response.length > 0) {
      labor.value = response.map((m: Labor) => ({
        label: m.labor_type || m.name,
        value: m.name,
      }))
    }
  } catch (error) {
    console.error('Error loading labors:', error)
  }
}
loadLaborOptions()

const trade = ref<{ label: string; value: string }[]>([])
const loadTradeOptions = async () => {
  try {
    const response = await frappeDB.getDocList('Trade', {
      fields: ['*'],
    })
    if (response && response.length > 0) {
      trade.value = response.map((m: Trade) => ({
        label: m.trade_name || m.name,
        value: m.name,
      }))
    }
  } catch (error) {
    console.error('Error loading trades:', error)
  }
}
loadTradeOptions()

const manufacturer = ref<{ label: string; value: string }[]>([])
const loadManufacturerOptions = async () => {
  try {
    const response = await frappeDB.getDocList('Manufacturer', {
      fields: ['*'],
    })
    if (response && response.length > 0) {
      manufacturer.value = response.map((m: Manufacturer) => ({
        label: m.company_name || m.name,
        value: m.name,
      }))
    }
  } catch (error) {
    console.error('Error loading manufacturers:', error)
  }
}
loadManufacturerOptions()

const model = ref<{ label: string; value: string }[]>([])
const loadModelOptions = async () => {
  try {
    const response = await frappeDB.getDocList('Model', {
      fields: ['*'],
    })
    if (response && response.length > 0) {
      model.value = response.map((m: Model) => ({
        label: m.name1 || m.name,
        value: m.name,
      }))
    }
  } catch (error) {
    console.error('Error loading models:', error)
  }
}
loadModelOptions()

export { contractor, employee, labor, trade, manufacturer, model }
