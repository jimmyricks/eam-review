<template>
  <div>
    <div class="flex items-center justify-between">
      <!-- Search controls -->
      <div class="flex items-center">
        <n-input-group>
          <!-- Field selector -->
          <n-popselect
            v-model:value="selectedField"
            :options="fieldOptions"
            trigger="click"
            placement="bottom-start"
            scrollable
            :disabled="searchLoading"
          >
            <n-button
              size="medium"
              icon-placement="right"
              :disabled="searchLoading"
            >
              <template #icon>
                <n-icon><Direction /></n-icon>
              </template>
              {{ fieldLabel || 'Select Field' }}
            </n-button>
          </n-popselect>

          <!-- Search input -->
          <n-input
            v-model:value="searchValue"
            placeholder="Search value"
            clearable
            size="medium"
            style="width: 200px"
            :disabled="!selectedField || searchLoading"
            @clear="handleClearSearch"
          >
            <template #prefix>
              <n-icon><search /></n-icon>
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
              <n-icon><FilterOff /></n-icon>
            </template>
          </n-button>
        </n-input-group>
      </div>

      <!-- Sort controls -->
      <div class="flex items-center">
        <n-button-group>
          <!-- Toggleable sort order button -->
          <n-button
            size="medium"
            :type="selectedSortField ? 'primary' : 'default'"
            :disabled="!selectedSortField || searchLoading"
            @click="toggleSortOrder"
            tertiary
          >
            <template #icon>
              <n-icon>
                <component
                  :is="sortOrder === 'asc' ? SortDescending : SortAscending"
                />
              </n-icon>
            </template>
          </n-button>

          <!-- Popselect for sort field -->
          <n-popselect
            v-model:value="selectedSortField"
            :options="sortFieldOptions"
            trigger="click"
            placement="bottom-end"
            scrollable
          >
            <n-button size="medium" :disabled="searchLoading">
              {{ sortFieldLabel || 'Sort by' }}
            </n-button>
          </n-popselect>
        </n-button-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NInput,
  NButton,
  NIcon,
  NInputGroup,
  NPopselect,
  NButtonGroup,
  type SelectOption,
} from 'naive-ui'
import {
  Search,
  X,
  SortAscending,
  SortDescending,
  FilterOff,
  Direction,
} from '@vicons/tabler'
import { useSearchDebounce } from './composables/useSearchDebounce'
import type { SearchableField, SearchFilter } from '@/types/Lists'

// -----------------------------------------------------------------------------
// Props & Emits
// -----------------------------------------------------------------------------
interface Props {
  searchableFields: SearchableField[]
  searchLoading?: boolean
  hasSelections?: boolean
  selectedCount?: number
  /** Currently active search field coming from parent */
  currentField?: string | null
  /** Currently active search value coming from parent */
  currentValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  searchLoading: false,
  hasSelections: false,
  selectedCount: 0,
  currentField: null,
  currentValue: '',
})

const emit = defineEmits<{
  search: [filters: SearchFilter[]]
  'clear-search': []
  'sort-change': [{ field: string; order: 'asc' | 'desc' }]
}>()

// -----------------------------------------------------------------------------
// Local State
// -----------------------------------------------------------------------------
const selectedField = ref<string | null>(null)
const searchValue = ref('')

// Sorting state (default to "Last Modified" descending)
const selectedSortField = ref<string>('modified')
const sortOrder = ref<'asc' | 'desc'>('desc')

// -----------------------------------------------------------------------------
// Computed Properties
// -----------------------------------------------------------------------------
const fieldOptions = computed((): SelectOption[] => {
  return props.searchableFields.map((field) => ({
    label: field.label,
    value: field.value,
  }))
})

// Sorting field options: add Last Modified and On Create to beginning
const sortFieldOptions = computed((): SelectOption[] => {
  const baseOptions: SelectOption[] = [
    { label: 'Last Modified', value: 'modified' },
    { label: 'On Create', value: 'creation' },
  ]

  const additional = props.searchableFields
    .filter((field) => field.value !== 'modified' && field.value !== 'creation')
    .map((field) => ({ label: field.label, value: field.value }))

  return [...baseOptions, ...additional]
})

// Label for current sort field (for button display)
const sortFieldLabel = computed(() => {
  return (
    sortFieldOptions.value.find((f) => f.value === selectedSortField.value)
      ?.label ?? ''
  )
})

// Label for current field (for button display)
const fieldLabel = computed(() => {
  return (
    fieldOptions.value.find((f) => f.value === selectedField.value)?.label ?? ''
  )
})

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const hasActiveSearch = computed(() => {
  return selectedField.value && searchValue.value.trim().length > 0
})

// -----------------------------------------------------------------------------
// Search Debounce
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Sync props -> local state so that UI reflects existing filters when the
// component is (re)mounted or when parent updates the active filters.
// -----------------------------------------------------------------------------
watch(
  () => props.currentField,
  (newField) => {
    selectedField.value = newField ?? null
  },
  { immediate: true },
)

watch(
  () => props.currentValue,
  (newValue) => {
    // Only update if the value actually changed to prevent unnecessary emits
    if (newValue !== undefined && newValue !== searchValue.value) {
      searchValue.value = newValue ?? ''
    }
  },
  { immediate: true },
)

// -----------------------------------------------------------------------------
// Watchers
// -----------------------------------------------------------------------------
watch(searchValue, (newValue) => {
  debouncedSearch(newValue)
})

watch(selectedField, (newField, oldField) => {
  if (oldField && newField !== oldField) {
    // Clear search when field changes
    const hadValue = searchValue.value.trim().length > 0
    searchValue.value = ''
    if (hadValue) {
      emit('clear-search')
    }
  }
})

// -----------------------------------------------------------------------------
// Watchers for sorting
// -----------------------------------------------------------------------------
watch(
  [selectedSortField, sortOrder],
  ([field, order]) => {
    if (field) {
      emit('sort-change', { field, order })
    }
  },
  { immediate: true },
)

// -----------------------------------------------------------------------------
// Event Handlers
// -----------------------------------------------------------------------------
const handleClearSearch = () => {
  searchValue.value = ''
  emit('clear-search')
}

const handleClearAll = () => {
  selectedField.value = null
  searchValue.value = ''
  emit('clear-search')
}

// Removed unused handleSortOrderChange (replaced by toggleSortOrder)
</script>

<style scoped></style>
