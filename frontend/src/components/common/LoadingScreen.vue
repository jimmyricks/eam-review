<template>
  <div class="loading-screen">
    <n-spin size="large" :show="true">
      <template #description>
        <div class="loading-content">
          <img src="/src/assets/metpower.png" alt="Logo" class="loading-logo" />
          <n-text class="loading-text">Loading...</n-text>
        </div>
      </template>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { NSpin, NText } from 'naive-ui'
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--n-color);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-logo {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--n-text-color);
}
</style>
