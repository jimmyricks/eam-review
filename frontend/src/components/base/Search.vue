<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@vicons/tabler'
import { NInput, NIcon } from 'naive-ui'

const searchQuery = ref<string>('')
const emit = defineEmits<{
  search: [value: string]
}>()

function handleSearch() {
  // console.log('Search:', searchQuery.value)
  emit('search', searchQuery.value)
}
</script>

<template>
  <div class="search-container">
    <n-input
      v-model:value="searchQuery"
      placeholder="Search..."
      size="medium"
      clearable
      class="search-input"
      @update:value="handleSearch"
      :input-props="{ id: 'search' }"
    >
      <template #prefix>
        <n-icon :component="Search" />
      </template>
    </n-input>
  </div>
</template>

<style scoped>
.search-container {
  display: flex;
  align-items: center;
}

.search-input {
  width: 250px;
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .search-input {
    width: 150px;
  }
}
</style>
