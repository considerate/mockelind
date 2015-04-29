let React = require('react');
let auth = require('./auth');
let {form, input} = React.DOM;
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
    render: function() {
        return form({id: 'loginForm', onSubmit: this.submit},
            input({type: 'text', ref: 'username'}),
            input({type: 'password', ref: 'password'}),
            input({type: 'submit'})
        );
    }
});
Login.contextTypes = {
      router: React.PropTypes.func
};

module.exports = Login;
