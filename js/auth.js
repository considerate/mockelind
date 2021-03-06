let {fetchJSON, fetchSecure} = require('./fetch');
let config = require('./config');
let mqtt = require('./mqtt');

let connectMqtt = () =>
    Promise.all([loggedInUser(),token()])
    .then(([user,token]) => {
        return mqtt.connect(user,token);
    });
let _token = null;
let _loggedInUser = null;
_loggedInUser = _loggedInUser || localStorage.getItem('user');
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
        _loggedInUser = userId;
        return _token;
    });
}

export let login = (id,pass) => userToken(id).then(token => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', id);
    return true;
});

export let loggedIn = () => {
    return Boolean(_token);
};

export let token = userToken;

export let loggedInUser = () => _loggedInUser;

export let logout = () => {
    connectMqtt(_loggedInUser,_token)
    .then(client => client.publish('online/'+ _loggedInUser, JSON.stringify({
        status: 'offline'
    }), () => {
        mqtt.disconnect()
        .then(() => {
            _token = null;
            _loggedInUser = null;
            delete localStorage.token;
            delete localStorage.user;
	    localStorage.removeItem('user');
	    localStorage.removeItem('token');
        });
    }));
    
            _token = null;
            _loggedInUser = null;
            delete localStorage.token;
            delete localStorage.user;
	    localStorage.removeItem('user');
	    localStorage.removeItem('token');

};
