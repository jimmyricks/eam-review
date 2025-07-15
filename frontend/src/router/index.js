import { createRouter, createWebHistory } from 'vue-router'
import { useAuthentication } from '@/composables/useAuthentication'
import { useAuthStore } from '@/stores/auth.store'

// Consolidated routes
const routes = [
  // Asset Management Routes
  {
    path: '/dashboard/asset-management',
    name: 'AssetDashboard',
    component: () => import('@/pages/asset-mgmt/AssetDashboard.vue'),
    meta: { requiresAuth: true, breadcrumb: 'Dashboard' },
  },
  {
    path: '/service-test',
    name: 'ServiceTest',
    component: () => import('@/components/test/ServiceTest.vue'),
  },
  {
    path: '/permission-test',
    name: 'PermissionTest',
    component: () => import('@/components/test/PermissionTest.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/cache-test',
    name: 'CacheTest',
    component: () => import('@/components/test/CacheTest.vue'),
    meta: { requiresAuth: true },
  },

  // Maintenance Management Routes
  {
    path: '/dashboard/maintenance-management',
    name: 'MaintenanceDashboard',
    component: () => import('@/pages/maintenance-mgmt/MaintenanceDashboard.vue'),
    meta: { requiresAuth: true, breadcrumb: 'Dashboard' },
  },

  // Work Management Routes
  {
    path: '/dashboard/work-management',
    name: 'WorkDashboard',
    component: () => import('@/pages/work-mgmt/WorkDashboard.vue'),
    meta: { requiresAuth: true, breadcrumb: 'Dashboard' },
  },

  // Procurement Routes
  {
    path: '/dashboard/purchasing-store',
    name: 'PurchaseDashboard',
    component: () => import('@/pages/prcrmt/PurchaseDashboard.vue'),
    meta: { requiresAuth: true, breadcrumb: 'Dashboard' },
  },
  {
    path: '/receiving',
    name: 'ReceivingList',
    component: () => import('@/pages/prcrmt/receiving/List.vue'),
    meta: { layout: 'list', requiresAuth: true },
  },
  {
    path: '/receiving/:receivingId',
    name: 'ReceivingForm',
    component: () => import('@/pages/prcrmt/receiving/Form.vue'),
    meta: { layout: 'form', requiresAuth: true },
  },

  // Core Routes
  {
    path: '/dashboard/core',
    name: 'CoreDashboard',
    component: () => import('@/pages/core/CoreDashboard.vue'),
    meta: { requiresAuth: true },
  },

  // Common routes
  {
    path: '/',
    name: 'LandingPage',
    component: () => import('@/pages/common/LandingPage.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/common/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/common/SettingsPage.vue'),
    meta: { requiresAuth: true },
  },

  // Generic routes for any doctype
  {
    path: '/:doctype',
    name: 'GenericList',
    component: () => import('@/pages/GenericList.vue'),
    meta: { layout: 'list', requiresAuth: true },
  },
  {
    path: '/:doctype/:id',
    name: 'GenericForm',
    component: () => import('@/pages/GenericForm.vue'),
    meta: { layout: 'form', requiresAuth: true },
  },

  // Forbidden route
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('@/pages/Forbidden.vue'),
    meta: { requiresAuth: false },
  },

  // 404 catch-all route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/common/NotFound.vue'),
    meta: { requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory('/frontend'),
  routes,
})

// Authentication/permission cache guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  authStore.loadCachedUserInfo()
  if (!authStore.isAuthenticated) {
    if (to.name !== 'Login') {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  } else {
    if (to.name === 'Login') {
      next({ name: 'LandingPage' })
      return
    }
  }
  next()
})

export default router
