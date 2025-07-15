import { ref, computed, reactive } from 'vue'
import { useMessage } from 'naive-ui'
import { useFrappeSDK } from '@/composables/useFrappeSDK'
import { useAuthStore } from '@/stores/auth.store'
import { storeToRefs } from 'pinia'

// Define a type for the Has Role child table
interface HasRole {
  name?: string
  owner?: string
  creation?: string
  modified?: string
  modified_by?: string
  docstatus?: number
  idx?: number
  role: string
  parent?: string
  parentfield?: string
  parenttype?: string
  doctype: 'Has Role'
}

// Define a type for the user form data
interface UserFormData {
  enabled: boolean
  email: string
  full_name: string
  language: string
  first_name: string
  username: string
  time_zone: string
  middle_name: string
  last_name: string
  roles: HasRole[]
  gender?: string | null
  birth_date?: string | null
  mobile_no?: string | null
  location?: string | null
  new_password?: string
  [key: string]: any
}

export function useUserManagement() {
  const message = useMessage()
  const sdk = useFrappeSDK()
  const authStore = useAuthStore()
  const { userName } = storeToRefs(authStore)

  // State
  const loading = ref(false)
  const saving = ref(false)
  const availableRoles = ref<string[]>([])
  const genderOptions = ref<{ label: string; value: string }[]>([])

  // Initialize formData with expected fields
  const formData = reactive<UserFormData>({
    enabled: true,
    email: '',
    full_name: '',
    language: '',
    first_name: '',
    username: '',
    time_zone: '',
    middle_name: '',
    last_name: '',
    roles: [],
    gender: null,
    birth_date: null,
    mobile_no: '',
    location: '',
  })

  // Current user ID from auth store
  const currentUserId = computed(() => userName.value)

  // Check if a specific role is assigned to the user
  const isRoleAssigned = (roleName: string): boolean => {
    return formData.roles.some((roleEntry) => roleEntry.role === roleName)
  }

  // Handle checkbox change for a role
  const handleRoleChange = (roleName: string, isChecked: boolean) => {
    const index = formData.roles.findIndex(
      (roleEntry) => roleEntry.role === roleName,
    )

    if (isChecked && index === -1) {
      // Add the role
      formData.roles.push({
        role: roleName,
        doctype: 'Has Role',
      })
    } else if (!isChecked && index !== -1) {
      // Remove the role
      formData.roles.splice(index, 1)
    }
  }

  // Fetch all available roles
  const fetchAvailableRoles = async () => {
    try {
      const roles = await sdk.db.getDocList('Role', {
        fields: ['name'],
        limit: 999,
      })

      const excludedRoles = new Set([
        'All',
        'Guest',
        'Administrator',
        'Desk User',
      ])
      availableRoles.value = roles
        .map((role: { name: string }) => role.name)
        .filter((roleName: string) => !excludedRoles.has(roleName))
        .sort()
    } catch (error) {
      message.error(`Error fetching roles: ${(error as any).message || error}`)
      console.error('Error fetching roles:', error)
    }
  }

  // Fetch available gender options
  const fetchGenderOptions = async () => {
    try {
      const genders = await sdk.db.getDocList('Gender', {
        fields: ['name'],
        limit: 100,
      })
      genderOptions.value = genders.map((g: { name: string }) => ({
        label: g.name,
        value: g.name,
      }))
    } catch (error) {
      console.error('Error fetching gender options:', error)
      message.error('Could not load gender options.')
    }
  }

  // Fetch current user data
  const fetchCurrentUserData = async () => {
    if (!currentUserId.value) {
      message.error('No current user found')
      return
    }

    loading.value = true
    try {
      const response = await sdk.call.get('frappe.desk.form.load.getdoc', {
        doctype: 'User',
        name: currentUserId.value,
      })

      if (response.docs && Array.isArray(response.docs) && response.docs[0]) {
        const docData = response.docs[0]
        // Explicitly convert numeric boolean fields
        docData.enabled = Boolean(docData.enabled)
        Object.assign(formData, docData)
      } else {
        console.error('Unexpected response structure from getdoc:', response)
        message.error('Failed to parse user data.')
      }
    } catch (error) {
      message.error(
        `Error fetching user data: ${(error as any).message || error}`,
      )
      console.error('Error fetching user data:', error)
    } finally {
      loading.value = false
    }
  }

  // Save current user data
  const saveCurrentUserData = async () => {
    if (!currentUserId.value) {
      message.error('No current user found')
      return false
    }

    saving.value = true
    try {
      const dataToSave = { ...formData }
      // Remove fields that backend might reject
      delete dataToSave.name
      delete dataToSave.doctype
      delete dataToSave.owner
      delete dataToSave.creation
      delete dataToSave.modified
      delete dataToSave.modified_by
      delete dataToSave.idx

      await sdk.db.updateDoc('User', currentUserId.value, dataToSave)
      message.success('User data updated successfully')

      // Re-fetch data after update
      await fetchCurrentUserData()
      return true
    } catch (error) {
      const errorMessage = (error as any).errors
        ? JSON.stringify((error as any).errors)
        : (error as any).message || error
      message.error(`Error saving user data: ${errorMessage}`)
      console.error('Error saving user data:', error)
      return false
    } finally {
      saving.value = false
    }
  }

  // Initialize data
  const initializeUserData = async () => {
    await Promise.all([
      fetchAvailableRoles(),
      fetchGenderOptions(),
      fetchCurrentUserData(),
    ])
  }

  return {
    // State
    formData,
    loading,
    saving,
    availableRoles,
    genderOptions,
    currentUserId,

    // Methods
    isRoleAssigned,
    handleRoleChange,
    fetchAvailableRoles,
    fetchGenderOptions,
    fetchCurrentUserData,
    saveCurrentUserData,
    initializeUserData,
  }
}
