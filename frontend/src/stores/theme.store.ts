import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useStorage, usePreferredDark } from '@vueuse/core'

export const useThemeStore = defineStore('theme', () => {
  // Use VueUse for reactive localStorage with system preference fallback
  const prefersDark = usePreferredDark()
  const isDarkMode = useStorage('eam_theme_dark_mode', prefersDark.value)

  // Computed properties
  const themeMode = computed(() => isDarkMode.value ? 'dark' : 'light')

  // Actions
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
  }

  const setDarkMode = (value: boolean) => {
    isDarkMode.value = value
  }

  const resetTheme = () => {
    isDarkMode.value = prefersDark.value
  }

  // Auto-sync with HTML class for Tailwind
  const syncHtmlClass = () => {
    if (typeof window !== 'undefined') {
      const htmlElement = document.documentElement
      if (isDarkMode.value) {
        htmlElement.classList.add('dark')
      } else {
        htmlElement.classList.remove('dark')
      }
    }
  }

  // Initialize HTML class sync
  syncHtmlClass()

  return {
    // State
    isDarkMode: computed({
      get: () => isDarkMode.value,
      set: (value: boolean) => {
        isDarkMode.value = value
        syncHtmlClass()
      }
    }),
    themeMode,
    prefersDark,

    // Actions
    toggleDarkMode: () => {
      toggleDarkMode()
      syncHtmlClass()
    },
    setDarkMode: (value: boolean) => {
      setDarkMode(value)
      syncHtmlClass()
    },
    resetTheme,
    syncHtmlClass
  }
}) 