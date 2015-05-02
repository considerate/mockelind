let React = require('react');
let {ul, li, h1, p, span,div, button} = React.DOM;

let not = (f) => (x) => !f(x);
let requireAuth = require('./require-auth');
let threads = require('./stores/threads');
let users = require('./stores/users');
let auth = require('./auth');

let notMe = (me) =>
    (user) =>
        user.id != me;

let isPrivateChat = (thread) =>
    thread.private;
let threadName = (thread,me) => {
    if(thread.name) {
        return thread.name;
    } else if(thread.users) {
        return thread.users.filter(notMe(me)).map(user => user.name).join(', ');
    }
}

let fetchUsers = (thread, token) =>
    Promise.all(thread.users.map(user =>
        users.get(user,token)
    ))
    .then(users => {
        thread.users = users;
        return thread;
    });

let fetchAllUsers = (threads, token) =>
    Promise.all(threads.map(thread =>
            fetchUsers(thread,token)));

var ThreadList = React.createClass({
    getInitialState: () => ({threads: []}),
    updateList() {
        auth.token()
        .then(token =>
            threads.mine(token)
            .then(threads => fetchAllUsers(threads,token))
        )
        .then(threads => {
            this.setState({threads});
        });
    },
    componentDidMount() {
        this.updateList();
    },
    newThread() {
        console.log('Want to create a new thread');
        let users = ['viktor', 'user1'];
        auth.token()
        .then(token =>
            threads.create(users,token)
            .then(data => data.thread)
            .then(thread => fetchUsers(thread,token))
            .then(thread =>
                this.setState({threads: this.state.threads.concat([thread])})
            )
        );
    },
    open(path) {
        let {router} = this.context;
        return () => {
            router.transitionTo(path);
        };
    },
    logout() {
        let {router} = this.context;
        auth.logout();
        router.transitionTo('/login');
    },
    render() {
        let me = auth.loggedInUser();
        console.log(me);
        let privateChats = this.state.threads.filter(isPrivateChat).map(thread =>
            li({key: thread.id, onClick: this.open('/threads/'+thread.id)}, [
                h1(null, threadName(thread,me)),
                p({class:'message'}, thread.text),
                span({class:'status'}, thread.status),
                span({class: 'online'}, thread.online)
            ])
        );
        let groupChats = this.state.threads.filter(not(isPrivateChat)).map(thread =>
            li({key: thread.id, onClick: this.open('/threads/'+thread.id)}, [
                h1(null, threadName(thread,me)),
                p({class:'message'}, thread.text),
                span({class:'status'}, thread.status)
            ])
        );
        return div({},
            button({onClick: this.logout}, 'Log Out'),
            button({onClick: this.newThread}, 'Create new Thread'),
            ul({}, privateChats.concat(groupChats))
        );
    }
});
ThreadList.contextTypes = {
      router: React.PropTypes.func
};
export default requireAuth(ThreadList);
