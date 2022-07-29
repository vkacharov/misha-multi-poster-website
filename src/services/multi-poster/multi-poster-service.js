
import { shareAsLink, shareAsAttachment, getPageId, getPost } from '../facebook';

export const multiPostLink = (link, pages, onSuccess, onError) => {
    new Promise((resolve) => {
            const pageLink = getPageLink(link);
            resolve(pageLink);
        })
        .then(pageLink => {
            console.log('page link', pageLink);
            return getPageId(pageLink);
        })
        .then(pageId => {
            console.log('page id', pageId);
            const postId = pageId + '_' + getPostId(link);
            return getPost(postId);
        })
        .then(originalPost => {
            console.log('original post', originalPost);
            if (containsShareAttachment(originalPost)) {
                const postCopy = copyPost(originalPost);
                pages.forEach(page => {
                    shareAsAttachment(postCopy, page)
                        .then(onSuccess)
                        .catch(onError);
                })
                
            } else {
                pages.forEach(page => {
                    shareAsLink(link, page)
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

const getPostId = (link) => {
    const match = link.match(/pfbid[\w\d]+/);
    if (match && match.length == 1) {
        return match[0];
    }

    throw ({
        message: `Failed to extract post id from ${link}`
    });
}

const getPageLink = (link) => {
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

const copyPost = (post) => {
    const copy = {};
    for (const [field, mapping] of Object.entries(postFieldMappings)) {
        const originalValue = post[mapping.originalField];
        if (originalValue && mapping.customMapping) {
            copy[field] = mapping.customMapping(originalValue);
        } else {
            copy[field] = originalValue;
        }
    }

    return copy;
}

const extractShareLinkUrl = (attachments) => {
    if (attachments && attachments.data.length > 0) {
        const type = attachments.data[0].type;
        if (type == 'share') {
            return attachments.data[0].url;
        }
    }

    return undefined;
}

const containsShareAttachment = (post) => {
    return post.attachments && 
    (typeof extractShareLinkUrl(post.attachments) !== 'undefined');
}

const postFieldMappings = {
    child_attachments: {
        originalField: 'child_attachments', 
    }, 
    feed_targeting: {
        originalField: 'feed_targeting'
    }, 
    link: {
        originalField: 'attachments',
        customMapping: extractShareLinkUrl
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
        customMapping: (messageTags) => {
            return messageTags.map(tag => tag.id).join(',');
        }
    },
    targeting: {
        originalField: 'targeting'
    }
}
