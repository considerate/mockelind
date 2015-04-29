/* jshint esnext:true */
let React = require('react');
let Router = require('react-router');
let factory = React.createFactory;
let Route = factory(Router.Route);
let DefaultRoute = factory(Router.DefaultRoute);
let NotFoundRoute = factory(Router.NotFoundRoute);
let Login = require('./js/login');
let ThreadList = require('./js/threadlist');

let routes = Route({location: "history"},
    Route({path: '/', handler: ThreadList}),
    Route({path: '/login', handler: Login})
);

window.onload = () => {
    Router.run(routes, function(handler) {
        React.render(React.createElement(handler), document.querySelector('#main'));
    });
};

