<template>
  <!-- <n-card :title="title">
    <template #header-extra>
      <n-statistic :value="value" />
    </template>
  </n-card> -->

  <n-card
    :segmented="{
      content: true,
      footer: 'soft',
    }"
  >
    <template #header>
      <n-tag
        :type="getWorkflowStateType(title)"
        size="medium"
        :bordered="false"
      >
        {{ title }}
      </n-tag>
    </template>
    <template #header-extra
      ><n-space align="center">
        <router-link :to="dynamicLink">
          <n-button type="primary" text size="medium">
            <n-icon>
              <ChevronRight />
            </n-icon>
          </n-button>
        </router-link>
      </n-space>
    </template>
    <n-statistic :value="value" />

    <!-- <template #footer> #footer </template> -->
    <template #action> </template>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NStatistic, NSpace, NTag, NButton, NIcon } from 'naive-ui'
import { getWorkflowStateType } from '@/utils/workflowStates'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@vicons/tabler'

const props = defineProps<{
  title: string
  value: number
  doctype: string
}>()

// Utility function to convert doctype name to slug
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

// Computed property for the dynamic router link
const dynamicLink = computed(() => ({
  path: `/${slugify(props.doctype)}`,
  query: { workflow_state: props.title },
}))
</script>

<style scoped>
/*
.n-card {
  width: 250px;
}
*/
</style>
