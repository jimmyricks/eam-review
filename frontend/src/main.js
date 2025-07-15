import './index.css'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import router from './router/index.js'
import App from './App.vue'

let app = createApp(App)

// Configure Pinia with persistedstate plugin
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(router)
app.use(pinia)

// Mount app - authentication will be handled by App.vue
app.mount('#app')

// Add this to main.js
app.config.errorHandler = (err, instance, info) => {
    console.error('Vue Error:', err);
    console.error('Component:', instance);
    console.error('Info:', info);
    console.trace('Stack trace:');
  };
  
  // Also add this for warnings
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn('Vue Warning:', msg);
    console.warn('Component:', instance);
    console.warn('Trace:', trace);
    console.trace('Stack trace:');
  };
