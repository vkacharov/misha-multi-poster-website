<script>
import {usePagesStore} from '../stores/pages.js';

import { shareLink } from '../services';
import { ref, watch } from 'vue';
import { notify } from "@kyvg/vue3-notification";

export default {
    setup() {
        const pagesStore = usePagesStore();
        const postLink = ref("");
        const numberOfSelectedPageIds = ref(0);
        const disableSharePostButton = ref(true);

        pagesStore.$subscribe(() => {
            numberOfSelectedPageIds.value = pagesStore.numberOfSelectedPageIds;
        });

        watch([postLink, numberOfSelectedPageIds], () => {
            console.log('WATCH', numberOfSelectedPageIds.value, postLink.value.length);
            disableSharePostButton.value = numberOfSelectedPageIds.value == 0 || postLink.value.length == 0;
        });

        const notifyPostSucceeded = (pageName, postId) => {
            const postLink = `<a href="https://facebook.com/${postId}">here</a>`;
            notify({
                title: pageName,
                text: `Successfully posted. Click ${postLink} to open the post.`,
                type: 'success',
                group: 'succeeded', 
                duration: -1

            });
        };

        const notifyPostErrored = (pageName, error) => {
            notify({
                title: pageName,
                text: `${error.error_user_title} <br> ${error.message}`,
                type: 'error',
                group: 'errored', 
                duration: -1

            });
        }; 

        const sharePostLink = (event) => {
            pagesStore.selectedPages.map(page => {
                shareLink(postLink.value, page).then(response => {
                    if (response.postResponse.id) {
                        notifyPostSucceeded(response.pageName, response.postResponse.id); 
                    } else if (response.postResponse.error) {
                        notifyPostErrored(response.pageName, response.postResponse.error);
                    }
                    console.log('POST response', response);
                });
            });
        }

        const clearNotifications = () => {
            ['errored', 'succeeded'].forEach(group => {
                notify({clean: true, group: group});
            });
        }

        return {
            postLink, 
            sharePostLink,
            disableSharePostButton,
            clearNotifications
        }
    }
}
</script>

<template>
    <h2>Enter the link you want to post</h2>
    <input v-model="postLink" />
    <div class="button-container">
        <button @click="sharePostLink" :disabled="disableSharePostButton">
            Post
        </button>
    </div>

    <div class="button-container">
        <button @click="clearNotifications">Clear notifications</button>
    </div>
</template>