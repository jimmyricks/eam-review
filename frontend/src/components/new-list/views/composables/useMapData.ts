import { computed, ref } from 'vue'
import { useListService } from '@/composables/services'
import type { ListRecord } from '@/types/Lists'

export interface MapMarker {
  id: string
  position: {
    lat: number
    lng: number
  }
  title: string
  description: string
  address: string
}

export function useMapData(doctype: string) {
  const { getList } = useListService()
  
  const records = ref<ListRecord[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  // Fetch location data
  const fetchLocations = async () => {
    try {
      loading.value = true
      error.value = null
      
      records.value = await getList(doctype, {
        limit: 1000,
        filters: [
          ['latitude', 'is', 'set'],
          ['longitude', 'is', 'set'],
        ],
      })


    } catch (err) {
      console.error('Failed to load data for map view:', err)
      error.value = 'Failed to load location data'
    } finally {
      loading.value = false
    }
  }

  // Get locations with coordinates for map display
  const mapLocations = computed(() => {
    const filtered = records.value.filter((record) => {
      // Filter records that have coordinates
      return record.latitude && record.longitude
    })
    
    return filtered
  })

  // Get center point for map
  const mapCenter = computed(() => {
    if (mapLocations.value.length === 0) {
      // Default to a sensible location if no records have coordinates
      return { lat: 10.3157, lng: 123.8854 } // Cebu City, Philippines
    }

    const totalLat = mapLocations.value.reduce(
      (sum, loc) => sum + (Number(loc.latitude) || 0),
      0,
    )
    const totalLng = mapLocations.value.reduce(
      (sum, loc) => sum + (Number(loc.longitude) || 0),
      0,
    )

    return {
      lat: totalLat / mapLocations.value.length,
      lng: totalLng / mapLocations.value.length,
    }
  })

  // Get map markers data
  const mapMarkers = computed((): MapMarker[] => {
    const markers = mapLocations.value.map((location) => ({
      id: location.name,
      position: {
        lat: Number(location.latitude) || 0,
        lng: Number(location.longitude) || 0,
      },
      title: location.name1 || location.name,
      description: location.description || '',
      address: location.address || '',
    }))
    
    return markers
  })

  // Check if there are any markers to display
  const hasMarkers = computed(() => mapMarkers.value.length > 0)

  return {
    // State
    loading,
    error,
    hasMarkers,
    
    // Data
    mapCenter,
    mapMarkers,
    
    // Actions
    fetchLocations,
  }
} 