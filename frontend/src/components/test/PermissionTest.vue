<template>
  <div class="p-8">
    <n-card title="Permission System Test">
      <div class="space-y-4">
        <div>
          <n-text tag="h3" class="text-lg font-semibold mb-2"
            >Cache Status</n-text
          >
          <n-space>
            <n-tag :type="cacheStats.isLoaded ? 'success' : 'warning'">
              {{ cacheStats.isLoaded ? 'Initialized' : 'Not Initialized' }}
            </n-tag>
            <n-tag type="info"> {{ cacheStats.roles }} User Roles </n-tag>
            <n-tag type="info"> {{ cacheStats.user }} User </n-tag>
          </n-space>
        </div>

        <div>
          <n-text tag="h3" class="text-lg font-semibold mb-2"
            >Test Doctype Permissions</n-text
          >
          <n-space>
            <n-select
              v-model:value="selectedDoctype"
              :options="doctypeOptions"
              placeholder="Select a doctype"
              style="width: 200px"
            />
            <n-button @click="testPermissions" :loading="testing">
              Test Permissions
            </n-button>
          </n-space>
        </div>

        <div v-if="permissionResults">
          <n-text tag="h3" class="text-lg font-semibold mb-2">
            Results for {{ selectedDoctype }}
          </n-text>
          <n-space>
            <n-tag :type="permissionResults.canCreate ? 'success' : 'error'">
              Create: {{ permissionResults.canCreate ? 'Yes' : 'No' }}
            </n-tag>
            <n-tag :type="permissionResults.canWrite ? 'success' : 'error'">
              Write: {{ permissionResults.canWrite ? 'Yes' : 'No' }}
            </n-tag>
            <n-tag :type="permissionResults.canRead ? 'success' : 'error'">
              Read: {{ permissionResults.canRead ? 'Yes' : 'No' }}
            </n-tag>
            <n-tag :type="permissionResults.canDelete ? 'success' : 'error'">
              Delete: {{ permissionResults.canDelete ? 'Yes' : 'No' }}
            </n-tag>
            <n-tag :type="permissionResults.canSubmit ? 'success' : 'error'">
              Submit: {{ permissionResults.canSubmit ? 'Yes' : 'No' }}
            </n-tag>
            <n-tag :type="permissionResults.canCancel ? 'success' : 'error'">
              Cancel: {{ permissionResults.canCancel ? 'Yes' : 'No' }}
            </n-tag>
            <n-tag :type="permissionResults.canExport ? 'success' : 'error'">
              Export: {{ permissionResults.canExport ? 'Yes' : 'No' }}
            </n-tag>
            <n-tag :type="permissionResults.canImport ? 'success' : 'error'">
              Import: {{ permissionResults.canImport ? 'Yes' : 'No' }}
            </n-tag>
            <n-tag :type="permissionResults.canPrint ? 'success' : 'error'">
              Print: {{ permissionResults.canPrint ? 'Yes' : 'No' }}
            </n-tag>
            <n-tag :type="permissionResults.canEmail ? 'success' : 'error'">
              Email: {{ permissionResults.canEmail ? 'Yes' : 'No' }}
            </n-tag>
          </n-space>
        </div>

        <div>
          <n-text tag="h3" class="text-lg font-semibold mb-2">Actions</n-text>
          <n-space>
            <n-button @click="refreshPermissions" :loading="testing">
              Refresh Permissions
            </n-button>
            <n-button @click="clearCache" type="warning">
              Clear Cache
            </n-button>
            <n-button @click="debugDoctype" type="info">
              Debug Doctype
            </n-button>
          </n-space>
        </div>

        <div v-if="error" class="mt-4">
          <n-alert type="error" :title="error" />
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NCard,
  NText,
  NSpace,
  NTag,
  NSelect,
  NButton,
  NAlert,
  useMessage,
  type SelectOption,
} from 'naive-ui'
import { useGlobalPermissions } from '@/composables/useGlobalPermissions'

// Composables
const message = useMessage()
const {
  canCreate,
  canWrite,
  canRead,
  canDelete,
  canSubmit,
  canCancel,
  canExport,
  canImport,
  canPrint,
  canEmail,
  hasRole,
  hasAnyRole,
  getAllowedModules,
  getUserInfo,
  clearPermissions,
  store,
} = useGlobalPermissions()

// State
const selectedDoctype = ref('Asset')
const testing = ref(false)
const error = ref('')
const permissionResults = ref<{
  canCreate: boolean
  canWrite: boolean
  canRead: boolean
  canDelete: boolean
  canSubmit: boolean
  canCancel: boolean
  canExport: boolean
  canImport: boolean
  canPrint: boolean
  canEmail: boolean
} | null>(null)

// Test doctypes
const doctypeOptions: SelectOption[] = [
  { label: 'Asset', value: 'Asset' },
  { label: 'Asset Class', value: 'Asset Class' },
  { label: 'Work Order', value: 'Work Order' },
  { label: 'Item', value: 'Item' },
  { label: 'Trade', value: 'Trade' },
  { label: 'Model', value: 'Model' },
]

// Cache stats
const cacheStats = computed(() => ({
  isLoaded: store.isLoaded,
  bootInfo: store.bootInfo ? 'Loaded' : 'Not loaded',
  user: store.userName || 'Unknown',
  roles: store.userRoles.length,
}))

// Test permissions for selected doctype
const testPermissions = async () => {
  if (!selectedDoctype.value) return

  testing.value = true
  error.value = ''

  try {
    // Test all permission types
    const results = {
      canCreate: canCreate(selectedDoctype.value),
      canWrite: canWrite(selectedDoctype.value),
      canRead: canRead(selectedDoctype.value),
      canDelete: canDelete(selectedDoctype.value),
      canSubmit: canSubmit(selectedDoctype.value),
      canCancel: canCancel(selectedDoctype.value),
      canExport: canExport(selectedDoctype.value),
      canImport: canImport(selectedDoctype.value),
      canPrint: canPrint(selectedDoctype.value),
      canEmail: canEmail(selectedDoctype.value),
    }

    permissionResults.value = results
    message.success('Permission test completed')
  } catch (err: any) {
    error.value = err.message || 'Failed to test permissions'
    message.error(error.value)
  } finally {
    testing.value = false
  }
}

// Refresh permissions
const refreshPermissions = async () => {
  try {
    testing.value = true
    error.value = ''

    // Clear and reload permissions
    clearPermissions()
    await store.fetchBootInfo()

    if (selectedDoctype.value) {
      await testPermissions()
    }

    message.success('Permissions refreshed successfully')
  } catch (err: any) {
    error.value = err.message || 'Failed to refresh permissions'
    message.error(error.value)
  } finally {
    testing.value = false
  }
}

// Clear cache
const clearCache = () => {
  clearPermissions()
  permissionResults.value = null
  error.value = ''
}

// Debug doctype permissions
const debugDoctype = async () => {
  if (!selectedDoctype.value) return

  try {
    testing.value = true
    error.value = ''

    console.log('🔍 Debug Doctype Permissions:', selectedDoctype.value)
    console.log('Boot Info:', store.bootInfo)
    console.log('User Permissions:', store.userPermissions)

    // Test permissions
    await testPermissions()

    message.success('Debug completed - check console for details')
  } catch (err: any) {
    error.value = err.message || 'Failed to debug permissions'
    message.error(error.value)
  } finally {
    testing.value = false
  }
}

// Initialize on mount
onMounted(() => {
  if (selectedDoctype.value) {
    testPermissions()
  }
})
</script>

<style scoped>
/* Additional styles if needed */
</style>
