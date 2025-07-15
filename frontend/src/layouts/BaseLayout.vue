<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NLayout,
  NLayoutSider,
  NLayoutFooter,
  NLayoutHeader,
  NLayoutContent,
  NButton,
  NIcon,
} from 'naive-ui'
import Navbar from '@/components/layout/Navbar.vue'
import Header from '@/components/layout/Header.vue'
import Breadcrumb from '@/components/layout/Breadcrumb.vue'
import {
  LayoutSidebarLeftCollapse,
  LayoutSidebarLeftExpand,
} from '@vicons/tabler'

// Sidebar collapse state (sync with localStorage)
const siderCollapsed = ref(localStorage.getItem('navbar-collapsed') === 'true')
watch(siderCollapsed, (val) =>
  localStorage.setItem('navbar-collapsed', val.toString()),
)

// Breadcrumb logic
interface BreadcrumbItem {
  label: string
  route: string | null
  doctype?: string
  docId?: string
}

const breadcrumbs = ref<BreadcrumbItem[]>([])
const router = useRouter()
const route = useRoute()

watch(
  () => route.fullPath,
  (newPath) => {
    const cleanPath = newPath.split('#')[0].split('?')[0]
    const segments = cleanPath.split('/').filter(Boolean)

    if (segments.length === 1) {
      const doctype = segments[0]
      breadcrumbs.value = [
        { label: capitalize(doctype), route: `/${doctype}`, doctype },
      ]
      return
    }

    if (segments.length >= 2) {
      const doctype = segments[0]
      const docId = segments[1]

      const doctypeCrumb: BreadcrumbItem = {
        label: capitalize(doctype),
        route: `/${doctype}`,
        doctype,
      }

      const docCrumb: BreadcrumbItem = {
        label: docId,
        route: `/${doctype}/${docId}`,
        doctype,
        docId,
      }

      const existingDocIndex = breadcrumbs.value.findIndex(
        (b) => b.route === docCrumb.route,
      )

      if (existingDocIndex === -1) {
        if (
          !breadcrumbs.value.some((b) => b.doctype === doctype && !b.docId) &&
          (breadcrumbs.value.length === 0 ||
            !breadcrumbs.value[breadcrumbs.value.length - 1].docId)
        ) {
          breadcrumbs.value.push(doctypeCrumb)
        }

        breadcrumbs.value.push(docCrumb)

        if (breadcrumbs.value.length > 3) {
          breadcrumbs.value = breadcrumbs.value.slice(-3)
        }
      } else {
        // Move existing doc crumb to end
        const existingCrumb = breadcrumbs.value.splice(existingDocIndex, 1)[0]
        breadcrumbs.value.push(existingCrumb)
      }
    }
  },
  { immediate: true },
)

function handleBreadcrumbNavigation(breadcrumb: BreadcrumbItem) {
  if (breadcrumb.route) {
    router.push(breadcrumb.route)
  }
}

function capitalize(word: string) {
  return word
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}
</script>
<template>
  <div class="h-screen overflow-hidden">
    <n-layout has-sider style="height: 100vh">
      <n-layout-sider
        bordered
        collapse-mode="transform"
        :collapsed-width="0"
        :width="260"
        :collapsed="siderCollapsed"
        @collapse="siderCollapsed = true"
        @expand="siderCollapsed = false"
      >
        <Navbar :collapsed="siderCollapsed" />
      </n-layout-sider>

      <n-layout>
        <n-layout-header bordered class="text-2xl font-semibold">
          <div class="h-20 flex items-center px-8 justify-between">
            <slot name="breadcrumb">
              <Breadcrumb
                :breadcrumbs="breadcrumbs"
                @navigate="handleBreadcrumbNavigation"
              />
            </slot>
            <Header />
          </div>
        </n-layout-header>

        <n-layout-content class="overflow-hidden">
          <div class="h-full">
            <slot />
          </div>
        </n-layout-content>
        <n-layout-footer
          position="fixed"
          :style="{
            height: '60px',
            left: siderCollapsed ? '0px' : '260px',
            zIndex: 1000,
          }"
          bordered
          class="flex items-center justify-between px-4"
        >
          <n-button
            @click="siderCollapsed = !siderCollapsed"
            size="large"
            text
            class="ml-4"
          >
            <template #icon>
              <n-icon>
                <component
                  :is="
                    siderCollapsed
                      ? LayoutSidebarLeftExpand
                      : LayoutSidebarLeftCollapse
                  "
                />
              </n-icon>
            </template>
          </n-button>

          <span
            class="text-sm text-gray-600 dark:text-gray-400 absolute left-1/2 transform -translate-x-1/2"
          >
            Cubeworks
          </span>
        </n-layout-footer>
      </n-layout>
    </n-layout>
  </div>
</template>

<style scoped>
/* Ensure no scrolling at any level */
:deep(.n-layout) {
  overflow: hidden !important;
}

:deep(.n-layout-sider) {
  overflow: hidden !important;
}

:deep(.n-layout-header) {
  overflow: hidden !important;
}

:deep(.n-layout-content) {
  overflow: hidden !important;
}

:deep(.n-layout-footer) {
  overflow: hidden !important;
}

/* Ensure the content area has proper height calculation */
:deep(.n-layout-content) {
  height: calc(
    100vh - 80px - 48px
  ) !important; /* 100vh - header height - footer height */
}
</style>
