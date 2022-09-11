export class FacebookService {
    login() {
        return new Promise(async (resolve) => {
            FB.login((response) => {
                resolve(response);
            },
            {
                scope: 'pages_read_engagement,pages_manage_posts,pages_show_list',
                return_scopes: true
            });
        });
    }

    async getAccounts() {
        const accounts = [];
        let endpoint = '/me/accounts';
        while (endpoint) {
            const accountsResponse = await this.#getAccountsPage(endpoint);
            if (accountsResponse.data) {
                accounts.push(...accountsResponse.data);
            }

            if (accountsResponse.paging) {
                endpoint = accountsResponse.paging.next;
            } else {
                endpoint = undefined;
            }
        }

        return accounts;
    }

    shareAsLink(link, page) {
        return new Promise((resolve, reject) => {
            var endpoint = '/' + page.id + '/feed';
            FB.api(endpoint, 'post', 
            {
                access_token: page.access_token, 
                link: link
            },
            (response) => {
                if (response.error) {
                    reject(response.error);
                }
                
                resolve({
                    pageName: page.name,
                    id: response.id
                });
            });
        });
    }

    shareAsAttachment(postRequest, page) {
        return new Promise(async (resolve, reject) => {
            const endpoint = '/' + page.id + '/feed';
            postRequest.access_token = page.access_token;
            FB.api(endpoint, 
                'post', 
                postRequest,
                (response) => {
                    if (response.error) {
                        reject(response.error);
                    }

                    resolve({
                        pageName: page.name,
                        id: response.id
                    });
                });
        });
    }

    getPost(id, pageAccessToken) {
        return new Promise((resolve, reject) => {
            const endpoint = "/" + id;
            FB.api(endpoint, 
                'get', 
                {
                    fields: 'attachments,child_attachments,feed_targeting,message,multi_share_end_card,multi_share_optimized,place,message_tags,targeting,story,story_tags',
                    access_token: pageAccessToken
                },
                (response) => {
                    if (response.error) {
                        reject(response.error);
                    }

                    resolve(response);
            });
        });
    }

    getPageId(pageLink) {
        return new Promise((resolve, reject) => {
            FB.api('/' + pageLink + '?fields=access_token', (response) => {
                if (response.error) {
                    reject(response.error);
                } else {
                    console.log('resolve', response.id, response.access_token);
                    resolve({
                        id: response.id, 
                        access_token: response.access_token
                    });
                }
            })
        }) 
    }

    async #getAccountsPage(endpoint) {
        return new Promise(async (resolve) => {
            FB.api(endpoint, (response) => {
                resolve(response);
            });
        });
    }
}