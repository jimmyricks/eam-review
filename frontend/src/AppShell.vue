<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { layouts } from '@/layouts/layouts'
import { useAuthStore } from './stores/auth.store'
import LoadingScreen from '@/components/common/LoadingScreen.vue'

const route = useRoute()
const authStore = useAuthStore()

// App initialization state (always true in new flow)
const isAppInitialized = true

// List of route names that should NOT use the main layout
const noLayoutRoutes = ['Login', 'NotFound']

// Check if the current route requires the main app layout
const showMainLayout = computed(
  () =>
    route.meta.requiresAuth !== false &&
    !noLayoutRoutes.includes(String(route.name || '')),
)

// Define which components should be cached by KeepAlive
const includeComponents = [
  'GenericList',
  'GenericForm',
  'ListPage',
  'FormPage',
  'CacheTest',
]

console.log('I AM IN APPSHELL')
</script>

<template>
  <LoadingScreen v-if="!isAppInitialized" />
  <template v-else>
    <component :is="layouts.base" v-if="showMainLayout">
      <router-view v-slot="{ Component, route }">
        <KeepAlive :include="includeComponents" :max="20">
          <component :is="Component" :key="route.name" />
        </KeepAlive>
      </router-view>
    </component>
    <router-view v-else />
  </template>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap');

html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 13px;
  overflow: hidden;
}
* {
  font-size: inherit;
}
.n-menu {
  font-size: 13px;
}
.n-button {
  font-size: 13px;
}
.n-input {
  font-size: 13px;
}
.n-form-item-label {
  font-size: 13px;
}
:root {
  --header-height: 4rem;
}
</style>
