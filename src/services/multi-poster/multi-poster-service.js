import { FacebookService } from '../facebook/fb-service.js';
import { ActivityService } from '../activity/activity-service.js';

export class MiltiPosterService {

    #facebookService;
    #activityService;

    constructor() {
        this.#facebookService = new FacebookService();
        this.#activityService = new ActivityService();
    }

    multiPostLink(link, pages, onSuccess, onError) {
        new Promise((resolve) => {
                const pageLink = this.#getPageLink(link);
                resolve(pageLink);
            })
            .then(pageLink => {
                return this.#facebookService.getPageId(pageLink);
            })
            .then(pageId => {
                const postId = pageId + '_' + this.#getPostId(link);
                return this.#facebookService.getPost(postId);
            })
            .then(originalPost => {
                if (this.#containsShareAttachment(originalPost)) {
                    const postCopy = this.#copyPost(originalPost);
                    this.#resolveActivities(postCopy);
                    pages.forEach(page => {
                        this.#facebookService.shareAsAttachment(postCopy, page)
                            .then(onSuccess)
                            .catch(onError);
                    })
                    
                } else {
                    pages.forEach(page => {
                        this.#facebookService.shareAsLink(link, page)
                            .then(onSuccess)
                            .catch(onError);
                    })
                }
            })
            .catch(error => {
                console.error(error);
                onError(error);
            })
    }

    #getPostId(link) {
        // posts with id like pfbid02SgS7mBZi92aHnSevZ7bobdAJDriZbuD4gWJBxoayEQZwBKmbxzScPuXW88QDCbZRl
        const match = link.match(/pfbid[\w\d]+/);
        if (match && match.length == 1) {
            return match[0];
        }
        
        // posts with id like 1063029675148360
        const numericalMatch = link.match(/posts\/(\d+)/);
        if (numericalMatch && numericalMatch.length == 2) {
            return numericalMatch[1];
        }

        // posts with id like 1063029675148360:1063029675148360
        const colonMatch = link.match(/(\d+):(\d+)/);
        if (colonMatch && colonMatch.length == 2) {
            return colonMatch[1];
        }

        throw ({
            message: `Failed to extract post id from ${link}`
        });
    }

    #getPageLink(link) {
        if (link.includes('permalink.php')) {
            // permalink: the id is in the url
            const match = link.match(/(?<=id\=)\d+/);
            if (match && match.length == 1) {
                return `https://facebook.com/${match[0]}`;
            }
        } else {
            // the group name is in the url
            const match = link.match(/http.+(?=\/posts)/);
            if (match && match.length == 1) {
                return match[0];
            }
        }
        throw ({
            message: `Failed to extract page link from ${link}`
        });
    }

    #copyPost(post) {
        const copy = {};
        for (const [field, mapping] of Object.entries(this.#postFieldMappings)) {
            const originalValue = post[mapping.originalField];
            if (originalValue && mapping.customMapping) {
                copy[field] = mapping.customMapping(originalValue, copy);
            } else {
                copy[field] = originalValue;
            }
        }

        return copy;
    }

    #extractShareLinkUrl(attachments) {
        if (attachments && attachments.data.length > 0) {
            const type = attachments.data[0].type;
            if (type == 'share') {
                return attachments.data[0].url;
            }
        }
    }

    #containsShareAttachment(post) {
        return post.attachments && 
        (typeof this.#extractShareLinkUrl(post.attachments) !== 'undefined');
    }

    #resolveActivities(postCopy) {
        if (postCopy.story && postCopy.story_tags) {
            const activity = this.#activityService.resolveActivity(postCopy.story, postCopy.story_tags);
            if (activity) {
                postCopy.og_action_type_id = activity.activityId;
                postCopy.og_icon_id = activity.icon;
                postCopy.og_object_id = activity.recipientId;

                if (activity.mentionTagIds && activity.mentionTagIds.length > 0) {
                    const tags = activity.mentionTagIds.join(',');
                    if (postCopy.tags && postCopy.tags.length > 0) {
                        postCopy.tags = postCopy.tags + ',' + tags;
                    } else {
                        postCopy.tags = tags;
                    }
                }
            }
        }

        delete postCopy.story;
        delete postCopy.story_tags;
    }

    #postFieldMappings = {
        child_attachments: {
            originalField: 'child_attachments', 
        }, 
        feed_targeting: {
            originalField: 'feed_targeting'
        }, 
        link: {
            originalField: 'attachments',
            customMapping: this.#extractShareLinkUrl
        }, 
        message: {
            originalField: 'message'
        }, 
        multi_share_end_card: {
            originalField: 'multi_share_end_card'
        }, 
        multi_share_optimized: {
            originalField: 'multi_share_optimized'
        }, 
        place: {
            originalField: 'place',
            customMapping: (place) => {
                return place.id; 
            }
        }, 
        tags: {
            originalField: 'message_tags',
            customMapping: (tags) => {
                return tags.map(tag => tag.id).join(','); 
            }
        },
        story_tags: {
            originalField: 'story_tags',
            customMapping: (storyTags, currentCopy) => {
                /**
                 * The location is tagged twice: in place and in story_tags. 
                 * Remove it from story_tags
                 */
                return storyTags.filter(tag => tag.id != currentCopy.place);
            }
        },
        story: {
            originalField: 'story'
        }, 
        targeting: {
            originalField: 'targeting'
        }
    }
}