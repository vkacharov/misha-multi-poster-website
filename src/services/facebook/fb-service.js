export const login = () => {
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

export const getAccounts = async () => {
    const accounts = [];
    let endpoint = '/me/accounts';
    while (endpoint) {
        const accountsResponse = await getAccountsPage(endpoint);
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

export const getAccountsPage = (endpoint) => {
    return new Promise(async (resolve) => {
        FB.api(endpoint, (response) => {
            resolve(response);
        });
    });
}

export const shareAsLink = (link, page) => {
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
                postResponse: response
            });
        });
    });
}

export const shareAsAttachment = (postRequest, page) => {
    return new Promise(async (resolve) => {
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

export const getPost = (id) => {
    return new Promise((resolve, reject) => {
        const endpoint = "/" + id;
        FB.api(endpoint, 
            'get', 
            {fields: 'attachments,child_attachments,feed_targeting,message,multi_share_end_card,multi_share_optimized,place,message_tags,targeting'},
            (response) => {
                if (response.error) {
                    reject(response.error);
                }

                resolve(response);
        });
    });
}

export const getPageId = (pageLink) => {
    return new Promise((resolve, reject) => {
        FB.api('/' + pageLink, (response) => {
            if (response.error) {
                reject(response.error);
            } else {
                console.log('resolve', response.id);
                resolve(response.id);
            }
        })
    })
    
}