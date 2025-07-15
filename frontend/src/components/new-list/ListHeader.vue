<template>
  <div class="px-8 py-4">
    <n-space justify="space-between" align="center">
      <!-- Left side: Title and count -->
      <div class="flex-1">
        <n-space align="center">
          <n-text tag="h1" class="text-2xl font-semibold">{{ doctype }}</n-text>
          <n-tag
            v-if="!loading"
            type="info"
            size="medium"
            round
            :bordered="false"
          >
            <span v-if="totalCount > 1">{{ totalCount }} {{ doctype }}s</span>
            <span v-else>{{ totalCount }} {{ doctype }}</span>
          </n-tag>
          <n-spin v-else size="medium" />
        </n-space>
      </div>

      <!-- Right side: Actions -->
      <div class="flex-shrink-0">
        <n-space>
          <!-- View switcher -->
          <div v-if="availableViews.length > 1" class="flex-shrink-0">
            <n-select
              :value="currentView"
              :options="viewOptions"
              size="medium"
              style="width: 120px"
              @update:value="handleViewChange"
            />
          </div>

          <!-- Settings button -->
          <n-dropdown
            v-if="settingsOptions.length > 1"
            trigger="click"
            :options="settingsOptions"
            @select="(key) => emit('settings', key)"
          >
            <n-button
              tertiary
              size="medium"
              :disabled="loading"
              style="width: 3rem"
            >
              <template #icon>
                <n-icon><DotsVertical /></n-icon>
              </template>
            </n-button>
          </n-dropdown>
          <n-button
            v-else
            tertiary
            size="medium"
            @click="
              () => emit('settings', settingsOptions[0]?.key || 'default')
            "
            :disabled="loading"
            style="width: 3rem"
          >
            <template #icon>
              <n-icon><DotsVertical /></n-icon>
            </template>
          </n-button>

          <!-- Actions dropdown (when selection) -->
          <n-dropdown
            v-if="hasSelections"
            trigger="click"
            :options="actionOptions"
            @select="handleActionDropdown"
            placement="bottom-start"
          >
            <n-button type="primary" size="medium">
              <template #icon>
                <n-icon><chevron-down /></n-icon>
              </template>
              Actions
            </n-button>
          </n-dropdown>

          <!-- Add record button (when no selection) -->
          <n-button
            v-if="!hasSelections && !uiSettings?.hideAddButton"
            type="primary"
            size="medium"
            @click="handleAddRecord"
            :loading="loading"
          >
            <template #icon>
              <n-icon><plus /></n-icon>
            </template>
            Add {{ doctype }}
          </n-button>
        </n-space>
      </div>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NSpace,
  NButton,
  NIcon,
  NSelect,
  NTag,
  NSpin,
  NText,
  NDropdown,
  type SelectOption,
  type DropdownOption,
} from 'naive-ui'
import { Plus, DotsVertical, ChevronDown } from '@vicons/tabler'

// -----------------------------------------------------------------------------
// Props & Emits
// -----------------------------------------------------------------------------
interface Props {
  doctype: string
  totalCount: number
  currentView: string
  availableViews: readonly string[]
  loading: boolean
  hasSelections: boolean
  actionOptions: DropdownOption[]
  uiSettings?: {
    hideAddButton?: boolean
  }
  settingsOptions?: DropdownOption[]
}

const props = withDefaults(defineProps<Props>(), {
  settingsOptions: () => [{ label: 'Settings', key: 'default' }],
})

const emit = defineEmits<{
  'add-record': []
  'view-change': [view: string]
  settings: [key: string | number]
  action: [actionKey: string]
}>()

// -----------------------------------------------------------------------------
// Computed Properties
// -----------------------------------------------------------------------------
const viewOptions = computed((): SelectOption[] => {
  return props.availableViews.map((view) => ({
    label: view.charAt(0).toUpperCase() + view.slice(1),
    value: view,
  }))
})

// -----------------------------------------------------------------------------
// Event Handlers
// -----------------------------------------------------------------------------
const handleAddRecord = () => {
  emit('add-record')
}

const handleViewChange = (view: string) => {
  emit('view-change', view)
}

const handleSettings = () => {
  emit('settings', 'default')
}

const handleActionDropdown = (actionKey: string) => {
  emit('action', actionKey)
}
</script>

<style scoped></style>
