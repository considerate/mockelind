let mqtt = require('mqtt');
let Bacon = require('baconjs');
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
        var mqttClient = mqtt.connect(config.mqttUrl, {
            protocolId: 'MQIsdp',
            protocolVersion: 3,
            username: userId,
            password: token,
            will: will
        });
        client = mqttClient;
        client.userId = userId;
        client.on('error', reject);
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
        mqttClient = client;
        userId = client.userId;
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
    return Bacon.fromBinder(pushEvent => {
        let handler = (topic,payload) => {
            if(topic === subscribeTopic) {
                let result = pushEvent(payload);
                if (result === Bacon.noMore) {
                    mqttClient.unsubscribe(subscribeTopic);
                    mqttClient.off('message', handler);
                }
            }
        };
        mqttClient.on('message', handler);
        mqttClient.subscribe(subscribeTopic);
    });
}
