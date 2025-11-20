import React, {useState, useCallback} from 'react';
import {Snackbar, Alert} from '@mui/material';
import {zWebSocket} from '../hooks/useStompClient';

export const NotificationsPanel = () => {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentNotification, setCurrentNotification] = useState(null);
    const {useStompSubscription} = zWebSocket();

    const handleMessage = useCallback((data) => {
        const notification = {
            id: Date.now(),
            eventType: data.eventType || 'Event',
            payload: data.payload || '',
            timestamp: new Date()
        };

        setNotifications(prev => [...prev, notification]);
        setCurrentNotification(notification);
        setOpen(true);
    }, []);

    useStompSubscription('/topic/zevents/#', handleMessage);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const handleExited = () => {
        // Show next notification if there are more in the queue
        const remainingNotifications = notifications.filter(n => n.id !== currentNotification?.id);
        setNotifications(remainingNotifications);

        if (remainingNotifications.length > 0) {
            setCurrentNotification(remainingNotifications[0]);
            setOpen(true);
        } else {
            setCurrentNotification(null);
        }
    };

    return (
        <>
            <Snackbar
                open={open}
                autoHideDuration={15000}
                onClose={handleClose}
                TransitionProps={{onExited: handleExited}}
                anchorOrigin={{vertical: 'top', horizontal: 'right'}}
            >
                <Alert
                    onClose={handleClose}
                    severity="info"
                    variant="filled"
                    sx={{width: '100%'}}
                >
                    <strong>{currentNotification?.eventType}</strong>
                    {currentNotification?.payload && (
                        <div>{currentNotification.payload.count}</div>
                    )}
                </Alert>
            </Snackbar>

        </>
    );
};
