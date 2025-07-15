import type { GlobalThemeOverrides } from 'naive-ui'

// Light theme overrides
export const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    // Primary blue colors
    primaryColor: '#2080f0',
    primaryColorHover: '#4098fc',
    primaryColorPressed: '#1060c9',
    primaryColorSuppl: '#63b0ff',

    // Info colors (blue-based)
    infoColor: '#2080f0',
    infoColorHover: '#4098fc',
    infoColorPressed: '#1060c9',
    infoColorSuppl: '#63b0ff',

    // Success colors
    successColor: '#18a058',
    successColorHover: '#36ad6a',
    successColorPressed: '#0c7a43',
    successColorSuppl: '#36ad6a',

    // Warning colors
    warningColor: '#f0a020',
    warningColorHover: '#fcb040',
    warningColorPressed: '#c97c10',
    warningColorSuppl: '#fcb040',

    // Error colors
    errorColor: '#d03050',
    errorColorHover: '#de576d',
    errorColorPressed: '#ab1f3f',
    errorColorSuppl: '#de576d',

    // Font settings
    fontFamily: 'Figtree, "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontFamilyMono: 'Figtree, "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontWeightStrong: '500',

    // Light theme specific
    bodyColor: '#ffffff',
    cardColor: '#ffffff',
    modalColor: '#ffffff',
    popoverColor: '#ffffff',
    tableHeaderColor: '#fafafa',
    borderRadius: '6px',
  },
}

// Dark theme overrides
export const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    // Primary blue colors (same as light)
    primaryColor: '#2080f0',
    primaryColorHover: '#4098fc',
    primaryColorPressed: '#1060c9',
    primaryColorSuppl: '#63b0ff',

    // Info colors (blue-based)
    infoColor: '#2080f0',
    infoColorHover: '#4098fc',
    infoColorPressed: '#1060c9',
    infoColorSuppl: '#63b0ff',

    // Success colors
    successColor: '#18a058',
    successColorHover: '#36ad6a',
    successColorPressed: '#0c7a43',
    successColorSuppl: '#36ad6a',

    // Warning colors
    warningColor: '#f0a020',
    warningColorHover: '#fcb040',
    warningColorPressed: '#c97c10',
    warningColorSuppl: '#fcb040',

    // Error colors
    errorColor: '#d03050',
    errorColorHover: '#de576d',
    errorColorPressed: '#ab1f3f',
    errorColorSuppl: '#de576d',

    // Font settings
    fontFamily: 'Figtree, "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontFamilyMono: 'Figtree, "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontWeightStrong: '500',

    // Dark theme specific
    bodyColor: '#121212',
    cardColor: '#171717',
    modalColor: '#171717',
    popoverColor: '#171717',
    tableHeaderColor: '#222222',
    textColorBase: '#ffffff',
    textColor1: '#ffffff',
    textColor2: '#e0e0e0',
    textColor3: '#c0c0c0',
    placeholderColor: '#888888',
    iconColor: '#ffffff',
    borderColor: '#404040',
    dividerColor: '#404040',
    closeColorHover: '#404040',
    closeColorPressed: '#505050',
    borderRadius: '6px',
  },
}

// Legacy export for backward compatibility
export const customTheme = lightThemeOverrides
