require('whatwg-fetch');
let status = (response) => {
    if(response.status >= 200 && response.status < 400) {
        return response;
    } else {
        throw new Error('Response failed with status code'+response.status);
    }
};
let json = (response) => response.json();
export let fetchJSON = (url,options={headers:{}}) => {
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';
    return fetch(url,options).then(status).then(json);
};
export let fetchSecure = (url, token, options={headers: {}}) => {
    options.headers = options.headers || {};
    options.headers.Authorization = 'Bearer '+token;
    return fetchJSON(url,options);
};
export let postSecure = (base, url, token, data) => {
    return fetch(base+url,{
        method: 'post',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' +token,
            'Access-Control-Request-Headers': 'Location'
        }
    }).then(response =>
        fetchSecure(base+response.headers.get('Location'),token)
    );
}

