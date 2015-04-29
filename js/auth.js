let {fetchJSON, fetchSecure} = require('./fetch');
let config = require('./config');
let _token = null;
_token = _token || localStorage.getItem('token');
function userToken(userId) {
    if(_token) {
        return Promise.resolve(_token);
    }
    return fetchJSON(
        [config.urls.users,'users',userId,'login'].join('/'), {
        method: 'post',
    }).then(data => {
        _token = data.token;
        return _token;
    });
}

export let login = (id,pass) => userToken(id).then(token => {
    localStorage.setItem('token', token);
    return true;
});

export let loggedIn = () => {
    return Boolean(_token);
};


export let token = userToken;

export let logout = () => {
    localStorage.removeItem('token');
};
