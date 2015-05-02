let {fetchSecure,postSecure} = require('../fetch');
let config = require('../config');
let messages = (data) => data.messages;

export let forThread = (threadid,token) => {
    let url = [config.urls.homebase,'threads', threadid, 'messages'].join('/');
    return fetchSecure(url,token).then(messages);
};
