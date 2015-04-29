/* jshint esnext:true */
let React = require('react');
let {ul, li, h1, p, span,div, button} = React.DOM;

let not = (f) => (x) => !f(x);
let requireAuth = require('./require-auth');
let threads = require('./stores/threads');
let users = require('./stores/users');
let auth = require('./auth');

let isPrivateChat = (thread) =>
    thread.private;
let threadName = (thread) => {
    if(thread.name) {
        return thread.name;
    } else {
        return thread.users.join(', ');
    }
}
var ThreadList = React.createClass({
    getInitialState: () => ({threads: []}),
    updateList() {
        auth.token()
        .then(threads.mine)
        .then(threads => {
            this.setState({threads});
        });
    },
    componentDidMount() {
        this.updateList();
    },
    newThread() {
        console.log('Want to create a new thread');
        let users = ['user1', 'user2'];
        auth.token()
        .then(token => threads.create(users,token))
        .then(data => {
            this.setState({threads: this.state.threads.concat([data.thread])});
        });
    },
    render() {
        let privateChats = this.state.threads.filter(isPrivateChat).map(thread =>
            li({key: thread.id}, [
                h1(null, threadName(thread)),
                p({class:'message'}, thread.text),
                span({class:'status'}, thread.status),
                span({class: 'online'}, thread.online)
            ])
        );
        let groupChats = this.state.threads.filter(not(isPrivateChat)).map(thread =>
            li({key: thread.id}, [
                h1(null, threadName(thread)),
                p({class:'message'}, thread.text),
                span({class:'status'}, thread.status)
            ])
        );
        return div({},
            button({onClick: this.newThread}, 'Create new Thread'),
            ul({}, privateChats.concat(groupChats))
        );
    }
});

export default requireAuth(ThreadList);
