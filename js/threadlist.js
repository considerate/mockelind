let React = require('react');
let {ul, li, h1, p, span,div, button, img, header, footer} = React.DOM;

let not = (f) => (x) => !f(x);
let requireAuth = require('./require-auth');
let threads = require('./stores/threads');
let users = require('./stores/users');
let auth = require('./auth');
let mqtt = require('./mqtt');

let connectMqtt = () =>
Promise.all([auth.loggedInUser(),auth.token()])
.then(([user,token]) => {
    return mqtt.connect(user,token);
});

let isPrivateChat = (thread) =>
thread.private;
let notMe = (me) =>
(user) =>
user.id != me;
let threadName = (thread,me) => {
    if(thread.name) {
        return thread.name;
    } else if(thread.users) {
        return thread.users.filter(notMe(me)).map(user => user.name).join(', ');
    }
};

let numUsersOnline = (onlineUsers, thread, me) =>
thread.users.filter(notMe(me))
.filter(user => onlineUsers[user.id])
.length;

let onlineStatusClass = (count) => {
    if(count === 1) {
        return 'online';
    } if(count > 1) {
        return 'online';
    } else {
        return 'offline';
    }
}

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

     let fetchAllUsers = (threads) =>
     Promise.all(threads.map(fetchUsers));

     var ThreadList = React.createClass({
         getInitialState: () => ({threads: [], onlineUsers: {}, friends: [], showFriendList: false}),
             updateList() {
             auth.token()
             .then(token => threads.mine(token))
             .then(fetchAllUsers)
             .then(threads => threads.map(this.onlineStatus))
             .then(threads => {
                 this.setState({threads});
             });
         },
         componentDidMount() {
             let {friends} = this.state;
             this.updateList();
             auth.token()
             .then(token =>
                   users.get(auth.loggedInUser(), token)
                   .then(user => [user,token]))
                   .then(([user,token]) =>
                         Promise.all(user.friends.map(friend => users.get(friend, token)))
                         .then(friends => this.setState({friends})))
         },
         newThread(users) {
             auth.token()
             .then(token =>
                   threads.create(users.map(user => user.id),token)
                   .then(data => data.thread)
                   .then(thread => fetchUsers(thread,token))
                   .then(this.onlineStatus)
                   .then(thread =>
                         this.setState({threads: this.state.threads.concat([thread]), showFriendList:false})
                        )
                  );
         },
         onlineStatus(thread) {
             let {onlineUsers} = this.state;
             thread.users.map(user => {
                 onlineUsers[user.id] = false;
                 connectMqtt()
                 .then(client => mqtt.subscribe(client, 'online/'+user.id))
                 .then(stream => {
                     stream.map(JSON.parse).onValue(message => {
                         if(message.status !== 'offline') {
                             onlineUsers[user.id] = true;
                             this.setState({onlineUsers});
                         } else {
                             onlineUsers[user.id] = false;
                             this.setState({onlineUsers});
                         }
                     });
                 });
             });
             return thread;
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
             let {threads, onlineUsers, friends, showFriendList} = this.state;
             console.log('Friends', friends);
             friends = friends || [];
             console.log('Friends', friends);
             console.log('online', onlineUsers);
             console.log('users     ',Object.keys(onlineUsers).filter(userId => onlineUsers[userId]));
             let privateChats = threads.filter(isPrivateChat).map(thread => {
                 let numOnline = numUsersOnline(onlineUsers,thread,me);
                 return li({key: thread.id, onClick: this.open('/threads/'+thread.id)}, [
                     img({src: '//placekitten.com/g/250/250'}),
                     div({},
                         h1(null, threadName(thread,me)),
                         p({className:'message'}, thread.text || 'Text goes here'),
                         span({className:'status'}, thread.status || 'Status text')
                        ),
                        span({className: 'onlinestatus' + ' ' + onlineStatusClass(numOnline)})
                 ])
             });
             let groupChats = threads.filter(not(isPrivateChat)).map(thread => {
                 let numOnline = numUsersOnline(onlineUsers,thread,me);
                 return li({key: thread.id, onClick: this.open('/threads/'+thread.id)}, [
                     img({src: '//placekitten.com/g/250/250'}),
                     div({},
                         h1(null, threadName(thread,me)),
                         p({className:'message'}, thread.text || 'Text goes here lets make this text longer so that it wont fit in one line even if we try really hard.'),
                         span({className:'status'}, thread.status || 'Status text')
                        ),
                        span({className: 'onlinestatus' + ' ' + onlineStatusClass(numOnline)}, numOnline)
                 ])
             });
             let showListClass = showFriendList?'show':'';
             let cancelButton = button({onClick: () => this.setState({showFriendList:false})}, 'Cancel');
             let friendList = friends.map(friend => li({onClick:()=>this.newThread([friend])}, friend.name));
             return div({className: 'threads'},
                        header({},
                               h1({className: 'title'}, 'Messages')
                              ),
                              ul({className: 'threadlist'}, privateChats.concat(groupChats)),
                              div({className:'overlay '+ showListClass},
                                  div({className: 'modal'},
                                      ul({className: 'friendList'}, friendList),
                                      cancelButton
                                     )
                                 ),
                              footer({},
                                     img({onClick: this.logout, className: 'back', src: '/css/arrow_back.svg'}),
                                     img({onClick: ()=>this.setState({showFriendList:true}), className: 'add', src: '/css/add.svg'})
                                    )
                       );
         }
     });
     ThreadList.contextTypes = {
         router: React.PropTypes.func
     };
     export default requireAuth(ThreadList);
