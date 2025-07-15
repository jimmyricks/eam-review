<script setup lang="ts">
import {
  NLayoutHeader,
  NText,
  NAvatar,
  NSpace,
  NIcon,
  NButton,
  NTooltip,
  NDropdown,
  NDivider,
  useMessage,
} from 'naive-ui'
import { Bell } from '@vicons/tabler'
import Search from '@/components/base/Search.vue'
import { h, ref, computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useFrappeSDK } from '@/composables/useFrappeSDK'
import { useAuthStore } from '@/stores/auth.store'
import { usePermissionsStore } from '@/stores/permissions'
import { storeToRefs } from 'pinia'

const router = useRouter()
const message = useMessage()
const { logout } = useFrappeSDK()
const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()

// Get reactive refs from the stores
const { isAuthenticated, userName } = storeToRefs(authStore)
const { isLoading: isBootInfoLoading } = storeToRefs(permissionsStore)

const emit = defineEmits<{
  (e: 'search', value: string): void
}>()

function handleSearch(searchText: string) {
  emit('search', searchText)
}

function renderIcon(icon: any) {
  return () => h(icon)
}

const userOptions = computed(() => {
  const baseOptions = [
    {
      label: 'Refresh Boot Info',
      key: 'refresh-boot-info',
      disabled: isBootInfoLoading.value,
    },
  ]

  if (isAuthenticated.value) {
    return [
      {
        label: 'User Settings',
        key: 'settings',
      },
      ...baseOptions,
      {
        type: 'divider',
        key: 'd1',
      },
      {
        label: 'Logout',
        key: 'logout',
      },
    ]
  } else {
    return [
      ...baseOptions,
      {
        type: 'divider',
        key: 'd1',
      },
      {
        label: 'Login',
        key: 'login',
      },
    ]
  }
})

async function handleUserAction(key: string) {
  if (key === 'logout') {
    logout()
      .then(() => {
        message.success('Logged out successfully')
        authStore.clearUserInfo()
        permissionsStore.clearPermissions()
        router.push('/login')
      })
      .catch((error) => {
        console.error('Logout failed:', error)
        message.error('Logout failed')
        authStore.clearUserInfo()
        permissionsStore.clearPermissions()
        router.push('/login')
      })
  } else if (key === 'settings') {
    router.push('/settings')
  } else if (key === 'login') {
    router.push('/login')
  } else if (key === 'refresh-boot-info') {
    try {
      await permissionsStore.refreshBootInfo()
      message.success('Boot info refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh boot info:', error)
      message.error('Failed to refresh boot info')
    }
  }
}
</script>

<template>
  <div class="flex items-center justify-between h-20 w-full">
    <!-- Left side: Breadcrumb -->
    <div class="flex-shrink-0">
      <slot name="breadcrumb" />
    </div>

    <!-- Right side: Search, Notifications, User Avatar -->
    <div class="flex items-center space-x-3">
      <Search @search="handleSearch" />
      <n-divider vertical />
      <n-button text size="large">
        <template #icon>
          <n-icon>
            <Bell />
          </n-icon>
        </template>
      </n-button>
      <n-dropdown
        :options="userOptions"
        @select="handleUserAction"
        trigger="click"
      >
        <n-button text>
          <n-avatar round size="small">
            {{ userName ? userName.substring(0, 1).toUpperCase() : 'U' }}
          </n-avatar>
        </n-button>
      </n-dropdown>
    </div>
  </div>
</template>

<style scoped>
/* Keep minimal styles for the simplified header */
</style>
