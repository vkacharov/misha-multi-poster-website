import { activities, objects } from './model/activities.js';

export class ActivityService {
    resolveActivity(story, storyTags) {
        const resolvedActivity = this.#resolveActivityFromStory(story);
        if (resolvedActivity) {
            const activityRecipientTag = this.#resolveActivityRecipientTag(resolvedActivity, story, storyTags);
            if (activityRecipientTag) {
                const mentionTags = this.#resolveMentionTags(activityRecipientTag, storyTags);
                return {
                    activityId: resolvedActivity.legacy_api_id,
                    icon: resolvedActivity.icon,
                    recipientId: activityRecipientTag,
                    mentionTagIds: mentionTags
                }
            } else {
                const activityRecipientObject = this.#resolveActivityRecipientObject(resolvedActivity, story);
                if (activityRecipientObject) {
                    const mentionTags = this.#resolveMentionTags(null, storyTags);
                    return {
                        activityId: resolvedActivity.legacy_api_id,
                        icon: activityRecipientObject.node.icon.id,
                        recipientId: activityRecipientObject.node.object.id,
                        mentionTagIds: mentionTags
                    }
                }
            }
        }
    }

    #resolveActivityFromStory(story) {
        const resolvedActivitiesList = Object.keys(activities)
        .filter(activityName => story.includes('is ' + activityName));
        if (resolvedActivitiesList.length > 0) {
            return activities[resolvedActivitiesList[0]];
        }
    }

    /**
     * In case the recipient of the activity is a predefined object.
     * F.ex. the story is "eating pizza". 
     * The activity is "eating". The recipient "pizza" is a predefined object. 
     */
    #resolveActivityRecipientObject(activity, story) {
        const activityObjects = objects[activity.legacy_api_id];
        const recipientObjectsList = activityObjects.data.viewer.minutiae_suggestions.edges.filter(data => {
            const node = data.node;
            const objectName = node.object.name;
            return story.includes(activity.name + ' ' + objectName);
        });
        if (recipientObjectsList.length > 0) {
            recipientObjectsList.sort((o1, o2) => {
                return o2.node.object.name.length - o1.node.object.name.length;
            });

            return recipientObjectsList[0];
        }
    }

    /**
     * In case the activity recipient is a page tag. 
     * F.ex. the story is "eating @Domonos". 
     * The activity is "eating". The recipient @Dominos page is tagged in storyTags. 
     */
    #resolveActivityRecipientTag(activity, story, storyTags) {
        if (storyTags) {
            const recipientTagsList = this.#resolveRecipientTags(activity.name, story, storyTags);
            if(recipientTagsList.length > 0) {
                return recipientTagsList[0].id;
            }
        }
    }

    #resolveRecipientTags(activityName, story, storyTags) {
        const objectTagsList = storyTags.filter(tag => {
            const activityIndex = story.indexOf(activityName + ' ' + tag.name);
            if (activityIndex >= 0) {
                const recipientOffset = activityIndex + activityName.length + 1;
                return recipientOffset == tag.offset;
            }

            return false;
        });
        return objectTagsList;
    }

    /**
     * The storyTags may contain both recipient tag and mention tags. 
     * F.ex. "eating @Dominos with @Velizar".
     * In this case, @Dominos is the recipient tag of the "eacting" activity. 
     * It is passed to the method in the recipientTags parameter.
     * @Velizar is the mention tag which is resolved by this method.  
     */
    #resolveMentionTags(recipientTagId, storyTags) {
        const mentionTagIds = storyTags.filter(tag => {
            return recipientTagId != tag.id
        })
        .map(tag => tag.id);

        return mentionTagIds;
    }
}
