let React = require('react');
let auth = require('./auth');

var requireAuth = (Component) => {
    return React.createClass({
        statics: {
            willTransitionTo(transition) {
                if (!auth.loggedIn()) {
                    console.log('Here I am');
                    transition.redirect('/login', {}, {nextPath: transition.path});
                }
            }
        },
        render () {
            return React.createElement(Component, this.props);
        }
    });
};

export default requireAuth;
