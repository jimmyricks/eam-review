import { ref, computed, type Ref, watch } from 'vue'
import type { ListRecord } from '@/types/Lists'
import type { DoctypeMetadata, FormField } from '@/types/metadata'
import { useDocumentService, useListService } from '@/composables/services'
import { frappeDB } from '@/composables/useFrappeSDK'

interface DiagramElement {
  group: 'nodes' | 'edges'
  data: {
    id: string
    label?: string
    source?: string
    target?: string
    name?: string
    icon?: string
    position_data?: any
    relation_type?: string
  }
}

interface PositionRelation {
  name: string
  position_a: string
  position_b: string
  position_relation_type: string
}

interface Position {
  name: string
  description: string
  asset_class?: string
  asset_class_icon?: string
  current_asset_id?: string
}

interface AssetClass {
  name: string
  class_icon: string
}

export function useDiagramData(
  records: Ref<ListRecord[]>,
  metadata: Ref<DoctypeMetadata | null>,
) {
  const { getDocument } = useDocumentService()
  const { getList } = useListService()
  
  // Cache for asset data to avoid repeated API calls
  const assetCache = ref<Map<string, string>>(new Map())
  const elements = ref<DiagramElement[]>([])
  const loading = ref(false)
  const forbidden = ref(false)

  const DEFAULT_ICON = '/files/default-icon.png'

  /**
   * Fetch asset tag for a given asset ID
   */
  const getAssetTag = async (assetId: string): Promise<string> => {
    // Check cache first
    if (assetCache.value.has(assetId)) {
      return assetCache.value.get(assetId)!
    }

    try {
      const response = await getDocument('Asset', assetId)
      if (response.docs && response.docs.length > 0) {
        const asset = response.docs[0]
        const assetTag = asset.asset_tag || 'No Asset Tag'
        assetCache.value.set(assetId, assetTag)
        return assetTag
      }

      return 'No Asset'
    } catch (error: any) {
      if (error?.response?.httpStatus === 403) {
        forbidden.value = true
      }
      console.error(`Error fetching asset ${assetId}:`, error)
      assetCache.value.set(assetId, 'No Asset')
      return 'No Asset'
    }
  }

  /**
   * Generate label for Position records with asset tag
   */
  const generatePositionLabel = async (record: ListRecord | Position): Promise<string> => {
    const currentAssetId = record.current_asset_id
    
    if (!currentAssetId) {
      return `${record.name} (No Asset)`
    }

    const assetTag = await getAssetTag(currentAssetId)
    return `${record.name} (${assetTag})`
  }

  /**
   * Load position data with asset classes
   */
  const loadPositionData = async (positionNames: string[]): Promise<Map<string, Position>> => {
    try {
      const positionData = await frappeDB.getDocList('Position', {
        fields: ['name', 'description', 'asset_class', 'current_asset_id'],
      })

      const assetClasses = [
        ...new Set(positionData.map((p: any) => p.asset_class).filter(Boolean)),
      ]
      let assetClassIcons = new Map()

      if (assetClasses.length > 0) {
        const assetClassData = await frappeDB.getDocList('Asset Class', {
          filters: [['name', 'in', assetClasses]],
          fields: ['name', 'class_icon'],
        })

        assetClassIcons = new Map(
          assetClassData.map((ac: any) => [ac.name, ac.class_icon]),
        )
      }

      const positionMap = new Map()
      positionData.forEach((pos: any) => {
        positionMap.set(pos.name, {
          ...pos,
          asset_class_icon: assetClassIcons.get(pos.asset_class) || DEFAULT_ICON,
        })
      })

      return positionMap
    } catch (error: any) {
      if (error?.response?.httpStatus === 403) {
        forbidden.value = true
      }
      console.error('Error loading position data:', error)
      return new Map()
    }
  }

  /**
   * Update diagram elements for Position doctype specifically
   */
  const updatePositionDiagramElements = async () => {
    try {
      loading.value = true

      // Load position relations
      const relations = await getList('Position Relation', {
        limit: 1000,
        fields: ['name', 'position_a', 'position_b', 'position_relation_type'],
      })

      if (!relations || relations.length === 0) {
        elements.value = []
        return
      }

      const positionNames = [
        ...new Set([
          ...relations.map((r: any) => r.position_a),
          ...relations.map((r: any) => r.position_b),
        ]),
      ].filter(Boolean)

      // Load position data
      let positions = new Map()
      if (positionNames.length > 0) {
        positions = await loadPositionData(positionNames)
      }

      // Create nodes
      const nodeSet = new Set<string>()
      const nodes: DiagramElement[] = []
      const edges: DiagramElement[] = []

      for (const relation of relations) {
        // Add position_a node
        if (!nodeSet.has(relation.position_a)) {
          nodeSet.add(relation.position_a)
          const position = positions.get(relation.position_a)
          
          let label = position?.description || relation.position_a
          if (position) {
            label = await generatePositionLabel(position)
          }

          nodes.push({
            group: 'nodes',
            data: {
              id: relation.position_a,
              label: label,
              name: relation.position_a,
              icon: position?.asset_class_icon || DEFAULT_ICON,
              position_data: position,
            },
          })
        }

        // Add position_b node
        if (!nodeSet.has(relation.position_b)) {
          nodeSet.add(relation.position_b)
          const position = positions.get(relation.position_b)
          
          let label = position?.description || relation.position_b
          if (position) {
            label = await generatePositionLabel(position)
          }

          nodes.push({
            group: 'nodes',
            data: {
              id: relation.position_b,
              label: label,
              name: relation.position_b,
              icon: position?.asset_class_icon || DEFAULT_ICON,
              position_data: position,
            },
          })
        }

        // Add edge
        edges.push({
          group: 'edges',
          data: {
            id: `${relation.position_a}-${relation.position_b}`,
            source: relation.position_a,
            target: relation.position_b,
            label: relation.position_relation_type,
            relation_type: relation.position_relation_type,
          },
        })
      }

      elements.value = [...nodes, ...edges]
    } catch (error: any) {
      if (error.httpStatus === 403) {
        forbidden.value = true
      } else {
        console.error('Error updating position diagram elements:', error)
      }
      elements.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Update diagram elements for generic list records
   */
  const updateGenericDiagramElements = async () => {
    if (!records.value.length || !metadata.value) {
      elements.value = []
      return
    }

    const nodes: DiagramElement[] = []
    const edges: DiagramElement[] = []

    const linkFields =
      metadata.value.fields.filter((f) => f.fieldtype === 'Link') || []

    // Create nodes with asset information for Position records
    for (const record of records.value) {
      let label = record.name // Default label
      
      // Special handling for Position records
      if (record.doctype === 'Position' || metadata.value?.name === 'Position') {
        label = await generatePositionLabel(record)
      }

      nodes.push({
        group: 'nodes',
        data: {
          id: record.name,
          label: label,
        },
      })
    }

    // Create edges based on link fields
    records.value.forEach((record) => {
      linkFields.forEach((field) => {
        const targetId = record[field.fieldname]
        if (targetId && records.value.some((r) => r.name === targetId)) {
          edges.push({
            group: 'edges',
            data: {
              id: `${record.name}-${field.fieldname}-${targetId}`,
              source: record.name,
              target: targetId,
              label: field.label,
            },
          })
        }
      })
    })

    elements.value = [...nodes, ...edges]
  }

  /**
   * Main update function that determines which type of diagram to generate
   */
  const updateElements = async () => {
    // Check if this is a Position doctype - use specialized logic
    if (metadata.value?.name === 'Position') {
      await updatePositionDiagramElements()
    } else {
      await updateGenericDiagramElements()
    }
  }

  // Watch for changes in records or metadata and update elements
  watch([records, metadata], updateElements, { immediate: true })

  return {
    elements: computed(() => elements.value),
    loading: computed(() => loading.value),
    forbidden: computed(() => forbidden.value),
    updateElements,
  }
}
