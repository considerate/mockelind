let React = require('react');
let auth = require('./auth');
let {form, input, img, div, a} = React.DOM;
let getValue = (obj,ref) =>
    obj.refs[ref].getDOMNode().value;

var Login = React.createClass({
    submit(event) {
        event.preventDefault();
        let {router} = this.context;
        console.log(router);
        var nextPath = router.getCurrentQuery().nextPath;
        let username = getValue(this,'username');
        let password = getValue(this,'password');
        auth.login(username, password).then(loggedIn => {
            if (!loggedIn)
                return this.setState({ error: true });
            if (nextPath) {
                router.replaceWith(nextPath);
            } else {
                router.replaceWith('/');
            }
        });
        console.log(username,password);
    },
    render() {
        return div({},
        img({src: '/css/login_logo.png', className: 'logo'}),
        img({src: '/css/banner.png', className: 'banner'}),
        form({id: 'loginForm', onSubmit: this.submit},
            input({type: 'text', ref: 'username'}),
            input({type: 'password', ref: 'password'}),
            input({type: 'submit', value: 'Log In'})
        ),
        a({href:'//friendbase.com'}, 'sign up for free')
        );
    }
});
Login.contextTypes = {
      router: React.PropTypes.func
};

module.exports = Login;
