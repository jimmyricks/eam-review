<template>
  <div class="map-view">
    <div ref="mapContainer" class="map-container"></div>
    <n-spin v-if="loading" size="large" class="overlay-spin" />
    <n-empty
      v-if="!loading && !hasMarkers"
      description="No locations to display on map"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { NSpin, NEmpty } from 'naive-ui'
import { useMapData } from './composables/useMapData'

interface Props {
  doctype: string
}

const props = defineProps<Props>()

const mapContainer = ref<HTMLElement | null>(null)
let map: any = null // Leaflet map instance
let L: any = null // Leaflet library

// Use the composable for all data logic
const { loading, error, hasMarkers, mapCenter, mapMarkers, fetchLocations } =
  useMapData(props.doctype)

const initializeMap = async () => {
  if (!mapContainer.value || map) return

  try {
    const leaflet = await import('leaflet')
    L = leaflet.default || leaflet
    await import('leaflet/dist/leaflet.css')

    map = L.map(mapContainer.value).setView(
      [mapCenter.value.lat, mapCenter.value.lng],
      13,
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
  } catch (error) {
    console.error('Error loading Leaflet:', error)
  }
}

const updateMarkers = () => {
  if (!map || !L) return

  // Clear existing markers
  map.eachLayer((layer: any) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer)
    }
  })

  const markers = mapMarkers.value.map((markerData) => {
    const icon = new L.Icon({
      iconUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    const marker = L.marker(
      [markerData.position.lat, markerData.position.lng],
      {
        icon,
      },
    ).addTo(map)

    // Create a more detailed popup for Location records
    const popupContent = `
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; color: #333;">${markerData.title}</h4>
        ${markerData.description ? `<p style="margin: 0 0 8px 0; color: #666;">${markerData.description}</p>` : ''}
        ${markerData.address ? `<p style="margin: 0; color: #888; font-size: 12px;"><strong>Address:</strong> ${markerData.address}</p>` : ''}
        <p style="margin: 8px 0 0 0; color: #888; font-size: 11px;">
          <strong>Coordinates:</strong> ${markerData.position.lat.toFixed(6)}, ${markerData.position.lng.toFixed(6)}
        </p>
      </div>
    `

    marker.bindPopup(popupContent)
    return marker
  })

  if (markers.length) {
    const group = L.featureGroup(markers)
    const bounds = group.getBounds()
    map.fitBounds(bounds, { padding: [50, 50] })
  }
}

// Initialize map and data
onMounted(async () => {
  await fetchLocations()
  await initializeMap()

  // Update markers after map is initialized
  if (hasMarkers.value) {
    updateMarkers()
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})

// Watch for marker changes and update map
watch(mapMarkers, (newMarkers) => {
  if (map && newMarkers.length) {
    updateMarkers()
  }
})
</script>

<style scoped>
.map-view {
  width: 100%;
  height: 80vh;
  position: relative;
}
.map-container {
  width: 100%;
  height: 100%;
  position: absolute;
  margin-top: 10px;
  border-radius: 10px;
}
.overlay-spin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
