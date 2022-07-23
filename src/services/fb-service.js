export const login = () => {
    return new Promise(async (resolve) => {
        FB.login((response) => {
            resolve(response);
        },
        {
            scope: 'email,pages_read_engagement,pages_manage_posts,pages_show_list',
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
            console.log('RESPONSE', response);
            resolve(response);
        });
    });
}

export const shareLink = (link, page) => {
    console.log('TO POST', link);
    return new Promise(async (resolve) => {
        var endpoint = '/' + page.id + '/feed';
        FB.api(endpoint, 'post', 
        {
            access_token: page.access_token, 
            link: link
        },
        (response) => {
            resolve({
                pageName: page.name,
                postResponse: response
            });
        });
    });
}