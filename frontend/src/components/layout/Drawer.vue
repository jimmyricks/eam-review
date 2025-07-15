<script setup lang="ts">
import { ref, h, watchEffect, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NMenu, NIcon, NScrollbar } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import type { Component } from 'vue'
import {
  ShapesOutline as AssetClassIcon,
  ListOutline as AssetsIcon,
  FileTrayOutline as AssetPropertyIcon,
  GridOutline as DashboardIcon,
  LocationOutline as LocationIcon,
  GitCompareOutline as PositionRelationIcon,
  Analytics as PositionsIcon,
  CogOutline as SystemIcon,
  OptionsOutline as PropertyIcon,
  ArrowUpCircleOutline as PurchaseRequestIcon,
  DownloadOutline as PurchaseReceiptIcon,
  ReturnUpBackOutline as PurchaseReturnIcon,
  ListOutline as InventoryIcon,
  ArrowRedoCircleOutline as TransferIcon,
  CheckboxOutline as InspectionIcon,
  ClipboardOutline as MaintenancePlanIcon,
  CalendarOutline as MaintenanceScheduleIcon,
  CubeOutline as MaintenanceActivityIcon,
  PaperPlaneOutline as MaintenanceRequestIcon,
  OpenOutline as MaintenanceOrderIcon,
  BuildOutline as WorkOrderIcon,
  DocumentOutline as WorkScheduleIcon,
  PeopleOutline as WorkOrderLaborIcon,
  HammerOutline as WorkOrderEquipmentIcon,
  DiceOutline as WorkOrderPartsIcon,
  CartOutline as VendorIcon,
  BusinessOutline as StoreIcon,
  StorefrontOutline as BinIcon,
  PricetagsOutline as UoMIcon,
  PeopleOutline as EmployeeIcon,
  BookmarkOutline as ContractorIcon,
  BodyOutline as TradeIcon,
  BusinessOutline as ManufacturerIcon,
  DiscOutline as ModelIcon,
  PeopleOutline as LaborIcon,
  PersonOutline as UserIcon,
  Settings as SettingsIcon,
} from '@vicons/tabler'

const emit = defineEmits<{
  (e: 'menu-click'): void
}>()

const activeKey = ref<string | null>(null)
const router = useRouter()
const route = useRoute()

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const baseMenuOptions: MenuOption[] = [
  {
    label: 'Asset Management',
    key: 'AssetManagement',
    icon: renderIcon(DashboardIcon),
    children: [
      {
        label: 'Dashboard',
        key: 'AssetDashboard',
        icon: renderIcon(DashboardIcon),
        path: '/dashboard/asset-management',
      },
      {
        label: 'Asset',
        key: 'Asset',
        icon: renderIcon(AssetsIcon),
        path: '/asset',
      },
      {
        label: 'Asset Class',
        key: 'AssetClass',
        icon: renderIcon(AssetClassIcon),
        path: '/asset-class',
      },
      {
        label: 'Position',
        key: 'Position',
        icon: renderIcon(PositionsIcon),
        path: '/position',
      },
      {
        label: 'Equipment',
        key: 'Equipment',
        icon: renderIcon(AssetsIcon),
        path: '/equipment',
      },
      {
        label: 'Setup',
        key: 'setup',
        icon: renderIcon(SystemIcon),
        children: [
          {
            label: 'Property',
            key: 'Property',
            icon: renderIcon(PropertyIcon),
            path: '/property',
          },
          {
            label: 'System',
            key: 'System',
            icon: renderIcon(SystemIcon),
            path: '/system',
          },
          {
            label: 'Location',
            key: 'Location',
            icon: renderIcon(LocationIcon),
            path: '/location',
          },
        ],
      },
    ],
  },
  {
    key: 'divider-1',
    type: 'divider',
    props: {},
  },
  {
    label: 'Maintenance Management',
    key: 'MaintenanceManagement',
    icon: renderIcon(MaintenanceActivityIcon),
    children: [
      {
        label: 'Dashboard',
        key: 'MaintenanceDashboard',
        icon: renderIcon(DashboardIcon),
        path: '/dashboard/maintenance-management',
      },
      {
        label: 'Maintenance Activity',
        key: 'MaintenanceActivity',
        icon: renderIcon(MaintenanceActivityIcon),
        path: '/maintenance-activity',
      },
      {
        label: 'Maintenance Plan',
        key: 'MaintenancePlan',
        icon: renderIcon(MaintenancePlanIcon),
        path: '/maintenance-plan',
      },
      {
        label: 'Maintenance Request',
        key: 'MaintenanceRequest',
        icon: renderIcon(MaintenanceRequestIcon),
        path: '/maintenance-request',
      },
      {
        label: 'Maintenance Order',
        key: 'MaintenanceOrder',
        icon: renderIcon(MaintenanceOrderIcon),
        path: '/maintenance-order',
      },
    ],
  },
  {
    key: 'divider-2',
    type: 'divider',
    props: {},
  },
  {
    label: 'Work Management',
    key: 'WorkManagement',
    icon: renderIcon(WorkOrderIcon),
    children: [
      {
        label: 'Dashboard',
        key: 'WorkDashboard',
        icon: renderIcon(DashboardIcon),
        path: '/dashboard/work-management',
      },
      {
        label: 'Work Order',
        key: 'WorkOrder',
        icon: renderIcon(WorkOrderIcon),
        path: '/work-order',
      },
    ],
  },
  {
    key: 'divider-3',
    type: 'divider',
    props: {},
  },
  {
    label: 'Procurement',
    key: 'Procurement',
    icon: renderIcon(AssetsIcon),
    children: [
      {
        label: 'Dashboard',
        key: 'PurchasingStoreDashboard',
        icon: renderIcon(DashboardIcon),
        path: '/dashboard/purchasing-store',
      },
      {
        label: 'Item',
        key: 'Item',
        icon: renderIcon(AssetsIcon),
        path: '/item',
      },
      {
        label: 'Inventory',
        key: 'Inventory',
        icon: renderIcon(InventoryIcon),
        path: '/inventory',
      },
      {
        label: 'Purchase Request',
        key: 'PurchaseRequest',
        icon: renderIcon(PurchaseRequestIcon),
        path: '/purchase-request',
      },
      {
        label: 'Purchase Receipt',
        key: 'PurchaseReceipt',
        icon: renderIcon(PurchaseReceiptIcon),
        path: '/purchase-receipt',
      },
      {
        label: 'Transfer',
        key: 'Transfer',
        icon: renderIcon(TransferIcon),
        path: '/transfer',
      },
      {
        label: 'Inspection',
        key: 'Inspection',
        icon: renderIcon(InspectionIcon),
        path: '/inspection',
      },
      {
        label: 'Setup',
        key: 'setup',
        icon: renderIcon(SystemIcon),
        children: [
          {
            label: 'Vendor',
            key: 'Vendor',
            icon: renderIcon(VendorIcon),
            path: '/vendor',
          },
          {
            label: 'Store',
            key: 'Store',
            icon: renderIcon(StoreIcon),
            path: '/store',
          },
          {
            label: 'Bin',
            key: 'Bin',
            icon: renderIcon(BinIcon),
            path: '/bin',
          },
          {
            label: 'Unit of Measure',
            key: 'UnitOfMeasure',
            icon: renderIcon(UoMIcon),
            path: '/unit-of-measure',
          },
        ],
      },
    ],
  },
  {
    key: 'divider-4',
    type: 'divider',
    props: {},
  },
  {
    label: 'Core/System',
    key: 'CoreSystem',
    icon: renderIcon(SystemIcon),
    children: [
      {
        label: 'Dashboard',
        key: 'CoreDashboard',
        icon: renderIcon(DashboardIcon),
        path: '/dashboard/core',
      },
      {
        label: 'Contractor',
        key: 'contractor',
        icon: renderIcon(ContractorIcon),
        path: '/contractor',
      },
      {
        label: 'Employee',
        key: 'employee',
        icon: renderIcon(EmployeeIcon),
        path: '/employee',
      },
      {
        label: 'Labor',
        key: 'labor',
        icon: renderIcon(LaborIcon),
        path: '/labor',
      },
      {
        label: 'Labor Availability',
        key: 'LaborAvailability',
        icon: renderIcon(LaborIcon),
        path: '/labor-availability',
      },
      {
        label: 'Trade',
        key: 'trade',
        icon: renderIcon(TradeIcon),
        path: '/trade',
      },
      {
        label: 'Manufacturer',
        key: 'manufacturer',
        icon: renderIcon(ManufacturerIcon),
        path: '/manufacturer',
      },
      {
        label: 'Model',
        key: 'model',
        icon: renderIcon(ModelIcon),
        path: '/model',
      },
    ],
  },
]

// Set active key based on current route
function updateActiveKey(path: string) {
  activeKey.value = findMenuKeyByPath(path, baseMenuOptions)
}

// Directly use baseMenuOptions, assuming backend handles permissions
const menuOptions = computed(() => baseMenuOptions)

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
    // Emit menu click to close the drawer
    emit('menu-click')
  }
}

// Watch for route changes to update active key
watchEffect(() => {
  const path = route.path
  updateActiveKey(path)
})

const defaultExpandedKeys = [
  'AssetManagement',
  'MaintenanceManagement',
  'WorkManagement',
  'Procurement',
  'CoreSystem',
]
</script>

<template>
  <div class="navigation-drawer">
    <n-scrollbar style="max-height: 100%">
      <n-menu
        v-model:value="activeKey"
        :collapsed="false"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :default-expanded-keys="defaultExpandedKeys"
        :root-indent="20"
        @update:value="handleMenuClick"
        class="drawer-menu"
      />
    </n-scrollbar>
  </div>
</template>

<style scoped>
.navigation-drawer {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-menu {
  flex-grow: 1;
}

/* Ensure the scrollbar applies correctly */
.n-scrollbar {
  flex-grow: 1;
}
</style>
