const fetch = require('node-fetch');

const isNodeVersionCompatible = () => {
    const version = process.versions.node.split('.').map(Number);
    return version[0] >= 18; // Check if Node.js version is 18 or higher
};

const fetchPolyfill = isNodeVersionCompatible() ? global.fetch : fetch;

module.exports = fetchPolyfill;