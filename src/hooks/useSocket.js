import { useEffect, useState } from 'react';
import socketService from '../lib/socket';

export const useSocket = () => {
    // Initialize socket only once
    const [socket] = useState(() => socketService.connect());

    useEffect(() => {
        // Connection is handled by socketService.connect() which is idempotent
        // The socketService already handles the enabled/disabled state
        // No need to do anything here since connect() is called in useState initializer

        return () => {
            // Optional: socket.disconnect() if we want to clean up on unmount
            // But usually we keep it open for the app
        };
    }, [socket]);

    return socket;
};
