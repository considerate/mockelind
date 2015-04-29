let {fetchSecure,postSecure} = require('../fetch');
let {connect: connectMqtt} = require('../mqtt');
let Bacon = require('baconjs');
let config = require('../config');
let threads = (data) => data.threads;

export let mine = (token) => {
    let url = [config.urls.homebase,'users/me/threads'].join('/');
    console.log(url);
    return fetchSecure(url,token).then(threads);
}

export let get = (id,token) => {
    let url = [config.urls.homebase,'threads', id].join('/');
    return fetchSecure(url,token).then(threads);
};

export let create = (users, token) => {
    return postSecure(config.urls.homebase, '/threads', token, {users});
};
