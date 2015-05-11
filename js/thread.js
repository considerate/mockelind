let React = require('react');
let {ul, li, h1, p, span,div, button, input, form, footer, header, img} = React.DOM;

let not = (f) => (x) => !f(x);
let requireAuth = require('./require-auth');
let threads = require('./stores/threads');
let messages = require('./stores/messages');
let users = require('./stores/users');
let auth = require('./auth');
let mqtt = require('./mqtt');


let scrolledToBottom = (elem) =>
   elem.scrollTop === (elem.scrollHeight - elem.offsetHeight);


let connectMqtt = () =>
    Promise.all([auth.loggedInUser(),auth.token()])
    .then(([user,token]) => {
        return mqtt.connect(user,token);
    });

let fromWho = (message, me) => {
    console.log(message);
    if(message.from === me) {
        return 'from-me';
    } else {
        return 'from-them';
    }
}

let fetchThread = (threadid) =>
    auth.token()
    .then(token => threads.get(threadid,token));

let fetchMessages = (threadid) =>
    auth.token()
    .then(token => messages.forThread(threadid,token));

let fetchUsers = (thread) =>
    auth.token()
    .then(token =>
        Promise.all(thread.users.map(user =>
            users.get(user,token)
        ))
        .then(users => {
            thread.users = users;
            return thread;
        })
    );
let notMe = (me) =>
    (user) =>
        user.id != me;
let threadName = (thread,me) => {
    if(thread.name) {
        return thread.name;
    } else if(thread.users) {
        return thread.users.filter(notMe(me)).map(user => user.name).join(', ');
    }
}

var Thread = React.createClass({
    contextTypes: {
      router: React.PropTypes.func
    },
    getInitialState: () => ({thread: {users: []}, messages: []}),
    componentDidMount() {
        let {message} = this.refs;
        let field = message.getDOMNode();
        field.focus();

        let {router} = this.context;
        let {threadid}  = router.getCurrentParams();

        fetchThread(threadid)
        .then(fetchUsers)
        .then(thread => this.setState({thread}));

        fetchMessages(threadid)
        .then(newMessages => {
            let {messages} = this.state;
            this.setState({messages: messages.concat(newMessages)});
        });

        let topic = 'threads/'+threadid+'/messages';
        let subscribePromise = connectMqtt()
        .then(client => mqtt.subscribe(client, topic))
        .then(stream => {
            stream.map(JSON.parse)
            .onValue(message => {
                if(this.isMounted()) {
                    let {messages} = this.state;
                    messages.push(message);
                    this.setState({messages});
                }
            });
        })
        .catch(error => {
            throw error;
        });
        this.setState({subscribePromise});
        window.addEventListener('resize', () => {
            console.log(window.innerHeight);
        });
    },
    back() {
        let {router} = this.context;
        router.transitionTo('/threads');
    },
    addMessage(event) {
        event.preventDefault();
        let {message} = this.refs;
        let field = message.getDOMNode();
        let text = field.value;
        let payload = JSON.stringify({
            body: text
        });

        let {router} = this.context;
        let {threadid}  = router.getCurrentParams();
        let topic = 'threads/'+threadid+'/messages';
        let {subscribePromise} = this.state;
        connectMqtt()
        .then(client => {
            client.publish(topic, payload);
        });
        //Clear field
        field.value = '';
        this.scrollDown();
    },
    componentWillUpdate() {
        let {scroller} = this.refs;
        let elem = scroller.getDOMNode();
        this.shouldScrollDown = scrolledToBottom(elem);
    },
    componentDidUpdate() {
        if(this.shouldScrollDown) {
            this.scrollDown();
        }
    },
    scrollDown() {
        let {scroller} = this.refs;
        let elem = scroller.getDOMNode();
        elem.scrollTop = elem.scrollHeight;
    },
    userPic(id) {
        let {thread} = this.state;
        let user = thread.users.filter(user => user.id === id)[0];
        if(!user || !user.picture) {
            return '//placekitten.com/g/302/302';
        }
        return user.picture;
    },
    render() {
        let {thread, messages, userPics} = this.state;
        let {users} = thread;
        let me = auth.loggedInUser();
        let messagelist = messages.map(message => {
            return li({className: 'clear'},
                      div({className:'message '+fromWho(message,me)},
                            p({},message.body),
                            img({src: this.userPic(message.from)})));
        });
        return div({className: 'thread'},
            header({},
                h1({className: 'title'}, threadName(thread,me))
            ),
           form({onSubmit: this.addMessage, className: 'form'},
            input({type: 'text', ref: 'message', onFocus: () => setTimeout(()=> this.scrollDown(), 50)}),
            input({type:'submit', hidden: true, value: ''})
           ),
           div({className: 'scroller', ref: 'scroller'},
           ul({className: 'messages'}, messagelist)
            ),
            footer({},
                img({onClick: this.back, className: 'back', src: '/css/arrow_back.svg'})
            )
        );
    }
});

export default requireAuth(Thread);
