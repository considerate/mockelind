/* jshint esnext:true */

let React = require('react');
let Router = require('react-router');
let factory = React.createFactory;
let Route = factory(Router.Route);
let DefaultRoute = factory(Router.DefaultRoute);
let NotFoundRoute = factory(Router.NotFoundRoute);
let RouteHandler = factory(Router.RouteHandler);
let Login = require('./js/login');
let mqtt = require('./js/mqtt');
let ThreadList = require('./js/threadlist');
let Thread = require('./js/thread');
let createElement = React.createElement;
let {p,div} = React.DOM;

let transitionGroup = factory(require('react/lib/ReactCSSTransitionGroup'));
let App = React.createClass({
  contextTypes: {
    router: React.PropTypes.func,
    routeDepth: React.PropTypes.number
  },
  render: function () {
    let name = this.context.router.getCurrentPath();
    return transitionGroup({
        transitionName: 'fade',
        component: 'div',
        className: 'container'
    }, RouteHandler({key:name, className: 'container'}));
  }
});

let routes = Route({location: "history", name: 'app', path: '/', handler: App},
    DefaultRoute({handler: ThreadList}),
    Route({name: 'thread', path: 'threads/:threadid', handler: Thread}),
    Route({name: 'threads', path: 'threads', handler: ThreadList}),
    Route({name: 'login', path: 'login', handler: Login})
);

window.onbeforeunload = () => {
    console.log('On before');
    mqtt.disconnect();
}

window.onload = () => {
    Router.run(routes, function(handler) {
        React.render(createElement(handler),
            document.querySelector('#main')
        );
    });
};

