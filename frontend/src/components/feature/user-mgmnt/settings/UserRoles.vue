<template>
  <n-card size="large" class="mb-8">
    <n-thing content-indented>
      <template #header> Roles & Permissions </template>
      <template #header-extra>
        <n-button v-if="!isEditing" @click="handleEdit" size="medium">
          Edit Roles
        </n-button>
        <n-button-group>
          <n-button
            v-if="isEditing"
            @click="handleSave"
            :loading="saving"
            :disabled="saving"
            type="primary"
          >
            Save
          </n-button>
          <n-button v-if="isEditing" @click="handleCancel" :disabled="saving">
            Cancel
          </n-button>
        </n-button-group>
      </template>

      Manage your roles and permissions. Changes will take effect after saving.
      <n-divider />
      <template #footer>
        <n-spin :show="loading">
          <n-space vertical :size="0">
            <div v-if="availableRoles.length > 0">
              <n-grid :cols="3" :x-gap="24" :y-gap="0">
                <n-gi v-for="roleName in availableRoles" :key="roleName">
                  <n-checkbox
                    size="medium"
                    :checked="isRoleAssigned(roleName)"
                    :disabled="!isEditing"
                    @update:checked="
                      (checked) => handleRoleChange(roleName, checked)
                    "
                  >
                    {{ roleName }}
                  </n-checkbox>
                </n-gi>
              </n-grid>
            </div>

            <!-- Empty State -->
            <n-empty
              v-else
              description="No roles found or could not load roles."
              size="medium"
            />

            <!-- Current Roles Summary -->
            <div v-if="currentRoles.length > 0">
              <n-divider />
              <n-text strong>Current Roles:</n-text>
              <n-space class="mt-2">
                <n-tag
                  v-for="role in currentRoles"
                  :key="role"
                  type="info"
                  size="medium"
                >
                  {{ role }}
                </n-tag>
              </n-space>
            </div>
          </n-space>
        </n-spin>
      </template>
    </n-thing>
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NCard,
  NSpace,
  NText,
  NButton,
  NSpin,
  NGrid,
  NGi,
  NCheckbox,
  NDivider,
  NEmpty,
  NThing,
  NButtonGroup,
  NTag,
} from 'naive-ui'
import { useUserManagement } from '@/components/feature/user-mgmnt/settings/composables/useUserManagement'

const isEditing = ref(false)
const originalRoles = ref<any[]>([])

const {
  formData,
  loading,
  saving,
  availableRoles,
  isRoleAssigned,
  handleRoleChange,
  saveCurrentUserData,
  initializeUserData,
} = useUserManagement()

// Computed property for current roles
const currentRoles = computed(() => {
  return formData.roles.map((role) => role.role).sort()
})

const handleEdit = () => {
  // Store original roles for cancel functionality
  originalRoles.value = JSON.parse(JSON.stringify(formData.roles))
  isEditing.value = true
}

const handleSave = async () => {
  const success = await saveCurrentUserData()
  if (success) {
    isEditing.value = false
  }
}

const handleCancel = () => {
  // Restore original roles
  formData.roles = JSON.parse(JSON.stringify(originalRoles.value))
  isEditing.value = false
}

onMounted(async () => {
  await initializeUserData()
})
</script>

<style scoped>
:deep(.n-checkbox) {
  margin-bottom: 0.5rem;
}

:deep(.n-checkbox .n-checkbox__label) {
  font-weight: 400;
}
</style>
