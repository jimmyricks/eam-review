<template>
  <div>
    <n-space justify="space-between" align="center">
      <!-- Left side: Search controls -->
      <div class="flex-1">
        <n-space align="center">
          <n-input-group>
            <!-- Field selector -->
            <n-select
              v-model:value="selectedField"
              :options="fieldOptions"
              placeholder="Select field"
              clearable
              filterable
              size="medium"
              style="width: 170px"
              :disabled="searchLoading"
            />

            <!-- Search input -->
            <n-input
              v-model:value="searchValue"
              :placeholder="`Enter ${selectedFieldLabel}...`"
              clearable
              size="medium"
              style="width: 200px"
              :disabled="!selectedField || searchLoading"
              @clear="handleClearSearch"
            >
              <template #prefix>
                <n-icon><Search /></n-icon>
              </template>
            </n-input>

            <!-- Clear all button -->
            <n-button
              v-if="hasActiveSearch"
              tertiary
              size="medium"
              @click="handleClearAll"
              :disabled="searchLoading"
            >
              <template #icon>
                <n-icon><X /></n-icon>
              </template>
            </n-button>
          </n-input-group>
        </n-space>
      </div>

      <!-- Right side: Actions -->
      <div class="flex-shrink-0">
        <n-space>
          <!-- View switcher -->
          <div v-if="availableViews.length > 1" class="flex-shrink-0">
            <n-select
              :value="currentView"
              :options="availableViews"
              size="medium"
              style="width: 120px"
              @update:value="handleViewChange"
            />
          </div>

          <!-- Settings button -->
          <n-button
            tertiary
            size="medium"
            @click="handleSettings"
            :disabled="searchLoading"
            style="width: 3rem"
          >
            <template #icon>
              <n-icon><DotsVertical /></n-icon>
            </template>
          </n-button>
        </n-space>
      </div>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NSpace,
  NSelect,
  NInput,
  NButton,
  NIcon,
  NInputGroup,
  type SelectOption,
} from 'naive-ui'
import { Search, X, DotsVertical } from '@vicons/tabler'
import { useSearchDebounce } from './composables/useSearchDebounce'
import type { SearchableField, SearchFilter } from '@/types/Lists'

// Props & Emits
interface Props {
  searchableFields: SearchableField[]
  searchLoading?: boolean
  currentView: string
  availableViews: { label: string; value: string }[]
}

const props = withDefaults(defineProps<Props>(), {
  searchLoading: false,
})

const emit = defineEmits<{
  search: [filters: SearchFilter[]]
  'clear-search': []
  settings: []
  'view-change': [view: string]
}>()

// Local State
const selectedField = ref<string | null>(null)
const searchValue = ref('')

// Computed Properties
const fieldOptions = computed((): SelectOption[] => {
  return props.searchableFields.map((field) => ({
    label: field.label,
    value: field.value,
  }))
})

const selectedFieldLabel = computed(() => {
  const field = props.searchableFields.find(
    (f) => f.value === selectedField.value,
  )
  return field?.label || selectedField.value || ''
})

const hasActiveSearch = computed(() => {
  return selectedField.value && searchValue.value.trim().length > 0
})

// Search Debounce
const { debouncedSearch } = useSearchDebounce(300, (value: string) => {
  if (selectedField.value && value.trim()) {
    const filters: SearchFilter[] = [
      {
        fieldname: selectedField.value,
        operator: 'like',
        value: `%${value.trim()}%`,
      },
    ]
    emit('search', filters)
  } else {
    emit('clear-search')
  }
})

// Watchers
watch(searchValue, (newValue) => {
  debouncedSearch(newValue)
})

watch(selectedField, (newField, oldField) => {
  if (oldField && newField !== oldField) {
    const hadValue = searchValue.value.trim().length > 0
    searchValue.value = ''
    if (hadValue) {
      emit('clear-search')
    }
  }
})

// Event Handlers
const handleClearSearch = () => {
  searchValue.value = ''
  emit('clear-search')
}

const handleClearAll = () => {
  selectedField.value = null
  searchValue.value = ''
  emit('clear-search')
}

const handleSettings = () => {
  emit('settings')
}

const handleViewChange = (view: string) => {
  emit('view-change', view)
}
</script>

<style scoped></style>
