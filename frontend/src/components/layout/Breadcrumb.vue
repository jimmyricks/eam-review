<script setup lang="ts">
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import { watch } from 'vue'

interface BreadcrumbItem {
  label: string
  route: string | null
  doctype?: string
  docId?: string
}

const props = defineProps<{
  breadcrumbs: BreadcrumbItem[]
}>()

const emit = defineEmits<{
  navigate: [item: BreadcrumbItem]
}>()

const handleClick = (item: BreadcrumbItem) => {
  if (item.route) {
    emit('navigate', item)
  }
}

// Debug: Watch breadcrumbs prop
watch(
  () => props.breadcrumbs,
  (newBreadcrumbs) => {
    // console.log('Breadcrumb component received:', newBreadcrumbs)
  },
  { immediate: true },
)
</script>

<template>
  <n-breadcrumb v-if="breadcrumbs && breadcrumbs.length > 0" separator="/">
    <n-breadcrumb-item
      v-for="(item, index) in breadcrumbs"
      :key="item.route ?? index"
    >
      <span
        v-if="item.route && index < breadcrumbs.length - 1"
        class="cursor-pointer text-primary"
        @click="handleClick(item)"
      >
        {{ item.label }}
      </span>
      <span v-else class="breadcrumb-current">{{ item.label }}</span>
    </n-breadcrumb-item>
  </n-breadcrumb>
</template>

<style scoped></style>
