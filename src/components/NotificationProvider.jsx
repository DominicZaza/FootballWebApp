import React, {createContext, useContext, useState, useCallback} from "react";
import { Snackbar, Alert } from "@mui/material";

const NotificationContext = createContext(null);

export const useNotify = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentNotification, setCurrentNotification] = useState(null);

    const notify = useCallback((eventType, payload, severity = "info") => {
        const notification = {
            id: Date.now(),
            eventType,
            payload,
            severity,
        };

        setNotifications(prev => [...prev, notification]);

        if (!open) {
            setCurrentNotification(notification);
            setOpen(true);
        }
    }, [open]);

    const handleClose = () => setOpen(false);

    const handleExited = () => {
        const remaining = notifications.filter(n => n.id !== currentNotification?.id);
        setNotifications(remaining);

        if (remaining.length > 0) {
            setCurrentNotification(remaining[0]);
            setOpen(true);
        } else {
            setCurrentNotification(null);
        }
    };

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}

            <Snackbar
                open={open}
                autoHideDuration={5000}
                onClose={handleClose}
                TransitionProps={{ onExited: handleExited }}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    severity={currentNotification?.severity || "info"}
                    variant="filled"
                    onClose={handleClose}
                >
                    <strong>{currentNotification?.eventType}</strong>
                    {currentNotification?.payload && (
                        <div>{currentNotification.payload}</div>
                    )}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};
