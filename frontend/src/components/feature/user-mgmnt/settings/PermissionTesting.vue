<template>
  <n-space vertical :size="16">
    <n-card size="large">
      <n-thing content-indented>
        <template #header>Permission System Status</template>
        <template #header-extra>
          <n-space>
            <n-tag :type="cacheStats.isLoaded ? 'success' : 'warning'">
              {{ cacheStats.isLoaded ? 'Initialized' : 'Not Initialized' }}
            </n-tag>
            <n-tag type="info"> {{ cacheStats.roles }} User Roles </n-tag>
          </n-space>
        </template>
        Real-time permission system cache and initialization status.
      </n-thing>
    </n-card>

    <n-card size="large">
      <n-thing content-indented>
        <template #header>Test Doctype Permissions</template>
        <template #description>
          Test permission levels for specific doctypes to verify access control
        </template>

        <n-divider class="my-4" />

        <n-space vertical :size="12">
          <n-space align="center">
            <n-text>Doctype:</n-text>
            <n-select
              v-model:value="selectedDoctype"
              :options="doctypeOptions"
              placeholder="Select a doctype"
              style="width: 200px"
            />
            <n-button
              @click="testPermissions"
              :loading="loading"
              type="primary"
            >
              Test Permissions
            </n-button>
          </n-space>

          <div v-if="permissionResults" class="permission-results">
            <n-text tag="div" class="font-medium mb-2">
              Results for {{ selectedDoctype }}:
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
        </n-space>

        <template #action>
          <n-space>
            <n-button @click="refreshPermissions" :loading="loading">
              Refresh Permissions
            </n-button>
            <n-button @click="clearCache" type="warning" secondary>
              Clear Cache
            </n-button>
            <n-button @click="debugDoctype" type="info" secondary>
              Debug Doctype
            </n-button>
          </n-space>
        </template>
      </n-thing>
    </n-card>

    <n-card size="large" v-if="error">
      <n-alert type="error" :title="error" />
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NCard,
  NSpace,
  NTag,
  NSelect,
  NButton,
  NAlert,
  NText,
  NThing,
  NDivider,
  useMessage,
  type SelectOption,
} from 'naive-ui'
import { useGlobalPermissions } from '@/composables/useGlobalPermissions'

const message = useMessage()

// Composables
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
const loading = ref(false)
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
  { label: 'Location', value: 'Location' },
  { label: 'Position', value: 'Position' },
  { label: 'Inventory', value: 'Inventory' },
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

  try {
    loading.value = true
    error.value = ''

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
    loading.value = false
  }
}

// Refresh permissions
const refreshPermissions = async () => {
  try {
    loading.value = true
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
    loading.value = false
  }
}

// Clear cache
const clearCache = () => {
  clearPermissions()
  permissionResults.value = null
  error.value = ''
  message.info('Permission cache cleared')
}

// Debug doctype permissions
const debugDoctype = async () => {
  if (!selectedDoctype.value) return

  try {
    loading.value = true
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
    loading.value = false
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
.permission-results {
  padding: 12px;
  background-color: var(--n-color-target);
  border-radius: 6px;
  border: 1px solid var(--n-border-color);
}
</style>
