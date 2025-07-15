import { ref, watch } from 'vue'
import AssetManagementAPI, { frappeDB } from '../../services/AssetManagementAPI'
import {
  Assets,
  Position,
  Location,
  AssetClass,
  System,
  AssetClassProperty,
  Property,
  SystemType,
  Equipment,
} from '../../types/Assets'

const asset = ref<
  { label: string; value: string; filter?: { asset_class: string } }[]
>([])
const loadAssetOptions = async () => {
  try {
    const response = await AssetManagementAPI.getAssets()
    if (response && response.length > 0) {
      asset.value = response.map((m: Assets) => {
        const mappedAsset = {
          label: `${m.description} (${m.name}, ${m.asset_class_name}, ${m.location}, ${m.system ?? 'No System'})`,
          value: m.name,
          filter: {
            asset_class: m.asset_class,
          },
        }
        return mappedAsset
      })
    }
  } catch (error) {
    console.error('Error loading assets:', error)
  }
}
loadAssetOptions()

const position = ref<{ label: string; value: string }[]>([])
const loadPositionOptions = async () => {
  try {
    const response = await AssetManagementAPI.getPositions()
    if (response && response.length > 0) {
      position.value = response.map((m: Position) => ({
        label: `${m.description} (${m.name}, ${m.asset_class_name}, ${m.location_name}, ${m.system_name})`,
        value: m.name, // Save ID
        filter: {
          asset_class: m.asset_class,
          location: m.location,
          system: m.system,
        },
      }))
    }
  } catch (error) {
    console.error('Error loading positions:', error)
  }
}
loadPositionOptions()

const location = ref<{ label: string; value: string }[]>([])
const loadLocationOptions = async () => {
  try {
    const response = await AssetManagementAPI.getLocations([])
    if (response && response.length > 0) {
      location.value = response.map((m: Location) => ({
        label: m.name1 || m.name, // Display Name
        value: m.name, // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading locations:', error)
  }
}
loadLocationOptions()

const assetClass = ref<{ label: string; value: string }[]>([])
const loadAssetClassOptions = async () => {
  try {
    const response = await AssetManagementAPI.getAssetClasses([])
    if (response && response.length > 0) {
      assetClass.value = response.map((m: AssetClass) => ({
        label: m.class_name, // Display Name
        value: m.name, // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading asset classes:', error)
  }
}
loadAssetClassOptions()

const system = ref<{ label: string; value: string }[]>([])
const loadSystemOptions = async () => {
  try {
    const response = await AssetManagementAPI.getSystems([])
    if (response && response.length > 0) {
      system.value = response.map((m: System) => ({
        label: m.name1, // Display Name
        value: m.name, // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading systems:', error)
  }
}
loadSystemOptions()

const assetClassProperty = ref<{ label: string; value: string }[]>([])
const loadAssetClassPropertyOptions = async () => {
  try {
    const response = await AssetManagementAPI.getAssetClassProperties([])
    if (response && response.length > 0) {
      assetClassProperty.value = response.map((m: AssetClassProperty) => ({
        label: m.property_name, // Display Name
        value: m.name, // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading asset class properties:', error)
  }
}
loadAssetClassPropertyOptions()

const property = ref<{ label: string; value: string }[]>([])
const loadPropertyOptions = async () => {
  try {
    const response = await AssetManagementAPI.getProperties([])

    if (response && response.length > 0) {
      property.value = response.map((m: Property) => ({
        label: m.property_name, // Display Name
        value: m.name, // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading properties:', error)
  }
}
loadPropertyOptions()

const propertyType = ref<{ label: string; value: string }[]>([])
const loadPropertyTypeOptions = async () => {
  try {
    const response = await AssetManagementAPI.getProperties([])
    if (response && response.length > 0) {
      propertyType.value = response.map((m: PropertyType) => ({
        label: m.property_type_name, // Display Name
        value: m.name, // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading property types:', error)
  }
}
loadPropertyTypeOptions()

const systemType = ref<{ label: string; value: string }[]>([])
const loadSystemTypeOptions = async () => {
  try {
    const response = await AssetManagementAPI.getSystemTypes([])
    if (response && response.length > 0) {
      systemType.value = response.map((m: SystemType) => ({
        label: m.system_type_name, // Display Name
        value: m.name, // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading system types:', error)
  }
}
loadSystemTypeOptions()

const equipment = ref<{ label: string; value: string }[]>([])
const loadEquipmentOptions = async () => {
  try {
    const response = await AssetManagementAPI.getEquipments()
    if (response && response.length > 0) {
      equipment.value = response.map((m: Equipment) => ({
        label: m.name.toString(), // Display Name
        value: m.name.toString(), // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading equipment:', error)
  }
}
loadEquipmentOptions()

const assetClassEquipment = ref<{ label: string; value: string }[]>([])
const loadAssetClassEquipmentOptions = async () => {
  try {
    const response = await frappeDB.getDocList('Asset Class', {
      fields: ['*'],
      filters: {
        equipment: 1,
      },
    })
    if (response && response.length > 0) {
      assetClassEquipment.value = response.map((m: AssetClassEquipment) => ({
        label: m.class_name || m.name, // Display Name
        value: m.name, // Save ID
      }))
    }
  } catch (error) {
    console.error('Error loading asset class equipment:', error)
  }
}
loadAssetClassEquipmentOptions()

export {
  asset,
  location,
  assetClass,
  system,
  assetClassProperty,
  property,
  propertyType,
  position,
  systemType,
  assetClassEquipment,
  equipment,
}
