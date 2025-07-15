<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  NConfigProvider,
  darkTheme,
  lightTheme,
  NModalProvider,
  NMessageProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NNotificationProvider,
} from 'naive-ui'
import AuthShell from './AuthShell.vue'
import AppShell from './AppShell.vue'
import { useSettingsStore } from '@/stores/settings'
import { lightThemeOverrides, darkThemeOverrides } from './themes/theme'
import { storeToRefs } from 'pinia'

const route = useRoute()
const authShellRoutes = ['Login', 'NotFound']
const useAuthShell = computed(() =>
  authShellRoutes.includes(String(route.name || '')),
)

const settingsStore = useSettingsStore()
const { isDarkMode } = storeToRefs(settingsStore)

const currentTheme = computed(() => (isDarkMode.value ? darkTheme : lightTheme))
const currentThemeOverrides = computed(() =>
  isDarkMode.value ? darkThemeOverrides : lightThemeOverrides,
)

watch(
  isDarkMode,
  (newValue) => {
    if (typeof window !== 'undefined') {
      const htmlElement = document.documentElement
      if (newValue) {
        htmlElement.classList.add('dark')
      } else {
        htmlElement.classList.remove('dark')
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <n-config-provider
    :theme="currentTheme"
    :theme-overrides="currentThemeOverrides"
  >
    <n-loading-bar-provider>
      <n-notification-provider>
        <n-modal-provider>
          <n-message-provider>
            <n-dialog-provider>
              <component :is="useAuthShell ? AuthShell : AppShell" />
            </n-dialog-provider>
          </n-message-provider>
        </n-modal-provider>
      </n-notification-provider>
    </n-loading-bar-provider>
  </n-config-provider>
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
  font-size: 13px; /* Reduced from default 16px */
  overflow: hidden; /* Prevent body scrolling */
}

/* Adjust text sizes globally */
* {
  font-size: inherit;
}

/* Specific adjustments for UI components */
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
  --header-height: 4rem; /* Match the header height from Header.vue */
}
</style>
