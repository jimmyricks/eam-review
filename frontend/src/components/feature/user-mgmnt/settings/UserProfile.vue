<template>
  <n-card size="large">
    <n-thing content-indented>
      <template #header> User Profile </template>
      <template #header-extra>
        <n-button v-if="!isEditing" @click="handleEdit" size="medium">
          Edit Profile
        </n-button>
        <n-button-group>
          <n-button
            v-if="isEditing"
            @click="handleSave"
            type="primary"
            :loading="saving"
            :disabled="saving"
          >
            Save
          </n-button>
          <n-button
            v-if="isEditing"
            @click="handleCancel"
            size="medium"
            :disabled="saving"
          >
            Cancel
          </n-button>
        </n-button-group>
      </template>
      <n-divider />

      <n-space vertical>
        <n-form ref="formRef" :model="formData" size="medium">
          <!-- <n-form-item label="Status">
            <n-checkbox
              v-model:checked="formData.enabled"
              size="medium"
              :disabled="!isEditing"
            >
              Account Enabled
            </n-checkbox>
          </n-form-item> -->
          <n-grid :cols="3" :x-gap="24" :y-gap="0">
            <n-form-item-gi path="username" label="Username">
              <n-input
                v-model:value="formData.username"
                placeholder="Username"
                :disabled="!isEditing"
              />
            </n-form-item-gi>
            <n-form-item-gi path="email" label="Email">
              <n-input
                v-model:value="formData.email"
                placeholder="Email"
                :disabled="!isEditing"
              />
            </n-form-item-gi>
            <n-form-item-gi path="full_name" label="Full Name">
              <n-input
                v-model:value="formData.full_name"
                placeholder="Full Name"
                :disabled="!isEditing"
              />
            </n-form-item-gi>
            <n-form-item-gi path="first_name" label="First Name">
              <n-input
                v-model:value="formData.first_name"
                placeholder="First Name"
                :disabled="!isEditing"
              />
            </n-form-item-gi>
            <n-form-item-gi path="middle_name" label="Middle Name">
              <n-input
                v-model:value="formData.middle_name"
                placeholder="Middle Name"
                :disabled="!isEditing"
              />
            </n-form-item-gi>
            <n-form-item-gi path="last_name" label="Last Name">
              <n-input
                v-model:value="formData.last_name"
                placeholder="Last Name"
                :disabled="!isEditing"
              />
            </n-form-item-gi>
            <n-form-item-gi path="gender" label="Gender">
              <n-select
                v-model:value="formData.gender"
                filterable
                placeholder="Select Gender"
                :options="genderOptions"
                :disabled="!isEditing"
              />
            </n-form-item-gi>
            <n-form-item-gi path="birth_date" label="Birth Date">
              <n-date-picker
                v-model:formatted-value="formData.birth_date"
                value-format="yyyy-MM-dd"
                type="date"
                clearable
                placeholder="Select Birth Date"
                style="width: 100%"
                :disabled="!isEditing"
              />
            </n-form-item-gi>
            <n-form-item-gi path="mobile_no" label="Mobile No.">
              <n-input
                v-model:value="formData.mobile_no"
                placeholder="Mobile No."
                :disabled="!isEditing"
              />
            </n-form-item-gi>
            <n-form-item-gi path="location" label="Location">
              <n-input
                v-model:value="formData.location"
                placeholder="Location"
                :disabled="!isEditing"
              />
            </n-form-item-gi>
            <n-form-item-gi path="newPassword" label="New Password">
              <n-input
                v-model:value="newPassword"
                type="password"
                placeholder="********"
                show-password-on="click"
                :disabled="!isEditing"
              />
            </n-form-item-gi>
          </n-grid>
          <div v-if="newPassword" class="mt-2">
            <n-progress
              type="line"
              :percentage="progressPercentage"
              :status="progressStatus"
              :show-indicator="false"
              style="margin-bottom: 4px"
            />
            <n-text
              v-if="passwordStrength?.warning"
              :type="
                passwordStrength?.password_policy_validation_passed
                  ? 'success'
                  : 'error'
              "
            >
              {{ passwordStrength.warning }}
            </n-text>
            <ul
              v-if="
                passwordStrength?.suggestions &&
                passwordStrength.suggestions.length
              "
              class="pl-4 mt-1"
            >
              <li
                v-for="(suggestion, index) in passwordStrength.suggestions"
                :key="index"
              >
                <n-text type="info">{{ suggestion }}</n-text>
              </li>
            </ul>
          </div>
        </n-form>
      </n-space>
    </n-thing>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import {
  NCard,
  NSpace,
  NText,
  NButton,
  NSpin,
  NForm,
  NFormItem,
  NFormItemGi,
  NInput,
  NGrid,
  NCheckbox,
  NDivider,
  NButtonGroup,
  NSelect,
  NThing,
  NDatePicker,
  useMessage,
  NProgress,
  type FormInst,
} from 'naive-ui'
import { useUserManagement } from '@/components/feature/user-mgmnt/settings/composables/useUserManagement'
import { useFrappeSDK } from '@/composables/useFrappeSDK'

const formRef = ref<FormInst | null>(null)
const isEditing = ref(false)
const originalData = ref<any>({})
const sdk = useFrappeSDK()
const message = useMessage()

const newPassword = ref('')
const passwordStrength = ref<any>(null)
const passwordScore = ref(0)
const debounceTimer = ref<number | null>(null)

const {
  formData,
  loading,
  saving,
  genderOptions,
  saveCurrentUserData,
  initializeUserData,
} = useUserManagement()

const handleEdit = () => {
  // Store original data for cancel functionality
  originalData.value = JSON.parse(JSON.stringify(formData))
  isEditing.value = true
}

const handleSave = async () => {
  try {
    await formRef.value?.validate()
    if (newPassword.value) {
      formData.new_password = newPassword.value
    }
    const success = await saveCurrentUserData()
    if (success) {
      isEditing.value = false
      newPassword.value = ''
      passwordStrength.value = null
      passwordScore.value = 0
      delete formData.new_password
    }
  } catch (validationErrors) {
    console.error('Form validation failed:', validationErrors)
  }
}

const handleCancel = () => {
  // Restore original data
  Object.assign(formData, originalData.value)
  isEditing.value = false
  newPassword.value = ''
  passwordStrength.value = null
  passwordScore.value = 0
}

const progressPercentage = computed(() => {
  if (!newPassword.value) return 0
  const scoreMap = [10, 25, 50, 75, 100]
  return scoreMap[passwordScore.value] ?? 0
})

const progressStatus = computed(() => {
  if (passwordScore.value <= 1) return 'error'
  if (passwordScore.value === 2) return 'warning'
  return 'success'
})

watch(newPassword, (value) => {
  if (debounceTimer.value) clearTimeout(debounceTimer.value)

  if (!value) {
    passwordStrength.value = null
    passwordScore.value = 0
    return
  }

  debounceTimer.value = window.setTimeout(async () => {
    try {
      const response = await sdk.call.post(
        'frappe.core.doctype.user.user.test_password_strength',
        {
          new_password: value,
        },
      )
      if (response.message) {
        passwordStrength.value = response.message.feedback
        passwordScore.value = response.message.score
      } else {
        passwordStrength.value = response?.feedback
      }
    } catch (error) {
      console.error('Password strength check failed:', error)
      passwordStrength.value = null
      passwordScore.value = 0
    }
  }, 500)
})

onMounted(async () => {
  await initializeUserData()
})
</script>

<style scoped>
/* :deep(.n-form-item-label) {
  font-weight: 500;
} */
</style>
