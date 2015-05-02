let React = require('react');
let {ul, li, h1, p, span,div, button, input, form} = React.DOM;

let not = (f) => (x) => !f(x);
let requireAuth = require('./require-auth');
let threads = require('./stores/threads');
let messages = require('./stores/messages');
let users = require('./stores/users');
let auth = require('./auth');
let mqtt = require('./mqtt');

let connectMqtt = () =>
    Promise.all([auth.loggedInUser(),auth.token()])
    .then(([user,token]) => {
        return mqtt.connect(user,token);
    });

let fetchThread = (threadid) =>
    auth.token()
    .then(token => threads.get(threadid,token));

let fetchMessages = (threadid) =>
    auth.token()
    .then(token => messages.forThread(threadid,token));

var Thread = React.createClass({
    contextTypes: {
      router: React.PropTypes.func
    },
    getInitialState: () => ({thread: {users: []}, messages: []}),
    componentDidMount() {
        let {router} = this.context;
        let {threadid}  = router.getCurrentParams();

        fetchThread(threadid)
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
            console.log(error);
            throw error;
        });
        this.setState({subscribePromise});
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
    },
    render() {
        let {thread, messages} = this.state;
        let {users} = thread;
        let messagelist = messages.map(message => {
            return li({}, message.body);
        });
        return div({},
           h1({}, "This is a thread"),
           form({onSubmit: this.addMessage},
            input({ref: 'message'}),
            input({type:'submit', hidden: true})
           ),
           p({}, thread.id),
           p({}, users.join(', ')),
           ul({}, messagelist)
        );
    }
});

export default requireAuth(Thread);
