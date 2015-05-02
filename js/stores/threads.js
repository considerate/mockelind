let {fetchSecure,postSecure} = require('../fetch');
let config = require('../config');
let threads = (data) => data.threads;
let thread = (data) => data.thread;

export let mine = (token) => {
    let url = [config.urls.homebase,'users/me/threads'].join('/');
    return fetchSecure(url,token).then(threads);
}

export let get = (id,token) => {
    let url = [config.urls.homebase,'threads', id].join('/');
    return fetchSecure(url,token).then(thread);
};

export let create = (users, token) => {
    return postSecure(config.urls.homebase, '/threads', token, {users});
};
