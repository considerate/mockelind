/* jshint esnext:true */
let React = require('react');
let Router = require('react-router');
let factory = React.createFactory;
let Route = factory(Router.Route);
let DefaultRoute = factory(Router.DefaultRoute);
let NotFoundRoute = factory(Router.NotFoundRoute);
let Login = require('./js/login');
let ThreadList = require('./js/threadlist');
let Thread = require('./js/thread');

let routes = Route({location: "history"},
    DefaultRoute({handler: ThreadList}),
    Route({path: '/threads',handler: ThreadList}),
    Route({path: '/threads/:threadid', handler: Thread}),
    Route({path: '/login', handler: Login})
);

window.onload = () => {
    Router.run(routes, function(handler) {
        React.render(React.createElement(handler), document.querySelector('#main'));
    });
};

