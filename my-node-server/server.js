const express = require('express');
const { detectNodeOrFetch } = require('./scripts/detect-node-or-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Use the fetch implementation based on Node.js version
const fetch = detectNodeOrFetch();

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Additional routes can be set up here

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});