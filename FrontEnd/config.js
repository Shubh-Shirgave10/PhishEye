const CONFIG = {
    // When served from the same domain (like on Render), use empty string for relative paths.
    // This avoids CORS issues and "Failed to fetch" errors.
    API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : ''
};
window.CONFIG = CONFIG;
