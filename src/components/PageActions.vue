<script>
import {usePagesStore} from '../stores/pages.js';

import { MiltiPosterService } from '../services/multi-poster/multi-poster-service.js';
import { ref, watch } from 'vue';
import { notify } from "@kyvg/vue3-notification";

export default {
    setup() {
        const pagesStore = usePagesStore();
        const multiPosterService = new MiltiPosterService(pagesStore);

        const postLink = ref("");
        const numberOfSelectedPageIds = ref(0);
        const disableSharePostButton = ref(true);

        pagesStore.$subscribe(() => {
            numberOfSelectedPageIds.value = pagesStore.numberOfSelectedPageIds;
        });

        watch([postLink, numberOfSelectedPageIds], () => {
            disableSharePostButton.value = numberOfSelectedPageIds.value == 0 || postLink.value.length == 0;
        });

        const notifyPostSucceeded = (postResult) => {
            const postLink = `<a href="https://facebook.com/${postResult.id}" target=”_blank”>here</a>`;
            notify({
                title: postResult.pageName,
                text: `Successfully posted. Click ${postLink} to open the post.`,
                type: 'success',
                group: 'succeeded', 
                duration: -1

            });
        };

        const notifyPostErrored = (error) => {
            notify({
                title: 'ERROR',
                text: JSON.stringify(error),
                type: 'error',
                group: 'errored', 
                duration: -1

            });
        }; 

        const sharePostLink = async (event) => {
            multiPosterService.multiPostLink(postLink.value, pagesStore.selectedPages, notifyPostSucceeded, notifyPostErrored);
        };

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