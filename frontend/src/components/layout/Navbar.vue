<script setup lang="ts">
import { ref, h, watchEffect, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NMenu, NIcon } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import type { Component } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { usePermissionsStore } from '@/stores/permissions'
import { useAuthStore } from '@/stores/auth.store'
import {
  List,
  ClipboardList,
  CalendarEvent,
  CalendarStats,
  Settings,
  Clipboard,
  Users,
  UserSearch,
  UserCheck,
  Map2,
  Location,
  FileAnalytics,
  Puzzle,
  Receipt,
  Tag,
  Tool,
  TransferIn,
  ListCheck,
  ReportSearch,
  Box,
  Scale,
  Sitemap,
  BuildingStore,
  FileInvoice,
  Puzzle2,
  BuildingWarehouse,
  Subtask,
  Tags,
} from '@vicons/tabler'

const props = defineProps<{
  collapsed?: boolean
}>()

const activeKey = ref<string | null>(null)
const router = useRouter()
const route = useRoute()
const settingsStore = useSettingsStore()
const { isDarkMode } = settingsStore
const permissionsStore = usePermissionsStore()
const authStore = useAuthStore()

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const RAW_MENU_OPTIONS: MenuOption[] = [
  {
    type: 'group',
    label: 'Asset Management',
    key: 'AssetManagementGroup',
    children: [
      {
        label: 'Asset',
        key: 'Asset',
        icon: renderIcon(List),
        path: '/asset',
      },
      {
        label: 'Disposed',
        key: 'Disposed',
        icon: renderIcon(List),
        path: '/disposed',
      },
      {
        label: 'Asset Class',
        key: 'AssetClass',
        icon: renderIcon(Tags),
        path: '/asset-class',
      },
      {
        label: 'Position',
        key: 'Position',
        icon: renderIcon(Location),
        path: '/position',
      },
      {
        label: 'Equipment',
        key: 'Equipment',
        icon: renderIcon(Puzzle2),
        path: '/equipment',
      },
      {
        label: 'Setup',
        key: 'AssetSetup',
        icon: renderIcon(Settings),
        children: [
          {
            label: 'Property',
            key: 'Property',
            icon: renderIcon(Tag),
            path: '/property',
          },
          {
            label: 'System',
            key: 'System',
            icon: renderIcon(Tool),
            path: '/system',
          },
          {
            label: 'Location',
            key: 'Location',
            icon: renderIcon(Map2),
            path: '/location',
          },
        ],
      },
    ],
  },
  {
    type: 'group',
    label: 'Maintenance Management',
    key: 'MaintenanceGroup',
    children: [
      {
        label: 'Maintenance Activity',
        key: 'MaintenanceActivity',
        icon: renderIcon(CalendarEvent),
        path: '/maintenance-activity',
      },
      {
        label: 'Maintenance Plan',
        key: 'MaintenancePlan',
        icon: renderIcon(CalendarStats),
        path: '/maintenance-plan',
      },
      {
        label: 'Maintenance Request',
        key: 'MaintenanceRequest',
        icon: renderIcon(Clipboard),
        path: '/maintenance-request',
      },
      {
        label: 'Maintenance Order',
        key: 'MaintenanceOrder',
        icon: renderIcon(FileInvoice),
        path: '/maintenance-order',
      },
    ],
  },
  {
    type: 'group',
    label: 'Work Management',
    key: 'WorkGroup',
    children: [
      {
        label: 'Work Order',
        key: 'WorkOrder',
        icon: renderIcon(Clipboard),
        path: '/work-order',
      },
    ],
  },
  {
    type: 'group',
    label: 'Procurement',
    key: 'ProcurementGroup',
    children: [
      {
        label: 'Item',
        key: 'Item',
        icon: renderIcon(Clipboard),
        path: '/item',
      },
      {
        label: 'Item Class',
        key: 'ItemClass',
        icon: renderIcon(Tags),
        path: '/item-class',
      },
      {
        label: 'Inventory',
        key: 'Inventory',
        icon: renderIcon(ListCheck),
        path: '/inventory',
      },
      {
        label: 'Purchase Request',
        key: 'PurchaseRequest',
        icon: renderIcon(Clipboard),
        path: '/purchase-request',
      },
      {
        label: 'Purchase Receipt',
        key: 'PurchaseReceipt',
        icon: renderIcon(Receipt),
        path: '/purchase-receipt',
      },
      {
        label: 'Transfer',
        key: 'Transfer',
        icon: renderIcon(TransferIn),
        path: '/transfer',
      },
      {
        label: 'Transfer Receipt',
        key: 'TransferReceipt',
        icon: renderIcon(Receipt),
        path: '/transfer-receipt',
      },
      {
        label: 'Inspection',
        key: 'Inspection',
        icon: renderIcon(ReportSearch),
        path: '/inspection',
      },
      {
        label: 'Setup',
        key: 'ProcurementSetup',
        icon: renderIcon(Settings),
        children: [
          {
            label: 'Vendor',
            key: 'Vendor',
            icon: renderIcon(Users),
            path: '/vendor',
          },
          {
            label: 'Store',
            key: 'Store',
            icon: renderIcon(BuildingStore),
            path: '/store',
          },
          {
            label: 'Bin',
            key: 'Bin',
            icon: renderIcon(Box),
            path: '/bin',
          },
          {
            label: 'Unit of Measure',
            key: 'UnitOfMeasure',
            icon: renderIcon(Scale),
            path: '/unit-of-measure',
          },
        ],
      },
    ],
  },
  {
    type: 'group',
    label: 'Core/System',
    key: 'CoreSystemGroup',
    children: [
      {
        label: 'Organizational Unit',
        key: 'OrganizationalUnit',
        icon: renderIcon(Sitemap),
        path: '/organizational-unit',
      },
      {
        label: 'Contractor',
        key: 'Contractor',
        icon: renderIcon(BuildingWarehouse),
        path: '/contractor',
      },
      {
        label: 'Employee',
        key: 'Employee',
        icon: renderIcon(UserCheck),
        path: '/employee',
      },
      {
        label: 'Labor',
        key: 'Labor',
        icon: renderIcon(Subtask),
        path: '/labor',
      },
      {
        label: 'Trade',
        key: 'Trade',
        icon: renderIcon(UserSearch),
        path: '/trade',
      },
      {
        label: 'Manufacturer',
        key: 'Manufacturer',
        icon: renderIcon(BuildingWarehouse),
        path: '/manufacturer',
      },
      {
        label: 'Model',
        key: 'Model',
        icon: renderIcon(Box),
        path: '/model',
      },
    ],
  },
]

const menuOptions = ref<MenuOption[]>([])

/**
 * Filter menu options based on can_read permissions from boot_info
 */
const filterMenuByPermissions = (options: MenuOption[]): MenuOption[] => {
  return options
    .map((group) => {
      if (group.type === 'group' && group.children) {
        const filteredChildren = group.children.filter((item) => {
          // Check if item has a path (which indicates a doctype)
          if ('path' in item && item.path && typeof item.path === 'string') {
            // Extract doctype from path (e.g., '/asset' -> 'Asset')
            const doctype = item.path
              .substring(1)
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (l: string) => l.toUpperCase())
            return permissionsStore.canRead(doctype)
          }

          // For nested children (like Setup sections)
          if (
            'children' in item &&
            item.children &&
            Array.isArray(item.children)
          ) {
            const filteredNestedChildren = item.children.filter(
              (nestedItem: any) => {
                if (
                  'path' in nestedItem &&
                  nestedItem.path &&
                  typeof nestedItem.path === 'string'
                ) {
                  const doctype = nestedItem.path
                    .substring(1)
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, (l: string) => l.toUpperCase())
                  return permissionsStore.canRead(doctype)
                }
                return true
              },
            )

            // Only include parent if it has visible children
            if (filteredNestedChildren.length > 0) {
              return {
                ...item,
                children: filteredNestedChildren,
              }
            }
            return false
          }

          return true
        })

        // Only include group if it has visible children
        if (filteredChildren.length > 0) {
          return {
            ...group,
            children: filteredChildren,
          }
        }
        return null
      }
      return group
    })
    .filter((item): item is MenuOption => item !== null)
}

onMounted(async () => {
  try {
    // Only fetch permissions if authenticated
    if (authStore.isAuthenticated && !permissionsStore.isLoaded) {
      await permissionsStore.fetchBootInfo()
    }
    // Filter menu options based on permissions
    menuOptions.value = filterMenuByPermissions(RAW_MENU_OPTIONS)
    updateActiveKey(route.path)
  } catch (error) {
    console.error('Failed to load permissions or filter menu options:', error)
    // Fallback to showing all menu options if permissions fail to load
    menuOptions.value = RAW_MENU_OPTIONS
    updateActiveKey(route.path)
  }
})

function updateActiveKey(path: string) {
  activeKey.value = findMenuKeyByPath(path, menuOptions.value)
}

function findMenuKeyByPath(path: string, options: MenuOption[]): string | null {
  for (const option of options) {
    if ('path' in option && option.path === path) return option.key as string
    if ('children' in option && option.children) {
      const foundKey = findMenuKeyByPath(path, option.children)
      if (foundKey) return foundKey
    }
  }
  return null
}

function handleMenuClick(key: string) {
  const findOption = (options: MenuOption[]): MenuOption | null => {
    for (const option of options) {
      if (option.key === key) return option
      if ('children' in option && option.children) {
        const found = findOption(option.children)
        if (found) return found
      }
    }
    return null
  }

  const option = findOption(menuOptions.value)
  if (option && 'path' in option && option.path) {
    router.push(option.path)
  }
}

watchEffect(() => {
  updateActiveKey(route.path)
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-shrink-0 p-4">
      <div class="flex items-center my-2 space-x-2 pl-2">
        <div class="w-10 h-10 flex items-center justify-center">
          <img
            v-if="!isDarkMode"
            src="/metpower.png"
            alt="METPower Logo"
            class="w-10 h-10 object-contain"
          />
          <img
            v-else
            src="/metpower-white.png"
            alt="METPower Logo"
            class="w-10 h-10 object-contain"
          />
        </div>
        <div>
          <h1 class="text-md font-semibold text-gray-900 dark:text-gray-100">
            METPower
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-500 tracking-[0px]">
            Enterprise Asset Management
          </p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto min-h-0">
      <div class="py-1">
        <n-menu
          v-model:value="activeKey"
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :root-indent="16"
          :icon-size="18"
          :indent="16"
          @update:value="handleMenuClick"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ✅ Fix group title styling */
:deep(.n-menu-item-group-title) {
  font-size: 13px !important;
  font-weight: 550 !important;
  color: rgb(150, 150, 150) !important; /* gray-400 */
  height: 24px !important;
  padding-left: 28px !important;
}

:deep(.n-menu-item-group) {
  padding-bottom: 12px !important;
}

/* Style normal (inactive) menu items */
:deep(.n-menu-item-content) {
  font-size: 13px;
  font-weight: 550;
}
</style>
