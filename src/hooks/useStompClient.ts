// useStompClient.js
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {useEffect, useRef, useState} from 'react';
import {useRestApi} from '../api/RestInvocations';

export const zWebSocket = () => {
    const clientRef = useRef(null);
    const {getWebSocketEndpoint} = useRestApi();
    const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

    useEffect(() => {
        if (isWebSocketConnected) return;
            const client = new Client({
                webSocketFactory: () => new SockJS(getWebSocketEndpoint()),
                reconnectDelay: 5000,
                reconnectAttempts: 5,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,

/*
                debug: (str) => {
                    console.log(str);
                },
*/

                onConnect: () => {
                    //console.log('WebSocket connected');
                    setIsWebSocketConnected(true);
                },
                onStompError: (frame) => {
                   // console.error('STOMP error:', frame);
                    setIsWebSocketConnected(false);
                },
                onWebSocketClose: (event) => {
                    //console.log('WebSocket closed with code=%s, wasClean=%s, reason=%s', event.code, event.wasClean, event.reason);
                    setIsWebSocketConnected(false);
                },
                onWebSocketError: (error) => {
                    //console.error('WebSocket error:', error);
                    setIsWebSocketConnected(false);
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
            if (!client || !topic || !isWebSocketConnected) return;

            const subscription = client.subscribe(topic, (message) => {
                handler(JSON.parse(message.body));
            });
            //console.log("Subscribing to", topic, "isWebSocketConnected:", isWebSocketConnected);

            return () => subscription.unsubscribe();
        }, [topic, handler, isWebSocketConnected]);
    }


    return {
        useStompSubscription
    };

};
