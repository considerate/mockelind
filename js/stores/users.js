let {fetchJSON, fetchSecure} = require('../fetch');
let {localStorage} = window;
let config = require('../config');
let mqtt = require('../mqtt');

function userData(userId, token){
    return fetchSecure([config.urls.users,'users',userId].join('/'), token);
}

export let online = (user, client) => {
    return mqtt.subscribe(client, 'online/'+user);
};
export let get = userData;
