import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn, useThrottleFn } from '@vueuse/core'
import { frappeDB } from '@/services/PurchaseStoreAPI'

// Define asset types inline for now
interface AssetDoc {
  name: string
  description?: string
  asset_class_name?: string
  location_name?: string
  system_name?: string
  workflow_state?: string
  [key: string]: any
}

interface AssetClassDoc {
  name: string
  description?: string
  [key: string]: any
}

interface AssetPropertyDoc {
  name: string
  property_name?: string
  [key: string]: any
}
import { useAppEventBus } from '@/composables/useVueUseUtils'

// Enhanced Asset Store with VueUse patterns
export const useAssetStore = defineStore('assetStore', () => {
  // State
  const assets = ref<AssetDoc[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchTerm = ref('')
  const filters = ref<Record<string, any>>({})
  
  // Dependencies
  const router = useRouter()
  const { emitDocumentSaved, emitDocumentDeleted, emitError, emitSuccess } = useAppEventBus()

  // Computed
  const filteredAssets = computed(() => {
    let filtered = assets.value

    // Apply search filter
    if (searchTerm.value.trim()) {
      const search = searchTerm.value.toLowerCase()
      filtered = filtered.filter(asset => 
        asset.name?.toLowerCase().includes(search) ||
        asset.description?.toLowerCase().includes(search) ||
        asset.asset_class_name?.toLowerCase().includes(search) ||
        asset.location_name?.toLowerCase().includes(search)
      )
    }

    // Apply additional filters
    Object.entries(filters.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        filtered = filtered.filter(asset => asset[key] === value)
      }
    })

    return filtered
  })

  const assetOptions = computed(() =>
    assets.value.map((asset) => ({
      label: `${asset.description} (${asset.name}, ${asset.asset_class_name}, ${asset.location_name}, ${asset.system_name})`,
      value: asset.name,
      // Only add filter if needed
      ...(asset.workflow_state === 'Acquired' && { filter: { workflow_state: 'Acquired' } })
    }))
  )

  const assetsByStatus = computed(() => {
    const grouped: Record<string, AssetDoc[]> = {}
    assets.value.forEach(asset => {
      const status = asset.workflow_state || 'Unknown'
      if (!grouped[status]) grouped[status] = []
      grouped[status].push(asset)
    })
    return grouped
  })

  // Optimized search function with debouncing
  const debouncedSearch = useDebounceFn((term: string) => {
    searchTerm.value = term
  }, 300)

  // Throttled fetch to prevent excessive API calls
  const throttledFetch = useThrottleFn(async (forceRefresh = false) => {
    if (loaded.value && !forceRefresh) return
    
    loading.value = true
    error.value = null

    try {
      const fetchedAssets = await frappeDB.getDocList('Asset', {
        fields: ['*'],
      })
      assets.value = fetchedAssets
      loaded.value = true
      console.log('Assets loaded:', assets.value.length)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch assets'
      error.value = errorMsg
      emitError('Failed to load assets', err)
      console.error('Error fetching assets:', err)
    } finally {
      loading.value = false
    }
  }, 1000)

  // Actions
  const fetchAssets = async (forceRefresh = false) => {
    await throttledFetch(forceRefresh)
  }

  const addAsset = async (newAsset: AssetDoc) => {
    loading.value = true
    error.value = null

    try {
      const asset = await frappeDB.createDoc('Asset', newAsset)
      assets.value.push(asset)
      
      // Emit success events
      emitDocumentSaved('Asset', asset.name, asset)
      emitSuccess(`Asset "${asset.name}" created successfully`)
      
      // Navigate to new asset
      router.push(`/assets/${asset.name}`)
      
      return { success: true, data: asset }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create asset'
      error.value = errorMsg
      emitError('Failed to create asset', err)
      console.error('Error adding asset:', err)
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  const updateAsset = async (assetID: string, updatedData: Partial<AssetDoc>) => {
    loading.value = true
    error.value = null

    try {
      const updatedAsset = await frappeDB.updateDoc<AssetDoc>('Asset', assetID, updatedData)
      
      // Update local state
      const index = assets.value.findIndex((a) => a.name === assetID)
      if (index !== -1) {
        assets.value[index] = updatedAsset
      }

      // Emit success events
      emitDocumentSaved('Asset', updatedAsset.name, updatedAsset)
      emitSuccess(`Asset "${assetID}" updated successfully`)
      
      console.log('Updated asset:', updatedAsset)
      return { success: true, data: updatedAsset }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update asset'
      error.value = errorMsg
      emitError('Failed to update asset', err)
      console.error('Error updating asset:', err)
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  const deleteAsset = async (assetName: string) => {
    loading.value = true
    error.value = null

    try {
      await frappeDB.deleteDoc('Asset', assetName)
      
      // Update local state
      assets.value = assets.value.filter((a) => a.name !== assetName)
      
      // Emit success events
      emitDocumentDeleted('Asset', assetName)
      emitSuccess(`Asset "${assetName}" deleted successfully`)
      
      console.log('Deleted asset:', assetName)
      return { success: true }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete asset'
      error.value = errorMsg
      emitError('Failed to delete asset', err)
      console.error('Error deleting asset:', err)
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  // Filter management
  const setFilter = (key: string, value: any) => {
    filters.value[key] = value
  }

  const clearFilters = () => {
    filters.value = {}
    searchTerm.value = ''
  }

  const getAssetById = (id: string) => {
    return assets.value.find(asset => asset.name === id)
  }

  return {
    // State
    assets: filteredAssets,
    allAssets: computed(() => assets.value),
    loaded,
    loading,
    error,
    searchTerm,
    filters,

    // Computed
    assetOptions,
    assetsByStatus,

    // Actions
    fetchAssets,
    addAsset,
    updateAsset,
    deleteAsset,
    
    // Search & Filter
    debouncedSearch,
    setFilter,
    clearFilters,
    getAssetById
  }
}, {
  persist: {
    key: 'eam_assets',
    paths: ['assets', 'loaded']
  }
})

// Enhanced Asset Class Store
export const useAssetClassStore = defineStore('assetClassStore', () => {
  // State
  const assetClasses = ref<AssetClassDoc[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchTerm = ref('')
  
  // Dependencies
  const router = useRouter()
  const { emitDocumentSaved, emitDocumentDeleted, emitError, emitSuccess } = useAppEventBus()

  // Computed
  const filteredAssetClasses = computed(() => {
    if (!searchTerm.value.trim()) return assetClasses.value
    
    const search = searchTerm.value.toLowerCase()
    return assetClasses.value.filter(assetClass => 
      assetClass.name?.toLowerCase().includes(search) ||
      assetClass.description?.toLowerCase().includes(search)
    )
  })

  const assetClassOptions = computed(() =>
    assetClasses.value.map((assetClass) => ({
      label: `${assetClass.description} (${assetClass.name})`,
      value: assetClass.name,
    }))
  )

  // Optimized search
  const debouncedSearch = useDebounceFn((term: string) => {
    searchTerm.value = term
  }, 300)

  // Throttled fetch
  const throttledFetch = useThrottleFn(async (forceRefresh = false) => {
    if (loaded.value && !forceRefresh) return
    
    loading.value = true
    error.value = null

    try {
      const fetchedAssetClasses = await frappeDB.getDocList('Asset Class', {
        fields: ['*'],
      })
      assetClasses.value = fetchedAssetClasses
      loaded.value = true
      console.log('Asset Classes loaded:', assetClasses.value.length)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch asset classes'
      error.value = errorMsg
      emitError('Failed to load asset classes', err)
      console.error('Error fetching asset classes:', err)
    } finally {
      loading.value = false
    }
  }, 1000)

  // Actions
  const fetchAssetClasses = async (forceRefresh = false) => {
    await throttledFetch(forceRefresh)
  }

  const addAssetClass = async (newAssetClass: AssetClassDoc) => {
    loading.value = true
    error.value = null

    try {
      const assetClass = await frappeDB.createDoc('Asset Class', newAssetClass)
      assetClasses.value.push(assetClass)
      
      emitDocumentSaved('Asset Class', assetClass.name, assetClass)
      emitSuccess(`Asset Class "${assetClass.name}" created successfully`)
      
      router.push(`/asset-classes/${assetClass.name}`)
      return { success: true, data: assetClass }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create asset class'
      error.value = errorMsg
      emitError('Failed to create asset class', err)
      console.error('Error adding asset class:', err)
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  const updateAssetClass = async (assetClassName: string, updatedData: Partial<AssetClassDoc>) => {
    loading.value = true
    error.value = null

    try {
      const updatedAssetClass = await frappeDB.updateDoc<AssetClassDoc>(
        'Asset Class',
        assetClassName,
        updatedData,
      )
      
      const index = assetClasses.value.findIndex((a) => a.name === assetClassName)
      if (index !== -1) {
        assetClasses.value[index] = updatedAssetClass
      }

      emitDocumentSaved('Asset Class', updatedAssetClass.name, updatedAssetClass)
      emitSuccess(`Asset Class "${assetClassName}" updated successfully`)
      
      console.log('Updated asset class:', updatedAssetClass)
      return { success: true, data: updatedAssetClass }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update asset class'
      error.value = errorMsg
      emitError('Failed to update asset class', err)
      console.error('Error updating asset class:', err)
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  const deleteAssetClass = async (assetClassName: string) => {
    loading.value = true
    error.value = null

    try {
      await frappeDB.deleteDoc('Asset Class', assetClassName)
      
      assetClasses.value = assetClasses.value.filter((a) => a.name !== assetClassName)
      
      emitDocumentDeleted('Asset Class', assetClassName)
      emitSuccess(`Asset Class "${assetClassName}" deleted successfully`)
      
      console.log('Deleted asset class:', assetClassName)
      return { success: true }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete asset class'
      error.value = errorMsg
      emitError('Failed to delete asset class', err)
      console.error('Error deleting asset class:', err)
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  const getAssetClassById = (id: string) => {
    return assetClasses.value.find(assetClass => assetClass.name === id)
  }

  return {
    // State
    assetClasses: filteredAssetClasses,
    allAssetClasses: computed(() => assetClasses.value),
    loaded,
    loading,
    error,
    searchTerm,

    // Computed
    assetClassOptions,

    // Actions
    fetchAssetClasses,
    addAssetClass,
    updateAssetClass,
    deleteAssetClass,
    
    // Search
    debouncedSearch,
    getAssetClassById
  }
}, {
  persist: {
    key: 'eam_asset_classes',
    paths: ['assetClasses', 'loaded']
  }
})

// Enhanced Asset Property Store
export const useAssetPropertyStore = defineStore('assetPropertyStore', () => {
  // State
  const assetProperties = ref<AssetPropertyDoc[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchTerm = ref('')
  
  // Dependencies
  const router = useRouter()
  const { emitDocumentSaved, emitDocumentDeleted, emitError, emitSuccess } = useAppEventBus()

  // Computed
  const filteredAssetProperties = computed(() => {
    if (!searchTerm.value.trim()) return assetProperties.value
    
    const search = searchTerm.value.toLowerCase()
    return assetProperties.value.filter(property => 
      property.name?.toLowerCase().includes(search) ||
      property.property_name?.toLowerCase().includes(search)
    )
  })

  // Optimized search
  const debouncedSearch = useDebounceFn((term: string) => {
    searchTerm.value = term
  }, 300)

  // Throttled fetch
  const throttledFetch = useThrottleFn(async (forceRefresh = false) => {
    if (loaded.value && !forceRefresh) return
    
    loading.value = true
    error.value = null

    try {
      const fetchedAssetProperty = await frappeDB.getDocList('Asset Property', {
        fields: ['*'],
      })
      assetProperties.value.splice(0, assetProperties.value.length, ...fetchedAssetProperty)
      loaded.value = true
      console.log('Asset Properties loaded:', assetProperties.value.length)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch asset properties'
      error.value = errorMsg
      emitError('Failed to load asset properties', err)
      console.error('Error fetching asset properties:', err)
    } finally {
      loading.value = false
    }
  }, 1000)

  // Actions
  const fetchAssetProperties = async (forceRefresh = false) => {
    await throttledFetch(forceRefresh)
  }

  const addAssetProperty = async (newAssetProperty: AssetPropertyDoc) => {
    loading.value = true
    error.value = null

    try {
      const assetProperty = await frappeDB.createDoc('Asset Property', newAssetProperty)
      assetProperties.value.push(assetProperty)
      
      emitDocumentSaved('Asset Property', assetProperty.name, assetProperty)
      emitSuccess(`Asset Property "${assetProperty.name}" created successfully`)
      
      router.push(`/asset-properties/${assetProperty.name}`)
      return { success: true, data: assetProperty }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create asset property'
      error.value = errorMsg
      emitError('Failed to create asset property', err)
      console.error('Error adding asset property:', err)
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  const updateAssetProperty = async (assetPropertyID: string, updatedData: Partial<AssetPropertyDoc>) => {
    loading.value = true
    error.value = null

    try {
      const updatedAssetProperty = await frappeDB.updateDoc<AssetPropertyDoc>(
        'Asset Property',
        assetPropertyID,
        updatedData,
      )
      
      const index = assetProperties.value.findIndex((a) => a.name === assetPropertyID)
      if (index !== -1) {
        assetProperties.value[index] = updatedAssetProperty
      }

      emitDocumentSaved('Asset Property', updatedAssetProperty.name, updatedAssetProperty)
      emitSuccess(`Asset Property "${assetPropertyID}" updated successfully`)
      
      console.log('Updated asset property:', updatedAssetProperty)
      return { success: true, data: updatedAssetProperty }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update asset property'
      error.value = errorMsg
      emitError('Failed to update asset property', err)
      console.error('Error updating asset property:', err)
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  const deleteAssetProperty = async (assetPropertyName: string) => {
    loading.value = true
    error.value = null

    try {
      await frappeDB.deleteDoc('Asset Property', assetPropertyName)
      
      assetProperties.value = assetProperties.value.filter((a) => a.name !== assetPropertyName)
      
      emitDocumentDeleted('Asset Property', assetPropertyName)
      emitSuccess(`Asset Property "${assetPropertyName}" deleted successfully`)
      
      console.log('Deleted asset property:', assetPropertyName)
      return { success: true }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete asset property'
      error.value = errorMsg
      emitError('Failed to delete asset property', err)
      console.error('Error deleting asset property:', err)
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  const getAssetPropertyById = (id: string) => {
    return assetProperties.value.find(property => property.name === id)
  }

  return {
    // State
    assetProperties: filteredAssetProperties,
    allAssetProperties: computed(() => assetProperties.value),
    loaded,
    loading,
    error,
    searchTerm,

    // Actions
    fetchAssetProperties,
    addAssetProperty,
    updateAssetProperty,
    deleteAssetProperty,
    
    // Search
    debouncedSearch,
    getAssetPropertyById
  }
}, {
  persist: {
    key: 'eam_asset_properties',
    paths: ['assetProperties', 'loaded']
  }
}) 