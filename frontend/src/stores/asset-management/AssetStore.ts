import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { frappeDB } from '@/services/AssetManagementAPI'
import { AssetClassDoc, AssetDoc, AssetPropertyDoc } from '@/types/Assets'
import { useRouter } from 'vue-router'

export const useAssetStore = defineStore('assetStore', () => {
  const assets = ref<AssetDoc[]>([])
  const loaded = ref(false)
  const router = useRouter()

  // Fetch assets only once
  const fetchAssets = async () => {
    if (loaded.value) return
    try {
      const fetchedAssets = await frappeDB.getDocList('Asset', {
        fields: ['*'],
      })
      assets.value = fetchedAssets
      console.log('assets', assets.value)
      loaded.value = true
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const addAsset = async (newAsset: AssetDoc) => {
    try {
      const asset = await frappeDB.createDoc('Asset', newAsset)

      assets.value.push(asset)
      router.push(`/assets/${asset.name}`)
    } catch (error) {
      console.error('Error adding asset:', error)
    }
  }

  const updateAsset = async (
    assetID: string,
    updatedData: Partial<AssetDoc>,
  ) => {
    try {
      const updatedAsset = await frappeDB.updateDoc<AssetDoc>(
        'Asset',
        assetID,
        updatedData,
      )
      console.log('Updated asset:', updatedAsset)

      const index = assets.value.findIndex((a) => a.name === assetID)
      if (index !== -1) {
        assets.value[index] = updatedAsset
      }
    } catch (error) {
      console.error('Error updating asset:', error)
    }
  }

  const deleteAsset = async (assetName: string) => {
    try {
      await frappeDB.deleteDoc('Asset', assetName)
      console.log('Deleted asset:', assetName)

      assets.value = assets.value.filter((a) => a.name !== assetName)
    } catch (error: any) {
      console.error('Error deleting asset:', error)
      return { status: 'error', message: error.message }
    }
  }

  const assetOptions = computed(() =>
    assets.value.map((m) => {
      const option: any = {
        label: `${m.description} (${m.name}, ${m.asset_class_name}, ${m.location_name}, ${m.system_name})`,
        value: m.name,
      }

      // Only add filter if needed
      if (m.workflow_state === 'Acquired') {
        option.filter = { workflow_state: 'Acquired' }
      }

      return option
    }),
  )

  return {
    assets,
    assetOptions,
    fetchAssets,
    addAsset,
    updateAsset,
    deleteAsset,
  }
})

export const useAssetClassStore = defineStore('assetClassStore', () => {
  const assetClasses = ref<AssetClassDoc[]>([])
  const loaded = ref(false)
  const router = useRouter()

  // Fetch assets only once
  const fetchAssetClasses = async () => {
    if (loaded.value) return
    try {
      const fetchedAssetClasses = await frappeDB.getDocList('Asset Class', {
        fields: ['*'],
      })
      assetClasses.value = fetchedAssetClasses
      console.log('assetClasses', assetClasses.value)
      loaded.value = true
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const addAssetClass = async (newAssetClass: AssetClassDoc) => {
    try {
      const assetClass = await frappeDB.createDoc('Asset Class', newAssetClass)

      assetClasses.value.push(assetClass)
      router.push(`/asset-classes/${assetClass.name}`)
    } catch (error) {
      console.error('Error adding asset class:', error)
    }
  }

  const updateAssetClass = async (
    assetClassName: string,
    updatedData: Partial<AssetClassDoc>,
  ) => {
    try {
      const updatedAssetClass = await frappeDB.updateDoc<AssetClassDoc>(
        'Asset Class',
        assetClassName,
        updatedData,
      )
      console.log('Updated asset class:', updatedAssetClass)

      const index = assetClasses.value.findIndex(
        (a) => a.name === assetClassName,
      )
      if (index !== -1) {
        assetClasses.value[index] = updatedAssetClass
      }
    } catch (error) {
      console.error('Error updating asset class:', error)
    }
  }

  const deleteAssetClass = async (assetClassName: string) => {
    try {
      await frappeDB.deleteDoc('Asset Class', assetClassName)
      console.log('Deleted asset class:', assetClassName)

      assetClasses.value = assetClasses.value.filter(
        (a) => a.name !== assetClassName,
      )
    } catch (error: any) {
      console.error('Error deleting asset class:', error)
      return { status: 'error', message: error.message }
    }
  }

  const assetClassOptions = computed(() =>
    assetClasses.value.map((m) => {
      const option: any = {
        label: `${m.description} (${m.name})`,
        value: m.name,
      }

      return option
    }),
  )

  return {
    assetClasses,
    assetClassOptions,
    fetchAssetClasses,
    addAssetClass,
    updateAssetClass,
    deleteAssetClass,
  }
})

export const useAssetPropertyStore = defineStore('assetPropertyStore', () => {
  const assetProperties = ref<AssetPropertyDoc[]>([])
  const loaded = ref(false)
  const router = useRouter()

  const fetchAssetProperties = async () => {
    if (loaded.value) return
    try {
      const fetchedAssetProperty = await frappeDB.getDocList('Asset Property', {
        fields: ['*'],
      })
      assetProperties.value.splice(
        0,
        assetProperties.value.length,
        ...fetchedAssetProperty,
      )
      loaded.value = true
    } catch (error) {
      console.error('Error fetching asset properties:', error)
    }
  }

  const addAssetProperty = async (newAssetProperty: AssetPropertyDoc) => {
    try {
      const assetProperty = await frappeDB.createDoc(
        'Asset Property',
        newAssetProperty,
      )

      assetProperties.value.push(assetProperty)
      router.push(`/asset-properties/${assetProperty.name}`)
    } catch (error) {
      console.error('Error adding asset:', error)
    }
  }

  const updateAssetProperty = async (
    assetPropertyID: string,
    updatedData: Partial<AssetPropertyDoc>,
  ) => {
    try {
      const updatedAssetProperty = await frappeDB.updateDoc<AssetPropertyDoc>(
        'Asset Property',
        assetPropertyID,
        updatedData,
      )
      console.log('Updated asset property:', updatedAssetProperty)

      const index = assetProperties.value.findIndex(
        (a) => a.name === assetPropertyID,
      )
      if (index !== -1) {
        assetProperties.value[index] = updatedAssetProperty
      }
    } catch (error) {
      console.error('Error updating asset:', error)
    }
  }

  const deleteAssetProperty = async (assetPropertyName: string) => {
    try {
      await frappeDB.deleteDoc('Asset Property', assetPropertyName)
      console.log('Deleted asset property:', assetPropertyName)

      assetProperties.value = assetProperties.value.filter(
        (a) => a.name !== assetPropertyName,
      )
    } catch (error: any) {
      console.error('Error deleting asset property:', error)
      return { status: 'error', message: error.message }
    }
  }

  return {
    assetProperties,
    fetchAssetProperties,
    addAssetProperty,
    updateAssetProperty,
    deleteAssetProperty,
  }
})
