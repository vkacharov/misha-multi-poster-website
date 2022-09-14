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
                const postId = pageId.id + '_' + this.#getPostId(link);
                return this.#facebookService.getPost(postId, pageId.access_token);
            })
            .then(originalPost => {
                if (this.#containsShareAttachment(originalPost)) {
                    const postCopy = this.#copyPost(originalPost);
                    this.#resolveActivities(postCopy);
                    console.log('POSTING', postCopy);
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
        const match = link.match(/pfbid[\w\d]+/);
        if (match && match.length == 1) {
            return match[0];
        }

        throw ({
            message: `Failed to extract post id from ${link}`
        });
    }

    #getPageLink(link) {
        if (link.includes('permalink.php')) {
            // permalink: the page id is in the url
            const match = link.match(/(?<=id\=)\d+/);
            if (match && match.length == 1) {
                return `https://facebook.com/${match[0]}`;
            }
        } else {
            // the page name is in the url
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
                    postCopy.tags = activity.mentionTagIds.join(',');
                }
            }
        }

        delete postCopy.story;
        delete postCopy.story_tags;
        delete postCopy.message_tags;
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
        message_tags: {
            originalField: 'message_tags'
        },
        message: {
            originalField: 'message',
            customMapping: (message, currentCopy) => {
                let currentOffset = 0;
                let resolvedMessage = '';
                currentCopy.message_tags.forEach(tag => {
                    const prefix = message.slice(currentOffset, tag.offset);
                    resolvedMessage += prefix;
                    const mention = message.slice(tag.offset, tag.offset + tag.length);
                    if (mention == tag.name) {
                        resolvedMessage += '@[' + tag.id + ']';
                    } else {
                        resolvedMessage += mention;
                    }
                    currentOffset = tag.offset + tag.length;
                });

                if (currentOffset < message.length) {
                    resolvedMessage += message.substring(currentOffset);
                }

                return resolvedMessage;
            }
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