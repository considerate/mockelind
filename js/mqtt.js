let connect = require('mqtt');
let Bacon = require('baconjs');
let config = require('./config');
let offlinePayload = JSON.stringify({
    status: 'offline'
});

let onlinePayload = JSON.stringify({
    status: 'online'
});

let client = null;
export function connect(userId, token) {
    //If there's already a connection use that one
    if (client) {
        return Promise.resolve(client);
    }
    return new Promise(function (resolve) {
        var topic = 'online/'+userId;
        var will = {
            topic: topic,
            payload: offlinePayload
        };
        var mqttClient = connect(config.urls['3rd-base'], {
            protocolId: 'MQIsdp',
            protocolVersion: 3,
            username: userId,
            password: token,
            will: will
        });
        client = mqttClient;
        client.on('error', (err) => {
            reject(err);
        });
        client.on('connect', () => resolve(client));
    }).then(function(client) {
        var topic = 'online/'+userId;
        client.publish(topic, onlinePayload, {
            retain: true
        });
        return client;
    });
}

export function disconnect() {
    return new Promise(resolve => {
        if(!client) {
            throw new Error('No client to disconnect');
        }
        let mqttClient = client;
        let userId = client.options.username;
        //Allow for new connections
        client = null;
        //Then log out and close this connection
        mqttClient.publish('online/'+userId, offlinePayload, {
            qos: 2,
            callback: () => {
                mqttClient.end(resolve);
            }
        });
    });
}

export let subscribe = (mqttClient,subscribeTopic) => {
    return new Promise((resolve,reject) => {
        let stream = Bacon.fromBinder(pushEvent => {
            let handler = (topic,payload) => {
                if(topic === subscribeTopic) {
                    //Message recieved on this topic, push to stream
                    pushEvent(payload.toString());
                }
            };
            mqttClient.on('message', handler);
            return () => {
                //Unsubscribe action after no more subscribers
                mqttClient.unsubscribe(subscribeTopic);
                mqttClient.off('message', handler);
            };
        });
        mqttClient.subscribe(subscribeTopic, null, (err, granted) => {
            if(err) {
                reject(err);
            }
            else {
                resolve(stream);
            }
        });
    });
}
