<template>
  <div :class="['diagram-view-wrapper', { forbidden }]">
    <div v-if="forbidden" class="overflow-hidden">
      <n-card>
        <n-empty description="You are not authorized to access this page" />
      </n-card>
    </div>
    <template v-else>
      <n-space
        v-if="!loading && elements.length"
        justify="end"
        class="mb-4 diagram-controls"
      >
        <n-button-group>
          <n-button @click="saveCurrentPositions" size="medium">
            Save Layout
          </n-button>
          <n-button @click="loadSavedPositions" size="medium">
            Load Saved Layout
          </n-button>
          <n-button @click="resetGraph" size="medium"> Reset Layout </n-button>
        </n-button-group>
      </n-space>
      <div class="diagram-view">
        <div
          v-show="isInitialized"
          ref="cyContainer"
          class="cytoscape-container"
        ></div>
        <n-spin
          v-if="loading || !isInitialized"
          size="large"
          class="overlay-spin"
        />
        <n-empty
          v-if="!loading && !elements.length"
          description="No position relations to display in diagram"
        />
        <FormModal
          v-if="selectedRecord"
          v-model:show="showFormModal"
          :doctype="'Position'"
          :name="selectedRecord.name"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  watch,
  computed,
  nextTick,
  onActivated,
  onDeactivated,
  shallowRef,
} from 'vue'
import cytoscape, {
  type Core,
  type NodeSingular,
  type EdgeSingular,
} from 'cytoscape'
import {
  NSpin,
  NEmpty,
  NButton,
  NSpace,
  useMessage,
  NButtonGroup,
  NCard,
} from 'naive-ui'
import FormModal from '@/components/new-form/FormModal.vue'
import { useDiagramData } from './composables/useDiagramData'
import type { ListRecord } from '@/types/Lists'
import type { DoctypeMetadata } from '@/types/metadata'

interface Props {
  doctype: string
  diagramConfig?: object
}

interface Position {
  name: string
  description: string
  asset_class?: string
  asset_class_icon?: string
}

const props = defineProps<Props>()

const message = useMessage()

// Use the diagram data composable
const mockRecords = ref<ListRecord[]>([])
const mockMetadata = ref<DoctypeMetadata | null>({
  name: 'Position',
} as DoctypeMetadata)
const { elements, loading, forbidden } = useDiagramData(
  mockRecords,
  mockMetadata,
)

const cyContainer = ref<HTMLElement | null>(null)
const cy = shallowRef<Core | null>(null)
const isInitialized = ref(false)
const isDestroyed = ref(false)
let initTimer: ReturnType<typeof setTimeout> | null = null
let animationTimer: ReturnType<typeof setTimeout> | null = null

const showFormModal = ref(false)
const selectedRecord = ref<Position | null>(null)

const STORAGE_KEY = computed(() => `cytoscape-layout-position-diagram`)

interface NodePosition {
  id: string
  position: { x: number; y: number }
}

const getEdgeStyle = (relationType: string) => {
  switch (relationType) {
    case 'Connected to':
      return {
        'line-color': '#52c41a',
        'target-arrow-color': '#52c41a',
        'line-style': 'solid' as const,
      }
    case 'is Parent of':
      return {
        'line-color': '#1890ff',
        'target-arrow-color': '#1890ff',
        'line-style': 'solid' as const,
      }
    case 'Linked to':
      return {
        'line-color': '#fa8c16',
        'target-arrow-color': '#fa8c16',
        'line-style': 'dashed' as const,
      }
    default:
      return {
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'line-style': 'solid' as const,
      }
  }
}

// Wine and Cheese layout for focusing on a node
const wineAndCheeseLayout = (centerNode: NodeSingular) => {
  if (!cy.value) return

  const cyInstance = cy.value
  const connectedNodes = centerNode.neighborhood().nodes()
  const connectedEdges = centerNode.connectedEdges()

  // Get viewport center
  const viewportCenter = {
    x: cyInstance.width() / 2,
    y: cyInstance.height() / 2,
  }

  // Position center node
  centerNode.animate({
    position: viewportCenter,
    duration: 500,
  })

  // Calculate positions for connected nodes in a circle
  const radius = Math.min(cyInstance.width(), cyInstance.height()) * 0.3
  const angleStep = (2 * Math.PI) / connectedNodes.length

  connectedNodes.forEach((node, index) => {
    const angle = index * angleStep
    const x = viewportCenter.x + radius * Math.cos(angle)
    const y = viewportCenter.y + radius * Math.sin(angle)

    node.animate({
      position: { x, y },
      duration: 500,
    })
  })

  // Animate other nodes to fade
  cyInstance
    .nodes()
    .not(centerNode)
    .not(connectedNodes)
    .animate({
      style: { opacity: 0.3 },
      duration: 300,
    })

  // Animate non-connected edges to fade
  cyInstance
    .edges()
    .not(connectedEdges)
    .animate({
      style: { opacity: 0.2 },
      duration: 300,
    })

  // Fit to show the focused subgraph with padding
  if (animationTimer) clearTimeout(animationTimer)
  animationTimer = setTimeout(() => {
    cyInstance.fit(centerNode.union(connectedNodes), 50)
  }, 600)
}

const defaultLayoutConfig = {
  name: 'cose',
  animate: false, // Disable animation for initial layout
  randomize: false,
  idealEdgeLength: () => 150,
  nodeRepulsion: () => 500000,
  nodeOverlap: 20,
  numIter: 1000,
  componentSpacing: 100,
  nestingFactor: 5,
  gravity: 0.25,
  coolingFactor: 0.95,
  minTemp: 1.0,
  padding: 50,
}

const destroyCytoscape = () => {
  if (cy.value) {
    try {
      cy.value.destroy()
      cy.value = null
    } catch (error) {
      console.warn('Error destroying cytoscape instance:', error)
    }
  }
}

const initializeCytoscape = () => {
  if (
    !cyContainer.value ||
    !elements.value.length ||
    isDestroyed.value ||
    forbidden.value
  ) {
    return
  }

  // Clean up any existing instance
  destroyCytoscape()

  try {
    // Create cytoscape instance
    const cyInstance = cytoscape({
      container: cyContainer.value,
      elements: [...elements.value], // Clone to avoid reactivity issues
      style: [
        {
          selector: 'node',
          style: {
            width: 70,
            height: 70,
            label: 'data(label)',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'font-size': 12,
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 8,
            'background-color': '#ffffff',
            'background-image': (ele: NodeSingular) => {
              const icon = ele.data('icon')
              const DEFAULT_ICON = '/files/default-icon.png'
              const finalIcon =
                icon && icon.trim() && icon !== DEFAULT_ICON
                  ? icon.startsWith('/files')
                    ? icon
                    : `/files/${icon}`
                  : DEFAULT_ICON
              return `url("${encodeURI(finalIcon)}")`
            },
            'background-fit': 'contain',
            'background-clip': 'node',
            'background-opacity': 0.1,
            'transition-duration': 300,
          },
        },
        {
          selector: 'node:active',
          style: {
            'overlay-opacity': 0.2,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 3,
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.3,
            'font-size': 11,
            'text-rotation': 'autorotate',
            'text-margin-y': -12,
            label: 'data(label)',
            'text-background-opacity': 0.8,
            'text-background-color': '#ffffff',
            'text-background-padding': '4px',
            'overlay-padding': 8,
            'transition-duration': 300,
          },
        },
        {
          selector: 'edge[relation_type="Connected to"]',
          style: getEdgeStyle('Connected to'),
        },
        {
          selector: 'edge[relation_type="is Parent of"]',
          style: getEdgeStyle('is Parent of'),
        },
        {
          selector: 'edge[relation_type="Linked to"]',
          style: getEdgeStyle('Linked to'),
        },
        {
          selector: '.highlighted',
          style: {
            'border-color': '#ff4d4f',
            'border-width': 4,
            'z-index': 999,
          },
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#ff4d4f',
            'target-arrow-color': '#ff4d4f',
            'z-index': 999,
          },
        },
      ],
      layout: defaultLayoutConfig,
      minZoom: 0.1,
      maxZoom: 3,
    })

    cy.value = cyInstance

    // Add event listeners
    cyInstance.on('tap', 'node', (event) => {
      const node = event.target

      // Reset all styles first
      cyInstance.elements().animate({
        style: { opacity: 1 },
        duration: 300,
      })

      cyInstance.$('.highlighted').removeClass('highlighted')
      node.addClass('highlighted')
      node.connectedEdges().addClass('highlighted')

      // Apply Wine and Cheese layout
      wineAndCheeseLayout(node)
    })

    cyInstance.on('dbltap', 'node', (event) => {
      const node = event.target
      const positionData = node.data('position_data')
      if (positionData) {
        selectedRecord.value = positionData
        showFormModal.value = true
      }
    })

    cyInstance.on('tap', (event) => {
      if (event.target === cyInstance) {
        // Reset view when clicking background
        cyInstance.$('.highlighted').removeClass('highlighted')
        cyInstance.elements().animate({
          style: { opacity: 1 },
          duration: 300,
        })
        cyInstance.fit()
      }
    })

    // Apply saved positions or run layout
    const savedPositions = loadNodePositions()
    if (savedPositions) {
      applyNodePositions(savedPositions)
    } else {
      cyInstance.ready(() => {
        cyInstance.layout(defaultLayoutConfig).run()
      })
    }

    isInitialized.value = true
  } catch (error) {
    console.error('Error initializing cytoscape:', error)
  }
}

const saveCurrentPositions = () => {
  if (!cy.value || cy.value.destroyed()) return

  try {
    const positions: NodePosition[] = cy.value.nodes().map((node) => ({
      id: node.id(),
      position: node.position(),
    }))
    localStorage.setItem(STORAGE_KEY.value, JSON.stringify(positions))
    message.success('Layout saved successfully')
  } catch (error) {
    console.error('Error saving positions:', error)
    message.error('Failed to save layout')
  }
}

const loadNodePositions = (): NodePosition[] | null => {
  try {
    const savedPositions = localStorage.getItem(STORAGE_KEY.value)
    if (!savedPositions) return null
    return JSON.parse(savedPositions) as NodePosition[]
  } catch (error) {
    console.error('Error loading saved positions:', error)
    return null
  }
}

const applyNodePositions = (positions: NodePosition[]) => {
  if (!cy.value || cy.value.destroyed()) return

  try {
    const positionMap = new Map(positions.map((p) => [p.id, p.position]))

    cy.value.nodes().forEach((node) => {
      const pos = positionMap.get(node.id())
      if (pos) {
        node.position(pos)
      }
    })
    cy.value.fit()
  } catch (error) {
    console.error('Error applying node positions:', error)
  }
}

const loadSavedPositions = () => {
  const positions = loadNodePositions()
  if (!positions) {
    message.warning('No saved layout found')
    return
  }
  applyNodePositions(positions)
  message.success('Saved layout loaded')
}

const resetGraph = () => {
  if (!cy.value || cy.value.destroyed()) return

  try {
    // Reset all styles
    cy.value.elements().style({ opacity: 1 })
    cy.value.$('.highlighted').removeClass('highlighted')

    // Run layout with animation
    cy.value.layout(defaultLayoutConfig).run()

    message.info('Layout has been reset')
  } catch (error) {
    console.error('Error resetting graph:', error)
  }
}

onMounted(async () => {
  // Trigger the composable to load Position data
  // This will automatically load position relations and generate elements
})

onActivated(() => {
  isDestroyed.value = false
  if (elements.value.length > 0 && !isInitialized.value) {
    initTimer = setTimeout(() => {
      if (!isDestroyed.value) {
        requestAnimationFrame(() => {
          initializeCytoscape()
        })
      }
    }, 100)
  }
})

onDeactivated(() => {
  isDestroyed.value = true
  destroyCytoscape()
  isInitialized.value = false
})

onUnmounted(() => {
  isDestroyed.value = true
  if (initTimer) clearTimeout(initTimer)
  if (animationTimer) clearTimeout(animationTimer)
  destroyCytoscape()
})

// Watch for element changes with proper cleanup
let watchTimer: ReturnType<typeof setTimeout> | null = null
watch(elements, (newElements) => {
  if (newElements.length > 0 && !loading.value && !isDestroyed.value) {
    if (watchTimer) clearTimeout(watchTimer)

    // If already initialized, just update elements
    if (isInitialized.value && cy.value && !cy.value.destroyed()) {
      try {
        cy.value.json({ elements: [...newElements] })
        cy.value.layout(defaultLayoutConfig).run()
      } catch (error) {
        console.error('Error updating elements:', error)
        // Reinitialize if update fails
        isInitialized.value = false
        destroyCytoscape()
        watchTimer = setTimeout(() => {
          if (!isDestroyed.value) {
            initializeCytoscape()
          }
        }, 100)
      }
    } else {
      // Initialize if not already done
      watchTimer = setTimeout(() => {
        if (!isDestroyed.value) {
          initializeCytoscape()
        }
      }, 100)
    }
  }
})
</script>

<style scoped>
.diagram-view-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 85vh;
  margin-bottom: 2rem;
  /* Prevent scrolling when forbidden */
  overflow: auto;
}
/* Prevent scrolling when forbidden */
.diagram-view-wrapper.forbidden {
  overflow: hidden !important;
  height: 100vh;
}

.diagram-controls {
  flex-shrink: 0;
}

.diagram-view {
  flex-grow: 1;
  position: relative;
  background-color: #f5f5f5;
  min-height: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.cytoscape-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.overlay-spin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}
</style>
