import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { routeToDoctype } from '@/utils/slugify'

// Define BreadcrumbItem type
export interface BreadcrumbItem {
  label: string
  route: string | null
  doctype?: string
  docId?: string
}

// Define VisitedFormPage type for tracking form navigation history
interface VisitedFormPage {
  path: string
  label: string
  doctype?: string
  docId?: string
  timestamp: number
}

// Global state for visited form pages (persisted across component instances)
const MAX_FORM_PAGES = 3 // Limit to 3 breadcrumbs

// Use VueUse's useStorage for reactive localStorage management
const visitedFormPages = useStorage<VisitedFormPage[]>('eam-visited-form-pages', [])

// Ensure we don't exceed max breadcrumbs
const ensureMaxBreadcrumbs = () => {
  if (visitedFormPages.value.length > MAX_FORM_PAGES) {
    visitedFormPages.value = visitedFormPages.value.slice(0, MAX_FORM_PAGES)
  }
}

// Initialize with proper limit
ensureMaxBreadcrumbs()

export function useBreadcrumbs() {
  const route = useRoute()
  const router = useRouter()

  // Helper function to extract doctype and docId from route
  const extractRouteInfo = (routePath: string, routeParams: any) => {
    const pathSegments = routePath.split('/').filter(Boolean)

    if (pathSegments.length === 0) return { doctype: null, docId: null }

    // For routes like /asset/ASSET001 or /asset-class/AC001
    const firstSegment = pathSegments[0]
    const doctype = routeToDoctype(firstSegment)

    // Extract document ID from various possible parameter names
    const docId =
      routeParams.docId ||
      routeParams.assetId ||
      routeParams.assetClassId ||
      routeParams.equipmentId ||
      routeParams.positionId ||
      routeParams.laborId ||
      routeParams.contractorId ||
      routeParams.manufacturerId ||
      routeParams.modelId ||
      routeParams.tradeId ||
      routeParams.employeeId ||
      routeParams.systemId ||
      routeParams.locationId ||
      routeParams.propertyId ||
      routeParams.maintenanceActivityId ||
      routeParams.maintenancePlanId ||
      routeParams.pmaId ||
      routeParams.maintenanceRequestId ||
      routeParams.maintenanceOrderId ||
      routeParams.workOrderId ||
      routeParams.workOrderActivityId ||
      routeParams.itemId ||
      routeParams.inventoryId ||
      routeParams.purchaseRequestId ||
      routeParams.purchaseReceiptId ||
      routeParams.transferId ||
      routeParams.inspectionId ||
      routeParams.vendorId ||
      routeParams.storeId ||
      routeParams.binId ||
      routeParams.unitOfMeasureId ||
      routeParams.checklistId ||
      routeParams.assetPropertyId ||
      routeParams.assetRelationId ||
      routeParams.sensorId ||
      routeParams.assetClassPropertyId ||
      routeParams.assetPositionId ||
      routeParams.positionRelationId ||
      routeParams.equipmentScheduleId ||
      routeParams.equipmentAvailabilityId ||
      routeParams.maintenancePartsId ||
      routeParams.maintenanceTradeId ||
      routeParams.maintenanceEquipmentId ||
      routeParams.maintenanceIntervalId ||
      routeParams.maintenanceConditionId ||
      routeParams.maintenanceCalendarId ||
      routeParams.maintenanceScheduleId ||
      routeParams.workOrderEquipmentId ||
      routeParams.workOrderEquipmentAssignmentId ||
      routeParams.workOrderEquipmentActualHoursId ||
      routeParams.workOrderLaborId ||
      routeParams.workOrderLaborAssignmentId ||
      routeParams.workOrderLaborActualHoursId ||
      routeParams.workOrderPartsId ||
      routeParams.workOrderPartsIssueId ||
      routeParams.workOrderPartsReturnId ||
      routeParams.workOrderPartsReservationId ||
      routeParams.workOrderChecklistId ||
      routeParams.workOrderActivityLogsId ||
      routeParams.purchaseRequestLineId ||
      routeParams.workScheduleId ||
      routeParams.leaveApplicationId ||
      routeParams.holidayId ||
      routeParams.laborAvailabilityId ||
      routeParams.tradeLaborId ||
      routeParams.tradeAvailabilityId ||
      routeParams.id ||
      null

    return { doctype, docId }
  }

  // Helper function to generate a readable label for a route
  const generateRouteLabel = (
    routePath: string,
    routeParams: any,
    routeMeta: any,
  ) => {
    const { doctype, docId } = extractRouteInfo(routePath, routeParams)

    // Handle special routes
    if (routePath === '/') return 'Home'
    if (routePath.includes('/dashboard/')) return 'Dashboard'
    if (routePath.includes('/settings')) return 'Settings'
    if (routePath.includes('/login')) return 'Login'

    // Handle new document routes
    if (docId === 'new') {
      return `New ${doctype || 'Document'}`
    }

    // Handle document form routes
    if (docId && doctype) {
      return docId // Just show the document ID for cleaner breadcrumbs
    }

    // Handle list routes
    if (doctype && !docId) {
      return `${doctype} List`
    }

    // Fallback to route meta breadcrumb or formatted path
    if (routeMeta?.breadcrumb) {
      return routeMeta.breadcrumb
    }

    // Last resort: format the path
    const pathSegments = routePath.split('/').filter(Boolean)
    if (pathSegments.length > 0) {
      return routeToDoctype(pathSegments[pathSegments.length - 1])
    }

    return 'Unknown Page'
  }

  // Check if a route is a form page
  const isFormPage = (routePath: string, routeParams: any, routeMeta: any) => {
    // Check meta layout first
    if (routeMeta?.layout === 'form') return true
    if (routeMeta?.layout === 'list') return false

    // Don't consider new record creation pages as form pages for breadcrumb tracking
    if (routePath.includes('/new')) return false

    // Auto-detect: form page if route has parameters (likely a document form)
    const hasParams = routeParams && Object.keys(routeParams).length > 0
    return hasParams
  }

  // Check if a route is a list page
  const isListPage = (routePath: string, routeParams: any, routeMeta: any) => {
    // Check meta layout first
    if (routeMeta?.layout === 'list') return true
    if (routeMeta?.layout === 'form') return false

    // Primary check: list page if URL has no ID parameter (no /:id in the route)
    const hasIdParam = routeParams && Object.keys(routeParams).length > 0
    const isSpecialRoute =
      routePath.includes('/dashboard/') ||
      routePath === '/' ||
      routePath.includes('/login') ||
      routePath.includes('/settings')

    // List page if no parameters and not a special route
    return !hasIdParam && !isSpecialRoute
  }

  // Add a form page to the visited form pages stack
  const addVisitedFormPage = (
    routePath: string,
    routeParams: any,
    routeMeta: any,
  ) => {
    const { doctype, docId } = extractRouteInfo(routePath, routeParams)
    const label = generateRouteLabel(routePath, routeParams, routeMeta)

    // Don't track certain routes
    const skipRoutes = ['/login', '/404', '/test-page', '/settings']
    if (skipRoutes.some((skip) => routePath.includes(skip))) {
      return
    }

    // Don't track new record creation pages
    if (routePath.includes('/new') || docId === 'new') {
      return
    }

    // Check if this exact page is already the most recent
    const mostRecent = visitedFormPages.value[0]
    if (
      mostRecent &&
      mostRecent.path === routePath &&
      mostRecent.docId === docId
    ) {
      return // Don't add duplicate consecutive entries
    }

    const newPage: VisitedFormPage = {
      path: routePath,
      label,
      doctype: doctype || undefined,
      docId: docId || undefined,
      timestamp: Date.now(),
    }

    // Add to the beginning of the array (most recent first)
    visitedFormPages.value.unshift(newPage)

    // Keep only the last MAX_FORM_PAGES
    ensureMaxBreadcrumbs()
  }

  // Clear form pages history (when visiting list pages or navbar navigation)
  const clearFormHistory = () => {
    visitedFormPages.value = []
    ensureMaxBreadcrumbs()
  }

  // Generate breadcrumbs from visited form pages
  const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    if (visitedFormPages.value.length === 0) {
      return []
    }

    // Get all form pages including the current one (which is at index 0)
    // Limit to maximum breadcrumbs
    const allFormPages = visitedFormPages.value.slice(0, MAX_FORM_PAGES)

    // Convert to breadcrumb items (reverse order so oldest is first)
    const crumbs: BreadcrumbItem[] = allFormPages
      .slice() // Create a copy to avoid mutating the original
      .reverse()
      .map((page, index) => ({
        label: page.label,
        route: index === allFormPages.length - 1 ? null : page.path, // Last item (current page) has no link
        doctype: page.doctype,
        docId: page.docId,
      }))

    return crumbs
  })

  // Determine if we should show breadcrumbs
  const showBreadcrumbs = computed(() => {
    // Show breadcrumbs only on form pages and if we have visited form pages
    if (visitedFormPages.value.length === 0) return false

    // Check if current route is a form page
    return isFormPage(route.path, route.params, route.meta)
  })

  // Get recent document IDs for a specific doctype
  const getRecentDocIds = (doctype: string): string[] => {
    return visitedFormPages.value
      .filter(
        (page) =>
          page.doctype === doctype && page.docId && page.docId !== 'new',
      )
      .slice(0, MAX_FORM_PAGES) // Use the same limit as breadcrumbs
      .map((page) => page.docId!)
  }

  // Navigate to a breadcrumb item
  const navigateToBreadcrumb = (item: BreadcrumbItem) => {
    if (item.route) {
      router.push(item.route)
    }
  }

  // Watch for route changes and handle form/list page logic
  watch(
    () => route.fullPath,
    () => {
      const currentPath = route.path
      const currentParams = route.params
      const currentMeta = route.meta

      if (isListPage(currentPath, currentParams, currentMeta)) {
        // Reset breadcrumbs when visiting a list page
        clearFormHistory()
      } else if (isFormPage(currentPath, currentParams, currentMeta)) {
        // Add to breadcrumbs when visiting a form page
        addVisitedFormPage(currentPath, currentParams, currentMeta)
      }
    },
    { immediate: true, flush: 'sync' },
  )

  return {
    breadcrumbs,
    showBreadcrumbs,
    visitedFormPages: computed(() => visitedFormPages.value),
    getRecentDocIds,
    clearFormHistory,
    navigateToBreadcrumb,
    addVisitedFormPage,
  }
}
