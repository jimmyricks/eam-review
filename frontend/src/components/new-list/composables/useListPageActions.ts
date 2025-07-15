import { useRouter } from 'vue-router'
import type { ListRecord } from '@/types/Lists'
import { doctypeToRoute } from '@/utils/slugify'

/**
 * Composable for list page actions and navigation
 * @param doctype - The doctype for navigation
 * @param routePath - Custom route path (optional)
 */
export function useListPageActions(doctype: string, routePath?: string) {
  const router = useRouter()

  /**
   * Get the base route for the doctype
   */
  const getBaseRoute = (): string => {
    if (routePath) return routePath
    return `/${doctypeToRoute(doctype)}`
  }

  /**
   * Handle adding a new record
   */
  const handleAddRecord = () => {
    const route = `${getBaseRoute()}/new`
    router.push(route)
  }

  /**
   * Handle row click navigation
   */
  const handleRowClick = (record: ListRecord) => {
    const route = `${getBaseRoute()}/${record.name}`
    router.push(route)
  }

  /**
   * Navigate to a specific record
   */
  const navigateToRecord = (recordName: string) => {
    const route = `${getBaseRoute()}/${recordName}`
    router.push(route)
  }

  /**
   * Navigate back to list
   */
  const navigateToList = () => {
    const route = getBaseRoute()
    router.push(route)
  }

  return {
    handleAddRecord,
    handleRowClick,
    navigateToRecord,
    navigateToList,
    getBaseRoute,
    doctypeToRoute,
  }
} 