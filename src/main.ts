import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './firebase'
import { resetClientState } from './utils/auth'

resetClientState()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
