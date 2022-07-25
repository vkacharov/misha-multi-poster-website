import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Notifications from '@kyvg/vue3-notification'

import './style.css'
import App from './App.vue'

function initFbSdk() {
    return new Promise(resolve => {
        window.fbAsyncInit = function() {
            FB.init({
              appId            : `${import.meta.env.VITE_APPID}`,
              autoLogAppEvents : true,
              xfbml            : true,
              version          : 'v14.0'
            });
        }

        resolve();
    });
}

initFbSdk().then(() => {
    const pinia = createPinia();
    const app = createApp(App);
    app.use(pinia);
    app.use(Notifications);
    app.mount('#app');
});