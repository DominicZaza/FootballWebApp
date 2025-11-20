// useStompClient.js
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {useEffect, useRef, useState} from 'react';
import {useRestApi} from '../api/RestInvocations';

export const zWebSocket = () => {
    const clientRef = useRef(null);
    const {getWebSocketEndpoint} = useRestApi();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (isConnected) return;
            const client = new Client({
                webSocketFactory: () => new SockJS(getWebSocketEndpoint()),
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,

/*
                debug: (str) => {
                    console.log(str);
                },
*/

                onConnect: () => {
                    //console.log('WebSocket connected');
                    setIsConnected(true);
                },
                onStompError: (frame) => {
                    console.error('STOMP error:', frame);
                    setIsConnected(false);
                },
                onWebSocketClose: (event) => {
                    console.log('WebSocket closed with code=%s, wasClean=%s, reason=%s', event.code, event.wasClean, event.reason);
                    setIsConnected(false);
                },
                onWebSocketError: (error) => {
                    console.error('WebSocket error:', error);
                    setIsConnected(false);
                }
            });

            client.activate();
            clientRef.current = client;

            return () => {
                if (clientRef.current) {
                    clientRef.current.deactivate();
                }
            };
        }

    , []);



    function useStompSubscription(topic, handler) {
        const { current: client } = clientRef;

        useEffect(() => {
            if (!client || !topic || !isConnected) return;

            const subscription = client.subscribe(topic, (message) => {
                handler(JSON.parse(message.body));
            });
            //console.log("Subscribing to", topic, "isConnected:", isConnected);

            return () => subscription.unsubscribe();
        }, [topic, handler, isConnected]);
    }


    return {
        useStompSubscription
    };

};
