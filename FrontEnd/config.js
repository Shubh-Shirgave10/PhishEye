const CONFIG = {
    // We are forcing the live Render URL to ensure no "localhost" leak occurs.
    API_BASE: 'https://phisheye-2-dbpr.onrender.com'
};
console.log("PhishEye Config Loaded: ", CONFIG.API_BASE);
window.CONFIG = CONFIG;
