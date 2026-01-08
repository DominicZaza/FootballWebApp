// Format date
export const formatDate = (dateString: string, isMobile: boolean) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    // Mobile users get a shorter, more compact format
    const options = isMobile
        ? {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }
        : {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };

    return date.toLocaleString('en-US', options);
};
export const formatDateSmall = (dateString: string, isMobile: boolean) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    // Mobile users get a shorter, more compact format
    const options =  {
            month: 'short',
            day: 'numeric',
        };

    return date.toLocaleString('en-US', options);
};
